import { compare } from 'compare-versions';
import { jsonrepair } from 'jsonrepair';
import { toDotPath } from 'zod/v4/core';

export function assignInplace<T>(destination: T[], new_array: T[]): T[] {
  destination.length = 0;
  destination.push(...new_array);
  return destination;
}

// 修正 _.merge 对数组的合并逻辑, [1, 2, 3] 和 [4, 5] 合并后变成 [4, 5] 而不是 [4, 5, 3]
export function correctlyMerge<TObject, TSource>(lhs: TObject, rhs: TSource): TObject & TSource {
  return _.mergeWith(lhs, rhs, (_lhs, rhs) => (_.isArray(rhs) ? rhs : undefined));
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
  const json_first = /^[[{]/s.test(content.trimStart());
  try {
    return json_first ? JSON.parse(jsonrepair(content)) : YAML.parseDocument(content, { merge: true }).toJS();
  } catch (e1) {
    try {
      return json_first ? YAML.parseDocument(content, { merge: true }).toJS() : JSON.parse(jsonrepair(content));
    } catch (e2) {
      const toError = (error: unknown) =>
        error instanceof Error ? `${error.stack ? error.stack : error.message}` : String(error);

      const error = { 字符串内容: content };
      _.set(error, json_first ? 'JSON错误信息' : 'YAML错误信息', toError(e1));
      _.set(error, json_first ? 'YAML错误信息' : 'JSON错误信息', toError(e2));
      throw new Error(
        literalYamlify({ [`要解析的字符串不是有效的 ${json_first ? 'JSON/YAML' : 'YAML/JSON'} 格式`]: error }),
      );
    }
  }
}

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
}
