import { loadReadme } from '@util/script';
import { compare } from 'compare-versions';

$(async () => {
  // 酒馆助手 4.7.0+ 已经将本脚本作为了体验优化选项, 则本脚本不生效, 直接返回
  if (compare(await getTavernHelperVersion(), '4.7.0', '>=')) {
    return;
  }

  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/保存提示词时保存预设/README.md');

  const handler = () => $('#update_oai_preset').trigger('click');
  const $save = $('#completion_prompt_manager_popup_entry_form_save');
  $save.on('click', handler);
  $(window).on('pagehide', () => {
    $save.off('click', handler);
  });
});
