import { checkMinimumVersion, loadReadme } from '@/util/tavern';
import { watchEffect } from 'vue';
import { destroy_panel, init_panel } from './panel';
import { useSettingsStore } from './settings';
import { Button } from './type';

function click_button(button: Button) {
  const $edit = $('#curEditTextarea');
  const $send = $('#send_textarea');
  const $textarea = $edit.length ? $edit : $send;

  const text = $textarea.val() as string;
  const { start_position, end_position } = (() => {
    let start = $textarea.prop('selectionStart');
    let end = $textarea.prop('selectionEnd');
    switch (button.insert_position) {
      case 'prepend': {
        const previous_newline_position = text.lastIndexOf('\n', start);
        start = end = previous_newline_position === -1 ? 0 : previous_newline_position;
        break;
      }
      case 'as_is':
        break;
      case 'append':
      case 'newline': {
        const next_newline_position = text.indexOf('\n', end);
        start = end = next_newline_position === -1 ? text.length : next_newline_position;
        break;
      }
    }
    return { start_position: start, end_position: end };
  })();
  $textarea.val(
    text.substring(0, start_position) +
      (button.insert_position === 'newline' ? '\n' : '') +
      button.content +
      text.substring(end_position),
  );

  const textarea_element = $textarea.get(0) as HTMLTextAreaElement | undefined;
  if (textarea_element) {
    const cursor_position =
      start_position +
      _.clamp(button.cursor_position, 0, button.content.length) +
      (button.insert_position === 'newline' ? 1 : 0);
    textarea_element.focus();
    try {
      textarea_element.setSelectionRange(cursor_position, cursor_position);
    } catch {
      $textarea.prop('selectionStart', cursor_position);
      $textarea.prop('selectionEnd', cursor_position);
    }
  }
}

function rebind_buttons(buttons: Button[]) {
  replaceScriptButtons(
    buttons.map(button => ({
      name: button.name,
      visible: true,
    })),
  );
  eventClearAll();
  buttons.forEach(button => {
    eventOn(getButtonEvent(button.name), () => click_button(button));
  });
}

$(() => {
  checkMinimumVersion('3.4.19', '输入助手');
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/输入助手/README.md');
  init_panel();
  const settings_store = useSettingsStore();
  watchEffect(() => {
    rebind_buttons(settings_store.settings.buttons.filter(button => button.enable));
  });
});

$(window).on('pagehide', () => {
  destroy_panel();
  replaceScriptButtons([]);
});
