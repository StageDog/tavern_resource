import { loadReadme } from '@util/script';

$(async () => {
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/保存提示词时保存预设/README.md');

  const handler = () => $('#update_oai_preset').trigger('click');
  const $save = $('#completion_prompt_manager_popup_entry_form_save');
  $save.on('click', handler);
  $(window).on('pagehide', () => {
    $save.off('click', handler);
  });
});
