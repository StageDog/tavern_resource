// TODO: 抽象出其中与其他脚本重复的代码
import { checkMinimumVersion } from '@util/common';
import { loadReadme } from '@util/script';
import { compare } from 'compare-versions';
import { marked } from 'marked';

const FETCH_TIMEOUT_MS = 15000;

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.name === 'AbortError' ? `超时 (${FETCH_TIMEOUT_MS / 1000}s 内没有响应)` : error.message;
  }
  return String(error);
}

function isPng(buffer: Uint8Array): boolean {
  return buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}

//----------------------------------------------------------------------------------------------------------------------
const PNG_SIGNATURE_LENGTH = 8;
const CRC_TABLE = Array.from({ length: 256 }, (_value, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 遍历 png 的所有块, 返回每块的 [起点, 终点) 和类型 */
function* iteratePngChunks(buffer: Uint8Array): Generator<{ type: string; start: number; end: number }> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const latin1 = new TextDecoder('latin1');
  let offset = PNG_SIGNATURE_LENGTH;
  while (offset + 12 <= buffer.length) {
    const length = view.getUint32(offset);
    const type = latin1.decode(buffer.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length;
    if (end > buffer.length) {
      return;
    }
    yield { type, start: offset, end };
    if (type === 'IEND') {
      return;
    }
    offset = end;
  }
}

function getTextChunkKeyword(buffer: Uint8Array, chunk: { start: number; end: number }): string {
  const data = buffer.subarray(chunk.start + 8, chunk.end - 4);
  const separator = data.indexOf(0);
  return separator > 0 ? new TextDecoder('latin1').decode(data.subarray(0, separator)) : '';
}

/** 组一个 tEXt 块: 长度 + 类型 + (关键字 \0 内容) + crc */
function makeTextChunk(keyword: string, text: string): Uint8Array {
  const latin1 = (value: string) => Uint8Array.from(value, c => c.charCodeAt(0));
  const body = new Uint8Array([...latin1(keyword), 0, ...latin1(text)]);
  const type_and_body = new Uint8Array([...latin1('tEXt'), ...body]);
  const chunk = new Uint8Array(12 + body.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, body.length);
  chunk.set(type_and_body, 4);
  view.setUint32(8 + body.length, crc32(type_and_body));
  return chunk;
}

function base64FromUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// 1x1 透明 png, 实在拿不到角色现有头像时才用
const FALLBACK_AVATAR_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/**
 * 把 json 卡包进 png 卡: 酒馆助手的 `importRawCharacter` 只会按 png 导入, 喂 json 会导入失败.
 * 图片用角色现有的头像, 这样更新后头像不会变; 原图里旧的角色卡块会被去掉, 换成新卡的内容
 */
async function wrapJsonCardIntoPng(name: string, json_text: string): Promise<Blob> {
  const card = JSON.parse(json_text);
  if (!_.isPlainObject(card) || !(card?.data?.name ?? card?.name)) {
    throw new Error('内容不是角色卡 json');
  }

  let image: Uint8Array | null = null;
  try {
    const avatar = await getCharacter(name).then(character => character.avatar);
    if (typeof avatar === 'string') {
      const response = await fetch(`/characters/${encodeURIComponent(avatar)}`, { cache: 'no-store' });
      if (response.ok) {
        image = new Uint8Array(await response.arrayBuffer());
      }
    }
  } catch {
    image = null;
  }
  if (!image || !isPng(image)) {
    image = Uint8Array.from(atob(FALLBACK_AVATAR_BASE64), c => c.charCodeAt(0));
  }

  const parts: Uint8Array[] = [image.subarray(0, PNG_SIGNATURE_LENGTH)];
  const encoded = base64FromUtf8(json_text);
  for (const chunk of iteratePngChunks(image)) {
    if (chunk.type === 'tEXt' && ['chara', 'ccv3'].includes(getTextChunkKeyword(image, chunk))) {
      continue;
    }
    if (chunk.type === 'IEND') {
      // 酒馆读卡时优先认 ccv3, 其次 chara; 两个都写上, 旧酒馆也能读
      parts.push(makeTextChunk('chara', encoded));
      if (card.spec === 'chara_card_v3') {
        parts.push(makeTextChunk('ccv3', encoded));
      }
    }
    parts.push(image.subarray(chunk.start, chunk.end));
  }
  return new Blob(parts as BlobPart[], { type: 'image/png' });
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
  if (!isPng(buffer)) {
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
          // createOrReplaceWorldbook 只在新建时返回 true, 覆盖上一份备份时返回 false, 所以不能拿返回值决定提示
          await createOrReplaceWorldbook(backup, await getWorldbook(primary));
          toastr.success(`已将世界书备份为 '${backup}'`);
        }
      }

      // 点了才拉角色卡: 每次开卡都拉整张卡既浪费流量, 又会拉到和更新日志不同步的缓存
      let content: Blob;
      try {
        content = await fetchServerWithError(data.card_url, 'blob');
      } catch (error) {
        toastr.error(`拉取角色卡失败: ${getErrorMessage(error)}`);
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

      // json 卡要先包进 png: 酒馆助手的 importRawCharacter 一律按 png 导入, 直接喂 json 会"成功"但酒馆里什么都没改
      if (!isPng(new Uint8Array(await content.slice(0, 8).arrayBuffer()))) {
        try {
          content = await wrapJsonCardIntoPng(data.name, await content.text());
        } catch (error) {
          toastr.error(`拉到的不是角色卡文件: ${getErrorMessage(error)}`);
          return;
        }
      }

      // 酒馆导入失败时也可能返回 200 + `{error: true}`, 所以不能只看 Response 存不存在
      const response = await importRawCharacter(data.name, content);
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.error) {
        toastr.error('更新角色卡失败, 请刷新重试');
        return;
      }
      await replaceCharacter(data.name, { version: card_version ?? data.version });
      toastr.success(`更新角色卡 '${data.name}' 成功`);
    },
  };
}

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

