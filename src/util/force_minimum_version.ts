import { compare } from 'compare-versions';

export async function force_minimum_version(expected: string, title: string) {
  const version = await getTavernHelperVersion();
  if (compare(version, expected, '<')) {
    toastr.error(`酒馆助手版本过低, 不请更新至 '${expected}' 或更高版本`, title);
  }
}
