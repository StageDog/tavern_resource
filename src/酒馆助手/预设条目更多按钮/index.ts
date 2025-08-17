function get_prompt_id_from_tool($tool: JQuery) {
  return $tool.closest('.completion_prompt_manager_prompt').attr('data-pm-identifier')!;
}

function replace_toolbox() {
  observer.disconnect();
  const $prompts = $(
    '.completion_prompt_manager_prompt:has(.fa-asterisk), .completion_prompt_manager_prompt:has(fa-syringe)',
  );
  const $prompt_controls = $prompts.find('.prompt_manager_prompt_controls');

  $prompts.find('.prompt_manager_prompt_tokens').css('pointer-events', 'none');
  $prompt_controls.find('span[title="Remove"], span[title="copy"], span[title="delete"]').remove();
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
            // 3.4.4 以前酒馆助手没能正确处理 id 冲突
            preset.prompts.splice(index + 1, 0, { ...preset.prompts[index], id: crypto.randomUUID() });
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
const replace_toolbox_debounced = _.debounce(replace_toolbox, 500);

const observer = new MutationObserver(replace_toolbox_debounced);

$(() => {
  replace_toolbox();
});

$(window).on('pagehide', () => {
  replacePreset('in_use', getPreset('in_use'));
  observer.disconnect();
});
