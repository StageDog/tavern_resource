async function get_third_party_extension_names(): Promise<string[]> {
  try {
    const response = await fetch('/api/extensions/discover');

    if (response.ok) {
      const extensions: Array<{ type: 'lcoal' | 'global' | 'system'; name: string }> = await response.json();
      return extensions
        .filter(extension => extension.type !== 'system')
        .map(extension => extension.name.replace('third-party/', ''));
    } else {
      return [];
    }
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function install_extension(url: string): Promise<boolean> {
  const request = await fetch('/api/extensions/install', {
    method: 'POST',
    headers: SillyTavern.getRequestHeaders(),
    body: JSON.stringify({
      url,
    }),
  });
  if (!request.ok) {
    const text = await request.text();
    toastr.warning(`${text || request.statusText}`, '扩展安装失败');
    console.error('扩展安装失败', request.status, request.statusText, text);
    return false;
  }

  const response = await request.json();
  toastr.success(
    `已成功安装由 '${response.author}' 编写的 '${response.display_name}' (版本 ${response.version})!`,
    '扩展安装成功',
  );
  console.debug(`已成功将 '${response.display_name}' 安装到 ${response.extensionPath}`);
  return true;
}

interface Extension {
  name: string;
  url: string;
}

export async function check_and_install_extensions(extensions: Extension[]): Promise<void> {
  const parsed_extensions = extensions
    .map(({ name, url }) => {
      let tag = url.replace(/(\.git|\/)$/, '');
      tag = tag.substring(tag.lastIndexOf('/') + 1);
      return {
        [tag]: {
          name,
          url,
        },
      };
    })
    .reduce((previous, current) => _.defaults(previous, current), {});

  const current_extensions = await get_third_party_extension_names();
  const uninstall_extension_tags = _.difference(Object.keys(parsed_extensions), current_extensions);
  if (uninstall_extension_tags.length === 0) {
    return;
  }

  if (
    !(await SillyTavern.callGenericPopup(
      '以下需要的插件尚未安装, 是否安装?<br>' +
        uninstall_extension_tags.map(tag => `- ${parsed_extensions[tag].name}`).join('<br>'),
      SillyTavern.POPUP_TYPE.CONFIRM,
      '',
      { leftAlign: true },
    ))
  ) {
    return;
  }

  await Promise.allSettled(uninstall_extension_tags.map(tag => install_extension(parsed_extensions[tag].url)));
  setTimeout(() => triggerSlash('/reload-page'), 3000);
}
