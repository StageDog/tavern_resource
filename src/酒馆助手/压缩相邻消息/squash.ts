import { assignInplace, chunkBy } from '../../util';
import { Settings } from './settings';

type Prompt = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

//----------------------------------------------------------------------------------------------------------------------
const head_separator = '{【{【聊天记录开头】}】}';
const deep_separator = '{【{【聊天记录深度分割】}】}';
const tail_separator = '{【{【聊天记录结尾】}】}';
const seperators: InjectionPrompt[] = [
  {
    id: '\0压缩相邻消息',
    position: 'in_chat',
    depth: 9999,
    role: 'assistant',
    content: head_separator,
  },
  {
    id: '\xff压缩相邻消息深度分割',
    position: 'in_chat',
    depth: 10,
    role: 'system',
    content: deep_separator,
  },
  {
    id: '\xff压缩相邻消息',
    position: 'in_chat',
    depth: 0,
    role: 'system',
    content: tail_separator,
  },
];

function injectSeperators() {
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dry_run) => {
    if (dry_run) {
      return;
    }
    injectPrompts(seperators);
  });
}

function uninjectSeperators() {
  uninjectPrompts(seperators.map(({ id }) => id));
}

//----------------------------------------------------------------------------------------------------------------------
function seperatePrompts(prompts: Prompt[]): Prompt[][] | null {
  const head_index = prompts.findIndex(({ content }) => content.includes(head_separator));
  const deep_index = prompts.findIndex(({ content }) => content.includes(deep_separator));
  const tail_index = prompts.findIndex(({ content }) => content.includes(tail_separator));
  if (head_index === -1 || deep_index === -1 || tail_index === -1) {
    return null;
  }

  const [before_head_prompt_content, after_head_prompt_content] = prompts[head_index].content.split(head_separator);
  const [before_deep_prompt_content, after_deep_prompt_content] = prompts[deep_index].content.split(deep_separator);
  const [before_tail_prompt_content, after_tail_prompt_content] = prompts[tail_index].content.split(tail_separator);

  return [
    [...prompts.slice(0, head_index), { role: prompts[head_index].role, content: before_head_prompt_content }],
    [
      { role: prompts[head_index].role, content: after_head_prompt_content },
      ...prompts.slice(head_index + 1, deep_index),
      { role: prompts[deep_index].role, content: before_deep_prompt_content },
    ],
    [
      { role: prompts[deep_index].role, content: after_deep_prompt_content },
      ...prompts.slice(deep_index + 1, tail_index),
      { role: prompts[tail_index].role, content: before_tail_prompt_content },
    ],
    [{ role: prompts[tail_index].role, content: after_tail_prompt_content }, ...prompts.slice(tail_index + 1)],
  ];
}

function rejectEmptyPrompts(prompts: Prompt[]): Prompt[] {
  return prompts.filter(({ content }) => content.trim() !== '');
}

function squashMessageByRole(prompts: Prompt[], settings: Settings): Prompt[] {
  return chunkBy(prompts, (lhs, rhs) => lhs.role === rhs.role).map(chunk => ({
    role: chunk[0].role,
    content: chunk.map(({ content }) => content.trim()).join(settings.seperator.value),
  }));
}

function squashChatHistory(prompts: Prompt[], settings: Settings): Prompt {
  // TODO: zod encode
  const system_prefix = substitudeMacros(settings.on_chat_history.system_prefix);
  const system_suffix = substitudeMacros(settings.on_chat_history.system_suffix);
  const assistant_prefix = substitudeMacros(settings.on_chat_history.assistant_prefix);
  const assistant_suffix = substitudeMacros(settings.on_chat_history.assistant_suffix);
  const user_prefix = substitudeMacros(settings.on_chat_history.user_prefix);
  const user_suffix = substitudeMacros(settings.on_chat_history.user_suffix);
  return {
    role: settings.on_chat_history.squash_role,
    content: prompts
      .map(({ role, content }) => {
        switch (role) {
          case 'system':
            return system_prefix + content.trim() + system_suffix;
          case 'assistant':
            return assistant_prefix + content.trim() + assistant_suffix;
          case 'user':
            return user_prefix + content.trim() + user_suffix;
        }
      })
      .join(settings.seperator.value),
  };
}

function listenEvent(settings: Settings) {
  let check_dry_run = false;
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dry_run) => {
    check_dry_run = dry_run;
  });
  eventMakeLast(
    tavern_events.GENERATE_AFTER_DATA,
    ({ prompt }: { prompt: SillyTavern.SendingMessage[] }, dry_run?: boolean) => {
      // 1.13.4 及之前 GENERATE_AFTER_DATA 没有 dry_run 参数
      if (dry_run ?? check_dry_run) {
        return;
      }

      if (prompt.some(({ content }) => typeof content !== 'string')) {
        // TODO: 支持带图片、多媒体的脚本
        return;
      }

      const chunks = seperatePrompts(prompt);
      if (chunks === null) {
        return;
      }
      if (settings.put_system_injection_after_chat_history) {
        chunks[0] = _.concat(
          chunks[0],
          _.remove(chunks[1], ({ role }) => role === 'system'),
        );
        chunks[3] = _.concat(
          _.remove(chunks[2], ({ role }) => role === 'system'),
          chunks[3],
        );
      }
      const [head, before_chat_history, after_chat_history, tail] = _(chunks)
        .map(prompts => rejectEmptyPrompts(prompts))
        .map(prompts => squashMessageByRole(prompts, settings))
        .value();
      switch (settings.on_chat_history.type) {
        case 'mixin':
          assignInplace(
            prompt,
            squashMessageByRole(_.concat(head, before_chat_history, after_chat_history, tail), settings),
          );
          break;
        case 'seperate':
          assignInplace(
            prompt,
            _.concat(head, squashMessageByRole(_.concat(before_chat_history, after_chat_history), settings), tail),
          );
          break;
        case 'squash':
          assignInplace(
            prompt,
            _.concat(head, squashChatHistory(_.concat(before_chat_history, after_chat_history), settings), tail),
          );
          break;
      }
    },
  );
}

//----------------------------------------------------------------------------------------------------------------------
export function initSquash(settings: Settings) {
  injectSeperators();
  listenEvent(settings);
}

export function destroySquash() {
  uninjectSeperators();
}
