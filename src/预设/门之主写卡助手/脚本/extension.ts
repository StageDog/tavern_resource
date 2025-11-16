import { toggleExtensionSettings } from '@/酒馆助手/禁用酒馆助手宏和提示词模板/toggle';
import { preset_name } from './imports';

function check_extension_settings() {
  toggleExtensionSettings(
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
  toggleExtensionSettings(true);
}
