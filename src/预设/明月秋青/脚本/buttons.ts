import { marked } from 'marked';
import { changelog_content, preset_content, preset_name } from './imports';

interface Button {
  name: string;
  function: (() => void) | (() => Promise<void>);
}

//----------------------------------------------------------------------------------------------------------------------
const import_preset: Button = {
  name: '导入预设',
  function: async () => {
    if (getPresetNames().includes(preset_name)) {
      return;
    }
    const success = await importRawPreset(preset_name, preset_content);
    if (!success) {
      toastr.error('导入预设失败, 请刷新重试', '写卡助手');
      return;
    }
    loadPreset(preset_name);
    toastr.success(`导入预设 '${preset_name}' 成功`, '写卡助手');
  },
};

const show_changelog: Button = {
  name: '更新日志',
  function: () => {
    marked.parse(changelog_content, { async: true, breaks: true }).then(html => {
      SillyTavern.callGenericPopup(html, SillyTavern.POPUP_TYPE.TEXT, '', {
        leftAlign: true,
        wider: true,
        allowVerticalScrolling: true,
      });
    });
  },
};

//----------------------------------------------------------------------------------------------------------------------
function registerButtons(buttons: Button[]) {
  buttons.forEach(button => {
    eventClearEvent(getButtonEvent(button.name));
    eventOn(getButtonEvent(button.name), button.function);
  });
  replaceScriptButtons(buttons.map(button => ({ name: button.name, visible: true })));
}

async function checkButtonStatus(): Promise<Button[]> {
  if (!getPresetNames().includes(preset_name)) {
    return [import_preset, show_changelog];
  }
  if (getLoadedPresetName() !== preset_name) {
    return [{ name: '点击切换预设', function: () => loadPreset(preset_name) }];
  }

  return [];
}

async function changeButtons() {
  const new_button_status = await checkButtonStatus();
  const old_buttons = getScriptButtons();
  if (
    _.isEqual(
      new_button_status.map(button => button.name),
      old_buttons.map(button => button.name),
    )
  ) {
    return;
  }
  registerButtons(new_button_status);
}
const changeButtonsThrottled = _.throttle(changeButtons, 1000, { trailing: false });

export async function initButtons(): Promise<{ destroy: () => void }> {
  registerButtons(await checkButtonStatus());
  eventOn(tavern_events.SETTINGS_UPDATED, changeButtonsThrottled);

  return {
    destroy: () => {
      replaceScriptButtons([]);
      eventRemoveListener(tavern_events.SETTINGS_UPDATED, changeButtonsThrottled);
    },
  };
}
