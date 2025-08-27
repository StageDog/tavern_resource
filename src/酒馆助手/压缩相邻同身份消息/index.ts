import { assign_inplace, check_minimum_version, chunk_by } from '@/util';
import {
  inject_seperators,
  seperate_prompts,
  uninject_seperators,
} from '@/酒馆助手/压缩相邻同身份消息/chat_history_seperators';
import { destroy_panel, init_panel } from '@/酒馆助手/压缩相邻同身份消息/panel';
import { get_settings } from '@/酒馆助手/压缩相邻同身份消息/settings';
import { Prompt } from '@/酒馆助手/压缩相邻同身份消息/type';

function reject_empty_prompts(prompts: Prompt[]): Prompt[] {
  return prompts.filter(({ content }) => content.trim() !== '');
}

function squash_messages_by_role(prompts: Prompt[]): Prompt[] {
  return chunk_by(reject_empty_prompts(prompts), (lhs, rhs) => lhs.role === rhs.role).map(chunk => ({
    role: chunk[0].role,
    content: chunk.map(({ content }) => content.trim()).join(get_settings().seperator.value),
  }));
}

function squash_chat_history(prompts: Prompt[]): Prompt {
  return {
    role: get_settings().squash_chat_history.squash_role,
    content: _(reject_empty_prompts(prompts))
      .map(({ role, content }) => {
        switch (role) {
          case 'system':
            return (
              substitudeMacros(get_settings().squash_chat_history.system_prefix) +
              content.trim() +
              substitudeMacros(get_settings().squash_chat_history.system_suffix)
            );
          case 'assistant':
            return (
              substitudeMacros(get_settings().squash_chat_history.assistant_prefix) +
              content.trim() +
              substitudeMacros(get_settings().squash_chat_history.assistant_suffix)
            );
          case 'user':
            return (
              substitudeMacros(get_settings().squash_chat_history.user_prefix) +
              content.trim() +
              substitudeMacros(get_settings().squash_chat_history.user_suffix)
            );
        }
      })
      .join(get_settings().seperator.value),
  };
}

$(() => {
  check_minimum_version('3.4.15', '压缩相邻同身份消息');
  init_panel();
  inject_seperators();
  eventMakeLast(tavern_events.GENERATE_AFTER_DATA, ({ prompt }: Parameters<ListenerType['generate_after_data']>[0]) => {
    const chunks = seperate_prompts(prompt) ?? { head: [], chat_history: [], tail: [] };
    if (!chunks) {
      return;
    }
    const { head, chat_history, tail } = chunks;
    console.info(head, chat_history, tail);
    assign_inplace(prompt, [
      ...squash_messages_by_role(head),
      ...(get_settings().squash_chat_history.enable
        ? [squash_chat_history(chat_history)]
        : [...squash_messages_by_role(chat_history)]),
      ...squash_messages_by_role(tail),
    ]);
  });
});

$(window).on('pagehide', () => {
  destroy_panel();
  uninject_seperators();
  console.info(YAML.stringify(get_settings()));
});
