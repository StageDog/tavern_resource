import { createPinia } from 'pinia';
import panel from './panel.vue';

import { createApp } from 'vue';

const app = createApp(panel);
const $app = $('<div>').attr('id', 'input_helper');

export function init_panel() {
  $('#extensions_settings2').append($app);

  app.use(createPinia()).mount($app[0]);
}

export function destroy_panel() {
  app.unmount();
  $app.remove();
}
