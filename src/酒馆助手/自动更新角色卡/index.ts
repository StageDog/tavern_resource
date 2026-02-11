// TODO: 抽象出其中与其他脚本重复的代码
import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';
import { marked } from 'marked';

const Settings = z
  .object({
    角色卡名称: z.string().default('未填写'),
    角色卡链接: z.string().default('未填写'),
    更新日志链接: z.string().default('未填写'),
  })
  .prefault({});

type Data = {
  name: string;
  version: string;
  content: Blob;
  changelog: string;
};

interface Button {
  name: string;
  function: (() => void) | (() => Promise<void>);
}

//----------------------------------------------------------------------------------------------------------------------
function makeUpdateCharacter(data: Data): Button {
  return {
    name: `更新角色卡: ${data.name}${data.version}`,
    function: async () => {
      const success = await importRawCharacter(data.name, data.content);
      if (!success) {
        toastr.error('更新角色卡失败, 请刷新重试');
        return;
      }
      replaceCharacter(data.name, { version: data.version });
      toastr.success(`更新角色卡 '${data.name}' 成功`);
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
  if (!getCharacterNames().includes(data.name) || (await getCharacter(data.name)).version !== data.version) {
    return [makeUpdateCharacter(data), makeShowChangelog(data)];
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
    checkMinimumVersion('4.6.5', '自动更新角色卡');
    loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/自动更新角色卡/README.md');

    const settings = Settings.parse(getVariables({ type: 'script' }));
    replaceVariables(settings, { type: 'script' });

    if (Object.values(settings).some(value => !value || value === '未填写')) {
      return;
    }

    const changelog = await fetchServerWithError(settings.更新日志链接, 'text');
    const data: Data = {
      name: settings.角色卡名称,
      version: changelog.match(/^##\s*(.*)\s*$/m)?.[1] ?? '',
      content: await fetchServerWithError(settings.角色卡链接, 'blob'),
      changelog: changelog,
    };

    registerButtons(await checkButtonStatus(data));
  }),
);
