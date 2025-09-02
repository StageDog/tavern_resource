import { defineStore } from 'pinia';
import { reactive, watch } from 'vue';

import { Settings } from './type';

export const use_settings_store = defineStore('settings', () => {
  const settings = reactive(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watch(
    settings,
    new_settings => {
      replaceVariables(_.cloneDeep(new_settings), { type: 'script', script_id: getScriptId() });
    },
    { immediate: true, deep: true },
  );
  return {
    settings,
  };
});
