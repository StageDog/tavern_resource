import { initSquash } from '@/酒馆助手/压缩相邻消息/squash';
import { Settings } from '@/酒馆助手/压缩相邻消息/store';
import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';

$(() => {
  checkMinimumVersion('3.4.17', '深度条目排斥器');
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/深度条目排斥器/README.md');
  const { destroy } = initSquash(
    Settings.decode({
      depth_injection: {
        above: {
          enabled: true,
          type: 'exclude',
        },
        below: {
          enabled: true,
          type: 'exclude',
        },
      },
      chat_history: {
        type: 'squash_nearby',
      },
    }),
  );
  $(window).on('pagehide', () => {
    destroy();
  });
});
