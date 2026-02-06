import { initPanel } from './panel';
import { initSquashWithoutPanel } from './squash';
import { Settings, useSettingsStore } from './store';

export function initSquash(options: { settings?: Settings; locked_as?: string } = {}) {
  const { destroy: destroyPanel } = initPanel();

  const store = useSettingsStore();
  if (options.settings) {
    store.settings = options.settings;
  }
  if (options.locked_as) {
    store.locked_as = options.locked_as;
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
