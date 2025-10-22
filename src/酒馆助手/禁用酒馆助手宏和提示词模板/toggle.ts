export function toggleExtensionSettings(enable: boolean) {
  // 酒馆助手 3.0
  const $macro_replace_disable_toggle = $('#macro-replace-disable-toggle');
  if ($macro_replace_disable_toggle.length > 0 && $macro_replace_disable_toggle.prop('checked') !== !enable) {
    $macro_replace_disable_toggle
      .prop('checked', !enable)
      .prop('disabled', !enable)[0]
      .dispatchEvent(new Event('click'));
  }

  // 酒馆助手 4.0
  const $TH_macro_enabled = $('#TH-macro-enabled');
  if ($TH_macro_enabled.length > 0 && $TH_macro_enabled.prop('checked') !== !enable) {
    $TH_macro_enabled.trigger('click').prop('disabled', !enable);
  }

  const $pt_enabled = $('#pt_enabled');
  if ($pt_enabled.length > 0 && $pt_enabled.prop('checked') !== enable) {
    $pt_enabled.prop('checked', enable).prop('disabled', !enable)[0].dispatchEvent(new Event('click'));
  }
}
