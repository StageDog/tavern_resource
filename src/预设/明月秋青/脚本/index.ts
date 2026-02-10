// @obfuscate
import { initButtons } from './buttons';

$(async () => {
  const { destroy } = await initButtons();
  $(window).on('pagehide', () => {
    destroy();
  });
});
