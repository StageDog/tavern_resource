import { createScriptIdDiv, teleportStyle } from '@util/script';
import 界面 from './设置界面.vue';

$(() => {
  const app = createApp(界面).use(createPinia());

  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
});
