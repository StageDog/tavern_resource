import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { Settings } from './type';

export const use_settings_store = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watch(
    settings,
    new_settings => {
      insertOrAssignVariables(_.cloneDeep(new_settings), { type: 'script', script_id: getScriptId() });
    },
    { immediate: true },
  );
  return {
    settings,
  };
});
