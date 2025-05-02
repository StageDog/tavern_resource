export {};

$(() => {
  eventOn(tavern_events.CHAT_CHANGED, async () => {
    const characters = SillyTavern.characters;
    const characterId = SillyTavern.characterId;

    if (characterId === undefined) {
      return;
    }
    const avatar = characters[characterId].avatar;
    const extension_settings = SillyTavern.extensionSettings.character_allowed_regex;
    if (!extension_settings.includes(avatar)) {
      extension_settings.push(avatar);
      await TavernHelper.builtin.saveSettings();
      await SillyTavern.saveChat();
      await SillyTavern.reloadCurrentChat();
    }
  });
});
