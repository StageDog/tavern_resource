import * as CORE from '@gitbeaker/core';
import { Gitlab } from '@gitbeaker/rest';

export interface Repository_path {
  host: string;
  project_id: string;
  path: string;
  ref: string;
}

export function parse_repository_path_from_url(url: string): Repository_path {
  const match = url.match(/(https?:\/\/[^/]+)\/((?:[^/]+)\/(?:[^/]+))\/-\/(?:tree|blob)\/([^/]+)\/([^?]*)/);
  if (!match) {
    throw Error(`解析仓库文件 url 失败: 未能从 '${url}' 中解析出 gitlab 仓库文件信息`);
  }
  return {
    host: match[1],
    project_id: match[2],
    path: match[4],
    ref: match[3],
  };
}

export async function retrieve_raw(api: CORE.Gitlab, file: Repository_path): Promise<Blob | string> {
  return await api.RepositoryFiles.showRaw(file.project_id, file.path, file.ref);
}

export async function compare_commits_between(api: CORE.Gitlab, project_id: string, from_ref: string, to_ref: string) {
  const result = await api.Repositories.compare(project_id, from_ref, to_ref);
  alert(JSON.stringify(result));
}

export function make_api(host: string, token?: string): CORE.Gitlab {
  return new Gitlab({ host: host, token: token });
}
