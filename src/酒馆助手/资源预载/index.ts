export {};

interface Preload {
  title: string;
  assets: string[];
}

async function get_preloads() {
  return getTavernRegexes()
    .filter(regex => regex.enabled && regex.script_name.includes('预载-'))
    .map<Preload>(regex => ({
      title: regex.script_name.replace('预载-', '').replaceAll(/【.+?】/gs, ''),
      assets: regex.replace_string
        .split('\n')
        .map(asset => asset.trim())
        .filter(asset => !!asset),
    }));
}

function extract_preload_node(preload: Preload) {
  return $('<div>')
    .attr('id', `script_preload-${preload.title}`)
    .append(preload.assets.map(asset => $('<link>').attr('rel', 'preload').attr('href', asset).attr('as', 'image')));
}

function reappend_preloads(nodes: JQuery) {
  const head = $('head', window.parent.document);
  head.find('#script_preload').remove();
  head.append(nodes);
}

$(async () => {
  const preloads = await get_preloads();
  const preload_nodes = preloads.map(extract_preload_node);
  reappend_preloads($('<div>').attr('id', 'script_preload').append(preload_nodes));
});
