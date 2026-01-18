import { mountStreamingMessages } from '@util/streaming';
import App from './App.vue';

$(() => {
  const { unmount } = mountStreamingMessages(() => createApp(App), { host: 'div' });
  $(window).on('pagehide', () => unmount());
});
