// TODO: 抽象出其中与其他脚本重复的代码
import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';
import { compare } from 'compare-versions';
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
      const primary = getCharWorldbookNames('current').primary;
      if (primary) {
        const result = await SillyTavern.callGenericPopup(
          '更新角色卡将会覆盖掉现在的世界书, 你需要备份吗?',
          SillyTavern.POPUP_TYPE.CONFIRM,
          '',
          {
            leftAlign: true,
            customButtons: ['备份并更新'],
            okButton: '仅更新',
            cancelButton: '取消',
            wide: true,
          },
        );
        if (!result) {
          return;
        }
        if (result === 2) {
          const backup = `${primary} (备份)`;
          const success = await createOrReplaceWorldbook(backup, await getWorldbook(primary));
          if (success) {
            toastr.success(`已将世界书备份为 '${backup}'`);
          }
        }
      }

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
async function updateButtons(data: Data): Promise<void> {
  const current_version = await getCharacter(data.name)
    .then(character => character.version.trim() || '0.0.0')
    .catch(() => '0.0.0');

  let should_update = false;
  try {
    should_update = current_version !== data.version || compare(current_version, data.version, '<');
  } catch (error) {
    /** ignore */
  }
  const buttons = [makeUpdateCharacter(data), makeShowChangelog(data)];
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
    insertOrAssignVariables(settings, { type: 'script' });

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

    await updateButtons(data);
  }),
);
