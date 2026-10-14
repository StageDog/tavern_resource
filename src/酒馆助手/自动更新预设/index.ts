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
function makeUpdatePreset(data: Data): Button {
  return {
    name: `更新预设: ${data.name}`,
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

function makeShowChangelog(data: Data): Button {
  return {
    name: '更新日志',
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

//----------------------------------------------------------------------------------------------------------------------
async function updateButtons(data: Data): Promise<void> {
  const should_update = !getPresetNames().includes(data.name);

  const buttons = [makeUpdatePreset(data), makeShowChangelog(data)];
  if (should_update) {
    buttons.forEach(button => {
      eventClearEvent(getButtonEvent(button.name));
      eventOn(getButtonEvent(button.name), button.function);
    });
    replaceScriptButtons(
      _(getScriptButtons())
        .filter(button => buttons.every(b => b.name !== button.name))
        .concat(buttons.map(button => ({ name: button.name, visible: true })))
        .value(),
    );
    return;
  }
  buttons.forEach(button => {
    eventClearEvent(getButtonEvent(button.name));
  });
  replaceScriptButtons(
    _(getScriptButtons())
      .filter(button => buttons.every(b => b.name !== button.name))
      .value(),
  );
}

//----------------------------------------------------------------------------------------------------------------------
const FETCH_TIMEOUT_MS = 15000;

async function fetchServerWithError<T extends 'text' | 'blob'>(
  url: string,
  type: T,
): Promise<T extends 'text' ? string : Blob> {
  // 被墙或抽风的 CDN 域不是报错而是挂死, 不加超时按钮就永远不出现
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (response.ok) {
    // @ts-expect-error 类型正确
    return type === 'text' ? response.text() : response.blob();
  }
  throw new Error(`检测自动更新预设失败: (${response.status}) ${await response.text()}`);
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
