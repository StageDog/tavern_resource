import tip from './tip.md';

const Settings = z
  .object({
    threshold: z.number().default(80000),
  })
  .prefault({});
type Settings = z.infer<typeof Settings>;

let settings: Settings;
function getSettings(): Settings {
  if (!settings) {
    settings = Settings.parse(getVariables({ type: 'script', script_id: getScriptId() }));
    insertVariables(settings, { type: 'script', script_id: getScriptId() });
  }
  return settings;
}

const onChatCompletionPromptReady = ({ chat, dryRun }: Parameters<ListenerType['chat_completion_prompt_ready']>[0]) => {
  if (dryRun) {
    return;
  }

  setTimeout(async () => {
    // 依次计算 toekn 从而利用酒馆对 token 的缓存
    const tokens = await Promise.all(
      chat.map(async message => {
        return await SillyTavern.getTokenCountAsync(message.content);
      }),
    );
    const total_tokens = tokens.reduce((result, current) => result + current, 0);
    if (total_tokens > getSettings().threshold) {
      toastr.warning(
        `<u>点击查看如何减少 token</u><br>如果不想被提醒，请通过 '酒馆助手-工具箱' 关闭此功能`,
        `token 数 (${total_tokens}) 超过建议 (${getSettings().threshold})`,
        {
          showDuration: 1000,
          escapeHtml: false,
          onclick: () => {
            SillyTavern.callGenericPopup(tip, SillyTavern.POPUP_TYPE.TEXT, '', {
              allowHorizontalScrolling: true,
              leftAlign: true,
            });
          },
        },
      );
    }
  });
};

$(() => {
  getSettings();
  eventOn(
    tavern_events.CHAT_COMPLETION_PROMPT_READY,
    _.debounce(onChatCompletionPromptReady, 1000, { leading: true, trailing: false }),
  );
});
