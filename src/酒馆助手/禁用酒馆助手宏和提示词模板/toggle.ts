export function toggleExtensionSettings(enable: boolean) {
  // 酒馆助手 3.0
  const $macro_replace_disable_toggle = $('#macro-replace-disable-toggle');
  if ($macro_replace_disable_toggle.length > 0 && $macro_replace_disable_toggle.prop('checked') !== !enable) {
    $macro_replace_disable_toggle.prop('checked', !enable)[0].dispatchEvent(new Event('click'));
  }

  // 酒馆助手 4.0
  const $TH_macro_disabled = $('#TH-macro-enabled, #TH-macro-disabled');
  if ($TH_macro_disabled.length > 0 && $TH_macro_disabled.prop('checked') !== !enable) {
    $TH_macro_disabled.trigger('click');
  }

  const $pt_enabled = $('#pt_enabled');
  if ($pt_enabled.length > 0 && $pt_enabled.prop('checked') !== enable) {
    $pt_enabled.prop('checked', enable)[0].dispatchEvent(new Event('click'));
  }
}
