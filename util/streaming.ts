import { createScriptIdDiv, createScriptIdIframe, teleportStyle } from '@util/script';
import type { App, Reactive } from 'vue';
import { uuidv4 } from './common';

/**
 * 通过 `mountStreamingMessages` 挂载的流式界面将会得到的响应式数据
 */
export type StreamingMessageContext = {
  prefix: string;
  host_id: string;

  message_id: number;
  message: string;
  during_streaming: boolean;
};

export function injectStreamingMessageContext(): Readonly<StreamingMessageContext> {
  return readonly(inject('streaming_message_context')!);
}

/**
 * 将组件作为流式楼层界面挂载到酒馆各个楼层, 替换掉酒馆原生的楼层正文显示.
 *
 * 方案是隐藏酒馆原来的楼层文本, 而在它下方插入一个类名有 `mes_streaming` 的 DOM:
 *   - `options.host==='iframe'` 则插入的是 iframe, 其内 contentDocument.body 作为组件的挂载点
 *     - 样式将与酒馆原生界面隔离
 *     - 组件内可以使用 tailwindcss
 *   - `options.host==='div'` 则插入的是 div, 它直接作为组件的挂载点
 *     - 将会继承酒馆样式
 *     - 禁止使用 mes_text 类名, 它会让酒馆的编辑楼层功能不可用
 *     - 组件内不能使用 tailwindcss, 因为会影响酒馆其他部分的样式
 *     - 你也许会用到 `@types/function/displayed_message.d.ts` 中的 `formatAsDisplayedMessage` 函数来格式化消息内容
 *
 * @param creator 创建流式界面的组件, 函数内可以用 `.use` 安装依赖或执行其他逻辑
 * @param options 可选选项
 *   - `host`: 宿主, 默认为 `'iframe'`, 因为 `'iframe'` 能隔离样式, 更方便做复杂界面
 *   - `filter`: 楼层过滤器. 如果设置, 则只有符合条件的楼层才会被挂载流式楼层界面
 *   - `prefix`: 组件的唯一标识符, 默认随机生成一个. 函数产生的流式楼层界面会共享这个 `prefix`, 并将 `host` DOM 的 id 设置成 `${prefix}-${message_id}`.
 * @returns 卸载流式楼层界面的函数
 */
export function mountStreamingMessages(
  creator: () => App,
  options: { host?: 'iframe' | 'div'; filter?: (message_id: number, message: string) => boolean; prefix?: string } = {},
): { unmount: () => void } {
  const { host = 'iframe', filter, prefix = uuidv4() } = options;

  const states: Map<number, { app: App; data: Reactive<StreamingMessageContext>; destroy: () => void }> = new Map();
  let has_stoped = false;

  const destroyIfInvalid = (message_id: number) => {
    const min_message_id = Number($('#chat > .mes').first().attr('mesid'));
    const max_message_id = getLastMessageId();
    if (!_.inRange(message_id, min_message_id, max_message_id + 1)) {
      states.get(message_id)?.destroy();
    }
  };

  const renderOneMessage = async (message_id: number, stream_message?: string) => {
    if (has_stoped) {
      return;
    }
    destroyIfInvalid(message_id);

    const message = stream_message ?? getChatMessages(message_id)[0].message ?? '';
    if (filter && !filter(message_id, message)) {
      states.get(message_id)?.destroy();
      return;
    }

    const $message_element = $(`.mes[mesid='${message_id}']`);

    const $mes_text = $message_element.find('.mes_text').addClass('hidden!');
    $message_element.find('.TH-streaming').addClass('hidden!');

    let $mes_streaming = $message_element.find(`#${prefix}-${message_id}`);
    if ($mes_streaming.length > 0) {
      const state = states.get(message_id);
      if (state) {
        state.data.message = message;
        state.data.during_streaming = Boolean(stream_message);
        $mes_streaming.removeClass('hidden!');
        return;
      }
    }

    states.get(message_id)?.destroy();

    $mes_streaming.remove();
    $mes_streaming = (host === 'iframe' ? createScriptIdIframe() : createScriptIdDiv())
      .addClass(`mes_streaming w-full`)
      .attr('id', `${prefix}-${message_id}`)
      .insertBefore($message_element.find('.mes_media_wrapper'));

    const data = reactive<StreamingMessageContext>({
      prefix,
      host_id: `${prefix}-${message_id}`,
      message_id,
      message,
      during_streaming: Boolean(stream_message),
    });
    const app = creator().provide('streaming_message_context', data);
    if (host === 'iframe') {
      $mes_streaming.on('load', function (this: HTMLIFrameElement) {
        teleportStyle(this.contentDocument!.head);
        app.mount(this.contentDocument!.body);
      });
    } else {
      app.mount($mes_streaming[0]);
    }

    const observer = new MutationObserver(() => {
      const $edit_textarea = $('#curEditTextarea');
      if ($edit_textarea.parent().is($mes_text)) {
        $mes_text.removeClass('hidden!');
        $mes_streaming.addClass('hidden!');
      }
    });
    observer.observe($mes_text[0] as HTMLElement, { childList: true, subtree: true, characterData: true });

    states.set(message_id, {
      app,
      data,
      destroy: () => {
        const $th_streaming = $message_element.find('.TH-streaming');
        if ($th_streaming.length > 0) {
          $th_streaming.removeClass('hidden!');
        } else {
          $mes_text.removeClass('hidden!');
        }

        app.unmount();
        $mes_streaming.remove();
        observer.disconnect();
        states.delete(message_id);
      },
    });
  };

  const renderAllMessage = async () => {
    if (has_stoped) {
      return;
    }
    states.keys().forEach(message_id => destroyIfInvalid(message_id));
    await Promise.all(
      $('#chat')
        .children(".mes[is_user='false'][is_system='false']")
        .map(async (_index, node) => {
          const message_id = Number($(node).attr('mesid') ?? 'NaN');
          if (!isNaN(message_id)) {
            await renderOneMessage(message_id);
          }
        }),
    );
  };

  const stop_list: Array<() => void> = [];
  const scopedEventOn = <T extends EventType>(event: T, listener: ListenerType[T]) => {
    stop_list.push(eventOn(event, errorCatched(listener)).stop);
  };
  scopedEventOn(tavern_events.CHAT_CHANGED, () => renderAllMessage());
  scopedEventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, message_id => renderOneMessage(message_id));
  scopedEventOn(tavern_events.MESSAGE_UPDATED, message_id => renderOneMessage(message_id));
  scopedEventOn(tavern_events.MESSAGE_SWIPED, message_id => {
    states.get(message_id)?.destroy();
    renderOneMessage(message_id);
  });
  scopedEventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(errorCatched(renderAllMessage), 1000));
  scopedEventOn(tavern_events.STREAM_TOKEN_RECEIVED, message => {
    const message_id = Number($('#chat').children('.mes.last_mes').attr('mesid') ?? 'NaN');
    if (!isNaN(message_id)) {
      renderOneMessage(message_id, message);
    }
  });

  if (host === 'div') {
    stop_list.push(teleportStyle().destroy);
  }
  renderAllMessage();

  return {
    unmount: () => {
      $('.mes_text').removeClass('hidden!');
      states.forEach(({ destroy }) => destroy());
      stop_list.forEach(stop => stop());
      has_stoped = true;
    },
  };
}
