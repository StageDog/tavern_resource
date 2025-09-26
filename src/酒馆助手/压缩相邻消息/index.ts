import { checkMinimumVersion, loadReadme } from '../../util';
import { destroyPanel, initPanel } from './panel';
import { useSettingsStore } from './settings';
import { destroySquash, initSquash } from './squash';

$(() => {
  checkMinimumVersion('3.4.17', '压缩相邻消息');
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');
  initPanel();
  initSquash(useSettingsStore().settings);
});

$(window).on('pagehide', () => {
  destroyPanel();
  destroySquash();
});
