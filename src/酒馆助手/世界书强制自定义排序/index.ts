const $option = $('#world_info_sort_order');

function switchToCustomSort() {
  $option.val('13');
  $option[0].dispatchEvent(new Event('change'));
}

$(() => {
  switchToCustomSort();
  $option.prop('disabled', true);
});

$(window).on('pagehide', () => {
  $option.prop('disabled', false);
});
