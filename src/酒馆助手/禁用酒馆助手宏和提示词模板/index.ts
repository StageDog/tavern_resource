import { loadReadme } from '@util/script';
import { isEjsAndMacroEnabled, toggleEjsAndMacro } from './toggle';

$(() => {
  loadReadme(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/禁用酒馆助手宏和提示词模板/README.md',
  );
  toggleEjsAndMacro(false);

  eventOn(getButtonEvent('禁用酒馆助手宏和提示词模板'), () => {
    toggleEjsAndMacro(false);
  });
  eventOn(getButtonEvent('启用酒馆助手宏和提示词模板'), () => {
    toggleEjsAndMacro(true);
  });

  const checkStatusAndSetButtons = _.throttle(
    () => {
      const buttons = getScriptButtons();
      const button = buttons.find(
        button => button.name === '启用酒馆助手宏和提示词模板' || button.name === '禁用酒馆助手宏和提示词模板',
      );

      if (!button) {
        appendInexistentScriptButtons([{ name: '启用酒馆助手宏和提示词模板', visible: true }]);
        return;
      }

      const is_disabled = !isEjsAndMacroEnabled();
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
$(window).on('pagehide', () => toggleEjsAndMacro(true));
