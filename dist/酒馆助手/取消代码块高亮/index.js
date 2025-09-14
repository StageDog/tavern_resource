import "https://testingcf.jsdelivr.net/npm/compare-versions/+esm";

;// external "https://testingcf.jsdelivr.net/npm/compare-versions/+esm"

;// ./src/util.ts

function assign_inplace(destination, new_array) {
    destination.length = 0;
    destination.push(...new_array);
    return destination;
}
function chunk_by(array, predicate) {
    if (array.length === 0) {
        return [];
    }
    const chunks = [[array[0]]];
    for (const [lhs, rhs] of _.zip(_.drop(array), _.dropRight(array))) {
        if (predicate(lhs, rhs)) {
            chunks[chunks.length - 1].push(lhs);
        }
        else {
            chunks.push([lhs]);
        }
    }
    return chunks;
}
async function check_minimum_version(expected, title) {
    if (compare(await getTavernHelperVersion(), expected, '<')) {
        toastr.error(`'${title}' 需要酒馆助手版本 >= '${expected}'`, '版本不兼容');
    }
}
async function load_readme(url) {
    const readme = await fetch(url);
    if (!readme.ok) {
        return false;
    }
    const readme_text = await readme.text();
    replaceScriptInfo(readme_text);
    return true;
}
function teleport_style() {
    if ($(`head > div[script_id="${getScriptId()}"]`).length > 0) {
        return;
    }
    const $div = $(`<div>`).attr('script_id', getScriptId()).append($(`head > style`, document).clone());
    $('head').append($div);
}
function deteleport_style() {
    $(`head > div[script_id="${getScriptId()}"]`).remove();
}

;// ./src/酒馆助手/取消代码块高亮/index.ts

// @ts-expect-error
const hljs = window.parent.hljs;
const original_highlightElement = hljs.highlightElement;
$(() => {
    load_readme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/取消代码块高亮/README.md');
    hljs.highlightElement = () => { };
    $('pre code')
        .removeAttr('data-highlighted')
        .text(function () {
        return $(this).text();
    });
});
$(window).on('pagehide', () => {
    hljs.highlightElement = original_highlightElement;
    $('pre code').each((_index, element) => {
        hljs.highlightElement(element);
    });
});

