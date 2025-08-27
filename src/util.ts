import { compare } from 'compare-versions';

export function assign_inplace<T>(destination: T[], new_array: T[]): T[] {
  destination.length = 0;
  destination.push(...new_array);
  return destination;
}

export function chunk_by<T>(array: T[], predicate: (lhs: T, rhs: T) => boolean): T[][] {
  if (array.length === 0) {
    return [];
  }

  const chunks: T[][] = [[array[0]]];
  for (const [lhs, rhs] of _.zip(_.drop(array), _.dropRight(array))) {
    if (predicate(lhs!, rhs!)) {
      chunks[chunks.length - 1].push(lhs!);
    } else {
      chunks.push([lhs!]);
    }
  }
  return chunks;
}

export async function check_minimum_version(expected: string, title: string) {
  if (compare(await getTavernHelperVersion(), expected, '<')) {
    toastr.error(`'${title}' 需要酒馆助手版本 >= '${expected}'`, '版本不兼容');
  }
}
