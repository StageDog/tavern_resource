$(() => {
  eventOn(tavern_events.CHARACTER_DELETED, async ({ character }) => {
    $('#character_world').val('');
    if (character.data?.character_book?.name) {
      await deleteLorebook(character.data.character_book.name);
    }
  });
});
