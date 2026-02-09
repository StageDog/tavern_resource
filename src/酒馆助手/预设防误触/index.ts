import '@/酒馆助手/最大化预设上下文长度/index';

function lock(enable: boolean) {
  $('#range_block_openai :input').prop('disabled', enable);
  $('#openai_settings > div:first-child :input').prop('disabled', enable);
  $('#stream_toggle').prop('disabled', false);
  $('#openai_show_thoughts').prop('disabled', false);
}

$(() => {
  const $lock =
    $(`<div class="margin0 menu_button menu_button_icon interactable" tabindex="0" role="button" style="color: var(--active);">
<i class="fa-fw fa-solid fa-lock"></i>
<i class="fa-fw fa-solid fa-unlock hidden!"></i>
</div>`).on('click', function () {
      if ($(this).find('.fa-lock').is(':visible')) {
        $(this).css('color', '');
        lock(false);
      } else {
        $(this).css('color', 'var(--active)');
        lock(true);
      }
      $(this).find('.fa-lock').toggleClass('hidden!');
      $(this).find('.fa-unlock').toggleClass('hidden!');
    });

  lock(true);
  $('#import_oai_preset').parent().prepend($lock);

  $(window).on('pagehide', () => {
    $lock.remove();
    lock(false);
  });
});
