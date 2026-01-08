import type { App } from 'vue';
import RoleplayOptions from './RoleplayOptions.vue';
import { REGEX, TAG } from './constant';
import { useConfigStore } from './store';
import { injectStyle } from './style';

const apps: Map<number, App> = new Map();

const pinia = createPinia();
setActivePinia(pinia);

async function renderOneMessage(message_id: number | string) {
  const chat_messages = getChatMessages(message_id);
  if (chat_messages.length === 0) {
    return;
  }
  const message: string = chat_messages[0].message ?? '';
  const match = message.match(REGEX);
  if (!match) {
    return;
  }

  const numbered_message_id = Number(message_id);
  apps.get(numbered_message_id)?.unmount();

  const $mes_text = retrieveDisplayedMessage(numbered_message_id);
  const $to_render = $mes_text.find(`.roleplay_options, pre:contains("${TAG}")`);
  if ($to_render.length > 0) {
    $to_render.parent('.TH-render').remove();
    $to_render.remove();
    const app = createApp(RoleplayOptions, {
      messageId: numbered_message_id,
      options: [...match[2].matchAll(/(.+?)[:：]\s*(.+)/gm)].map(match => ({
        title: match[1],
        content: match[2].replace(/^\$\{(.+)\}$/, '$1').replace(/^「(.+)」$/, '$1'),
      })),
    }).use(pinia);
    apps.set(numbered_message_id, app);
    app.mount($mes_text[0]);
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
      const message_id = $(node).attr('mesid');
      try {
        if (message_id) {
          renderOneMessage(parseInt(message_id));
        }
      } catch (error) {
        /** empty */
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
    apps.forEach(app => {
      app.unmount();
    });
    apps.clear();
    stop();
  });
});
