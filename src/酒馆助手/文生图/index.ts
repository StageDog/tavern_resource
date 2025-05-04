export {};

import style from './index.scss?raw';

const image_tag = 'image_tag' as const;
const image_tag_regex = new RegExp(`<${image_tag}>(.+?)<\/${image_tag}>`, 'gs');

function extract_element(prompt: string): JQuery<HTMLDivElement> {
  const $div = $(
    `<div class="text_to_image_container" id="text_to_image-${Math.random().toString(36).slice(2, 9)}">`,
  ) as JQuery<HTMLDivElement>;
  $div.append(`<style>${style}</style>`);
  $div.append(
    $(`<button class="text_to_image_button" data="${_.escape(prompt.trim())}"></button>`)
      .on('click', async function (this: HTMLButtonElement) {
        $(this).text('生成中...');
        const prompt = _.unescape($(this).attr('data'));
        const result = await triggerSlash(`/sd quiet=true ${prompt}`);
        if (!result) {
          $(this).text('重新生成');
          return;
        }
        $(this).text('重新生成');
        $(this).next('span').empty().append(`<img src="${result}" />`);
      })
      .text('生成图片'),
  );
  $div.append(`<span class="text_to_image_result"></span>`);
  return $div;
}

async function renderOneMessage(message_id: number) {
  const message: string = getChatMessages(message_id)[0].message;
  const $elements = [...message.matchAll(image_tag_regex)].map(match => extract_element(match[1]));

  retrieveDisplayedMessage(message_id)
    .find(`pre:contains("${image_tag}")`)
    .each(function (index: number) {
      $(this).replaceWith($elements[index]);
    });
}

async function renderAllMessage() {
  $('#chat')
    .children(".mes[is_user='false'][is_system='false']")
    .each((_index, node) => {
      renderOneMessage(Number(node.getAttribute('mesid')));
    });
}

$(async () => {
  await errorCatched(renderAllMessage)();
  eventOn(tavern_events.CHAT_CHANGED, errorCatched(renderAllMessage));
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, errorCatched(renderOneMessage));
  eventOn(tavern_events.MESSAGE_UPDATED, errorCatched(renderOneMessage));
  eventOn(tavern_events.MESSAGE_SWIPED, errorCatched(renderOneMessage));
  eventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(errorCatched(renderAllMessage), 1000));
});
