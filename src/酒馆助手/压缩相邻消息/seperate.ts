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
    role: 'system',
    content: tail_separator,
  },
];

export function seperate_prompts(prompts: Prompt[]): Prompt[][] | null {
  const head_index = prompts.findIndex(({ content }) => content.includes(head_separator));
  const tail_index = prompts.findIndex(({ content }) => content.includes(tail_separator));
  if (head_index === -1 || tail_index === -1) {
    return null;
  }

  const [before_head_prompt_content, after_head_prompt_content] = prompts[head_index].content.split(head_separator);
  const [before_tail_prompt_content, after_tail_prompt_content] = prompts[tail_index].content.split(tail_separator);

  return [
    [...prompts.slice(0, head_index), { role: prompts[head_index].role, content: before_head_prompt_content }],
    [
      { role: prompts[head_index].role, content: after_head_prompt_content },
      ...prompts.slice(head_index + 1, tail_index),
      { role: prompts[tail_index].role, content: before_tail_prompt_content },
    ],
    [{ role: prompts[tail_index].role, content: after_tail_prompt_content }, ...prompts.slice(tail_index + 1)],
  ];
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
