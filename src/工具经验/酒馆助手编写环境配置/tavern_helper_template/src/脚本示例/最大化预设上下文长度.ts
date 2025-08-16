// 在加载脚本时执行某个函数
$(() => {
  lock_inputs(true);
});

// 在卸载脚本时执行某个函数
$(window).on('pagehide', () => lock_inputs(false));

function lock_inputs(enable: boolean) {
  $('#range_block_openai :input').prop('disabled', enable);
  $('#openai_settings > div:first-child :input').prop('disabled', enable);
  $('#stream_toggle').prop('disabled', false);
  $('#openai_show_thoughts').prop('disabled', false);
}
