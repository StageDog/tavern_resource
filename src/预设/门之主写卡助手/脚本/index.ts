// @obfuscate
import { initSquash } from '@/酒馆助手/压缩相邻消息/squash';
import { Settings } from '@/酒馆助手/压缩相邻消息/store';
import { check_and_install_extensions } from '@/酒馆助手/自动安装插件/check_and_install_extensions';
import { initButtons } from './buttons';
import { initExtensionSettings } from './extension';

$(async () => {
  const destroy_list: Array<() => void> = [];

  destroy_list.push(initExtensionSettings().destroy);
  destroy_list.push((await initButtons()).destroy);
  destroy_list.push(initSquash(Settings.decode({})).destroy);
  setTimeout(
    () =>
      check_and_install_extensions([{ name: '提示词模板', url: 'https://codeberg.org/zonde306/ST-Prompt-Template' }]),
    10000,
  );

  $(window).on('pagehide', () => {
    destroy_list.forEach(destroy => destroy());
  });
});
