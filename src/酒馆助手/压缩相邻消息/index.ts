import { check_minimum_version, load_readme } from '../../util';
import { destroy_panel, init_panel } from './panel';
import { get_settings } from './settings';
import { destory_squash, init_squash } from './squash';

$(() => {
  check_minimum_version('3.4.17', '压缩相邻消息');
  load_readme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');
  init_panel();
  init_squash(get_settings());
});

$(window).on('pagehide', () => {
  destroy_panel();
  destory_squash();
});