//----------------------------------------------------------------------------------------------------------------------
const CHANGELOG_BUTTON_NAME = '更新日志';

function isOurButton(name: string, button: { name: string }): boolean {
  // 按钮名里带版本号, 所以按前缀匹配: 远端发了新版后, 旧版本号的按钮才不会残留
  return button.name.startsWith(getUpdateButtonPrefix(name)) || button.name === CHANGELOG_BUTTON_NAME;
}

/** 清掉上次存在卡里的按钮和事件; 拉不到更新日志时也要清, 否则留下一个点了没反应的死按钮 */
function clearButtons(name: string): void {
  getScriptButtons()
    .filter(button => isOurButton(name, button))
    .forEach(button => {
      eventClearEvent(getButtonEvent(button.name));
    });
  replaceScriptButtons(getScriptButtons().filter(button => !isOurButton(name, button)));
}

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
  clearButtons(data.name);
  if (!should_update) {
    return;
  }
  const buttons = [makeUpdateCharacter(data), makeShowChangelog(data)];
  buttons.forEach(button => {
    eventOn(getButtonEvent(button.name), button.function);
  });
  replaceScriptButtons([...getScriptButtons(), ...buttons.map(button => ({ name: button.name, visible: true }))]);
}

//----------------------------------------------------------------------------------------------------------------------
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
    checkMinimumVersion('4.6.5', '自动更新角色卡');
    loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/自动更新角色卡/README.md');

    const settings = Settings.parse(getVariables({ type: 'script' }));
    insertOrAssignVariables(settings, { type: 'script' });

    if (Object.values(settings).some(value => !value || value === '未填写')) {
      return;
    }

    // 开卡只拉更新日志 (很小); 角色卡要等玩家点了更新按钮才拉
    let changelog: string;
    try {
      changelog = await fetchServerWithError(settings.更新日志链接, 'text');
    } catch (error) {
      toastr.error(`检测自动更新角色卡失败: ${getErrorMessage(error)}`);
      clearButtons(settings.角色卡名称);
      return;
    }
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
