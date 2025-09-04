// @no-ci
import { check_and_install_extensions } from '../../../酒馆助手/自动安装插件/check_and_install_extensions';
import { destory_buttons, init_buttons } from './buttons';
import { destory_extension_settings, init_extension_settings } from './extension';

$(() => {
  check_and_install_extensions([
    {
      name: '提示词模板',
      url: 'https://codeberg.org/zonde306/ST-Prompt-Template',
    },
  ]);
  init_extension_settings();
  init_buttons();
});

$(window).on('pagehide', () => {
  destory_buttons();
  destory_extension_settings();
});
