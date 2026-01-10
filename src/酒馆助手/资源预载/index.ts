export {};

interface Prefetch {
  title: string;
  assets: string[];
}

const Settings = z.object({
  资源预载: z.string().default(''),
});

const variable_option = { type: 'script', script_id: getScriptId() } as const;

function get_prefetches(): Prefetch[] {
  const settings = Settings.parse(getVariables(variable_option));
  insertVariables(settings, variable_option);

  return _(getTavernRegexes())
    .filter(regex => regex.enabled && regex.script_name.includes('预载-'))
    .map(regex => ({
      title: regex.script_name.replace('预载-', '').replaceAll(/【.+?】/gs, ''),
      content: regex.replace_string,
    }))
    .concat([{ title: '脚本变量', content: settings.资源预载 }])
    .map(({ title, content }) => ({
      title,
      assets: content
        .split('\n')
        .map(asset => asset.trim())
        .filter(asset => !!asset),
    }))
    .value();
}

$(() => {
  Promise.allSettled(
    get_prefetches().flatMap(prefetch =>
      prefetch.assets.map(
        asset =>
          new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = asset;
          }),
      ),
    ),
  );
});
