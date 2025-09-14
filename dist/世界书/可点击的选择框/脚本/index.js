
;// ./src/世界书/可点击的选择框/脚本/络络扁平化暗色紧凑列表.scss?raw
const _raw_namespaceObject = ".roleplay_options_back{background:linear-gradient(160deg,rgba(45,45,45,0.75),rgba(35,35,35,0.85));border-radius:14px;box-shadow:0 10px 28px rgba(0,0,0,.15),0 3px 10px rgba(0,0,0,.12);padding:16px 18px;display:flex;flex-direction:column;gap:10px;border:1px solid hsla(0,0%,100%,.06);max-width:100%;margin:20px 0}.roleplay_options_title{font-size:.94em;font-weight:600;color:#f0f0f0;padding-right:12px;letter-spacing:.02em;text-align:left;margin-bottom:4px}.roleplay_options_content{font-size:.94em;line-height:1.55;color:#c6c6c6;font-weight:normal;transition:color .25s ease;text-align:left;flex:1;letter-spacing:.015em;overflow-wrap:anywhere}.roleplay_options_content:not(:empty):not(.short-content)~.roleplay_options_title{width:100%;margin-bottom:8px;border-bottom:1px solid hsla(0,0%,100%,.08);padding-bottom:6px}.roleplay_options_content.short-content{flex:1}.roleplay_options_hr{display:none}.roleplay_options_item{position:relative;background:rgba(50,50,50,.65);border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.1);padding:14px 16px;cursor:default;border:1px solid hsla(0,0%,100%,.04);transition:all .25s cubic-bezier(0.25,0.8,0.25,1);overflow:hidden;display:flex;flex-wrap:wrap;align-items:flex-start;z-index:1;margin:2px 0;color:#d8d8d8;font-weight:400;line-height:1.5}.roleplay_options_item::after{content:\"\";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,rgba(90,90,90,0.06) 0%,transparent 70%);opacity:0;transition:opacity .3s ease;z-index:-1}.roleplay_options_item:before{content:\"\";position:absolute;top:0;left:0;width:3px;height:100%;background:linear-gradient(to bottom,rgba(160,160,160,0.6),rgba(180,180,180,0.3));transform:scaleY(0);transform-origin:top;transition:transform .3s cubic-bezier(0.4,0,0.2,1)}.last_mes .roleplay_options_item{cursor:pointer}.last_mes .roleplay_options_item:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.15);background:rgba(58,58,58,.75);border-color:rgba(200,200,200,.12)}.last_mes .roleplay_options_item:hover::after{opacity:1}.last_mes .roleplay_options_item:hover .roleplay_options_content{color:#e2e2e2}.last_mes .roleplay_options_item:active{transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.12)}.last_mes .roleplay_options_item:hover:before{transform:scaleY(1)}@media (max-width:768px){.roleplay_options_back{padding:14px;gap:8px}.roleplay_options_item{padding:12px 14px}.roleplay_options_title{font-size:.9em;padding-right:10px}.roleplay_options_content{font-size:.9em;line-height:1.5}}@media (prefers-reduced-motion:reduce){.roleplay_options_item{transition:none}.roleplay_options_item::before,.roleplay_options_item::after{transition:none}.roleplay_options_content,.roleplay_options_title{transition:none}}";
;// ./src/世界书/可点击的选择框/脚本/index.ts

