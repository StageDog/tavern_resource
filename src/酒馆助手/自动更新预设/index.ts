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
  content: string;
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
      const success = await importRawPreset(data.name, data.content);
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
function registerButtons(buttons: Button[]) {
  buttons.forEach(button => {
    eventClearEvent(getButtonEvent(button.name));
    eventOn(getButtonEvent(button.name), button.function);
  });
  replaceScriptButtons(buttons.map(button => ({ name: button.name, visible: true })));
}

async function checkButtonStatus(data: Data): Promise<Button[]> {
  if (!getPresetNames().includes(data.name)) {
    return [makeUpdatePreset(data), makeShowChangelog(data)];
  }
  return [];
}

//----------------------------------------------------------------------------------------------------------------------
async function fetchServerWithError<T extends 'text' | 'blob'>(
  url: string,
  type: T,
): Promise<T extends 'text' ? string : Blob> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (response.ok) {
    // @ts-expect-error 类型正确
    return type === 'text' ? response.text() : response.blob();
  }
  throw new Error(`(${response.status}) ${await response.text()}`);
}

//----------------------------------------------------------------------------------------------------------------------
$(
  errorCatched(async () => {
    checkMinimumVersion('4.6.5', '自动更新预设');
    loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/自动更新预设/README.md');

    const settings = Settings.parse(getVariables({ type: 'script' }));
    replaceVariables(settings, { type: 'script' });

    if (Object.values(settings).some(value => !value || value === '未填写')) {
      return;
    }

    const changelog = await fetchServerWithError(settings.更新日志链接, 'text');
    const data: Data = {
      name: `${settings.预设名称}` + (changelog.match(/^##\s*(.*)\s*$/m)?.[1] ?? ''),
      content: await fetchServerWithError(settings.预设链接, 'text'),
      changelog,
    };

    registerButtons(await checkButtonStatus(data));
  }),
);
