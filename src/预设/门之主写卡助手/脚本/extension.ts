import { toggleExtensionSettings } from '@/酒馆助手/禁用酒馆助手宏和提示词模板/toggle';
import { preset_name } from './imports';

function checkExtensionSettings() {
  toggleExtensionSettings(
    getLoadedPresetName() !== preset_name ||
      getPreset('in_use')?.prompts.some(prompt => prompt.name.includes('<游玩模块>') && prompt.enabled === true),
  );
}
const checkExtensionSettingsThrottled = _.throttle(checkExtensionSettings, 1000, { trailing: false });

export function initExtensionSettings() {
  eventOn(tavern_events.SETTINGS_UPDATED, checkExtensionSettingsThrottled);
  checkExtensionSettings();
}

export function destroyExtensionSettings() {
  eventRemoveListener(tavern_events.SETTINGS_UPDATED, checkExtensionSettingsThrottled);
  toggleExtensionSettings(true);
}
