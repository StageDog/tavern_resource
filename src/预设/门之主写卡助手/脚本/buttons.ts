import { marked } from 'marked';
import { CHANGELOG_CONTENT, EXAMPLE_CHAT_CONTENT, PRESET_CONTENT, PRESET_NAME } from './imports';

interface Button {
  name: string;
  function: (() => void) | (() => Promise<void>);
}

const import_preset: Button = {
  name: '导入预设',
  function: async () => {
    if (getPresetNames().includes(PRESET_NAME)) {
      return;
    }
    const success = await importRawPreset(PRESET_NAME, PRESET_CONTENT);
    if (!success) {
      toastr.error('导入预设失败, 请刷新重试', '写卡助手');
      return;
    }
    loadPreset(PRESET_NAME);
    toastr.success(`导入预设 '${PRESET_NAME}' 成功`, '写卡助手');
  },
};

const show_changelog: Button = {
  name: '更新日志',
  function: () => {
    marked.parse(CHANGELOG_CONTENT, { async: true, breaks: true }).then(html => {
      SillyTavern.callGenericPopup(html, SillyTavern.POPUP_TYPE.TEXT, '', { leftAlign: true });
    });
  },
};

async function toggleGemini(enable: boolean) {
  await updatePresetWith('in_use', preset => {
    preset.prompts
      .filter(prompt => prompt.name.includes('🟦'))
      .forEach(prompt => {
        prompt.enabled = enable;
      });
    preset.prompts
      .filter(prompt => prompt.name.includes('🟨'))
      .forEach(prompt => {
        prompt.enabled = !enable;
      });
    return preset;
  }).then(
    () =>
      toastr.success('已切换为 ' + (enable ? 'Gemini, 在预设底部可以开关 Gemini 战书' : 'Claude/GPT'), '切换破限成功'),
    error => toastr.error(`${error}`, '切换破限失败'),
  );
}

const switch_to_gemini: Button = {
  name: '更换为Gemini',
  function: () => toggleGemini(true),
};

const switch_to_claude_gpt: Button = {
  name: '更换为Claude/GPT',
  function: () => toggleGemini(false),
};

async function toggleDesignMode(enable: boolean) {
  await updatePresetWith('in_use', preset => {
    const design_start = preset.prompts.findIndex(prompt => prompt.name.includes('<设计模块>'));
    const design_end = preset.prompts.findIndex(prompt => prompt.name.includes('</设计模块>'));
    const game_start = preset.prompts.findIndex(prompt => prompt.name.includes('<游玩模块>'));
    const game_end = preset.prompts.findIndex(prompt => prompt.name.includes('</游玩模块>'));

    const do_enable = (prompt: PresetPrompt) => {
      prompt.enabled = _.get(prompt, 'extra.was_enabled', false);
    };
    const do_disbale = (prompt: PresetPrompt) => {
      if (prompt.enabled) {
        _.set(prompt, 'extra.was_enabled', true);
      } else {
        _.unset(prompt, 'extra.was_enabled');
      }
      prompt.enabled = false;
    };
    preset.prompts.slice(design_start, design_end + 1).forEach(enable ? do_enable : do_disbale);
    preset.prompts.slice(game_start, game_end + 1).forEach(enable ? do_disbale : do_enable);
    return preset;
  }).then(
    () =>
      toastr.success(
        `已切换为${enable ? '设计模式' : '游玩模式'}并${enable ? '关闭' : '开启'}了提示词模板和酒馆助手宏${enable ? '' : ', 在预设中可以自定义游玩设置'}`,
        '切换模式成功',
      ),
    error => toastr.error(`${error}`, '切换模式失败'),
  );
}

const switch_to_design_mode: Button = {
  name: '切换为写卡模式',
  function: () => toggleDesignMode(true),
};

const switch_to_game_mode: Button = {
  name: '切换为游玩模式',
  function: () => toggleDesignMode(false),
};

const design_steps: string[] = [
  '角色详情qkl版',
  '角色详情nova版',
  '角色关键信息',
  '角色列表',
  '变量结构设计 (脚本)',
  '变量初始设置 (initvar)',
  '变量更新规则',
  '变量列表',
  '变量输出格式',
  '变量输出格式强调',
  '角色阶段',
  '生成或转换成动态化提示词',
  '评价和润色提示词',
  '状态栏-纯文字',
  '状态栏-酒馆助手前端界面',
  '❌状态栏-流式美化',
  '❌流式楼层美化',
  '❌文风',
];

