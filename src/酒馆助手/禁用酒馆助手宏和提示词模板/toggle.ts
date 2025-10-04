export function toggleExtensionSettings(enable: boolean) {
  const $macro_replace_disable_toggle = $('#macro-replace-disable-toggle');
  if ($macro_replace_disable_toggle.length > 0 && $macro_replace_disable_toggle.prop('checked') !== !enable) {
    $macro_replace_disable_toggle
      .prop('checked', !enable)
      .prop('disabled', !enable)[0]
      .dispatchEvent(new Event('click'));
  }

  const $pt_enabled = $('#pt_enabled');
  if ($pt_enabled.length > 0 && $pt_enabled.prop('checked') !== enable) {
    $pt_enabled.prop('checked', enable).prop('disabled', !enable)[0].dispatchEvent(new Event('click'));
  }
}
