$(() => {
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, message_id => {
    setTimeout(() => {
      const $last_mes = $('#chat > .mes.last_mes');
      if (Number($last_mes.attr('mesid')) === message_id) {
        if ('scrollBehavior' in window.parent.document.documentElement.style) {
          $last_mes[0]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } else {
          $last_mes[0]?.scrollIntoView({ block: 'start' });
        }
      }
    }, 100);
  });
});
