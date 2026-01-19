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
 *     - 你也许会用到 `@types/function/displayed_message.d.ts` 中的 `formatAsDisplayedMessage` 来格式化消息内容, 并用 `.replaceAll('mes_text', 'mes_streaming')` 来为格式化后内容适配样式
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

  const destroyIfInvalid = (message_id: number): boolean => {
    const min_message_id = Number($('#chat > .mes').first().attr('mesid'));
    if (!_.inRange(message_id, min_message_id, SillyTavern.chat.length)) {
      states.get(message_id)?.destroy();
      return true;
    }
    return false;
  };

  const destroyAllInvalid = () => {
    states.keys().forEach(message_id => destroyIfInvalid(message_id));
  };

  const renderOneMessage = async (message_id: number, stream_message?: string) => {
    if (has_stoped) {
      return;
    }
    if (destroyIfInvalid(message_id)) {
      return;
    }

    const message = stream_message ?? getChatMessages(message_id)[0].message ?? '';
    if (filter && !filter(message_id, message)) {
      states.get(message_id)?.destroy();
      return;
    }

    const $message_element = $(`.mes[mesid='${message_id}']`);

    const $mes_text = $message_element.find('.mes_text').addClass('hidden!');
    $message_element.find('.TH-streaming').addClass('hidden!');

    let $host = $message_element.find(`#${prefix}-${message_id}`);
    if ($host.length > 0) {
      const state = states.get(message_id);
      if (state) {
        state.data.message = message;
        state.data.during_streaming = Boolean(stream_message);
        return;
      }
    }

    states.get(message_id)?.destroy();
    $host.remove();

    let $mes_streaming = $message_element.find('.mes_streaming');
    if ($mes_streaming.length === 0) {
      $mes_streaming = $('<div class="mes_streaming">')
        .css({
          'font-weight': '500',
          'line-height': 'calc(var(--mainFontSize) + .5rem)',
          'max-width': '100%',
          'overflow-wrap': 'anywhere',
          padding: 'calc(var(--mainFontSize) * 0.8) 0 0 0',
        })
        .insertAfter($mes_text);
    }

    $host = (host === 'iframe' ? createScriptIdIframe().addClass('w-full') : createScriptIdDiv())
      .attr('id', `${prefix}-${message_id}`)
      .appendTo($mes_streaming);

    const data = reactive<StreamingMessageContext>({
      prefix,
      host_id: `${prefix}-${message_id}`,
      message_id,
      message,
      during_streaming: Boolean(stream_message),
    });
    const app = creator().provide('streaming_message_context', data);
    if (host === 'iframe') {
      $host.on('load', function (this: HTMLIFrameElement) {
        teleportStyle(this.contentDocument!.head);
        app.mount(this.contentDocument!.body);
      });
    } else {
      app.mount($host[0]);
    }

    const observer = new MutationObserver(() => {
      const $edit_textarea = $('#chat').find('#curEditTextarea');
      if ($edit_textarea.parent().is($mes_text)) {
        $mes_text.removeClass('hidden!');
        $host.addClass('hidden!');
      } else if ($edit_textarea.length === 0) {
        $mes_text.addClass('hidden!');
        $message_element.find('.TH-streaming').addClass('hidden!');
        $host.removeClass('hidden!');
      }
    });
    observer.observe($mes_text[0] as HTMLElement, { childList: true });

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
        $host.remove();
        if ($mes_streaming.children().length === 0) {
          $mes_streaming.remove();
        }
        observer.disconnect();
        states.delete(message_id);
      },
    });
  };

  const renderAllMessage = async (options: { destroy_all?: boolean; trigger_event?: boolean } = {}) => {
    if (has_stoped) {
      return;
    }
    if (options.destroy_all) {
      states.forEach(({ destroy }) => destroy());
    } else {
      destroyAllInvalid();
    }
    await Promise.all(
      $('#chat')
        .children(".mes[is_user='false'][is_system='false']")
        .map(async (_index, node) => {
          const message_id = Number($(node).attr('mesid') ?? 'NaN');
          if (!isNaN(message_id)) {
            await renderOneMessage(message_id);
            if (options.trigger_event) {
              eventEmit(tavern_events.CHARACTER_MESSAGE_RENDERED, message_id, 'rerender');
            }
          }
        }),
    );
  };

  const stop_list: Array<() => void> = [];
  const scopedEventOn = <T extends EventType>(event: T, listener: ListenerType[T], first?: true) => {
    stop_list.push(
      first ? eventMakeFirst(event, errorCatched(listener)).stop : eventOn(event, errorCatched(listener)).stop,
    );
  };
  scopedEventOn('chatLoaded', () => {
    renderAllMessage({ destroy_all: true });
  });
  scopedEventOn(
    tavern_events.CHARACTER_MESSAGE_RENDERED,
    message_id => {
      destroyAllInvalid();
      renderOneMessage(message_id);
    },
    true,
  );
  [tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_DELETED].forEach(event =>
    scopedEventOn(event, message_id => {
      destroyAllInvalid();
      states.get(message_id)?.destroy();
      renderOneMessage(message_id);
    }),
  );
  scopedEventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(errorCatched(renderAllMessage), 1000));
  scopedEventOn(tavern_events.STREAM_TOKEN_RECEIVED, message => {
    renderOneMessage(Number($('#chat').children('.mes.last_mes').attr('mesid')), message);
  });

  if (host === 'div') {
    stop_list.push(teleportStyle().destroy);
  }
  renderAllMessage({ trigger_event: true });

  return {
    unmount: () => {
      const $th_streaming = $('#chat').find('.TH-streaming');
      if ($th_streaming.length > 0) {
        $th_streaming.removeClass('hidden!');
      } else {
        $('chat').find('.mes_text').removeClass('hidden!');
      }
      states.forEach(({ destroy }) => destroy());
      stop_list.forEach(stop => stop());
      has_stoped = true;
    },
  };
}
