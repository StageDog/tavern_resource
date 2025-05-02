export {};

interface QuickReplySet {
  version: number;
  name: string;
  disableSend: boolean;
  placeBeforeInput: boolean;
  injectInput: boolean;
  color: string;
  onlyBorderColor: boolean;
  qrList: QuickReply[];
  idIndex: number;
}

interface QuickReply {
  id: number;
  icon: string;
  showLabel: boolean;
  label: string;
  title: string;
  message: string;
  contextList: { set: string; isChained: boolean }[];
  preventAutoExecute: boolean;
  isHidden: boolean;
  executeOnStartup: boolean;
  executeOnUser: boolean;
  executeOnAi: boolean;
  executeOnChatChange: boolean;
  executeOnGroupMemberDraft: boolean;
  executeOnNewChat: boolean;
  automationId: string;
}

interface ImportQuickReplyOption {
  scope?: 'disable' | 'character' | 'global';
  button?: boolean;
}

function tryParseUrl(file_content: string): URL | undefined {
  try {
    return new URL(file_content);
  } catch (error) {
    return undefined;
  }
}

function tryParseJson(file_content: string): QuickReplySet | undefined {
  try {
    return JSON.parse(file_content);
  } catch (error) {
    return undefined;
  }
}

async function importQuickReply(file_content: string, option: ImportQuickReplyOption = {}): Promise<void> {
  const required_option: Required<ImportQuickReplyOption> = {
    scope: option.scope ?? 'disable',
    button: option.button ?? true,
  };

  const url = tryParseUrl(file_content);
  if (url) {
    file_content = await fetch(url).then(request => request.text());
  }
  const quick_reply_set: QuickReplySet | undefined = tryParseJson(file_content);
  if (!quick_reply_set) {
    console.warn(
      `[自动导入快速回复] 未能成功导入快速回复, 请确认所给的内容是一个正确的快速回复文件内容, 或是快速回复文件的链接网址`,
    );
    return;
  }

  const quick_replies = quick_reply_set.qrList;
  triggerSlash(`
    /parser-flag STRICT_ESCAPING on ||
    /qr-set-off "${quick_reply_set.name}" ||
    /qr-chat-set-off "${quick_reply_set.name}" ||
    /qr-set-delete ${quick_reply_set.name} ||
    /qr-set-create nosend=${quick_reply_set.disableSend} before=${quick_reply_set.placeBeforeInput} inject=${
    quick_reply_set.injectInput
  } ${quick_reply_set.name} ||
    ${quick_replies
      .map(
        qr =>
          `/qr-create set=${quick_reply_set.name} label=${qr.label} ${qr.icon ? `icon=${qr.icon}` : ``} showlabel=${
            qr.showLabel
          } hidden=${qr.isHidden} startup=${qr.executeOnStartup} user=${qr.executeOnUser} bot=${qr.executeOnAi} load=${
            qr.executeOnChatChange
          } new=${qr.executeOnNewChat} group=${qr.executeOnGroupMemberDraft} title=${qr.title} "${qr.message
            .replaceAll('"', '\\"')
            .replaceAll('<user>', '{{user}}')
            .replaceAll('<char>', '{{char}}')
            .replaceAll('{{', '\\{\\{')}" ||\n`,
      )
      .join('')}
    ${quick_replies
      .filter(qr => qr.contextList.length !== 0)
      .map(qr =>
        qr.contextList
          .map(
            context =>
              `/qr-contextadd set=${quick_reply_set.name} label=${qr.label} id=${qr.id} chain=${context.isChained} "${context.set}" ||\n`,
          )
          .join(''),
      )}
    ${
      {
        disable: ``,
        character: `/qr-chat-set-on visible=${option.button} "${quick_reply_set.name}" ||\n`,
        global: `/qr-set-on visible=${option.button} "${quick_reply_set.name}" ||\n`,
      }[required_option.scope]
    }
    /parser-flag STRICT_ESCAPING off ||
`);
}

async function importQuickReplyFromRegex(): Promise<void> {
  $('#qr--isEnabled').prop('checked', true)[0].dispatchEvent(new Event('click'));

  const regex_data = await getTavernRegexes();
  regex_data
    .filter(regex => regex.enabled) // 只导入被启用的快速回复正则
    .forEach(regex => {
      const match = regex.script_name.match(/^快速回复-(不启用|聊天|全局)-(显示按钮|不显示按钮)-.*$/);
      if (!match) {
        return;
      }
      const option: Required<ImportQuickReplyOption> = {
        scope: { 不启用: 'disable', 聊天: 'character', 全局: 'global' }[match[1]] as 'disable' | 'character' | 'global',
        button: { 显示按钮: true, 不显示按钮: false }[match[2]] as boolean,
      };
      console.info(`[自动导入快速回复] 从 ${regex.script_name} 中导入快速回复, 选项: ${JSON.stringify(option)}`);
      importQuickReply(regex.replace_string, option);
    });
}

$(() => importQuickReplyFromRegex());
