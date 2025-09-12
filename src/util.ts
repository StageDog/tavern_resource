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

export async function load_readme(url: string): Promise<boolean> {
  const readme = await fetch(url);
  if (!readme.ok) {
    return false;
  }
  const readme_text = await readme.text();
  replaceScriptInfo(readme_text);
  return true;
}

export function teleport_vue_style() {
  if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) {
    return;
  }
  const $div = $(`<div>`).attr('script_id', getScriptId()).append($(`head > style[data-vue-ssr-id]`, document).clone());
  $('head').append($div);
}

export function deteleport_vue_style() {
  $(`head > div[script_id="${getScriptId()}"]`).remove();
}
