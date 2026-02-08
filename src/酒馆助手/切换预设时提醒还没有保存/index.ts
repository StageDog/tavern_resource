import { detailedDiff } from 'deep-object-diff';

$(() => {
  const $select = $('#settings_preset_openai');

  let allow_next = false;
  async function onChange(event: Event) {
    if (allow_next) {
      allow_next = false;
      return;
    }
    event.stopImmediatePropagation();
    event.stopPropagation();

    const preset_before = SillyTavern.chatCompletionSettings.preset_settings_openai;

    const in_use = getPreset('in_use');
    const preset_content = getPreset(preset_before);
    if (_.isEqual(in_use, preset_content)) {
      allow_next = true;
      $select.trigger('change');
      return;
    }

    const diff = detailedDiff(preset_content, in_use);
    const preset_after = $select.find(':selected').text();
    const result = await SillyTavern.callGenericPopup(
      builtin.renderMarkdown(
        `'${preset_before}' 预设存在以下内容还未保存, 是否切换成 '${preset_after}' 预设?\n\`\`\`yaml\n${YAML.stringify(_.pickBy(diff, value => !_.isEmpty(value)))}\n\`\`\``,
      ),
      SillyTavern.POPUP_TYPE.CONFIRM,
      '',
      {
        leftAlign: true,
        customButtons: ['保存并切换'],
        okButton: '仅切换',
        cancelButton: '取消',
        wide: true,
      },
    );

    console.warn(result);

    if (!result) {
      $select
        .find('option')
        .filter(function () {
          return $(this).text() === preset_before;
        })
        .prop('selected', true);
      return;
    }

    if (result === 2) {
      await replacePreset(preset_before, in_use);
    }
    allow_next = true;
    $select.trigger('change');
  }

  $select[0].addEventListener('change', onChange, { capture: true });

  $(window).on('pagehide', () => {
    $select[0].removeEventListener('change', onChange);
  });
});
