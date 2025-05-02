export {};

function lock_inputs(enable: boolean) {
  $('#range_block_openai :input').prop('disabled', enable);
  $('#openai_settings > div:first-child :input').prop('disabled', enable);
  $('#stream_toggle').prop('disabled', false);
  $('#openai_show_thoughts').prop('disabled', false);
}

$(() => {
  lock_inputs(true);
});

$(window).on('unload', () => lock_inputs(false));
