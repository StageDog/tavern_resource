import { compare } from 'compare-versions';
import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';
import { toDotPath } from 'zod/v4/core';

export function assignInplace<T>(destination: T[], new_array: T[]): T[] {
  destination.length = 0;
  destination.push(...new_array);
  return destination;
}

export function chunkBy<T>(array: T[], predicate: (lhs: T, rhs: T) => boolean): T[][] {
  if (array.length === 0) {
    return [];
  }

  const chunks: T[][] = [[array[0]]];
  for (const [lhs, rhs] of _.zip(_.dropRight(array), _.drop(array))) {
    if (predicate(lhs!, rhs!)) {
      chunks[chunks.length - 1].push(rhs!);
    } else {
      chunks.push([rhs!]);
    }
  }
  return chunks;
}

export function regexFromString(input: string, replace_macros?: boolean): RegExp | null {
  if (!input) {
    return null;
  }
  const makeRegex = (pattern: string, flags: string) => {
    if (replace_macros) {
      pattern = substitudeMacros(pattern);
    }
    return new RegExp(pattern, flags);
  };
  try {
    const match = input.match(/\/(.+)\/([a-z]*)/i);
    if (!match) {
      return makeRegex(_.escapeRegExp(input), 'i');
    }
    if (match[2] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(match[3])) {
      return makeRegex(input, 'i');
    }
    let flags = match[2] ?? '';
    _.pull(flags, 'g');
    if (flags.indexOf('i') === -1) {
      flags = flags + 'i';
    }
    return makeRegex(match[1], flags);
  } catch {
    return null;
  }
}

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function checkMinimumVersion(expected: string, title: string) {
  if (compare(await getTavernHelperVersion(), expected, '<')) {
    toastr.error(`'${title}' 需要酒馆助手版本 >= '${expected}'`, '版本不兼容');
  }
}

export function prettifyErrorWithInput(error: z.ZodError) {
  return _([...error.issues])
    .sortBy(issue => issue.path?.length ?? 0)
    .flatMap(issue => {
      const lines = [`✖ ${issue.message}`];
      if (issue.path?.length) {
        lines.push(`  → 路径: ${toDotPath(issue.path)}`);
      }
      if (issue.input !== undefined) {
        lines.push(`  → 输入: ${JSON.stringify(issue.input)}`);
      }
      return lines;
    })
    .join('\n');
}

export function literalYamlify(value: any) {
  return YAML.stringify(value, { blockQuote: 'literal' });
}

export function parseString(content: string): any {
  let parsed: unknown;
  try {
    parsed = YAML.parseDocument(content, { merge: true }).toJS();
  } catch (yaml_error) {
    try {
      // eslint-disable-next-line import-x/no-named-as-default-member
      parsed = JSON5.parse(content);
    } catch (json5_error) {
      try {
        parsed = JSON.parse(jsonrepair(content));
      } catch (json_error) {
        const toError = (error: unknown) => (error instanceof Error ? error.message : String(error));
        throw new Error(
          literalYamlify({
            ['要解析的字符串不是有效的 YAML/JSON 格式']: {
              字符串内容: content,
              YAML错误信息: toError(yaml_error),
              JSON5错误信息: toError(json5_error),
              尝试修复JSON时的错误信息: toError(json_error),
            },
          }),
        );
      }
    }
  }
  return parsed;
}

<<<<<<< HEAD
export function getComplementString(string: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(string);

  const complemented = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    complemented[i] = 0xff - bytes[i];
  }

  let hex = '';
  for (let i = 0; i < complemented.length; i++) {
    const h = complemented[i].toString(16).padStart(2, '0');
    hex += h;
  }
  return hex;
=======
export async function checkAndUpdateCharacter(name: string, latest_version: string, png_url: string): Promise<void> {
  const current_version = (await getCharacter(name)).version.trim() || '0.0.0';
  if (compare(current_version, latest_version, '>=')) {
    return;
  }
  await importRawCharacter(name, await fetch(png_url).then(response => response.blob()));
  replaceCharacter(name, { version: latest_version });
  toastr.success(
    `角色卡已自动更新到 '${latest_version.startsWith('v') ? latest_version : `v${latest_version}`}'`,
    name,
  );
>>>>>>> 657d325b384170d58b72e3fe3cc38173e31a414a
}
