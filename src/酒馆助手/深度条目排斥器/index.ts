import { checkMinimumVersion } from '@/util/common';
import { loadReadme } from '@/util/script';
import { Settings } from '@/酒馆助手/压缩相邻消息/settings';
import { initSquash } from '@/酒馆助手/压缩相邻消息/squash';

$(() => {
  checkMinimumVersion('3.4.17', '深度条目排斥器');
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/深度条目排斥器/README.md');
  const { destroy } = initSquash(
    Settings.decode({
      name: '深度排斥器',
      put_system_injection_after_chat_history: true,
      on_chat_history: {
        type: 'mixin',
      },
    }),
  );
  $(window).on('pagehide', () => {
    destroy();
  });
});
