import { toggleExtensionSettings } from '@/酒馆助手/禁用酒馆助手宏和提示词模板/toggle';
import { preset_name } from './imports';

function checkExtensionSettings() {
  toggleExtensionSettings(
    getLoadedPresetName() !== preset_name ||
      getPreset('in_use')?.prompts.some(prompt => prompt.name.includes('<游玩模块>') && prompt.enabled === true),
  );
}
const checkExtensionSettingsThrottled = _.throttle(checkExtensionSettings, 1000, { trailing: false });

let settings: EjsTemplate.Features;

export function initExtensionSettings() {
  eventOn(tavern_events.SETTINGS_UPDATED, checkExtensionSettingsThrottled);
  checkExtensionSettings();
  if (typeof EjsTemplate.getFeatures === 'function') {
    settings = EjsTemplate.getFeatures();
    EjsTemplate.setFeatures({
      enabled: true,

      generate_enabled: true,
      generate_loader_enabled: true,
      inject_loader_enabled: true,

      render_enabled: false,
      render_loader_enabled: false,
      code_blocks_enabled: false,
      raw_message_evaluation_enabled: false,
      filter_message_enabled: false,
      depth_limit: -1,

      autosave_enabled: false,
      preload_worldinfo_enabled: false,
      with_context_disabled: false,
      debug_enabled: false,
      invert_enabled: true,
    });
  }
}

export function destroyExtensionSettings() {
  eventRemoveListener(tavern_events.SETTINGS_UPDATED, checkExtensionSettingsThrottled);
  toggleExtensionSettings(true);
  if (settings) {
    EjsTemplate.setFeatures(settings);
  }
}
