// @obfuscate
import { Settings } from '@/酒馆助手/压缩相邻消息/settings';
import { initSquash } from '@/酒馆助手/压缩相邻消息/squash';
import { check_and_install_extensions } from '@/酒馆助手/自动安装插件/check_and_install_extensions';
import { destroy_buttons, initButtons } from './buttons';
import { destroyExtensionSettings, initExtensionSettings } from './extension';

$(() => {
  initExtensionSettings();
  initButtons();
  initSquash(Settings.decode({}));
  setTimeout(
    () =>
      check_and_install_extensions([{ name: '提示词模板', url: 'https://codeberg.org/zonde306/ST-Prompt-Template' }]),
    10000,
  );
});

$(window).on('pagehide', () => {
  destroy_buttons();
  destroyExtensionSettings();
});
