const modes = ['ModeA', 'ModeB', 'ModeO', 'ModeT'];
const take_overs = ['允许AI抢话', '禁止AI抢话'];
async function get_variables() {
    return _.pick(getVariables({ type: 'chat' }), ['mode', 'step']);
}
async function set_variables(variables) {
    await insertOrAssignVariables(variables);
}
//----------------------------------------------------------------------------------------------------------------------
async function get_status() {
    const variables = await get_variables();
    const display = $('<div>');
    display.append($('<p>').text(`当前模式: ${variables.mode ?? '未选择'}`));
    display.append($('<p>').text(`当前步骤: ${variables.step ?? '请先选择模式'}`));
    triggerSlash(`/popup okButton="确认" ${display.html()}`);
}
var detail;
(function (detail) {
    async function choose_mode_impl(chosen_mode, take_over) {
        const char_lorebook = getCurrentCharPrimaryLorebook();
        if (!char_lorebook) {
            triggerSlash('/echo severity=error 未找到 A.U.T.O 世界书, 你是否忘了导入它?');
            return;
        }
        let chat_lorebook = await getOrCreateChatLorebook();
        if ((await getLorebookEntries(chat_lorebook)).length > 0) {
            const confirm_result = await triggerSlash('/popup cancelButton="取消" okButton="确认" result=true 检测到本聊天文件绑定的世界书非空, 你确定要清空它重新选择模式吗?');
            if (confirm_result === '0') {
                return;
            }
        }
        await deleteLorebook(chat_lorebook);
        chat_lorebook = await getOrCreateChatLorebook();
        const entries = _.reject(await getLorebookEntries(char_lorebook), entry => _.reject(modes, mode => mode === chosen_mode).some(mode => entry.comment.includes(mode)));
        await createLorebookEntries(chat_lorebook, entries.map(entry => ({
            ...entry,
            enabled: entry.comment.match(/\D1\D/) ||
                entry.comment.includes('基础概念') ||
                entry.comment.includes(`写卡模式-${take_over}`)
                ? true
                : false,
        })));
        set_variables({ mode: chosen_mode, step: 1 });
        triggerSlash(`/echo severity=success 成功将 '${chosen_mode}' 提取到聊天世界书 '${chat_lorebook}' 中!`);
    }
    detail.choose_mode_impl = choose_mode_impl;
    async function get_step_range(entries) {
        return {
            min: 1,
            max: _.max([
                ...entries
                    .reduce((result, entry) => {
                    return result + entry.comment;
                }, '')
                    .matchAll(/\d+/g),
            ].map(match => Number(match.toString()))),
        };
    }
    async function set_step_by_offset(offset) {
        const variables = await get_variables();
        if (variables.mode == null || variables.step == null) {
            triggerSlash(`/echo severity=error 你必须先选择模式!`);
            return;
        }
        if (variables.mode === 'ModeT') {
            triggerSlash(`/echo severity=error ModeT不支持切换步骤, 请手动开关!`);
            return;
        }
        const lorebook = await getOrCreateChatLorebook();
        const entries = await getLorebookEntries(lorebook);
        const { min, max } = await get_step_range(entries);
        const new_step = variables.step + offset;
        if (new_step < min || new_step > max) {
            triggerSlash(`/echo severity=error 设置的步骤 '${new_step}' 超出了范围 '${min}-${max}'!`);
            return;
        }
        const get_index = (entry) => {
            return Number(entry.comment.match(/(?<=\D)\d+(?=\D)/)[0]);
        };
        entries
            .filter(entry => entry.comment.includes('Step'))
            .forEach(entry => (entry.enabled = get_index(entry) === new_step ? true : false));
        entries
            .filter(entry => entry.comment.includes('Part'))
            .forEach(entry => (entry.enabled = get_index(entry) <= new_step ? true : false));
        setLorebookEntries(lorebook, entries);
        set_variables({ step: new_step });
        triggerSlash(`/echo severity=success 成功将 '${variables.mode}' 设置为步骤 '${new_step}'`);
    }
    detail.set_step_by_offset = set_step_by_offset;
})(detail || (detail = {}));
async function choose_mode() {
    const chosen_mode = await triggerSlash(`/buttons labels=${JSON.stringify(modes)}`);
    const take_over = await triggerSlash(`/buttons labels=${JSON.stringify(take_overs)}`);
    if (chosen_mode && take_over) {
        detail.choose_mode_impl(chosen_mode, take_over);
    }
}
async function decrease_step() {
    await detail.set_step_by_offset(-1);
}
async function increase_step() {
    await detail.set_step_by_offset(1);
}
//----------------------------------------------------------------------------------------------------------------------
$(() => {
    eventOnButton('查看状态', get_status);
    eventOnButton('选择模式', choose_mode);
    eventOnButton('上一步', decrease_step);
    eventOnButton('下一步', increase_step);
});


