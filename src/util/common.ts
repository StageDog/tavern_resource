import { compare } from 'compare-versions';

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

export function regexFromString(input: string): RegExp | null {
  try {
    const match = input.match(/(\/?)(.+)\1([a-z]*)/i);
    if (!match) {
      return null;
    }
    if (match[3] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(match[3])) {
      return new RegExp(input, 'gi');
    }
    let flags = match[3];
    if (flags.indexOf('g') === -1) {
      flags = flags + 'g';
    }
    if (flags.indexOf('i') === -1) {
      flags = flags + 'i';
    }
    return new RegExp(match[2], flags);
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
