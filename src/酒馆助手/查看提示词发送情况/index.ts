function is_chat_completion() {
  return SillyTavern.mainApi === 'openai';
}

function add_button() {
  const $launch_button = $('<div class="list-group-item flex-container flexGap5 interactable">')
    .attr('id', 'prompt_inspector_button')
    .prop('tabIndex', 0)
    .append($('<i class="fa-solid fa-bug">'))
    .append($('<span>').text('提示词发送情况'))
    .on('click', show_prompt_inspector);

  $('#extensionsMenu').append($launch_button);
}

function remove_button() {
  $('#prompt_inspector_button').remove();
}

function on_chat_completion_prompt_ready(data: Parameters<ListenerType['chat_completion_prompt_ready']>[0]) {
  if (data.dryRun || !is_chat_completion()) {
    return;
  }

  setTimeout(async () => {
    const prompts = await Promise.all(
      data.chat.map(async ({ role, content }) => ({
        role,
        content,
        token: await SillyTavern.getTokenCountAsync(content),
      })),
    );
    localStorage.setItem('prompt_inspector_data', JSON.stringify(prompts));
    localStorage.setItem(
      'prompt_inspector_token',
      String(await SillyTavern.getTokenCountAsync(prompts.map(prompt => prompt.content).join('\n'))),
    );
  });
}

function show_prompt_inspector(): void {
  const prompts: { role: string; content: string; token: number }[] = JSON.parse(
    localStorage.getItem('prompt_inspector_data') ?? '[]',
  );
  const token: string = localStorage.getItem('prompt_inspector_token') ?? '';

  const create_entry = (prompt: { role: string; content: string; token: number }) => {
    const $entry = $('<div class="inline-drawer completion_prompt_manager_prompt">');

    const $title = $('<div class="inline-drawer-toggle inline-drawer-header">')
      .append($('<span>').text(`身份: ${prompt.role}, 提示词数: ${prompt.token}`))
      .append($('<div class="fa-solid inline-drawer-icon interactable down fa-circle-chevron-down" tabindex="0">'));

    const $content = $('<div class="inline-drawer-content monospace">')
      .css('white-space', 'pre-wrap')
      .css('display', 'block')
      .text(prompt.content);

    return $entry.append($title, $content);
  };

  const $template = $('<div>')
    .append($('<h3>提示词发送情况</h3>'))
    .append($('<div class="text_muted">').text(`总提示词数: ${token}`))
    .append($('<div id="completion_prompt_manager_popup_entry_form_inspect_list">').append(prompts.map(create_entry)));

  const popup = new SillyTavern.Popup($template[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
    leftAlign: true,
    wide: true,
    large: true,
    allowVerticalScrolling: true,
  });
  popup.show();
}

$(() => {
  add_button();
  eventMakeLast(tavern_events.CHAT_COMPLETION_PROMPT_READY, on_chat_completion_prompt_ready);
});
$(window).on('unload', () => {
  remove_button();
  eventRemoveListener(tavern_events.CHAT_COMPLETION_PROMPT_READY, on_chat_completion_prompt_ready);
});