const lorebook_name = '【可点击的选择框】';
const roleplay_options_tag = '<roleplay_options>';
const roleplay_options_regex = /<roleplay_options>\s*(?:```.*\n)?([\s\S]*?)(?:\n```)?\s*<\/roleplay_options>/im;
//----------------------------------------------------------------------------------------------------------------------
var option_section;
(function (option_section) {
    const default_option = {
        input_mode: '直接发送',
    };
    async function parse_option() {
        const options = _.merge({}, ...(await getLorebookEntries(lorebook_name))
            .filter(entry => entry.comment.startsWith('设置-') && entry.enabled)
            .map(entry => {
            const value = entry.comment.replace('设置-', '');
            return { [value]: entry.content };
        }));
        const result = default_option;
        if (_.has(options, '直接发送')) {
            result.input_mode = '直接发送';
        }
        else if (_.has(options, '覆盖输入')) {
            result.input_mode = '覆盖输入';
        }
        else if (_.has(options, '尾附输入')) {
            result.input_mode = '尾附输入';
        }
        return result;
    }
    async function update() {
        const old_option = option_section.option;
        option_section.option = await parse_option();
        return !_.isEqual(option_section.option, old_option);
    }
    option_section.update = update;
})(option_section || (option_section = {}));
//----------------------------------------------------------------------------------------------------------------------
var render_section;
(function (render_section) {
    async function divclick($element) {
        if ($element.parents('.last_mes').length > 0) {
            const content = $element.find('.roleplay_options_content').text().trim();
            if (option_section.option.input_mode === '直接发送') {
                triggerSlash(`/send ${content} || /trigger`);
            }
            else if (option_section.option.input_mode === '覆盖输入') {
                triggerSlash(`/setinput ${content}`);
            }
            else if (option_section.option.input_mode === '尾附输入') {
                const old_content = $('#send_textarea').val();
                $('#send_textarea')
                    .val([old_content, content].join('\n') || '')[0]
                    .dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }
    let style;
    async function extract_style() {
        const entries = (await getLorebookEntries(lorebook_name)).filter(entry => entry.comment.startsWith('样式-') && entry.enabled);
        if (entries.length === 0) {
            return `<style>${_raw_namespaceObject}</style>`;
        }
        return entries[0].content;
    }
    async function update() {
        const old_style = style;
        style = await extract_style();
        return !_.isEqual(style, old_style);
    }
    render_section.update = update;
    function extract_roleplay_options_element(text) {
        const $div = $('<div class="roleplay_options">');
        $div.append(style);
        $div.append($('<div class="roleplay_options_back">').append([...text.matchAll(/(.+?)[:：]\s*(.+)/gm)]
            .map(match => ({
            title: match[1],
            content: match[2].replace(/^\$\{(.+)\}$/, '$1').replace(/^「(.+)」$/, '$1'),
        }))
            .map(({ title, content }) => $('<div class="roleplay_options_item" tabindex="1">')
            .on('click', function () {
            divclick($(this));
        })
            .append(`<span class="roleplay_options_title"><strong>${title}</strong></span>`)
            .append('<hr class="roleplay_options_hr">')
            .append(`<span class="roleplay_options_content">${content}</span>`))));
        return $div;
    }
    render_section.extract_roleplay_options_element = extract_roleplay_options_element;
})(render_section || (render_section = {}));
//----------------------------------------------------------------------------------------------------------------------
async function renderOneMessage(message_id) {
    const message = getChatMessages(message_id)[0].message;
    const match = message.match(roleplay_options_regex);
    if (!match) {
        return;
    }
    const $roleplay_options_element = render_section.extract_roleplay_options_element(match[1]);
    const $mes_text = retrieveDisplayedMessage(message_id);
    const $to_render = $mes_text.find(`.roleplay_options, pre:contains("${roleplay_options_tag}")`);
    if ($to_render.length > 0) {
        $to_render.remove();
        $mes_text.append($roleplay_options_element);
    }
}
async function renderAllMessage() {
    $('#chat')
        .children(".mes[is_user='false'][is_system='false']")
        .each((_index, node) => {
        renderOneMessage(Number(node.getAttribute('mesid')));
    });
}
$(async () => {
    await errorCatched(option_section.update)();
    await errorCatched(render_section.update)();
    await renderAllMessage();
    eventOn(tavern_events.CHAT_CHANGED, errorCatched(renderAllMessage));
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, errorCatched(renderOneMessage));
    eventOn(tavern_events.MESSAGE_UPDATED, errorCatched(renderOneMessage));
    eventOn(tavern_events.MESSAGE_SWIPED, errorCatched(renderOneMessage));
    eventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(errorCatched(renderAllMessage), 1000));
    eventOn(tavern_events.WORLDINFO_UPDATED, errorCatched(async (lorebook) => {
        if (lorebook !== lorebook_name) {
            return;
        }
        if (!(await option_section.update()) && !(await render_section.update())) {
            return;
        }
        await renderAllMessage();
    }));
});
function promoteOnce() {
    const contents = $('.mes[is_user="false"][is_system="false"]')
        .last()
        .find('.roleplay_options_content')
        .map((_index, element) => $(element).text().trim())
        .toArray();
    triggerSlash(`/send ${contents.length === 0 ? '继续推进' : _.sample(contents)} || /trigger`);
}
const promoteOnceDelayed = () => setTimeout(promoteOnce, _.get(getVariables({ type: 'global' }), [lorebook_name, '自动推进发送间隔'], 3000));
let current_loop_times = null;
function LoopOnce() {
    if (current_loop_times === null) {
        return;
    }
    promoteOnceDelayed();
    ++current_loop_times;
    if (current_loop_times === _.get(getVariables({ type: 'global' }), [lorebook_name, '自动推进循环次数'], -1)) {
        StopLoop();
    }
}
function StopLoop() {
    eventRemoveListener(tavern_events.CHARACTER_MESSAGE_RENDERED, LoopOnce);
    current_loop_times = null;
    toastr.success('已停止自动推进', lorebook_name);
}
$(async () => {
    eventOnButton('设置循环次数', async () => {
        const result = Number(await SillyTavern.callGenericPopup(`设置循环次数 (-1 为直到按下 '停止自动推进')`, SillyTavern.POPUP_TYPE.INPUT, _.get(getVariables({ type: 'global' }), [lorebook_name, '自动推进循环次数'], '-1')));
        if (result !== -1 && result <= 0) {
            toastr.error('循环次数要么是 -1, 要么是大于 0 的整数');
            return;
        }
        insertOrAssignVariables({ [lorebook_name]: { 自动推进循环次数: result } }, { type: 'global' });
        if (result === -1) {
            toastr.success('已设置推进次数为 -1, 即直到按下 "停止自动推进" 才会停止', lorebook_name);
        }
        else {
            toastr.success(`已设置推进次数为 ${result} 次`, lorebook_name);
        }
    });
    eventOnButton('设置发送间隔', async () => {
        const result = Number(await SillyTavern.callGenericPopup(`设置发送间隔 (单位: 毫秒)`, SillyTavern.POPUP_TYPE.INPUT, _.get(getVariables({ type: 'global' }), [lorebook_name, '自动推进发送间隔'], '3000')));
        if (result <= 0) {
            toastr.error('发送间隔必须大于 0');
            return;
        }
        insertOrAssignVariables({ [lorebook_name]: { 自动推进发送间隔: result } }, { type: 'global' });
        toastr.success(`已设置发送间隔为 ${result} 毫秒`, lorebook_name);
    });
    eventOnButton('启动自动推进', () => {
        if (current_loop_times !== null) {
            toastr.error('自动推进在之前已开启, 请先停止自动推进');
            return;
        }
        current_loop_times = 0;
        LoopOnce();
        eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, LoopOnce);
        toastr.success('已开启自动推进', lorebook_name);
    });
    eventOnButton('停止自动推进', StopLoop);
});

