import { initPanel } from './panel';
import { initSquashWithoutPanel } from './squash';
import { Settings, useSettingsStore } from './store';

export function initSquash(settings?: Settings) {
  const { destroy: destroyPanel } = initPanel();

  const store = useSettingsStore();
  if (settings) {
    store.settings = settings;
  }

  let destroySquash: () => void;
  watch(
    () => store.settings,
    newSettings => {
      destroySquash?.();
      destroySquash = initSquashWithoutPanel(newSettings).destroy;
    },
    { immediate: true, deep: true },
  );

  return {
    destroy: () => {
      destroyPanel();
      destroySquash();
    },
  };
}
