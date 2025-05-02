export {};

interface Style {
  title: string;
  code: string;
}

function get_styles() {
  return getTavernRegexes()
    .filter(regex => regex.enabled && regex.script_name.includes('样式-'))
    .map<Style>(regex => ({
      title: regex.script_name.replace('样式-', '').replaceAll(/【.+?】/gs, ''),
      code: regex.replace_string,
    }));
}

function extract_style_node(style: Style) {
  return $('<style>').attr('id', `script_custom_style-${style.title}`).text(style.code);
}

function reappend_styles(nodes: JQuery) {
  const head = $('head', window.parent.document);
  head.find('#script_custom_style').remove();
  head.append(nodes);
}

$(async () => {
  const styles = await get_styles();
  const style_nodes = styles.map(extract_style_node);
  reappend_styles($('<div>').attr('id', 'script_custom_style').append(style_nodes));
});
