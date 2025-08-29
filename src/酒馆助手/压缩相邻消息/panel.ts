import panel from './panel.vue';

import { createApp } from 'vue';

export function init_panel() {
  $('#extensions_settings2').append(`<div id="squash_nearby_same_role_messages_settings"></div>`);
  createApp(panel).mount($('#squash_nearby_same_role_messages_settings')[0]);
}

export function destroy_panel() {
  $('#extensions_settings2').find('#squash_nearby_same_role_messages_settings').remove();
}
