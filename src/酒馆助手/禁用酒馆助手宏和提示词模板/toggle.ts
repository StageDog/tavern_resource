export function isEjsAndMacroEnabled(): boolean {
  return !$('#macro-replace-disable-toggle, #TH-macro-enabled, #TH-macro-disabled').prop('checked');
}

export function toggleEjsAndMacro(enable: boolean) {
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

  if (EjsTemplate) {
    EjsTemplate.setFeatures({
      enabled: enable,
      generate_enabled: true,
      generate_loader_enabled: true,
      inject_loader_enabled: true,
      render_enabled: false,
      render_loader_enabled: false,
      code_blocks_enabled: false,
      raw_message_evaluation_enabled: false,
      filter_message_enabled: false,
      autosave_enabled: false,
      preload_worldinfo_enabled: false,
      invert_enabled: true,
      compile_workers: false,
      sandbox: false,
    });
  }
}
