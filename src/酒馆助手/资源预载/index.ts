export { };

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

function extract_prefetch_node(prefetch: Prefetch) {
  return $('<div>')
    .attr('id', `script_prefetch-${prefetch.title}`)
    .append(prefetch.assets.map(asset => $('<link>').attr(
      {
        rel: 'prefetch',
        as: 'image',
        href: asset,
      })));
}

function reappend_prefetches(nodes: JQuery) {
  const head = $('head', window.parent.document);
  head.find('#script_prefetch').remove();
  head.append(nodes);
}

$(async () => {
  const prefetches = get_prefetches();
  const prefetch_nodes = prefetches.map(extract_prefetch_node);
  reappend_prefetches($('<div>').attr('id', 'script_prefetch').append(prefetch_nodes));
});
