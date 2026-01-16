import { createScriptIdIframe } from '@util/script';
import type { Reactive, App as VueApp } from 'vue';
import { useConfigStore } from '../store';
import App from './App.vue';
import { Data } from './type';

const states: Map<number, { app: VueApp; data: Reactive<Data>; destroy: () => void }> = new Map();

const CLASS = 'mes_galgame' as const;

function destroy(message_id: number | string) {
  const numbered_message_id = Number(message_id);
  states.get(numbered_message_id)?.destroy();
  states.delete(numbered_message_id);
}

function destroyIfInvalid(message_id: number | string) {
  const numbered_message_id = Number(message_id);
  const min_message_id = Number($('#chat > .mes').first().attr('mesid'));
  const max_message_id = getLastMessageId();
  if (!_.inRange(numbered_message_id, min_message_id, max_message_id + 1)) {
    destroy(message_id);
  }
}

function destroyAllInvalid() {
  states.keys().forEach(message_id => destroyIfInvalid(message_id));
}

async function renderOneMessage(message_id: number | string, stream_message?: string) {
  const numbered_message_id = Number(message_id);
  if (isNaN(numbered_message_id)) {
    return;
  }

  const $message_element = $(`.mes[mesid='${numbered_message_id}']`);

  destroyIfInvalid(numbered_message_id);

  const message = stream_message ?? getChatMessages(numbered_message_id)[0].message ?? '';
  const matched = message.match(/<galgame>\s*```/im);
  if (!matched) {
    destroy(numbered_message_id);
    return;
  }

  const $mes_text = $message_element.find('.mes_text');
  $mes_text.addClass('hidden!');

  let $mes_galgame = $message_element.find(`.${CLASS}`) as JQuery<HTMLIFrameElement>;
  if ($mes_galgame.length > 0) {
    const state = states.get(numbered_message_id);
    if (state) {
      state.data.duringStreaming = Boolean(stream_message);
      state.data.message = message;
      $mes_galgame.removeClass('hidden!');
      return;
    }
  }

  destroy(numbered_message_id);

  $mes_galgame.remove();
  $mes_galgame = createScriptIdIframe()
    .addClass(`${CLASS} w-full`)
    .attr('id', `stream-${numbered_message_id}`)
    .insertAfter($mes_text);

  const data = reactive(<Data>{
    messageId: numbered_message_id,
    message,
    duringStreaming: Boolean(stream_message),
    inputMethod: useConfigStore().config.选择框触发方式,
  });
  const app = createApp(App).provide('data', data).use(createPinia());
  $mes_galgame.on('load', function () {
    app.mount(this.contentDocument!.body);
  });

  const observer = new MutationObserver(() => {
    const $edit_textarea = $('#curEditTextarea');
    if ($edit_textarea.parent().is($mes_text)) {
      $mes_text.removeClass('hidden!');
      $mes_galgame.addClass('hidden!');
    }
  });

  observer.observe($mes_text[0] as HTMLElement, { childList: true, subtree: true, characterData: true });

  const stop = watch(
    () => useConfigStore().config.选择框触发方式,
    new_input_method => {
      data.inputMethod = new_input_method;
    },
  );

  states.set(numbered_message_id, {
    app,
    data,
    destroy: () => {
      $mes_text.removeClass('hidden!');
      app.unmount();
      $mes_galgame.remove();
      observer.disconnect();
      stop();
    },
  });
}

async function renderAllMessage() {
  destroyAllInvalid();

  $('#chat')
    .children(".mes[is_user='false'][is_system='false']")
    .each((_index, node) => {
      renderOneMessage($(node).attr('mesid') ?? 'NaN');
    });
}

export function initGalgame() {
  renderAllMessage();
  eventOn(
    tavern_events.CHAT_CHANGED,
    errorCatched(() => renderAllMessage()),
  );
  eventOn(
    tavern_events.CHARACTER_MESSAGE_RENDERED,
    errorCatched(message_id => renderOneMessage(message_id)),
  );
  eventOn(
    tavern_events.MESSAGE_UPDATED,
    errorCatched(message_id => renderOneMessage(message_id)),
  );
  eventOn(
    tavern_events.MESSAGE_SWIPED,
    errorCatched(message_id => {
      destroy(message_id);
      renderOneMessage(message_id);
    }),
  );
  eventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(errorCatched(renderAllMessage), 1000));
  eventOn(
    tavern_events.STREAM_TOKEN_RECEIVED,
    errorCatched(message => renderOneMessage($('#chat').children('.mes.last_mes').attr('mesid') ?? 'NaN', message)),
  );

  return {
    destroy: () => {
      $('.mes_text').removeClass('hidden!');

      states.forEach(({ destroy }) => destroy());
      states.clear();
      $(`.${CLASS}`).remove();
    },
  };
}
