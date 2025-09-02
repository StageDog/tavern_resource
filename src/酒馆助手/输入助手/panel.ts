import { createPinia } from 'pinia';
import panel from './panel.vue';

import { createApp } from 'vue';

const app = createApp(panel);
const $app = $('<div>').attr('id', 'input_helper');

export function init_panel() {
  $('#extensions_settings2').append($app);

  app.use(createPinia()).mount($app[0]);

  const scope_id = $app
    .find('div')[0]
    .getAttributeNames()
    .find(value => value.startsWith('data-v-'));
  $app.append($(`head > style:contains("${scope_id}")`, document));
}

export function destroy_panel() {
  app.unmount();
  $app.remove();
}