async function switchToStep(step: number) {
  await updatePresetWith('in_use', preset => {
    const prompt = preset.prompts.find(prompt => prompt.name.includes(design_steps[step]))!;

    if (design_steps[step].includes('❌')) {
      marked
        .parse(`# ${design_steps[step]} 尚不可用\n\n${prompt.content!}`, { async: true, breaks: true })
        .then(html => {
          SillyTavern.callGenericPopup(html, SillyTavern.POPUP_TYPE.TEXT, '', { leftAlign: true });
        });
      throw Error(`${design_steps[step]} 尚不可用`);
    }

    const design_start = preset.prompts.findIndex(prompt => prompt.name.includes('<设计模块>'));
    const design_end = preset.prompts.findIndex(prompt => prompt.name.includes('</设计模块>'));
    preset.prompts.slice(design_start, design_end + 1).forEach(prompt => {
      prompt.enabled = false;
    });

    preset.prompts[design_start].enabled = true;
    prompt.enabled = true;
    preset.prompts[design_end].enabled = true;
    return preset;
  }).then(
    () =>
      toastr.success(
        `已切换为 '${design_steps[step]}'${design_steps[step].includes('动态化提示词') ? ', 你可以让它生成使用变量的提示词, 也可以提供一段提示词让它改用变量动态化' : ''}`,
        '切换功能成功',
      ),
    error => toastr.error(`${error}`, '切换功能失败'),
  );
}

async function getCurrentStep(prompts: PresetPrompt[]): Promise<number> {
  const step = prompts.find(prompt => design_steps.some(item => prompt.name.includes(item) && prompt.enabled));
  if (!step) {
    await switchToStep(0);
    return 0;
  }
  return design_steps.findIndex(item => step.name.includes(item));
}

function makeStepPrev(step: number): Button {
  return { name: '⇐', function: step > 0 ? () => switchToStep(step - 1) : () => {} };
}

function makeStepInfo(step: number): Button {
  // TODO: 说明功能内容
  return {
    name: `当前：${design_steps[step]}`,
    function: () => toastr.error('暂无功能具体说明，请参考示例聊天记录，直接输入要求让 AI 生成', '咕咕咕'),
  };
}

const select_step: Button = {
  name: '选择功能',
  function: async () => {
    console.info(JSON.stringify(design_steps));
    const result = await triggerSlash(`/buttons labels=${JSON.stringify(design_steps)} 请选择功能`);
    if (!result) {
      return;
    }
    await switchToStep(design_steps.findIndex(item => item === result));
  },
};

const import_example_chat: Button = {
  name: '导入示例聊天',
  function: () => {
    importRawChat(`${PRESET_NAME} - 示例.jsonl`, EXAMPLE_CHAT_CONTENT).then(
      () => toastr.success(`由于酒馆限制, 请自行在 '管理聊天文件' 中切换示例`, '导入示例聊天成功'),
      error => toastr.error(`${error}`, '导入示例聊天失败'),
    );
  },
};

function makeStepNext(step: number): Button {
  return {
    name: '⇒',
    function: step < design_steps.length - 1 ? () => switchToStep(step + 1) : () => {},
  };
}

//----------------------------------------------------------------------------------------------------------------------
function registerButtons(buttons: Button[]) {
  buttons.forEach(button => {
    eventClearEvent(getButtonEvent(button.name));
    eventOn(getButtonEvent(button.name), button.function);
  });
  replaceScriptButtons(buttons.map(button => ({ name: button.name, visible: true })));
}

async function checkButtonStatus(): Promise<Button[]> {
  if (!getPresetNames().includes(PRESET_NAME)) {
    return [import_preset, show_changelog];
  }
  if (getLoadedPresetName() !== PRESET_NAME) {
    return [{ name: '点击切换预设', function: () => loadPreset(PRESET_NAME) }];
  }
  const result: Button[] = [];

  const preset = getPreset('in_use');
  if (preset.prompts.some(prompt => prompt.name.includes('🟦') && prompt.enabled)) {
    result.push(switch_to_claude_gpt);
  } else {
    result.push(switch_to_gemini);
  }

  if (preset.prompts.some(prompt => prompt.name === '<设计模块>' && prompt.enabled)) {
    const current_step = await getCurrentStep(preset.prompts);
    result.push(
      switch_to_game_mode,
      makeStepPrev(current_step),
      makeStepInfo(current_step),
      makeStepNext(current_step),
      select_step,
      import_example_chat,
    );
  } else {
    result.push(switch_to_design_mode);
  }

  return result;
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
