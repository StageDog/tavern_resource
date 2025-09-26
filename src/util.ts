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
  for (const [lhs, rhs] of _.zip(_.drop(array), _.dropRight(array))) {
    if (predicate(lhs!, rhs!)) {
      chunks[chunks.length - 1].push(lhs!);
    } else {
      chunks.push([lhs!]);
    }
  }
  return chunks;
}

export async function checkMinimumVersion(expected: string, title: string) {
  if (compare(await getTavernHelperVersion(), expected, '<')) {
    toastr.error(`'${title}' 需要酒馆助手版本 >= '${expected}'`, '版本不兼容');
  }
}

export async function loadReadme(url: string): Promise<boolean> {
  const readme = await fetch(url);
  if (!readme.ok) {
    return false;
  }
  const readme_text = await readme.text();
  replaceScriptInfo(readme_text);
  return true;
}

export function teleportStyle() {
  if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) {
    return;
  }
  const $div = $(`<div>`).attr('script_id', getScriptId()).append($(`head > style`, document).clone());
  $('head').append($div);
}

export function deteleportStyle() {
  $(`head > div[script_id="${getScriptId()}"]`).remove();
}

export function createScriptIdDiv(): JQuery<HTMLDivElement> {
  return $('<div>').attr('script_id', getScriptId()) as JQuery<HTMLDivElement>;
}

export function destroyScriptIdDiv(): void {
  $(`div[script_id="${getScriptId()}"]`).remove();
}
