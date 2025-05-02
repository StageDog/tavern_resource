export {};

$(async () => {
  const power_user = SillyTavern.powerUserSettings;

  function toggle_if_not_allowed(setting: string, expected: boolean): boolean {
    if (power_user[setting] === expected) {
      return false;
    }
    power_user[setting] = expected;
    $(`#${setting}`).prop('checked', expected);
    return true;
  }

  if (
    ['auto_fix_generated_markdown', 'trim_sentences', 'forbid_external_media', 'encode_tags']
      .map(setting => toggle_if_not_allowed(setting, false))
      .some(is_changed => !!is_changed)
  ) {
    SillyTavern.saveSettingsDebounced();
  }
});
