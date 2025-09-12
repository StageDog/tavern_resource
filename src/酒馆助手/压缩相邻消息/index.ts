import { check_minimum_version, deteleport_vue_style, load_readme, teleport_vue_style } from '../../util';
import { destroy_panel, init_panel } from './panel';
import { use_settings_store } from './settings';
import { destory_squash, init_squash } from './squash';

$(() => {
  check_minimum_version('3.4.17', '压缩相邻消息');
  load_readme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');
  teleport_vue_style();
  init_panel();
  init_squash(use_settings_store().settings);
});

$(window).on('pagehide', () => {
  deteleport_vue_style();
  destroy_panel();
  destory_squash();
});
