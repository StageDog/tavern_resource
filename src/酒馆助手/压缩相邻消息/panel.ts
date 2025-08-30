import panel from './panel.vue';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

const app = createApp(panel);

export function init_panel() {
  $('#extensions_settings2').append(`<div id="squash_nearby_same_role_messages_settings"></div>`);
  app.use(createPinia()).mount($('#squash_nearby_same_role_messages_settings')[0]);
}

export function destroy_panel() {
  $('#extensions_settings2').find('#squash_nearby_same_role_messages_settings').remove();
  app.unmount();
}
