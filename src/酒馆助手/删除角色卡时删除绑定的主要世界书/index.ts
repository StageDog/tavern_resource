import { loadReadme } from '@util/script';

$(async () => {
  loadReadme(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/删除角色卡时删除绑定的主要世界书/README.md',
  );

  eventOn(tavern_events.CHARACTER_DELETED, async ({ character }) => {
    $('#character_world').val('');
    if (character.data?.character_book?.name) {
      await deleteLorebook(character.data.character_book.name);
    }
  });
});
