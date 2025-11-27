$(() => {
  eventOn(tavern_events.CHARACTER_DELETED, async ({ character }) => {
    $('#character_world').val('');
    await deleteLorebook(character.data.character_book.name);
  });
});
