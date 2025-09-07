import example_chat_content from '../../../../../private/预设/【门之主】写卡助手 - 示例.jsonl?raw';
import preset_content from '../../../../../private/预设/【门之主】写卡助手.json?raw';
import { preset_name } from './settings';

interface Button {
  name: string;
  function: (() => void) | (() => Promise<void>);
}

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

async function toggle_gemini(enable: boolean) {
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
  function: () => toggle_gemini(true),
};

const switch_to_claude_gpt: Button = {
  name: '更换为Claude/GPT',
  function: () => toggle_gemini(false),
};

async function toggle_design_mode(enable: boolean) {
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
  function: () => toggle_design_mode(true),
};

const switch_to_game_mode: Button = {
  name: '切换为游玩模式',
  function: () => toggle_design_mode(false),
};

const design_steps: string[] = [
  '角色详情 (角色定义之前)',
  '角色关键信息 (D4)',
  '角色列表 (D2)',
  '变量列表及更新规则 (D1)',
  '更复杂的变量更新规则 (D4)',
  '变量更新强调 (D0)',
  '变量初始设置 (initvar)',
  '角色阶段 (D3)',
  '生成或转换成动态化提示词',
  '评价和润色提示词',
  '状态栏-纯文字',
  '状态栏-酒馆助手前端界面',
];

async function switch_to_step(step: number) {
  await updatePresetWith('in_use', preset => {
    const design_start = preset.prompts.findIndex(prompt => prompt.name.includes('<设计模块>'));
    const design_end = preset.prompts.findIndex(prompt => prompt.name.includes('</设计模块>'));
    preset.prompts.slice(design_start, design_end + 1).forEach(prompt => {
      prompt.enabled = false;
    });
    preset.prompts[design_start].enabled = true;
    preset.prompts.find(prompt => prompt.name.includes(design_steps[step]))!.enabled = true;
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

async function get_current_step(prompts: PresetPrompt[]): Promise<number> {
  const step = prompts.find(prompt => design_steps.some(item => prompt.name.includes(item) && prompt.enabled));
  if (!step) {
    await switch_to_step(0);
    return 0;
  }
  return design_steps.findIndex(item => step.name.includes(item));
}

function make_step_prev(step: number): Button {
  return { name: '⇐', function: step > 0 ? () => switch_to_step(step - 1) : () => {} };
}

function make_step_info(step: number): Button {
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
    await switch_to_step(design_steps.findIndex(item => item === result));
  },
};

const import_example_chat: Button = {
  name: '导入示例聊天',
  function: () => {
    if (SillyTavern.characterId === undefined) {
      throw Error('导入聊天文件失败, 请先选择一张角色卡');
    }

    const form_data = new FormData();
    form_data.append(
      'avatar',
      new File([example_chat_content], `${preset_name} - 示例.jsonl`, { type: 'application/json' }),
    );
    form_data.append('file_type', 'jsonl');
    form_data.append('avatar_url', SillyTavern.characters[SillyTavern.characterId].avatar);
    form_data.append('character_name', SillyTavern.characters[SillyTavern.characterId].name);
    form_data.append('user_name', SillyTavern.name1);

    const headers = SillyTavern.getRequestHeaders();
    _.unset(headers, 'Content-Type');
    return fetch(`/api/chats/import`, {
      method: 'POST',
      headers: headers,
      body: form_data,
      cache: 'no-cache',
    }).then(
      () => toastr.success(`由于酒馆限制, 请自行在 '管理聊天文件' 中切换示例`, '导入示例聊天成功'),
      error => toastr.error(`${error}`, '导入示例聊天失败'),
    );
  },
};

function make_step_next(step: number): Button {
  return {
    name: '⇒',
    function: step < design_steps.length - 1 ? () => switch_to_step(step + 1) : () => {},
  };
}

//----------------------------------------------------------------------------------------------------------------------
function register_buttons(buttons: Button[]) {
  buttons.forEach(button => {
    eventClearEvent(getButtonEvent(button.name));
    eventOn(getButtonEvent(button.name), button.function);
  });
  replaceScriptButtons(buttons.map(button => ({ name: button.name, visible: true })));
}

async function check_button_status(): Promise<Button[]> {
  if (!getPresetNames().includes(preset_name)) {
    return [import_preset];
  }
  if (!getLoadedPresetName().includes(preset_name)) {
    return [{ name: '点击切换预设', function: () => loadPreset(preset_name) }];
  }
  const result: Button[] = [];

  const preset = getPreset('in_use');
  if (preset.prompts.some(prompt => prompt.name.includes('🟦') && prompt.enabled)) {
    result.push(switch_to_claude_gpt);
  } else {
    result.push(switch_to_gemini);
  }

  if (preset.prompts.some(prompt => prompt.name === '<设计模块>' && prompt.enabled)) {
    const current_step = await get_current_step(preset.prompts);
    result.push(
      switch_to_game_mode,
      make_step_prev(current_step),
      make_step_info(current_step),
      make_step_next(current_step),
      select_step,
      import_example_chat,
    );
  } else {
    result.push(switch_to_design_mode);
  }

  return result;
}

async function change_buttons() {
  const new_button_status = await check_button_status();
  const old_buttons = getScriptButtons();
  if (
    _.isEqual(
      new_button_status.map(button => button.name),
      old_buttons.map(button => button.name),
    )
  ) {
    return;
  }
  register_buttons(new_button_status);
}
const change_buttons_throttled = _.throttle(change_buttons, 1000, { trailing: false });

export async function init_buttons() {
  register_buttons(await check_button_status());
  eventOn(tavern_events.SETTINGS_UPDATED, change_buttons_throttled);
}

export function destory_buttons() {
  replaceScriptButtons([]);
}
