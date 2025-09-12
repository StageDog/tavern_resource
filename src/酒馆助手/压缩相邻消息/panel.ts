import { createPinia } from 'pinia';
import { createApp } from 'vue';
import panel from './panel.vue';

const app = createApp(panel);
const $app = $('<div>').attr('id', 'suqash_adjacent_messages');

export function init_panel() {
  $('#extensions_settings2').append($app);

  app.use(createPinia()).mount($app[0]);
}

export function destroy_panel() {
  app.unmount();
  $app.remove();
}
