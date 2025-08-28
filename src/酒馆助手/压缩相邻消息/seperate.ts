import { Prompt } from '@/酒馆助手/压缩相邻消息/type';

const head_separator = '{【{【聊天记录开头】}】}';
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
    id: '\xff压缩相邻消息',
    position: 'in_chat',
    depth: 0,
    role: 'assistant',
    content: tail_separator,
  },
];

export function seperate_prompts(prompts: Prompt[]): { head: Prompt[]; chat_history: Prompt[]; tail: Prompt[] } | null {
  const head_index = prompts.findIndex(({ content }) => content.includes(head_separator));
  const tail_index = prompts.findIndex(({ content }) => content.includes(tail_separator));
  if (head_index === -1 || tail_index === -1) {
    return null;
  }
  prompts[head_index].content = prompts[head_index].content.replace(new RegExp(`${head_separator}\n?`), '').trim();
  prompts[tail_index].content = prompts[tail_index].content.replace(new RegExp(`\n?${tail_separator}`), '').trim();
  return {
    head: prompts.slice(0, head_index),
    chat_history: prompts.slice(head_index, tail_index + 1),
    tail: prompts.slice(tail_index + 1),
  };
}

export function inject_seperators() {
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dry_run) => {
    if (dry_run) {
      return;
    }
    injectPrompts(seperators);
  });
}

export function uninject_seperators() {
  uninjectPrompts(seperators.map(({ id }) => id));
}
