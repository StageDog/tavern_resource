let chat_id = SillyTavern.getCurrentChatId();
eventOn(tavern_events.CHAT_CHANGED, new_chat_id => {
  if (chat_id !== new_chat_id) {
    chat_id = new_chat_id;
    window.location.reload();
  }
});
