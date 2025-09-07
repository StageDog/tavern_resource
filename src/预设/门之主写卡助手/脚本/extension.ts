import { preset_name } from './settings';

function toggle_extension_settings(enable: boolean) {
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

function check_extension_settings() {
  toggle_extension_settings(
    getLoadedPresetName() !== preset_name ||
      getPreset('in_use')?.prompts.some(prompt => prompt.name.includes('<游玩模块>') && prompt.enabled === true),
  );
}
const check_extension_settings_throttled = _.throttle(check_extension_settings, 1000, { trailing: false });

export function init_extension_settings() {
  eventOn(tavern_events.SETTINGS_UPDATED, check_extension_settings_throttled);
  check_extension_settings();
}

export function destory_extension_settings() {
  eventRemoveListener(tavern_events.SETTINGS_UPDATED, check_extension_settings_throttled);
  toggle_extension_settings(true);
}
