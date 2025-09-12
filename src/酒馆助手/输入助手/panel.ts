import { createPinia } from 'pinia';
import { createApp } from 'vue';
import panel from './panel.vue';

const app = createApp(panel);

export function init_panel() {
  const $app = $('<div>').attr('id', 'input_helper');
  $('#extensions_settings2').append($app);

  app.use(createPinia()).mount($app[0]);
  app.onUnmount(() => {
    $app.remove();
  });
}

export function destroy_panel() {
  app.unmount();
}
