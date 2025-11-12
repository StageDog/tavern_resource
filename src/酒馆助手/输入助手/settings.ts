import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';
import { Settings } from './type';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watchEffect(() => {
    replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });

  return { settings };
});
