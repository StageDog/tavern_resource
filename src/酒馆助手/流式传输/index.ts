let srcdoc: string = '';
function initApp() {
  // FIXME: App 没必要是全局脚本, 可以直接用 `document.head` 获取本 iframe 的 head 再加上别的数据
  const app = $('#script-iframe-App').attr('srcdoc');
  if (!app) {
    throw Error(`{Render} 未找到要渲染的 html 界面`);
  }
  srcdoc = app;
}

async function renderOn(message_element: HTMLDivElement, message?: string): Promise<void> {
  const jquery_message_element = $(message_element);
  const message_id = parseInt(jquery_message_element.attr('mesid') as string);
  message = message ?? (await triggerSlash(`/messages names=off ${message_id}`)) ?? '';

  const mes_text = jquery_message_element.find('.mes_text');
  mes_text.prop('hidden', true);

  const app = jquery_message_element.find('.frontend-app');
  if (app.length > 0) {
    app.prop('hidden', false);
    eventEmit(`app-${message_id}`, message);
    return;
  }

  const message_script = `<script>window.message = ${JSON.stringify(message)};</script>`;
  const message_id_script = `<script>window.message_id = ${message_id};</script>`;
  const srcdocWithMessage = srcdoc.replace('</head>', `${message_script}${message_id_script}</head>`);

  const iframe = $('<iframe>')
    .attr('srcdoc', srcdocWithMessage)
    .addClass('frontend-app')
    .css('border', 'none')
    .css('margin', '5px auto')
    .css('width', '100%')
    .insertAfter(jquery_message_element.find('.ch_name'));

  const observer = new MutationObserver(() => {
    const isEditing = $('#curEditTextarea');
    if (isEditing.parent().is(mes_text)) {
      mes_text.prop('hidden', false);
      iframe.prop('hidden', true);
    }
  });

  observer.observe(mes_text.get(0) as HTMLElement, { childList: true, subtree: true, characterData: true });
}

async function renderAll(): Promise<void> {
  const nodes = $('#chat').children(".mes[is_user='false'][is_system='false']") as JQuery<HTMLDivElement>;
  for (const node of nodes) {
    renderOn(node);
  }
}

async function renderLast(message: string): Promise<void> {
  const node = $('#chat').children('.mes.last_mes').get(0) as HTMLDivElement | undefined;
  if (node) {
    renderOn(node, message);
  }
}

initApp();
renderAll();
eventOn(tavern_events.MESSAGE_DELETED, renderAll);
eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, renderAll);
eventOn(tavern_events.USER_MESSAGE_RENDERED, renderAll);
eventOn(tavern_events.MESSAGE_UPDATED, renderAll);
eventOn(tavern_events.MESSAGE_SWIPED, renderAll);
eventOn(tavern_events.STREAM_TOKEN_RECEIVED, renderLast);
