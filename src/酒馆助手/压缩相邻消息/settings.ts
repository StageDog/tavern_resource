import { Settings } from './type';

let settings: Settings;
export function get_settings(): Settings {
  if (!settings) {
    settings = Settings.parse(getVariables({ type: 'script', script_id: getScriptId() }));
    insertVariables(settings, { type: 'script', script_id: getScriptId() });
  }
  return settings;
}
export function set_settings(new_settings: Settings) {
  settings = new_settings;
  insertOrAssignVariables(settings, { type: 'script', script_id: getScriptId() });
}
