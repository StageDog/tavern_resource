import { assignInplace, chunkBy, getComplementString, regexFromString } from '@util/common';
import { registerAsUniqueScript } from '@util/script';
import { compare } from 'compare-versions';
import { Settings } from './store';

type Prompt = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

//----------------------------------------------------------------------------------------------------------------------
export type Separators = {
  head: InjectionPrompt;
  deep: InjectionPrompt;
  tail: InjectionPrompt;
};

export function injectSeparators(settings: Settings) {
  const separators: Readonly<Separators> = Object.freeze({
    head: {
      id: `\0${getComplementString('压缩相邻消息-聊天记录开头')}`,
      position: 'in_chat',
      depth: 9999,
      role: 'assistant',
      content: `【【压缩相邻消息-聊天记录开头】】`,
    },
    deep: {
      id: `\xff压缩相邻消息-Dx`,
      position: 'in_chat',
      depth: settings.depth_injection.threshold,
      role: 'system',
      content: `【【压缩相邻消息-Dx】】`,
    },
    tail: {
      id: `\xff压缩相邻消息-聊天记录结尾`,
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: `【【压缩相邻消息-聊天记录结尾】】`,
    },
  } as const);

  const inject = (_type: string, _option: object, dry_run: boolean) => {
    if (dry_run) {
      return;
    }
    injectPrompts(Object.values(separators));
  };
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, inject);

  return {
    separators,
    uninject: () => {
      eventRemoveListener(tavern_events.GENERATION_AFTER_COMMANDS, inject);
      uninjectPrompts(Object.values(separators).map(({ id }) => id));
    },
  };
}

//----------------------------------------------------------------------------------------------------------------------
function seperatePrompts(prompts: Prompt[], separators: Separators): Prompt[][] | null {
  const head_index = prompts.findIndex(({ content }) => content.includes(separators.head.content));
  const deep_index = prompts.findIndex(({ content }) => content.includes(separators.deep.content));
  const tail_index = prompts.findIndex(({ content }) => content.includes(separators.tail.content));
  if (head_index === -1 || deep_index === -1 || tail_index === -1) {
    return null;
  }

  const split_with_context = (
    splitted_before: [string, string],
    before_index: number,
    current_index: number,
    splitter: string,
  ): [string, string] => {
    if (before_index !== current_index) {
      return prompts[current_index].content.split(splitter) as [string, string];
    }
    const splitted = splitted_before[1].split(splitter) as [string, string];
    splitted_before[1] = '';
    return splitted;
  };

  const splitted_head = split_with_context(['', ''], -1, head_index, separators.head.content);
  const splitted_deep = split_with_context(splitted_head, head_index, deep_index, separators.deep.content);
  const splitted_tail = split_with_context(splitted_deep, deep_index, tail_index, separators.tail.content);

  return [
    [...prompts.slice(0, head_index), { role: prompts[head_index].role, content: splitted_head[0] }],
    [
      { role: prompts[head_index].role, content: splitted_head[1] },
      ...prompts.slice(head_index + 1, deep_index),
      { role: prompts[deep_index].role, content: splitted_deep[0] },
    ],
    [
      { role: prompts[deep_index].role, content: splitted_deep[1] },
      ...prompts.slice(deep_index + 1, tail_index),
      { role: prompts[tail_index].role, content: splitted_tail[0] },
    ],
    [{ role: prompts[tail_index].role, content: splitted_tail[1] }, ...prompts.slice(tail_index + 1)],
  ];
}

function trimEmptyLines(string: string): string {
  return _(string)
    .split('\n')
    .dropWhile(line => !line.trim())
    .dropRightWhile(line => !line.trim())
    .join('\n');
}

function rejectEmptyPrompts(prompts: Prompt[]): Prompt[] {
  return prompts.filter(({ content }) => content.trim() !== '');
}

function squashMessageByRole(prompts: Prompt[], settings: Settings): Prompt[] {
  return chunkBy(prompts, (lhs, rhs) => lhs.role === rhs.role).map(chunk => ({
    role: chunk[0].role,
    content: chunk.map(({ content }) => trimEmptyLines(content)).join(settings.delimiter.value),
  }));
}

function squashChatHistory(prompts: Prompt[], settings: Settings): Prompt {
  // TODO: zod encode
  const system_prefix = substitudeMacros(settings.chat_history.system_prefix);
  const system_suffix = substitudeMacros(settings.chat_history.system_suffix);
  const assistant_prefix = substitudeMacros(settings.chat_history.assistant_prefix);
  const assistant_suffix = substitudeMacros(settings.chat_history.assistant_suffix);
  const user_prefix = substitudeMacros(settings.chat_history.user_prefix);
  const user_suffix = substitudeMacros(settings.chat_history.user_suffix);
  return {
    role: settings.chat_history.squash_role,
    content: prompts
      .map(({ role, content }) => {
        const trimmed = trimEmptyLines(content);
        switch (role) {
          case 'system':
            return system_prefix + trimmed + system_suffix;
          case 'assistant':
            return assistant_prefix + trimmed + assistant_suffix;
          case 'user':
            return user_prefix + trimmed + user_suffix;
        }
      })
      .join(settings.delimiter.value),
  };
}

