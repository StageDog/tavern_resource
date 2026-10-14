// TODO: 抽象出其中与其他脚本重复的代码
import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';
import { marked } from 'marked';

const Settings = z
  .object({
    预设名称: z.string().default('未填写'),
    预设链接: z.string().default('未填写'),
    更新日志链接: z.string().default('未填写'),
  })
  .prefault({});

type Data = {
  name: string;
  preset_url: string;
  changelog: string;
};

interface Button {
  name: string;
  function: (() => void) | (() => Promise<void>);
}

//----------------------------------------------------------------------------------------------------------------------
function getUpdateButtonPrefix(name: string): string {
  return `更新预设: ${name}`;
}

function makeUpdatePreset(data: Data): Button {
  return {
    name: `${getUpdateButtonPrefix(data.name)}${data.name}`,
    function: async () => {
      if (getPresetNames().includes(data.name)) {
        return;
      }
      // 点了才拉预设: 每次开预设都拉整张预设既浪费流量, 又会拉到和更新日志不同步的缓存
      let content: string;
      try {
        content = await fetchServerWithError(data.preset_url, 'text');
      } catch (error) {
        toastr.error(`拉取预设失败: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }
      const success = await importRawPreset(data.name, content);
      if (!success) {
        toastr.error('更新预设失败, 请刷新重试');
        return;
      }
      loadPreset(data.name);
      toastr.success(`更新预设 '${data.name}' 成功`);
    },
  };
}

const CHANGELOG_BUTTON_NAME = '更新日志';

function makeShowChangelog(data: Data): Button {
  return {
    name: CHANGELOG_BUTTON_NAME,
    function: () => {
      marked.parse(data.changelog, { async: true, breaks: true }).then(html => {
        SillyTavern.callGenericPopup(html, SillyTavern.POPUP_TYPE.TEXT, '', {
          leftAlign: true,
          wider: true,
          allowVerticalScrolling: true,
        });
      });
    },
  };
}

function isOurButton(name: string, button: { name: string }): boolean {
  // 按钮名里带版本号, 所以按前缀匹配: 远端发了新版后, 旧版本号的按钮才不会残留
  return button.name.startsWith(getUpdateButtonPrefix(name)) || button.name === CHANGELOG_BUTTON_NAME;
}

//----------------------------------------------------------------------------------------------------------------------
function clearButtons(name: string): void {
  getScriptButtons()
    .filter(button => isOurButton(name, button))
    .forEach(button => {
      eventClearEvent(getButtonEvent(button.name));
    });
  replaceScriptButtons(getScriptButtons().filter(button => !isOurButton(name, button)));
}

async function updateButtons(data: Data): Promise<void> {
  clearButtons(data.name);

  const should_update = !getPresetNames().includes(data.name);
  if (!should_update) {
    return;
  }

  const buttons = [makeUpdatePreset(data), makeShowChangelog(data)];
  buttons.forEach(button => {
    eventOn(getButtonEvent(button.name), button.function);
  });
  replaceScriptButtons([...getScriptButtons(), ...buttons.map(button => ({ name: button.name, visible: true }))]);
}

//----------------------------------------------------------------------------------------------------------------------
const FETCH_TIMEOUT_MS = 15000;

async function fetchServerWithError<T extends 'text' | 'blob'>(
  url: string,
  type: T,
): Promise<T extends 'text' ? string : Blob> {
  // 被墙或抽风的 CDN 域不是报错而是挂死, 不加超时按钮就永远不出现; 超时要管到正文读完, 不然传到一半卡住照样挂死
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) {
      throw new Error(`(${response.status}) ${await response.text()}`);
    }
    // @ts-expect-error 类型正确
    return type === 'text' ? await response.text() : await response.blob();
  } finally {
    clearTimeout(timer);
  }
}

//----------------------------------------------------------------------------------------------------------------------
$(
  errorCatched(async () => {
    checkMinimumVersion('4.6.5', '自动更新预设');
    loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/自动更新预设/README.md');

    const settings = Settings.parse(getVariables({ type: 'script' }));
    insertOrAssignVariables(settings, { type: 'script' });

    if (Object.values(settings).some(value => !value || value === '未填写')) {
      return;
    }

    const changelog = await fetchServerWithError(settings.更新日志链接, 'text');
    const version = changelog.match(/^##\s*(.*)\s*$/m)?.[1]?.trim() ?? '';
    const data: Data = {
      name: `${settings.预设名称}` + version,
      preset_url: settings.预设链接.replaceAll('{version}', encodeURIComponent(version)),
      changelog,
    };

    await updateButtons(data);
  }),
);
