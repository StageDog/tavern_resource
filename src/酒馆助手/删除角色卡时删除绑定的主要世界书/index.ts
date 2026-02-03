import { loadReadme } from '@util/script';
import { compare } from 'compare-versions';

$(async () => {
  // 酒馆助手 4.7.0+ 已经将本脚本作为了体验优化选项, 则本脚本不生效, 直接返回
  if (compare(await getTavernHelperVersion(), '4.7.0', '>=')) {
    return;
  }

  loadReadme(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/删除角色卡时删除绑定的主要世界书/README.md',
  );

  eventOn(tavern_events.CHARACTER_DELETED, async ({ character }) => {
    $('#character_world').val('');
    const worldbook = character.data?.character_book?.name;
    if (worldbook && getLorebooks().includes(worldbook)) {
      await deleteLorebook(character.data.character_book.name);
    }
  });
});
