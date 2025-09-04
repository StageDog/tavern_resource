// @no-ci
import { destory_buttons, init_buttons } from './buttons';
import { destory_extension_settings, init_extension_settings } from './extension';

$(() => {
  init_extension_settings();
  init_buttons();
});

$(window).on('pagehide', () => {
  destory_buttons();
  destory_extension_settings();
});
