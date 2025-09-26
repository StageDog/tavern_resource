import { checkMinimumVersion, loadReadme } from '../../util';
import { destroy_panel, init_panel } from './panel';
import { use_settings_store } from './settings';
import { destory_squash, init_squash } from './squash';

$(() => {
  checkMinimumVersion('3.4.17', '压缩相邻消息');
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');
  init_panel();
  init_squash(use_settings_store().settings);
});

$(window).on('pagehide', () => {
  destroy_panel();
  destory_squash();
});
