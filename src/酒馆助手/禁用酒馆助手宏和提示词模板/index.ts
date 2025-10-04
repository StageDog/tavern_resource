import { loadReadme } from '../../util';
import { toggleExtensionSettings } from './toggle';

$(() => {
  loadReadme(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/禁用酒馆助手宏和提示词模板/README.md',
  );
  toggleExtensionSettings(false);

  eventOn(getButtonEvent('禁用酒馆助手宏和提示词模板'), () => {
    toggleExtensionSettings(false);
  });
  eventOn(getButtonEvent('启用酒馆助手宏和提示词模板'), () => {
    toggleExtensionSettings(true);
  });

  const checkStatusAndSetButtons = _.throttle(
    () => {
      const buttons = getScriptButtons();
      let button: ScriptButton;
      const possible_button = buttons.find(
        button => button.name === '启用酒馆助手宏和提示词模板' || button.name === '禁用酒馆助手宏和提示词模板',
      );
      if (!possible_button) {
        button = { name: '启用酒馆助手宏和提示词模板', visible: true };
        buttons.push(button);
      } else {
        button = possible_button;
      }

      const is_disabled = $('#macro-replace-disable-toggle').prop('checked');
      const should_enable = button.name === '启用酒馆助手宏和提示词模板';
      if (is_disabled === should_enable) {
        return;
      }
      if (is_disabled) {
        button.name = '启用酒馆助手宏和提示词模板';
      } else {
        button.name = '禁用酒馆助手宏和提示词模板';
      }
      replaceScriptButtons(buttons);
    },
    1000,
    { trailing: false },
  );
  eventOn(tavern_events.SETTINGS_UPDATED, checkStatusAndSetButtons);
  checkStatusAndSetButtons();
});
$(window).on('pagehide', () => toggleExtensionSettings(true));
