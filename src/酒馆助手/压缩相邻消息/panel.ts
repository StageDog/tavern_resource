import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { deteleport_vue_style, teleport_vue_style } from '../../util';
import panel from './panel.vue';

const app = createApp(panel);

export function init_panel() {
  teleport_vue_style();

  const $app = $('<div>').attr('script_id', getScriptId());
  $('#extensions_settings2').append($app);

  app.use(createPinia()).mount($app[0]);
}

export function destroy_panel() {
  app.unmount();

  $(`#extensions_settings2 > div[script_id="${getScriptId()}"]`).remove();

  deteleport_vue_style();
}
