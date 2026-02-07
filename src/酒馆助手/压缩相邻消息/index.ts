import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';
import { initSquash } from './export';

$(() => {
  checkMinimumVersion('4.0.0', '压缩相邻消息');
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');

  const { destroy } = initSquash();
  $(window).on('pagehide', () => {
    destroy();
  });
});
