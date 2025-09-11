import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';

import { Settings } from './type';

export const use_settings_store = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watchEffect(() => {
    replaceVariables(_.cloneDeep(settings.value), { type: 'script', script_id: getScriptId() });
  });
  return {
    settings,
  };
});
