import { assignInplace, chunkBy, regexFromString, uuidv4 } from '@util/common';
import { compare } from 'compare-versions';
import { Settings } from './settings';

type Prompt = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

//----------------------------------------------------------------------------------------------------------------------
type Seperators = {
  head: InjectionPrompt;
  deep: InjectionPrompt;
  tail: InjectionPrompt;
};

function injectSeperators(settings: Settings) {
  const seperators = Object.freeze({
    head: {
      id: `\0${settings.name}`,
      position: 'in_chat',
      depth: 9999,
      role: 'assistant',
      content: uuidv4(),
    },
    deep: {
      id: `\xff${settings.name}深度分割`,
      position: 'in_chat',
      depth: settings.system_depth,
      role: 'system',
      content: uuidv4(),
    },
    tail: {
      id: `\xff${settings.name}`,
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: uuidv4(),
    },
  } as const);

  const inject = (_type: string, _option: object, dry_run: boolean) => {
    if (dry_run) {
      return;
    }
    injectPrompts(Object.values(seperators));
  };
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, inject);

  return {
    seperators,
    uninject: () => {
      eventRemoveListener(tavern_events.GENERATION_AFTER_COMMANDS, inject);
      uninjectPrompts(Object.values(seperators).map(({ id }) => id));
    },
  };
}

//----------------------------------------------------------------------------------------------------------------------
function seperatePrompts(prompts: Prompt[], seperators: Seperators): Prompt[][] | null {
  const head_index = prompts.findIndex(({ content }) => content.includes(seperators.head.content));
  const deep_index = prompts.findIndex(({ content }) => content.includes(seperators.deep.content));
  const tail_index = prompts.findIndex(({ content }) => content.includes(seperators.tail.content));
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

  const splitted_head = split_with_context(['', ''], -1, head_index, seperators.head.content);
  const splitted_deep = split_with_context(splitted_head, head_index, deep_index, seperators.deep.content);
  const splitted_tail = split_with_context(splitted_deep, deep_index, tail_index, seperators.tail.content);

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

function rejectEmptyPrompts(prompts: Prompt[]): Prompt[] {
  return prompts.filter(({ content }) => content.trim() !== '');
}

function squashMessageByRole(prompts: Prompt[], settings: Settings): Prompt[] {
  const splitPattern = settings.split_seperator.enabled
    ? regexFromString(settings.split_seperator.pattern)
    : null;

  return chunkBy(prompts, (lhs, rhs) => {
    if (lhs.role !== rhs.role) return false;
    if (splitPattern && splitPattern.test(rhs.content)) return false;
    return true;
  }).map(chunk => ({
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

function listenEvent(settings: Settings, seperators: Seperators) {
  const handlePrompts = ({ prompt }: { prompt: SillyTavern.SendingMessage[] }, dry_run: boolean) => {
    if (dry_run) {
      return;
    }

    if (prompt.some(({ content }) => typeof content !== 'string')) {
      // TODO: 支持带图片、多媒体的脚本
      return;
    }

    // @ts-expect-error 类型正确
    const chunks = seperatePrompts(prompt, seperators);
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
  };
  const handlePrompts2 = ({ messages }: { messages: SillyTavern.SendingMessage[] }) => {
    handlePrompts({ prompt: messages }, false);
  };

  if (compare(getTavernVersion(), '1.13.4', '>')) {
    eventMakeFirst(tavern_events.GENERATE_AFTER_DATA, handlePrompts);
  } else {
    eventMakeFirst(tavern_events.CHAT_COMPLETION_SETTINGS_READY, handlePrompts2);
  }

  const handleStopStringOnStream = (text: string) => {
    if (!settings.stop_string) {
      return;
    }
    const regex = regexFromString(settings.stop_string);
    if (!regex) {
      return;
    }
    if (regex.test(text)) {
      SillyTavern.stopGeneration();
    }
  };
  eventMakeFirst(tavern_events.STREAM_TOKEN_RECEIVED, handleStopStringOnStream);

  const handleStopStringOnReceived = async (message_id: number | string) => {
    if (!settings.stop_string) {
      return;
    }

    const chat_message = SillyTavern.chat[Number(message_id)];

    const regex = regexFromString(settings.stop_string);
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
  eventMakeFirst(tavern_events.MESSAGE_RECEIVED, handleStopStringOnReceived);

  return {
    unlisten: () => {
      eventRemoveListener(tavern_events.GENERATE_AFTER_DATA, handlePrompts);
      eventRemoveListener(tavern_events.CHAT_COMPLETION_SETTINGS_READY, handlePrompts2);
      eventRemoveListener(tavern_events.STREAM_TOKEN_RECEIVED, handleStopStringOnStream);
      eventRemoveListener(tavern_events.MESSAGE_RECEIVED, handleStopStringOnReceived);
    },
  };
}

//----------------------------------------------------------------------------------------------------------------------
export function initSquash(settings: Settings) {
  const { seperators, uninject } = injectSeperators(settings);
  const { unlisten } = listenEvent(settings, seperators);
  return {
    destroy: () => {
      uninject();
      unlisten();
    },
  };
}
