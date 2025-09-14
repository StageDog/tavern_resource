const Settings = z.object({
    资源预载: z.string().default(''),
});
const variable_option = { type: 'script', script_id: getScriptId() };
function get_preloads() {
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
function extract_preload_node(preload) {
    return $('<div>')
        .attr('id', `script_preload-${preload.title}`)
        .append(preload.assets.map(asset => $('<link>').attr('rel', 'preload').attr('href', asset).attr('as', 'image')));
}
function reappend_preloads(nodes) {
    const head = $('head', window.parent.document);
    head.find('#script_preload').remove();
    head.append(nodes);
}
$(async () => {
    const preloads = get_preloads();
    const preload_nodes = preloads.map(extract_preload_node);
    reappend_preloads($('<div>').attr('id', 'script_preload').append(preload_nodes));
});