function listenEvent(settings: Settings, separators: Separators, shouldEnable: () => boolean) {
  const handlePrompts = ({ prompt }: { prompt: SillyTavern.SendingMessage[] }, dry_run: boolean) => {
    if (dry_run || !shouldEnable()) {
      return;
    }

    if (prompt.some(({ content }) => typeof content !== 'string')) {
      // TODO: 支持带图片、多媒体的情况
      return;
    }

    // @ts-expect-error 类型正确
    const chunks = seperatePrompts(prompt, separators);
    if (chunks === null) {
      return;
    }

    const { above, below } = settings.depth_injection;

    const applyInjection = (injection_settings: typeof above, from: number, to: number) => {
      if (!injection_settings.enabled) {
        return;
      }

      const isSystemWithoutPlaceholder = (p: Prompt): boolean =>
        p.role === 'system' &&
        !(above.enabled && above.type === 'placeholder' && p.content.includes(above.placeholder)) &&
        !(below.enabled && below.type === 'placeholder' && p.content.includes(below.placeholder));

      const placeholder_content =
        injection_settings.type === 'placeholder'
          ? rejectEmptyPrompts(chunks[from])
              .filter(isSystemWithoutPlaceholder)
              .map(p => trimEmptyLines(p.content))
              .join(settings.delimiter.value)
          : '';

      if (
        injection_settings.type === 'placeholder' &&
        _(chunks)
          .flatten()
          .some(p => p.content.includes(injection_settings.placeholder))
      ) {
        _.remove(chunks[from], isSystemWithoutPlaceholder);
      } else {
        const exclude_chunk = _.remove(chunks[from], p => p.role === 'system');
        chunks[to] = to < from ? _.concat(chunks[to], exclude_chunk) : _.concat(exclude_chunk, chunks[to]);
      }
      _(chunks)
        .flatten()
        .filter(p => p.content.includes(injection_settings.placeholder))
        .forEach(p => {
          p.content = p.content.replaceAll(injection_settings.placeholder, placeholder_content);
        });
    };
    applyInjection(above, 1, 0);
    applyInjection(below, 2, 3);

    const [head, above_chat_history, below_chat_history, tail] = _(chunks)
      .map(prompts => rejectEmptyPrompts(prompts))
      .map(prompts => squashMessageByRole(prompts, settings))
      .value();

    let result: Prompt[];
    switch (settings.chat_history.type) {
      case 'squash_nearby':
        result = squashMessageByRole(_.concat(head, above_chat_history, below_chat_history, tail), settings);
        break;
      case 'squash_into_one':
        result = _.concat(head, squashChatHistory(_.concat(above_chat_history, below_chat_history), settings), tail);
        break;
    }

    assignInplace(prompt, result);
  };
  const handlePrompts2 = ({ messages }: { messages: SillyTavern.SendingMessage[] }) => {
    handlePrompts({ prompt: messages }, false);
  };

  if (compare(getTavernVersion(), '1.13.4', '>')) {
    eventOn(tavern_events.GENERATE_AFTER_DATA, handlePrompts);
  } else {
    eventOn(tavern_events.CHAT_COMPLETION_SETTINGS_READY, handlePrompts2);
  }

  const handleStopStringOnStream = (text: string) => {
    if (!settings.stop_string || !shouldEnable()) {
      return;
    }
    const regex = regexFromString(settings.stop_string, true);
    if (!regex) {
      return;
    }
    if (regex.test(text)) {
      SillyTavern.stopGeneration();
    }
  };
  eventOn(tavern_events.STREAM_TOKEN_RECEIVED, handleStopStringOnStream);

  const handleStopStringOnReceived = async (message_id: number | string) => {
    if (!settings.stop_string || !shouldEnable()) {
      return;
    }

    const chat_message = SillyTavern.chat[Number(message_id)];

    const regex = regexFromString(settings.stop_string, true);
    if (!regex) {
      return;
    }
    const match = chat_message.mes.match(regex);
    if (match) {
      chat_message.mes = chat_message.mes.slice(0, match.index);
      if (chat_message.swipes) {
        _.set(chat_message, ['swipes', chat_message.swipe_id!], chat_message.mes);
      }
      // 与 https://gitgud.io/Monblant/noass 采用相同逻辑而不使用 setChatMessages, 因为 CHARACTER_MESSAGE_RENDERED 将会随后自然触发
      SillyTavern.updateMessageBlock(Number(message_id), chat_message);
      await SillyTavern.saveChat();
    }
  };
  eventOn(tavern_events.MESSAGE_RECEIVED, handleStopStringOnReceived);

  return {
    unlisten: () => {
      eventRemoveListener(tavern_events.GENERATE_AFTER_DATA, handlePrompts);
      eventRemoveListener(tavern_events.CHAT_COMPLETION_SETTINGS_READY, handlePrompts2);
      eventRemoveListener(tavern_events.STREAM_TOKEN_RECEIVED, handleStopStringOnStream);
      eventRemoveListener(tavern_events.MESSAGE_RECEIVED, handleStopStringOnReceived);
    },
  };
}

export function initSquash(settings: Settings) {
  const { unregister, getPreferredScriptId } = registerAsUniqueScript('压缩相邻消息');
  const { separators, uninject } = injectSeparators(settings);
  const { unlisten } = listenEvent(settings, separators, () => getPreferredScriptId() === getScriptId());
  return {
    destroy: () => {
      unregister();
      unlisten();
      uninject();
    },
  };
}
