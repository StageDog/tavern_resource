import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';
import { watchEffect } from 'vue';
import { initPanel } from './panel';
import { useSettingsStore } from './settings';
import { Button } from './type';

function click_button(button: Button) {
  const active_element = window.parent.document.activeElement;
  const possible_textarea =
    active_element?.tagName === 'IFRAME'
      ? (active_element as HTMLIFrameElement).contentDocument?.activeElement
      : active_element;
  const $textarea =
    possible_textarea &&
    (possible_textarea.tagName === 'TEXTAREA' ||
      (possible_textarea.tagName === 'INPUT' && $(possible_textarea).prop('type') === 'text'))
      ? $(possible_textarea)
      : $('#send_textarea');
  if ($textarea.length === 0) {
    return;
  }
  const textarea_element = $textarea[0] as HTMLTextAreaElement | HTMLInputElement;

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
  const { destroy } = initPanel();
  const settings_store = useSettingsStore();
  watchEffect(() => {
    rebind_buttons(settings_store.settings.buttons.filter(button => button.enable));
  });

  $(window).on('pagehide', () => {
    destroy();
  });
});
