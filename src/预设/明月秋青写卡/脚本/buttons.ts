import { isEjsAndMacroEnabled, toggleEjsAndMacro } from '@/酒馆助手/禁用酒馆助手宏和提示词模板/toggle';
import { marked } from 'marked';
import { changelog_content, preset_content, preset_name } from './imports';

type Step = {
  category: '一般条目' | 'MVU变量';
  design: string;
  check?: string;
};

const STEPS: Step[] = [
  { category: '一般条目', design: '📋 世界观协作设计', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 世界观正式输出', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 角色基础', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 语料设计', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 角色缺点', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 独立人格', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 兴趣爱好', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 衣柜', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 NSFW档案', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 NSFW语料', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 演绎指导', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 NPC设计', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 角色速览', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 自由创作助手', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📋 开场白', check: '🔍 一般条目泛用自查' },
  { category: '一般条目', design: '📌 世界书配置指南' },
  { category: 'MVU变量', design: '📋 MVU变量结构脚本', check: '🔍 MVU变量结构脚本' },
  { category: 'MVU变量', design: '📋 MVU初始变量', check: '🔍 MVU初始变量' },
  { category: 'MVU变量', design: '📋 MVU变量更新规则', check: '🔍 MVU变量更新规则' },
  { category: 'MVU变量', design: '📋 MVU变量列表', check: '🔍 MVU变量列表' },
  { category: 'MVU变量', design: '📋 MVU变量输出格式', check: '🔍 MVU变量输出格式' },
  { category: 'MVU变量', design: '📋 前端美化状态栏', check: '🔍 前端美化状态栏' },
  { category: 'MVU变量', design: '📋 EJS代码' },
  { category: 'MVU变量', design: '📋 多阶段人设' },
  { category: 'MVU变量', design: '📋 多阶段控制器' },
] as const;

const ALL_STEPS = STEPS.flatMap(step => [step.design, step.check].filter(_.isString));

function mappedStepName(step: number): string {
  let step_name = ALL_STEPS[step];
  if (step_name === '🔍 一般条目泛用自查') {
    step_name = ALL_STEPS[step - 1].replace('📋 ', '🔍 ');
  }
  return step_name;
}

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
      .filter(prompt => ALL_STEPS.some(step => prompt.name === step))
      .forEach(prompt => (prompt.enabled = false));
    const prompt = preset.prompts.find(prompt => prompt.name.includes(ALL_STEPS[step]));
    if (prompt) {
      prompt.enabled = true;
      if (prompt.name === '🔍 一般条目泛用自查') {
        _.set(prompt, 'extra.current_step', step);
      }
    }
    return preset;
  }).then(
    () =>
      toastr.success(`已切换为 '${mappedStepName(step)}'`, '切换功能成功', {
        timeOut: 3000,
        escapeHtml: false,
      }),
    error => toastr.error(`${error}`, '切换功能失败'),
  );
}

async function getCurrentStep(prompts: PresetPrompt[]): Promise<number> {
  const step = prompts.find(prompt => ALL_STEPS.some(item => prompt.name === item && prompt.enabled));
  if (!step) {
    return 0;
  }
  if (step.name === '🔍 一般条目泛用自查') {
    return _.get(step, 'extra.current_step', 1);
  }
  return ALL_STEPS.findIndex(item => step.name.includes(item));
}

function makeStepPrev(step: number): Button {
  return { name: '⇐', function: step > 0 ? () => switchToStep(step - 1) : () => {} };
}

function makeStepInfo(step: number): Button {
  return { name: `当前：${mappedStepName(step)}`, function: () => {} };
}

function makeStepNext(step: number): Button {
  return {
    name: '⇒',
    function: step < ALL_STEPS.length - 1 ? () => switchToStep(step + 1) : () => {},
  };
}

function makeCategorySteps(category: '一般条目' | 'MVU变量'): Button {
  return {
    name: category,
    function: async () => {
      const DESIGN_STEPS = STEPS.filter(step => step.category === category).map(step => step.design);
      const step_to_choose = await triggerSlash(`/buttons labels=${JSON.stringify(DESIGN_STEPS)} 选择要开启的条目`);
      const step = STEPS.find(item => item.design === step_to_choose);
      if (!step) {
        return;
      }

      let mode_to_choose: '创作' | '自查' | '' = '创作';
      if (step.check) {
        mode_to_choose = (await triggerSlash(
          `/buttons labels=${JSON.stringify(['创作', '自查'])} 你是要创作这个条目, 还是自查这个条目的生成结果?`,
        )) as '创作' | '自查' | '';
      }
      if (!mode_to_choose) {
        return;
      }
      if (mode_to_choose === '创作') {
        await switchToStep(ALL_STEPS.findIndex(item => item === step.design));
      } else {
        await switchToStep(ALL_STEPS.findIndex(item => item === step.check));
      }
    },
  };
}

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
    makeCategorySteps('一般条目'),
    makeCategorySteps('MVU变量'),
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
