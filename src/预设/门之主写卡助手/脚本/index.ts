// @obfuscate
import { initSquash } from '@/酒馆助手/压缩相邻消息/export';
import { Settings } from '@/酒馆助手/压缩相邻消息/store';
import { toggleEjsAndMacro } from '@/酒馆助手/禁用酒馆助手宏和提示词模板/toggle';
import { check_and_install_extensions } from '@/酒馆助手/自动安装插件/check_and_install_extensions';
import { initButtons } from './buttons';
import { PRESET_NAME } from './imports';

$(async () => {
  setTimeout(
    () =>
      check_and_install_extensions([{ name: '提示词模板', url: 'https://codeberg.org/zonde306/ST-Prompt-Template' }]),
    10000,
  );

  toggleEjsAndMacro(
    getLoadedPresetName() !== PRESET_NAME ||
      getPreset('in_use')?.prompts.some(prompt => prompt.name.includes('<游玩模块>') && prompt.enabled === true),
  );

  const destroy_list: Array<() => void> = [];
  destroy_list.push((await initButtons()).destroy);
  destroy_list.push(
    initSquash({
      settings: Settings.decode({
        stop_string: '/Explorer:|<\\|im_end\\|>/',
        chat_history: {
          user_prefix: 'Explorer:\n',
          user_suffix: '',
          assistant_prefix: 'Yog-Sothoth:\n',
          assistant_suffix: '',
          system_prefix: '设定:\n',
          system_suffix: '',
        },
      }),
      locked_as: '门之主写卡助手',
    }).destroy,
  );

  $(window).on('pagehide', () => {
    destroy_list.forEach(destroy => destroy());
    toggleEjsAndMacro(true);
  });
});
