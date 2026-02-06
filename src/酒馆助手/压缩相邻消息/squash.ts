import { assignInplace, chunkBy, getComplementString, regexFromString } from '@util/common';
import { registerAsUniqueScript } from '@util/script';
import { compare } from 'compare-versions';
import { Settings } from './store';

function getPromptContent(prompt: SillyTavern.SendingMessage, settings: Settings): string {
  if (typeof prompt.content === 'string') {
    return prompt.content;
  }
  return prompt.content
    .filter(({ type }) => type === 'text')
    .map(({ text }: any) => text)
    .join(settings.delimiter.value);
}
function updatePromptContentWith(
  prompt: SillyTavern.SendingMessage,
  updater: (prompt: { role: 'system' | 'assistant' | 'user'; content: string }) => string,
  settings: Settings,
): SillyTavern.SendingMessage {
  const content = updater({ role: prompt.role, content: getPromptContent(prompt, settings) });
  if (typeof prompt.content === 'string') {
    prompt.content = content;
  } else {
    _.remove(prompt.content, item => item.type === 'text');
    if (content) {
      prompt.content.splice(0, 0, { type: 'text', text: content });
    }
  }
  return prompt;
}

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
function seperatePrompts(
  prompts: SillyTavern.SendingMessage[],
  separators: Separators,
): SillyTavern.SendingMessage[][] | undefined {
  const head_index = prompts.findIndex(
    ({ content }) => typeof content === 'string' && content.includes(separators.head.content),
  );
  const deep_index = prompts.findIndex(
    ({ content }) => typeof content === 'string' && content.includes(separators.deep.content),
  );
  const tail_index = prompts.findIndex(
    ({ content }) => typeof content === 'string' && content.includes(separators.tail.content),
  );
  if (head_index === -1 || deep_index === -1 || tail_index === -1) {
    return undefined;
  }

  const split_with_context = (
    splitted_before: [string, string],
    before_index: number,
    current_index: number,
    splitter: string,
  ): [string, string] => {
    if (before_index !== current_index) {
      return (prompts[current_index].content as string).split(splitter) as [string, string];
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

function rejectEmptyPrompts(prompts: SillyTavern.SendingMessage[]): SillyTavern.SendingMessage[] {
  return _.reject(prompts, ({ content }) => typeof content === 'string' && content.trim() === '');
}

function squashAdjacentMessage(
  prompts: SillyTavern.SendingMessage[],
  settings: Settings,
): SillyTavern.SendingMessage[] {
  return chunkBy(
    prompts,
    (lhs, rhs) => lhs.role === rhs.role && typeof lhs.content === 'string' && typeof rhs.content === 'string',
  ).map(chunk => ({
    role: chunk[0].role,
    // 长度大于 1, 必然 content 为 string
    content: chunk.length === 1 ? chunk[0].content : chunk.map(({ content }) => content).join(settings.delimiter.value),
  }));
}

function squashChatHistory(prompts: SillyTavern.SendingMessage[], settings: Settings): SillyTavern.SendingMessage[] {
  // TODO: zod encode
  const prefix = {
    system: substitudeMacros(settings.chat_history.system_prefix),
    assistant: substitudeMacros(settings.chat_history.assistant_prefix),
    user: substitudeMacros(settings.chat_history.user_prefix),
  };
  const suffix = {
    system: substitudeMacros(settings.chat_history.system_suffix),
    assistant: substitudeMacros(settings.chat_history.assistant_suffix),
    user: substitudeMacros(settings.chat_history.user_suffix),
  };

  const tagContent = (prompt: SillyTavern.SendingMessage) =>
    updatePromptContentWith(
      prompt,
      ({ role, content }) => {
        content = content.includes(prefix[role]) ? content : prefix[role] + content;
        content = content.includes(suffix[role]) ? content : content + suffix[role];
        return content;
      },
      settings,
    );

  return chunkBy(prompts, (lhs, rhs) => typeof lhs.content === 'string' && typeof rhs.content === 'string').map(
    chunk => {
      chunk.forEach(tagContent);

      return {
        role: settings.chat_history.squash_role,
        content:
          chunk.length === 1 ? chunk[0].content : chunk.map(({ content }) => content).join(settings.delimiter.value),
      };
    },
  );
}

function listenEvent(settings: Settings, separators: Separators, shouldEnable: () => boolean) {
  const handlePrompts = ({ prompt }: { prompt: SillyTavern.SendingMessage[] }, dry_run: boolean) => {
    if (dry_run || !shouldEnable()) {
      return;
    }

    const chunks = seperatePrompts(prompt, separators)?.map(chunk =>
      rejectEmptyPrompts(chunk).map(prompt =>
        updatePromptContentWith(prompt, ({ content }) => trimEmptyLines(content), settings),
      ),
    );
    if (!chunks) {
      return;
    }

    const { above, below } = settings.depth_injection;

    const applyInjection = (injection_settings: typeof above, from: number, to: number) => {
      if (!injection_settings.enabled) {
        return;
      }

      const isSystemWithoutPlaceholder = (p: SillyTavern.SendingMessage): boolean =>
        p.role === 'system' &&
        !(above.enabled && above.type === 'placeholder' && getPromptContent(p, settings).includes(above.placeholder)) &&
        !(below.enabled && below.type === 'placeholder' && getPromptContent(p, settings).includes(below.placeholder));

      const placeholder_content =
        injection_settings.type === 'placeholder'
          ? chunks[from]
              .filter(isSystemWithoutPlaceholder)
              // 没有把图片、多媒体也作为内容, 但无所谓, 世界书里不能设置图片或多媒体
              .map(p => getPromptContent(p, settings))
              .join(settings.delimiter.value)
          : '';

      if (
        injection_settings.type === 'placeholder' &&
        _(chunks)
          .flatten()
          .some(p => getPromptContent(p, settings).includes(injection_settings.placeholder))
      ) {
        _.remove(chunks[from], isSystemWithoutPlaceholder);
      } else {
        const exclude_chunk = _.remove(chunks[from], p => p.role === 'system');
        chunks[to] = to < from ? _.concat(chunks[to], exclude_chunk) : _.concat(exclude_chunk, chunks[to]);
      }
      _(chunks)
        .flatten()
        .filter(p => getPromptContent(p, settings).includes(injection_settings.placeholder))
        .forEach(p => {
          updatePromptContentWith(
            p,
            ({ content }) => content.replaceAll(injection_settings.placeholder, placeholder_content),
            settings,
          );
        });
    };
    applyInjection(above, 1, 0);
    applyInjection(below, 2, 3);

    const [head, above_chat_history, below_chat_history, tail] = chunks;

    let result: SillyTavern.SendingMessage[];
    switch (settings.chat_history.type) {
      case 'squash_nearby':
        result = squashAdjacentMessage(_.concat(head, above_chat_history, below_chat_history, tail), settings);
        break;
      case 'squash_into_one':
        result = squashAdjacentMessage(
          _.concat(head, squashChatHistory(_.concat(above_chat_history, below_chat_history), settings), tail),
          settings,
        );
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
    // slice(1) 来避免 AI 在开头匹配到停止字符串的情况
    if (regex.test(text.trimStart().slice(1))) {
      SillyTavern.stopGeneration();
    }
  };
  eventMakeFirst(tavern_events.STREAM_TOKEN_RECEIVED, handleStopStringOnStream);

  const handleStopStringOnReceived = async (message_id: number | string) => {
    if (!settings.stop_string || !shouldEnable()) {
      return;
    }

    const chat_message = SillyTavern.chat[Number(message_id)];

    const first_non_space_index = chat_message.mes.search(/\S/);
    if (first_non_space_index === -1) {
      return;
    }

    const regex = regexFromString(settings.stop_string, true);
    if (!regex) {
      return;
    }

    // slice(first_non_space_index + 1) 来避免 AI 在开头匹配到停止字符串的情况
    const searched_index = chat_message.mes.slice(first_non_space_index + 1).search(regex);
    if (searched_index === -1) {
      return;
    }

    chat_message.mes = chat_message.mes.slice(0, first_non_space_index + searched_index + 1);
    if (chat_message.swipes) {
      _.set(chat_message, ['swipes', chat_message.swipe_id!], chat_message.mes);
    }
    // 与 https://gitgud.io/Monblant/noass 采用相同逻辑而不使用 setChatMessages, 因为 CHARACTER_MESSAGE_RENDERED 将会随后自然触发
    SillyTavern.updateMessageBlock(Number(message_id), chat_message);
    await SillyTavern.saveChat();
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

export function initSquashWithoutPanel(settings: Settings) {
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
