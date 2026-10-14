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
  /** 角色卡链接 (已把 `{version}` 替换成更新日志里的最新版本号) */
  card_url: string;
  changelog: string;
};

interface Button {
  name: string;
  function: (() => void) | (() => Promise<void>);
}

//----------------------------------------------------------------------------------------------------------------------
function getUpdateButtonPrefix(name: string): string {
  return `更新角色卡: ${name}`;
}

/** 从角色卡文件里读出它自己声明的版本号 (`data.character_version`); 读不出来返回 null */
async function getVersionFromCard(content: Blob): Promise<string | null> {
  const buffer = new Uint8Array(await content.arrayBuffer());
  const parseVersion = (text: string): string | null => {
    try {
      const card = JSON.parse(text);
      const version = card?.data?.character_version ?? card?.character_version;
      return typeof version === 'string' && version.trim() ? version.trim() : null;
    } catch {
      return null;
    }
  };

  // json 卡
  const is_png =
    buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (!is_png) {
    return parseVersion(new TextDecoder().decode(buffer));
  }

  // png 卡: 版本号在 tEXt 块里, 关键字 `ccv3` (v3) 或 `chara` (v2), 内容是 base64 过的 json
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const latin1 = new TextDecoder('latin1');
  let offset = 8;
  let v2: string | null = null;
  while (offset + 12 <= buffer.length) {
    const length = view.getUint32(offset);
    const type = latin1.decode(buffer.subarray(offset + 4, offset + 8));
    const data_start = offset + 8;
    const data_end = data_start + length;
    if (data_end > buffer.length) {
      break;
    }
    if (type === 'tEXt') {
      const chunk = buffer.subarray(data_start, data_end);
      const separator = chunk.indexOf(0);
      if (separator > 0) {
        const keyword = latin1.decode(chunk.subarray(0, separator));
        if (keyword === 'ccv3' || keyword === 'chara') {
          let decoded: string | null;
          try {
            decoded = new TextDecoder().decode(
              Uint8Array.from(atob(latin1.decode(chunk.subarray(separator + 1))), c => c.charCodeAt(0)),
            );
          } catch {
            decoded = null;
          }
          const version = decoded ? parseVersion(decoded) : null;
          if (keyword === 'ccv3' && version) {
            return version;
          }
          if (keyword === 'chara') {
            v2 = version;
          }
        }
      }
    }
    if (type === 'IEND') {
      break;
    }
    offset = data_end + 4;
  }
  return v2;
}

//----------------------------------------------------------------------------------------------------------------------
function makeUpdateCharacter(data: Data): Button {
  return {
    name: `${getUpdateButtonPrefix(data.name)}${data.version}`,
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

      // 点了才拉角色卡: 每次开卡都拉整张卡既浪费流量, 又会拉到和更新日志不同步的缓存
      let content: Blob;
      try {
        content = await fetchServerWithError(data.card_url, 'blob');
      } catch (error) {
        toastr.error(`拉取角色卡失败: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }

      // 校验卡里自己声明的版本号: 更新日志说是新版、拉到的却是 CDN 缓存的旧卡时, 不能把旧内容贴上新版本号 (否则玩家会被锁死在假版本上)
      const card_version = await getVersionFromCard(content);
      if (card_version !== null && card_version !== data.version) {
        toastr.error(
          `更新中止: 拉到的角色卡版本是 '${card_version}', 更新日志里的最新版本是 '${data.version}'. 可能是旧角色卡在网络缓存中还存在, 请稍后重试`,
        );
        return;
      }

      const success = await importRawCharacter(data.name, content);
      if (!success) {
        toastr.error('更新角色卡失败, 请刷新重试');
        return;
      }
      replaceCharacter(data.name, { version: card_version ?? data.version });
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

  let should_update;
  try {
    should_update = compare(current_version, data.version, '<');
  } catch (error) {
    should_update = current_version !== data.version;
  }
  const buttons = [makeUpdateCharacter(data), makeShowChangelog(data)];
  // 按钮名里带版本号, 所以清理时按前缀匹配: 远端发了新版后, 旧版本号的按钮才不会残留
  const is_ours = (button: { name: string }) =>
    button.name.startsWith(getUpdateButtonPrefix(data.name)) || buttons.some(b => b.name === button.name);
  getScriptButtons()
    .filter(is_ours)
    .forEach(button => {
      eventClearEvent(getButtonEvent(button.name));
    });
  if (should_update) {
    buttons.forEach(button => {
      eventOn(getButtonEvent(button.name), button.function);
    });
    replaceScriptButtons(
      _(getScriptButtons())
        .filter(button => !is_ours(button))
        .concat(buttons.map(button => ({ name: button.name, visible: true })))
        .value(),
    );
    return;
  }
  replaceScriptButtons(
    _(getScriptButtons())
      .filter(button => !is_ours(button))
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
  throw new Error(`检测自动更新角色卡失败: (${response.status}) ${await response.text()}`);
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

    // 开卡只拉更新日志 (很小); 角色卡要等玩家点了更新按钮才拉
    const changelog = await fetchServerWithError(settings.更新日志链接, 'text');
    const version = changelog.match(/^##\s*(.*)\s*$/m)?.[1]?.trim() ?? '';
    const data: Data = {
      name: settings.角色卡名称,
      version,
      // 链接里可以写 `{version}` 占位符, 指向不可变的版本路径 (如 `@{version}/角色卡.png`), 从根上避免 CDN 缓存的旧卡
      card_url: settings.角色卡链接.replaceAll('{version}', encodeURIComponent(version)),
      changelog,
    };

    await updateButtons(data);
  }),
);
