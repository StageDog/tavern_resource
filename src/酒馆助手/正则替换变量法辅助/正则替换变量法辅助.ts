export {};

const variable_regex = /@\s*([^@\n]*?)\s*@?\s*=\s*(?:.*?⇒)?'?([^@\n]*?)'?\s*((@$)|(?=@))/gm

/**
 * 解析文本中的所有 `"@变量=值@"` 和 `"@变量=旧值⇒新值@"`, 转换为键值对对象
 *
 * @param text 要解析的文本
 * @returns 解析得到的键值对对象
 *
 * @example
 * const variables = parseVariables("@心爱受孕=否@@心爱好感度=10@");
 * console.info(variables.心爱受孕);  // 否
 * console.info(variables.心爱好感度);  // 10
 */
function parseVariables(text: string): Record<string, any> {
  return _.merge({}, ...[...text.matchAll(variable_regex)].map(match => ({ [match[1]]: match[2] })));
}

/**
 * 将键值对对象转换为 `"@变量=值@"` 字符串
 *
 * @param data 键值对对象
 * @returns 转换得到的字符串
 *
 * @example
 * const string = stringifyVariables({心爱受孕: 否, 心爱好感度: 10});
 * console.info(string);  // @心爱受孕=否@
 *                        // @心爱好感度=10@
 */
function stringifyVariables(data: Record<string, any>): string {
  return `${Object.entries(data)
    .map(([key, value]) => `@${key}=${value}@`)
    .join('\n')}`;
}

/**
 * 在最后一条消息附加 `@变量=值@` 从而更新变量
 *
 * @param data 要更新的变量和值
 *
 * @example
 * await updateLastVariables({
 *   '变量.络络.亲密度': 60,
 *   '变量.络络.下次响应界面选择判断': 2,
 * });
 */
async function updateLastVariables(data: Record<string, any>) {
  await updateVariablesAt(SillyTavern.chat.length - 1, data);
}

/**
 * 在第 `message_id` 楼消息附加 `@变量=值@` 从而更新变量
 *
 * @param message_id 消息楼层号
 * @param data 要更新的变量和值
 *
 * @example
 * await updateVariablesAt(0, {
 *   '变量.络络.亲密度': 60,
 *   '变量.络络.下次响应界面选择判断': 2,
 * });
 */
async function updateVariablesAt(message_id: number, data: Record<string, any>) {
  const messages = await getChatMessages(message_id);
  if (messages.length <= 0) {
    return;
  }

  const message = messages[0].message;
  await setChatMessage(
    {
      message: message + `\n<UpdateVariable>\n${stringifyVariables(data)}\n</UpdateVariable>`,
    },
    message_id,
    { refresh: 'none' },
  );
}

async function propagateVariables() {
  const last_chat = SillyTavern.chat.at(-1);
  if (!last_chat) {
    return;
  }

  const process = (data: Record<string, any>) => {
    return _.pickBy(
      _.mapKeys(data, (_value, key) => key.replaceAll('@', '').trim()),
      (_value, key) => key.startsWith('变量.'),
    );
  };
  const data = _.merge(
    {},
    process(SillyTavern.chatMetadata?.variables),
    ...SillyTavern.chat.slice(-2).map((chat: { mes: string }) => process(parseVariables(chat.mes))),
  );

  const updated_message: string = last_chat.mes.replace(
    /(?:\n<UpdateVariable>\n<FullUpdateVariable>.*?<\/FullUpdateVariable>\n<\/UpdateVariable>)|$/s,
    `\n<UpdateVariable>\n<FullUpdateVariable>\n${stringifyVariables(data)}\n</FullUpdateVariable>\n</UpdateVariable>`,
  );
  if (last_chat.swipes && last_chat.swipe_id) {
    last_chat.swipes[last_chat.swipe_id] = updated_message;
  }
  last_chat.mes = updated_message;

  await SillyTavern.saveChat();
}

$(() => {
  // 其他地方的代码可使用 `eventEmit('在最新楼层更新变量', {心爱受孕: 否, 心爱好感度: 10})` 来更新变量
  // 快速回复中可使用 `/event-emit event=在最新楼层更新变量 data={"心爱受孕": "否", "心爱好感度": 10}` 来更新变量
  eventOn('在最新楼层更新变量', updateLastVariables);

  // 修复和摘要/总结正则的兼容性
  eventOn(tavern_events.MESSAGE_SENT, propagateVariables);
  eventOn(tavern_events.MESSAGE_RECEIVED, propagateVariables);
});
