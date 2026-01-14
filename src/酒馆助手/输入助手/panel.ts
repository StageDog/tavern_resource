import { createScriptIdDiv, teleportStyle } from '@util/script';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import Panel from './Panel.vue';

export function initPanel() {
  const app = createApp(Panel).use(createPinia());

  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  return {
    destroy: () => {
      app.unmount();
      $app.remove();
      destroy();
    },
  };
}
