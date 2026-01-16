import type { App as VueApp } from 'vue';
import App from './App.vue';
import { useConfigStore } from './store';
import { injectStyle } from './style';

const apps: Map<number, VueApp> = new Map();

const pinia = createPinia();
setActivePinia(pinia);

const TAG = '<roleplay_options>' as const;
const REGEX = /<(roleplay_options)>\s*(?:```.*\n)?((?:(?!<\1>)[\s\S])*?)(?:\n```)?\s*<\/\1>/im;

async function renderOneMessage(message_id: number) {
  const chat_messages = getChatMessages(message_id);
  if (chat_messages.length === 0) {
    return;
  }
  const message: string = chat_messages[0].message ?? '';
  const match = message.match(REGEX);
  if (!match) {
    return;
  }

  apps.get(message_id)?.unmount();
  apps.delete(message_id);

  const $mes_text = retrieveDisplayedMessage(message_id);
  const $to_render = $mes_text.find(`pre:contains("${TAG}")`);
  if ($to_render.length > 0) {
    const $th_render = $to_render.parent('.TH-render');
    if ($th_render.length > 0) {
      $th_render.addClass('hidden!');
    } else {
      $to_render.addClass('hidden!');
    }

    const app = createApp(App, {
      messageId: message_id,
      options: [...match[2].matchAll(/(.+?)[:：]\s*(.+)/gm)].map(match => ({
        title: match[1],
        content: match[2].replace(/^\$\{(.+)\}$/, '$1').replace(/^「(.+)」$/, '$1'),
      })),
    }).use(pinia);

    apps.set(message_id, app);

    const possible_div = $mes_text.find(`div[script_id="${getScriptId()}"]`);
    app.mount(
      possible_div.length > 0 ? possible_div[0] : $('<div>').attr('script_id', getScriptId()).appendTo($mes_text)[0],
    );
  }
}

async function renderAllMessage() {
  apps.forEach(app => {
    app.unmount();
  });
  apps.clear();

  $('#chat')
    .children(".mes[is_user='false'][is_system='false']")
    .each((_index, node) => {
      const message_id = Number($(node).attr('mesid') ?? 'NaN');
      if (!isNaN(message_id)) {
        renderOneMessage(message_id);
      }
    });
}

$(async () => {
  await useConfigStore()._wait_init;
  const { stop } = injectStyle();
  await renderAllMessage();
  eventOn(tavern_events.CHAT_CHANGED, errorCatched(renderAllMessage));
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, errorCatched(renderOneMessage));
  eventOn(tavern_events.MESSAGE_UPDATED, errorCatched(renderOneMessage));
  eventOn(tavern_events.MESSAGE_SWIPED, errorCatched(renderOneMessage));
  eventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(errorCatched(renderAllMessage), 1000));

  $(window).on('pagehide', () => {
    $(`pre:contains("${TAG}")`).each(function () {
      const $th_render = $(this).parent('.TH-render');
      if ($th_render.length > 0) {
        $th_render.removeClass('hidden!');
      } else {
        $(this).removeClass('hidden!');
      }
    });

    apps.forEach(app => {
      app?.unmount();
    });
    apps.clear();

    stop();
  });
});
