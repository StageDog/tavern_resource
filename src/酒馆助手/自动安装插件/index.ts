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
    toastr.warning(`扩展安装失败: ${text || request.statusText}`);
    console.error('扩展安装失败', request.status, request.statusText, text);
    return false;
  }

  const response = await request.json();
  toastr.success(
    `扩展安装成功: 已成功安装由 '${response.author}' 编写的 '${response.display_name}' (版本 ${response.version})!`,
  );
  console.debug(`已成功将 '${response.display_name}' 安装到 ${response.extensionPath}`);
  return true;
}

$(async () => {
  const extensions = (await getTavernRegexes({ enable_state: 'enabled' }))
    .filter(regex => regex.script_name.includes('预安装插件'))
    .flatMap(regex => Object.entries<string>(YAML.parse(regex.replace_string)))
    .map(([name, url]) => {
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
  const uninstall_extension_tags = _.difference(Object.keys(extensions), current_extensions);
  if (uninstall_extension_tags.length === 0) {
    return;
  }

  if (
    !(await SillyTavern.callGenericPopup(
      '以下需要的插件尚未安装, 是否安装?<br>' +
        uninstall_extension_tags.map(tag => `- ${extensions[tag].name}`).join('<br>'),
      SillyTavern.POPUP_TYPE.CONFIRM,
      '',
      { leftAlign: true },
    ))
  ) {
    return;
  }

  await Promise.allSettled(uninstall_extension_tags.map(tag => install_extension(extensions[tag].url)));
  setTimeout(() => triggerSlash('/reload-page'), 3000);
});
