const handler = () => $('#update_oai_preset').trigger('click');

$(() => {
  $('#completion_prompt_manager_popup_entry_form_save').on('click', handler);
});

$(window).on('unload', () => {
  $('#completion_prompt_manager_popup_entry_form_save').off('click', handler);
});
