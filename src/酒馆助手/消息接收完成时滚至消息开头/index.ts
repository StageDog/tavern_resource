$(() => {
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, message_id => {
    const $last_mes = $('#chat > .mes.last_mes');
    if (Number($last_mes.attr('mesid')) === message_id) {
      $last_mes[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
