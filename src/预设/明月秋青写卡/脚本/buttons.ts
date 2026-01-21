import { isEjsAndMacroEnabled, toggleEjsAndMacro } from '@/酒馆助手/禁用酒馆助手宏和提示词模板/toggle';
import { marked } from 'marked';
import { changelog_content, preset_content, preset_name } from './imports';

const DESIGN_STEPS: string[] = [
  '📋 世界观协作设计',
  '📋 世界观正式输出',
  '📋 角色基础模板',
  '📋 语料设计模板',
  '📋 角色缺点模板',
  '📋 独立人格模板',
  '📋 兴趣爱好模板',
  '📋 衣柜模板',
  '📋 NSFW档案模板',
  '📋 NSFW语料模板',
  '📋 演绎指导模板',
  '📋 NPC设计模板',
  '📋 角色速览',
  '📋 自由创作助手',
  '📋 开场白创作',
  '📌 世界书配置指南',
  '📋 MVU变量结构脚本',
  '📋 MVU初始变量',
  '📋 MVU变量更新规则',
  '📋 MVU变量列表',
  '📋 MVU变量输出格式',
  '📋 前端美化状态栏',
  '📋 EJS代码',
  '📋 多阶段人设',
  '📋 多阶段控制器',
];

const SELF_CHECK_STEPS: string[] = [
  '🔍 工作流程',
  '🔍 MVU变量结构脚本',
  '🔍 MVU初始变量',
  '🔍 MVU变量更新规则',
  '🔍 MVU变量列表',
  '🔍 MVU变量输出格式',
  '🔍 前端美化状态栏',
  '🔍 EJS代码',
];

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
      SillyTavern.callGenericPopup(html, SillyTavern.POPUP_TYPE.TEXT, '', { leftAlign: true });
    });
  },
};

//----------------------------------------------------------------------------------------------------------------------
function makeEjsAndMacroToggle(): Button {
  const has_enabled = isEjsAndMacroEnabled();
  return {
    name: has_enabled ? '禁用提示词模板和酒馆助手宏' : '启用提示词模板和酒馆助手宏',
    function: async () => {
      toggleEjsAndMacro(!has_enabled);
      toastr.success(has_enabled ? '已禁用提示词模板和酒馆助手宏' : '已启用提示词模板和酒馆助手宏');
    },
  };
}

async function switchToStep(step: number) {
  await updatePresetWith('in_use', preset => {
    preset.prompts
      .filter(prompt => DESIGN_STEPS.some(step => prompt.name.includes(step)))
      .forEach(prompt => (prompt.enabled = false));
    preset.prompts.find(prompt => prompt.name.includes(DESIGN_STEPS[step]))!.enabled = true;
    return preset;
  }).then(
    () => {
      const possible_self_check_name = DESIGN_STEPS[step].replace('📋 ', '🔍 ');
      toastr.success(
        `已切换为 '${DESIGN_STEPS[step]}'${SELF_CHECK_STEPS.some(step => possible_self_check_name === step) ? '<br>完成后点击"自查条目"检查' : ''}`,
        '切换功能成功',
        {
          timeOut: 3000,
          escapeHtml: false,
        },
      );
    },
    error => toastr.error(`${error}`, '切换功能失败'),
  );
}

async function getCurrentStep(prompts: PresetPrompt[]): Promise<number> {
  const step = prompts.find(prompt => DESIGN_STEPS.some(item => prompt.name.includes(item) && prompt.enabled));
  if (!step) {
    await switchToStep(0);
    return 0;
  }
  return DESIGN_STEPS.findIndex(item => step.name.includes(item));
}

function makeStepPrev(step: number): Button {
  return { name: '⇐', function: step > 0 ? () => switchToStep(step - 1) : () => {} };
}

function makeStepInfo(step: number): Button {
  // TODO: 说明功能内容
  return {
    name: `当前：${DESIGN_STEPS[step]}`,
    function: () => {},
  };
}

function makeStepNext(step: number): Button {
  return {
    name: '⇒',
    function: step < DESIGN_STEPS.length - 1 ? () => switchToStep(step + 1) : () => {},
  };
}

const all_steps: Button = {
  name: '所有条目',
  function: async () => {
    console.info(JSON.stringify(DESIGN_STEPS));
    const result = await triggerSlash(`/buttons labels=${JSON.stringify(DESIGN_STEPS)} 选择要开启的条目`);
    if (!result) {
      return;
    }
    await switchToStep(DESIGN_STEPS.findIndex(item => item === result));
  },
};

const self_check_steps: Button = {
  name: '自查条目',
  function: async () => {
    const preset = getPreset('in_use');

    const labels = SELF_CHECK_STEPS.map(name => {
      const p = preset.prompts.find(t => t.name === name);
      return `${p?.enabled ? '✅' : '❌'} ${name}`;
    });

    const selection = await triggerSlash(`/buttons labels=${JSON.stringify(labels)} 选择要切换的自查条目`);
    if (!selection) {
      return;
    }

    const clean_name = selection.replace(/^[✅❌]\s*/, '');
    updatePresetWith('in_use', preset => {
      const prompt = preset.prompts.find(t => t.name === clean_name);
      if (prompt) {
        prompt.enabled = !prompt.enabled;
      }
      return preset;
    });
  },
};

function makeEjsLoreToggle(has_enabled: boolean): Button {
  return {
    name: has_enabled ? '禁用EJS模板库' : '启用EJS模板库',
    function: async () => {
      await updatePresetWith('in_use', preset => {
        preset.prompts.find(t => t.name === '📋 EJS模板库')!.enabled = !has_enabled;
        return preset;
      }).then(
        () => toastr.success(has_enabled ? '已禁用EJS模板库' : '已启用EJS模板库'),
        error => toastr.error(`${error}`, '切换功能失败'),
      );
    },
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
  if (!getPresetNames().includes(preset_name)) {
    return [import_preset, show_changelog];
  }
  if (getLoadedPresetName() !== preset_name) {
    return [{ name: '点击切换预设', function: () => loadPreset(preset_name) }];
  }

  const preset = getPreset('in_use');
  const current_step = await getCurrentStep(preset.prompts);
  return [
    makeEjsAndMacroToggle(),
    makeStepPrev(current_step),
    makeStepInfo(current_step),
    makeStepNext(current_step),
    all_steps,
    self_check_steps,
    makeEjsLoreToggle(preset.prompts.find(prompt => prompt.name === '📋 EJS模板库')?.enabled ?? false),
  ];
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
