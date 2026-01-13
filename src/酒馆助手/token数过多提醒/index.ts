import { loadReadme } from '@util/script';
import tip from './tip.md';

const Settings = z
  .object({
    token数阈值: z.number().default(80000),
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

const onGenerateAfterData = ({ prompt }: Parameters<ListenerType['generate_after_data']>[0]) => {
  setTimeout(async () => {
    // 依次计算 token 从而利用酒馆对 token 的缓存
    const tokens = await Promise.all(
      prompt
        .filter(prompt => typeof prompt.content === 'string')
        .map(async prompt => {
          return await SillyTavern.getTokenCountAsync(prompt.content);
        }),
    );
    const total_tokens = tokens.reduce((result, current) => result + current, 0);
    if (total_tokens > getSettings().token数阈值) {
      toastr.warning(
        `<u>点击查看如何减少 token</u><br>如果不想被提醒，请通过 '酒馆助手-工具箱' 关闭此功能`,
        `token 数 (${total_tokens}) 超过建议 (${getSettings().token数阈值})`,
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
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/token数过多提醒/README.md');
  eventOn(tavern_events.GENERATE_AFTER_DATA, _.debounce(onGenerateAfterData, 1000, { leading: true, trailing: false }));
});
