import { assign_inplace, check_minimum_version, chunk_by, load_readme } from '@/util';
import { destroy_panel, init_panel } from '@/酒馆助手/压缩相邻消息/panel';
import { inject_seperators, seperate_prompts, uninject_seperators } from '@/酒馆助手/压缩相邻消息/seperate';
import { get_settings } from '@/酒馆助手/压缩相邻消息/settings';
import { Prompt } from '@/酒馆助手/压缩相邻消息/type';

function reject_empty_prompts(prompts: Prompt[]): Prompt[] {
  return prompts.filter(({ content }) => content.trim() !== '');
}

function squash_messages_by_role(prompts: Prompt[]): Prompt[] {
  return chunk_by(prompts, (lhs, rhs) => lhs.role === rhs.role).map(chunk => ({
    role: chunk[0].role,
    content: chunk.map(({ content }) => content.trim()).join(get_settings().seperator.value),
  }));
}

function squash_chat_history(prompts: Prompt[]): Prompt {
  return {
    role: get_settings().on_chat_history.squash_role,
    content: prompts
      .map(({ role, content }) => {
        switch (role) {
          case 'system':
            return (
              substitudeMacros(get_settings().on_chat_history.system_prefix) +
              content.trim() +
              substitudeMacros(get_settings().on_chat_history.system_suffix)
            );
          case 'assistant':
            return (
              substitudeMacros(get_settings().on_chat_history.assistant_prefix) +
              content.trim() +
              substitudeMacros(get_settings().on_chat_history.assistant_suffix)
            );
          case 'user':
            return (
              substitudeMacros(get_settings().on_chat_history.user_prefix) +
              content.trim() +
              substitudeMacros(get_settings().on_chat_history.user_suffix)
            );
        }
      })
      .join(get_settings().seperator.value),
  };
}

$(() => {
  check_minimum_version('3.4.15', '压缩相邻消息');
  load_readme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');
  init_panel();
  inject_seperators();

  let is_dry_run = false;
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dry_run) => {
    is_dry_run = dry_run;
  });
  eventMakeLast(tavern_events.GENERATE_AFTER_DATA, ({ prompt }: Parameters<ListenerType['generate_after_data']>[0]) => {
    if (is_dry_run) {
      return;
    }

    const chunks = seperate_prompts(prompt);
    if (chunks === null) {
      return;
    }
    const [head, chat_history, tail] = _(chunks)
      .map(prompts => reject_empty_prompts(prompts))
      .map(prompts => squash_messages_by_role(prompts))
      .value();
    switch (get_settings().on_chat_history.type) {
      case 'mixin':
        assign_inplace(prompt, squash_messages_by_role(_.concat(head, chat_history, tail)));
        break;
      case 'seperate':
        assign_inplace(prompt, _.concat(head, chat_history, tail));
        break;
      case 'squash':
        assign_inplace(prompt, _.concat(head, squash_chat_history(chat_history), tail));
        break;
    }
  });
});

$(window).on('pagehide', () => {
  destroy_panel();
  uninject_seperators();
});
