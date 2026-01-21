import { toggleEjsAndMacro } from '@/酒馆助手/禁用酒馆助手宏和提示词模板/toggle';
import { PRESET_NAME } from './imports';

function checkExtensionSettings() {
  toggleEjsAndMacro(
    getLoadedPresetName() !== PRESET_NAME ||
      getPreset('in_use')?.prompts.some(prompt => prompt.name.includes('<游玩模块>') && prompt.enabled === true),
  );
}
const checkExtensionSettingsThrottled = _.throttle(checkExtensionSettings, 1000, { trailing: false });

let settings: EjsTemplate.Features;

export function initEjsAndMacro() {
  if (EjsTemplate && typeof EjsTemplate.getFeatures === 'function') {
    settings = EjsTemplate.getFeatures();
    EjsTemplate.setFeatures({
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

  checkExtensionSettings();
  eventOn(tavern_events.SETTINGS_UPDATED, checkExtensionSettingsThrottled);

  return {
    destroy: () => {
      eventRemoveListener(tavern_events.SETTINGS_UPDATED, checkExtensionSettingsThrottled);

      if (EjsTemplate && settings) {
        EjsTemplate.setFeatures(settings);
      }
    },
  };
}
