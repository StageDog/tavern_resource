$(()=>{eventOn(tavern_events.CHARACTER_DELETED,async({character:a})=>{$('#character_world').val(''),await deleteLorebook(a.data.character_book.name)})});
//# sourceMappingURL=index.js.map