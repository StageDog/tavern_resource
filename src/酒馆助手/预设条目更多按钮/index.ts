function get_prompt_id_from_tool($tool: JQuery) {
  return $tool.closest('.completion_prompt_manager_prompt').attr('data-pm-identifier')!;
}

function replace_toolbox() {
  observer.disconnect();
  const $prompt_controls = $('.prompt_manager_prompt_controls:has(span[title="Remove"])');
  $prompt_controls.find('span[title="Remove"]').hide();
  $prompt_controls.find('span[title="copy"]').remove();
  $prompt_controls.find('span[title="delete"]').remove();
  $prompt_controls.prepend(
    $('<span title="copy" class="prompt-manager-copy-action fa-solid fa-copy fa-xs"></span>').on(
      'click',
      async function () {
        const prompt_id = get_prompt_id_from_tool($(this));
        await updatePresetWith(
          'in_use',
          preset => {
            const index = preset.prompts.findIndex(prompt => prompt.id === prompt_id);
            if (index === -1) {
              return preset;
            }
            preset.prompts.splice(index + 1, 0, preset.prompts[index]);
            return preset;
          },
          { render: 'immediate' },
        );
      },
    ),
  );
  $prompt_controls.prepend(
    $('<span title="delete" class="prompt-manager-remove-action caution fa-solid fa-trash fa-xs"></span>').on(
      'click',
      async function () {
        const result = await SillyTavern.callGenericPopup('确定要永久删除这个条目吗?', SillyTavern.POPUP_TYPE.CONFIRM);
        if (!result) {
          return;
        }
        const prompt_id = get_prompt_id_from_tool($(this));
        await updatePresetWith(
          'in_use',
          preset => {
            const index = preset.prompts.findIndex(prompt => prompt.id === prompt_id);
            if (index === -1) {
              return preset;
            }
            preset.prompts.splice(index, 1);
            return preset;
          },
          { render: 'immediate' },
        );
      },
    ),
  );
  observer.observe($('#completion_prompt_manager')[0], {
    childList: true,
    subtree: true,
  });
}
const replace_toolbox_debounced = _.debounce(replace_toolbox, 200);

const observer = new MutationObserver(replace_toolbox_debounced);

$(() => {
  replace_toolbox();
});

$(window).on('unload', () => {
  const $prompts = $('.prompt_manager_prompt_controls:has(span[title="Remove"])');
  $prompts.find('span[title="Remove"]').show();
  $prompts.find('span[title="copy"]').remove();
  $prompts.find('span[title="delete"]').remove();

  observer.disconnect();
});
