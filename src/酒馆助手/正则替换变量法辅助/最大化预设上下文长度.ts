export {};

function unlock_token_length() {
  const MAX_CONTEXT = 2000000;
  const settings = SillyTavern.chatCompletionSettings;
  if (settings.max_context_unlocked === true && settings.openai_max_context === MAX_CONTEXT) {
    return;
  }

  $('#oai_max_context_unlocked').prop('checked', true).trigger('input');
  $('#openai_max_context_counter').val(MAX_CONTEXT);
  $('#openai_max_context').val(MAX_CONTEXT).trigger('input');
}
const unlock_token_length_debounced = _.debounce(unlock_token_length, 1000);

$(() => {
  eventOn(tavern_events.SETTINGS_UPDATED, unlock_token_length_debounced);
});
