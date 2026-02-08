import { detailedDiff } from 'deep-object-diff';

function selectPreset(settings: Record<string, any>, preset_name: string) {
  _.set(settings, 'preset_settings_openai', preset_name);
  $(`#settings_preset_openai option`)
    .filter(function () {
      return $(this).text() === preset_name;
    })
    .prop('selected', true);
}

$(() => {
  eventOn(tavern_events.OAI_PRESET_CHANGED_BEFORE, async data => {
    const in_use = getPreset('in_use');
    const preset = getPreset(data.presetNameBefore);
    if (_.isEqual(in_use, preset)) {
      return;
    }

    const diff = detailedDiff(preset, in_use);
    const result = await SillyTavern.callGenericPopup(
      builtin.renderMarkdown(
        `'${data.presetNameBefore}' 预设存在以下内容还未保存, 是否切换成 '${data.presetName}' 预设?\n\`\`\`yaml\n${YAML.stringify(_.pickBy(diff, value => !_.isEmpty(value)))}\n\`\`\``,
      ),
      SillyTavern.POPUP_TYPE.CONFIRM,
      '',
      {
        leftAlign: true,
        okButton: '保存并切换',
        cancelButton: '取消',
        customButtons: ['直接切换'],
        wide: true,
      },
    );
    if (result === SillyTavern.POPUP_RESULT.CUSTOM1 || result === 2) {
      return;
    }
    if (result === SillyTavern.POPUP_RESULT.AFFIRMATIVE) {
      await data.savePreset(data.presetNameBefore, data.settings, false);
      selectPreset(data.settings, data.presetNameBefore);
      return;
    }
    Object.keys(data.preset).forEach(key => _.unset(data.preset, key));
    selectPreset(data.settings, data.presetNameBefore);
  });
});
