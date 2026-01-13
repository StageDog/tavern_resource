import { createScriptIdDiv, destroyScriptIdDiv, deteleportStyle, teleportStyle } from '@util/script';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Panel from './Panel.vue';

const app = createApp(Panel);

export function initPanel() {
  teleportStyle();

  const $app = createScriptIdDiv();
  $('#extensions_settings2').append($app);

  app.use(createPinia()).mount($app[0]);
  return {
    destroy: () => {
      app.unmount();
      destroyScriptIdDiv();
      deteleportStyle();
    },
  };
}
