import { mountStreamingMessages } from '@util/streaming';
import App from './App.vue';

$(() => {
  const { unmount } = mountStreamingMessages(() => {
    return createApp(App).use(createPinia());
  });
  $(window).on('pagehide', () => unmount());
});
