import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';
import { initPanel } from './panel';
import { initSquash } from './squash';
import { useSettingsStore } from './store';

$(() => {
  checkMinimumVersion('3.4.17', '压缩相邻消息');
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');

  const { destroy: destroyPanel } = initPanel();

  let destroySquash: () => void;
  watch(
    () => useSettingsStore().settings,
    newSettings => {
      destroySquash?.();
      destroySquash = initSquash(newSettings).destroy;
    },
    { immediate: true, deep: true },
  );

  $(window).on('pagehide', () => {
    destroyPanel();
    destroySquash();
  });
});
