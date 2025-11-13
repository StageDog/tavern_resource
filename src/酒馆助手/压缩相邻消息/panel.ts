import { createPinia } from 'pinia';
import { createScriptIdDiv, destroyScriptIdDiv, deteleportStyle, teleportStyle } from 'util/tavern';
import { createApp } from 'vue';
import Panel from './Panel.vue';

const app = createApp(Panel);

export function initPanel() {
  teleportStyle();

  const $app = createScriptIdDiv();
  $('#extensions_settings2').append($app);

  app.use(createPinia()).mount($app[0]);
}

export function destroyPanel() {
  app.unmount();
  destroyScriptIdDiv();
  deteleportStyle();
}
