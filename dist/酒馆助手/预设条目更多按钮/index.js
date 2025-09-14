import { compare } from "https://testingcf.jsdelivr.net/npm/compare-versions/+esm";

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

;// ./src/酒馆助手/预设条目更多按钮/index.ts

function get_prompt_id_from_tool($tool) {
    return $tool.closest('.completion_prompt_manager_prompt').attr('data-pm-identifier');
}
function replace_toolbox() {
    observer.disconnect();
    const $prompts = $('.completion_prompt_manager_prompt:has(.fa-asterisk), .completion_prompt_manager_prompt:has(.fa-syringe), .completion_prompt_manager_prompt:has(.fa-square-poll-horizontal)');
    const $prompt_controls = $prompts.find('.prompt_manager_prompt_controls');
    $prompts.find('.prompt_manager_prompt_tokens').css('pointer-events', 'none');
    $prompt_controls.find('span[title="Remove"], span[title="copy"], span[title="delete"]').remove();
    $prompt_controls.prepend($('<span title="delete" class="prompt-manager-remove-action caution fa-solid fa-trash fa-xs"></span>').on('click', async function () {
        const result = await SillyTavern.callGenericPopup('确定要永久删除这个条目吗?', SillyTavern.POPUP_TYPE.CONFIRM);
        if (!result) {
            return;
        }
        const prompt_id = get_prompt_id_from_tool($(this));
        await updatePresetWith('in_use', preset => {
            const index = preset.prompts.findIndex(prompt => prompt.id === prompt_id);
            if (index === -1) {
                return preset;
            }
            preset.prompts.splice(index, 1);
            return preset;
        }, { render: 'immediate' });
    }), $('<span title="copy" class="prompt-manager-copy-action fa-solid fa-copy fa-xs"></span>').on('click', async function () {
        const prompt_id = get_prompt_id_from_tool($(this));
        await updatePresetWith('in_use', preset => {
            const index = preset.prompts.findIndex(prompt => prompt.id === prompt_id);
            if (index === -1) {
                return preset;
            }
            preset.prompts.splice(index + 1, 0, preset.prompts[index]);
            return preset;
        }, { render: 'immediate' });
    }));
    observer.observe($('#completion_prompt_manager')[0], {
        childList: true,
        subtree: true,
    });
}
const replace_toolbox_debounced = _.debounce(replace_toolbox, 500);
const observer = new MutationObserver(replace_toolbox_debounced);
$(() => {
    check_minimum_version('3.4.4', '预设条目更多按钮');
    load_readme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/预设条目更多按钮/README.md');
    replace_toolbox();
});
$(window).on('pagehide', () => {
    replacePreset('in_use', getPreset('in_use'));
    observer.disconnect();
});

