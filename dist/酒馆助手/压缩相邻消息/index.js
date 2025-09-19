import { compare } from "https://testingcf.jsdelivr.net/npm/compare-versions/+esm";
import { createPinia, defineStore, storeToRefs } from "https://testingcf.jsdelivr.net/npm/pinia/+esm";

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

;// external "https://testingcf.jsdelivr.net/npm/pinia/+esm"

;// external "Vue"
const external_Vue_namespaceObject = Vue;
;// ./src/酒馆助手/压缩相邻消息/type.ts
const Settings = z.object({
    seperator: z
        .object({
        type: z.enum(['space', 'newline', 'double newline', 'custom']).default('double newline'),
        value: z.string().default('\n\n'),
    })
        .prefault({})
        .transform(data => {
        switch (data.type) {
            case 'space':
                data.value = ' ';
                break;
            case 'newline':
                data.value = '\n';
                break;
            case 'double newline':
                data.value = '\n\n';
                break;
            case 'custom':
                break;
        }
        return data;
    }),
    put_system_injection_after_chat_history: z.boolean().default(false),
    on_chat_history: z
        .object({
        type: z.enum(['mixin', 'seperate', 'squash']).default('squash'),
        squash_role: z.enum(['user', 'assistant', 'system']).default('assistant'),
        user_prefix: z.string().default('{{user}}: '),
        user_suffix: z.string().default(''),
        assistant_prefix: z.string().default('剧情: '),
        assistant_suffix: z.string().default(''),
        system_prefix: z.string().default(''),
        system_suffix: z.string().default(''),
    })
        .prefault({}),
});

;// ./src/酒馆助手/压缩相邻消息/settings.ts



const use_settings_store = defineStore('settings', () => {
    const settings = (0,external_Vue_namespaceObject.ref)(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));
    (0,external_Vue_namespaceObject.watchEffect)(() => {
        insertOrAssignVariables(_.cloneDeep(settings.value), { type: 'script', script_id: getScriptId() });
    });
    return {
        settings,
    };
});

;// ./node_modules/.pnpm/ts-loader@9.5.4_typescript@6.0.0-dev.20250807_webpack@5.101.3/node_modules/ts-loader/index.js??clonedRuleSet-424!./node_modules/.pnpm/vue-loader@17.4.2_vue@3.5.21_typescript@6.0.0-dev.20250807__webpack@5.101.3/node_modules/vue-loader/dist/index.js??ruleSet[1].rules[4].use[0]!./src/酒馆助手/压缩相邻消息/panel.vue?vue&type=script&setup=true&lang=ts


const _hoisted_1 = { class: "inline-drawer" };
const _hoisted_2 = { class: "inline-drawer-content" };
const _hoisted_3 = { class: "flex-container flexFlowColumn" };
const _hoisted_4 = {
    key: 0,
    class: "flex-container flexFlowColumn"
};
const _hoisted_5 = { class: "flex-container flexFlowColumn" };
const _hoisted_6 = {
    class: "checkbox_label",
    for: "put_system_injection_after_chat_history"
};
const _hoisted_7 = { class: "flex-container flexFlowColumn" };
const _hoisted_8 = {
    key: 1,
    class: "flex-container flexFlowColumn"
};
const _hoisted_9 = { key: 2 };
const _hoisted_10 = {
    class: "flex-container flexFlowColumn",
    title: "用户消息前缀"
};
const _hoisted_11 = {
    class: "flex-container flexFlowColumn",
    title: "用户消息后缀"
};
const _hoisted_12 = {
    class: "flex-container flexFlowColumn",
    title: "助手消息前缀"
};
const _hoisted_13 = {
    class: "flex-container flexFlowColumn",
    title: "助手消息后缀"
};
const _hoisted_14 = {
    class: "flex-container flexFlowColumn",
    title: "系统消息前缀"
};
const _hoisted_15 = {
    class: "flex-container flexFlowColumn",
    title: "系统消息后缀"
};


/* harmony default export */ const panelvue_type_script_setup_true_lang_ts = (/*@__PURE__*/(0,external_Vue_namespaceObject.defineComponent)({
    __name: 'panel',
    setup(__props) {
        const { settings } = storeToRefs(use_settings_store());
        function showHelp() {
            SillyTavern.callGenericPopup(`<p>按照<a href="https://discord.com/channels/1134557553011998840/1413538722078785576">一些预设作者和角色卡作者的说法</a>, Gemini 和 Claude 不同, 不必将条目插入聊天记录中</p>
     <p>勾选这个选项会将注入到聊天深度的系统消息按照原有顺序移动到聊天记录的末尾 (即 D0), 而不是保持在原来的深度位置. 确保系统消息不会干扰聊天记录的连续性.</p>
     <p>这个选项很需要角色卡适配, 如果角色详情放在了深度条目, 则勾选这个选项容易使角色固化</p>`, SillyTavern.POPUP_TYPE.TEXT, '', { leftAlign: true });
        }
        return (_ctx, _cache) => {
            return ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", _hoisted_1, [
                _cache[27] || (_cache[27] = (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "inline-drawer-toggle inline-drawer-header" }, [
                    (0,external_Vue_namespaceObject.createElementVNode)("b", null, "压缩相邻消息"),
                    (0,external_Vue_namespaceObject.createElementVNode)("div", { class: "inline-drawer-icon fa-solid fa-circle-chevron-down down" })
                ], -1 /* CACHED */)),
                (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_2, [
                    (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_3, [
                        _cache[12] || (_cache[12] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "squash_separator_type" }, "消息分隔符", -1 /* CACHED */)),
                        (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("select", {
                            id: "squash_separator_type",
                            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).seperator.type) = $event)),
                            class: "text_pole"
                        }, [...(_cache[11] || (_cache[11] = [
                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "space" }, "空格", -1 /* CACHED */),
                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "newline" }, "换行", -1 /* CACHED */),
                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "double newline" }, "双换行", -1 /* CACHED */),
                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "custom" }, "自定义", -1 /* CACHED */)
                            ]))], 512 /* NEED_PATCH */), [
                            [external_Vue_namespaceObject.vModelSelect, (0,external_Vue_namespaceObject.unref)(settings).seperator.type]
                        ])
                    ]),
                    ((0,external_Vue_namespaceObject.unref)(settings).seperator.type === 'custom')
                        ? ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", _hoisted_4, [
                            _cache[13] || (_cache[13] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "squash_separator_value" }, "自定义分隔符", -1 /* CACHED */)),
                            (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                id: "squash_separator_value",
                                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).seperator.value) = $event)),
                                class: "text_pole flex1 wide100p",
                                type: "text",
                                autocomplete: "off"
                            }, null, 512 /* NEED_PATCH */), [
                                [external_Vue_namespaceObject.vModelText, (0,external_Vue_namespaceObject.unref)(settings).seperator.value]
                            ])
                        ]))
                        : (0,external_Vue_namespaceObject.createCommentVNode)("v-if", true),
                    _cache[25] || (_cache[25] = (0,external_Vue_namespaceObject.createElementVNode)("hr", null, null, -1 /* CACHED */)),
                    (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_5, [
                        (0,external_Vue_namespaceObject.createElementVNode)("label", _hoisted_6, [
                            _cache[14] || (_cache[14] = (0,external_Vue_namespaceObject.createElementVNode)("span", null, "将 D⚙ (系统深度条目) 按序移到聊天记录后", -1 /* CACHED */)),
                            (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                id: "put_system_injection_after_chat_history",
                                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).put_system_injection_after_chat_history) = $event)),
                                type: "checkbox"
                            }, null, 512 /* NEED_PATCH */), [
                                [external_Vue_namespaceObject.vModelCheckbox, (0,external_Vue_namespaceObject.unref)(settings).put_system_injection_after_chat_history]
                            ]),
                            (0,external_Vue_namespaceObject.createElementVNode)("i", {
                                class: "fa-solid fa-circle-question fa-sm note-link-span",
                                style: { "cursor": "pointer" },
                                title: "将注入到聊天深度的系统消息按照原有顺序移动到聊天记录的末尾，而不是保持在原来的深度位置。这可以确保系统消息不会干扰聊天记录的连续性。",
                                onClick: showHelp
                            })
                        ])
                    ]),
                    _cache[26] || (_cache[26] = (0,external_Vue_namespaceObject.createElementVNode)("hr", null, null, -1 /* CACHED */)),
                    (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_7, [
                        _cache[16] || (_cache[16] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "squash_chat_history_type" }, "聊天历史处理方式", -1 /* CACHED */)),
                        (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("select", {
                            id: "squash_chat_history_type",
                            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.type) = $event)),
                            class: "text_pole"
                        }, [...(_cache[15] || (_cache[15] = [
                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "mixin" }, "与其他提示词混合", -1 /* CACHED */),
                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "seperate" }, "与其他提示词隔离", -1 /* CACHED */),
                                (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "squash" }, "单独压缩为一条消息", -1 /* CACHED */)
                            ]))], 512 /* NEED_PATCH */), [
                            [external_Vue_namespaceObject.vModelSelect, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.type]
                        ])
                    ]),
                    ((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.type === 'squash')
                        ? ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", _hoisted_8, [
                            _cache[18] || (_cache[18] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "squash_role" }, "压缩角色", -1 /* CACHED */)),
                            (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("select", {
                                id: "squash_role",
                                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.squash_role) = $event)),
                                class: "text_pole"
                            }, [...(_cache[17] || (_cache[17] = [
                                    (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "system" }, "系统", -1 /* CACHED */),
                                    (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "user" }, "用户", -1 /* CACHED */),
                                    (0,external_Vue_namespaceObject.createElementVNode)("option", { value: "assistant" }, "助手", -1 /* CACHED */)
                                ]))], 512 /* NEED_PATCH */), [
                                [external_Vue_namespaceObject.vModelSelect, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.squash_role]
                            ])
                        ]))
                        : (0,external_Vue_namespaceObject.createCommentVNode)("v-if", true),
                    ((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.type === 'squash')
                        ? ((0,external_Vue_namespaceObject.openBlock)(), (0,external_Vue_namespaceObject.createElementBlock)("div", _hoisted_9, [
                            (0,external_Vue_namespaceObject.createCommentVNode)(" 用户前缀后缀 "),
                            (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_10, [
                                _cache[19] || (_cache[19] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "user_prefix" }, "用户前缀", -1 /* CACHED */)),
                                (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                    id: "user_prefix",
                                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.user_prefix) = $event)),
                                    class: "text_pole flex1 wide100p",
                                    type: "text",
                                    autocomplete: "off"
                                }, null, 512 /* NEED_PATCH */), [
                                    [external_Vue_namespaceObject.vModelText, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.user_prefix]
                                ])
                            ]),
                            (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_11, [
                                _cache[20] || (_cache[20] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "user_suffix" }, "用户后缀", -1 /* CACHED */)),
                                (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                    id: "user_suffix",
                                    "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.user_suffix) = $event)),
                                    class: "text_pole flex1 wide100p",
                                    type: "text",
                                    autocomplete: "off"
                                }, null, 512 /* NEED_PATCH */), [
                                    [external_Vue_namespaceObject.vModelText, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.user_suffix]
                                ])
                            ]),
                            (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_12, [
                                _cache[21] || (_cache[21] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "assistant_prefix" }, "助手前缀", -1 /* CACHED */)),
                                (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                    id: "assistant_prefix",
                                    "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.assistant_prefix) = $event)),
                                    class: "text_pole flex1 wide100p",
                                    type: "text",
                                    autocomplete: "off"
                                }, null, 512 /* NEED_PATCH */), [
                                    [external_Vue_namespaceObject.vModelText, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.assistant_prefix]
                                ])
                            ]),
                            (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_13, [
                                _cache[22] || (_cache[22] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "assistant_suffix" }, "助手后缀", -1 /* CACHED */)),
                                (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                    id: "assistant_suffix",
                                    "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.assistant_suffix) = $event)),
                                    class: "text_pole flex1 wide100p",
                                    type: "text",
                                    autocomplete: "off"
                                }, null, 512 /* NEED_PATCH */), [
                                    [external_Vue_namespaceObject.vModelText, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.assistant_suffix]
                                ])
                            ]),
                            (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_14, [
                                _cache[23] || (_cache[23] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "system_prefix" }, "系统前缀", -1 /* CACHED */)),
                                (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                    id: "system_prefix",
                                    "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.system_prefix) = $event)),
                                    class: "text_pole flex1 wide100p",
                                    type: "text",
                                    autocomplete: "off"
                                }, null, 512 /* NEED_PATCH */), [
                                    [external_Vue_namespaceObject.vModelText, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.system_prefix]
                                ])
                            ]),
                            (0,external_Vue_namespaceObject.createElementVNode)("div", _hoisted_15, [
                                _cache[24] || (_cache[24] = (0,external_Vue_namespaceObject.createElementVNode)("label", { for: "system_suffix" }, "系统后缀", -1 /* CACHED */)),
                                (0,external_Vue_namespaceObject.withDirectives)((0,external_Vue_namespaceObject.createElementVNode)("input", {
                                    id: "system_suffix",
                                    "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => (((0,external_Vue_namespaceObject.unref)(settings).on_chat_history.system_suffix) = $event)),
                                    class: "text_pole flex1 wide100p",
                                    type: "text",
                                    autocomplete: "off"
                                }, null, 512 /* NEED_PATCH */), [
                                    [external_Vue_namespaceObject.vModelText, (0,external_Vue_namespaceObject.unref)(settings).on_chat_history.system_suffix]
                                ])
                            ])
                        ]))
                        : (0,external_Vue_namespaceObject.createCommentVNode)("v-if", true)
                ])
            ]));
        };
    }
}));

;// ./src/酒馆助手/压缩相邻消息/panel.vue?vue&type=script&setup=true&lang=ts
 
;// ./src/酒馆助手/压缩相邻消息/panel.vue



const __exports__ = panelvue_type_script_setup_true_lang_ts;

/* harmony default export */ const panel = (__exports__);
;// ./src/酒馆助手/压缩相邻消息/panel.ts




const app = (0,external_Vue_namespaceObject.createApp)(panel);
function init_panel() {
    teleport_style();
    const $app = $('<div>').attr('script_id', getScriptId());
    $('#extensions_settings2').append($app);
    app.use(createPinia()).mount($app[0]);
}
function destroy_panel() {
    app.unmount();
    $(`#extensions_settings2 > div[script_id="${getScriptId()}"]`).remove();
    deteleport_style();
}

;// ./src/酒馆助手/压缩相邻消息/squash.ts

//----------------------------------------------------------------------------------------------------------------------
const head_separator = '{【{【聊天记录开头】}】}';
const tail_separator = '{【{【聊天记录结尾】}】}';
const seperators = [
    {
        id: '\0压缩相邻消息',
        position: 'in_chat',
        depth: 9999,
        role: 'assistant',
        content: head_separator,
    },
    {
        id: '\xff压缩相邻消息',
        position: 'in_chat',
        depth: 0,
        role: 'system',
        content: tail_separator,
    },
];
function inject_seperators() {
    eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dry_run) => {
        if (dry_run) {
            return;
        }
        injectPrompts(seperators);
    });
}
function uninject_seperators() {
    uninjectPrompts(seperators.map(({ id }) => id));
}
//----------------------------------------------------------------------------------------------------------------------
function seperate_prompts(prompts) {
    const head_index = prompts.findIndex(({ content }) => content.includes(head_separator));
    const tail_index = prompts.findIndex(({ content }) => content.includes(tail_separator));
    if (head_index === -1 || tail_index === -1) {
        return null;
    }
    const [before_head_prompt_content, after_head_prompt_content] = prompts[head_index].content.split(head_separator);
    const [before_tail_prompt_content, after_tail_prompt_content] = prompts[tail_index].content.split(tail_separator);
    return [
        [...prompts.slice(0, head_index), { role: prompts[head_index].role, content: before_head_prompt_content }],
        [
            { role: prompts[head_index].role, content: after_head_prompt_content },
            ...prompts.slice(head_index + 1, tail_index),
            { role: prompts[tail_index].role, content: before_tail_prompt_content },
        ],
        [{ role: prompts[tail_index].role, content: after_tail_prompt_content }, ...prompts.slice(tail_index + 1)],
    ];
}
function reject_empty_prompts(prompts) {
    return prompts.filter(({ content }) => content.trim() !== '');
}
function squash_messages_by_role(prompts, settings) {
    return chunk_by(prompts, (lhs, rhs) => lhs.role === rhs.role).map(chunk => ({
        role: chunk[0].role,
        content: chunk.map(({ content }) => content.trim()).join(settings.seperator.value),
    }));
}
function squash_chat_history(prompts, settings) {
    // TODO: zod encode
    const system_prefix = substitudeMacros(settings.on_chat_history.system_prefix);
    const system_suffix = substitudeMacros(settings.on_chat_history.system_suffix);
    const assistant_prefix = substitudeMacros(settings.on_chat_history.assistant_prefix);
    const assistant_suffix = substitudeMacros(settings.on_chat_history.assistant_suffix);
    const user_prefix = substitudeMacros(settings.on_chat_history.user_prefix);
    const user_suffix = substitudeMacros(settings.on_chat_history.user_suffix);
    return {
        role: settings.on_chat_history.squash_role,
        content: prompts
            .map(({ role, content }) => {
            switch (role) {
                case 'system':
                    return system_prefix + content.trim() + system_suffix;
                case 'assistant':
                    return assistant_prefix + content.trim() + assistant_suffix;
                case 'user':
                    return user_prefix + content.trim() + user_suffix;
            }
        })
            .join(settings.seperator.value),
    };
}
function listen_event(settings) {
    let is_dry_run = false;
    eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dry_run) => {
        is_dry_run = dry_run;
    });
    eventMakeLast(tavern_events.GENERATE_AFTER_DATA, ({ prompt }) => {
        if (is_dry_run) {
            return;
        }
        const chunks = seperate_prompts(prompt);
        if (chunks === null) {
            return;
        }
        if (settings.put_system_injection_after_chat_history) {
            chunks[2] = _.concat(_.remove(chunks[1], ({ role }) => role === 'system'), chunks[2]);
        }
        const [head, chat_history, tail] = _(chunks)
            .map(prompts => reject_empty_prompts(prompts))
            .map(prompts => squash_messages_by_role(prompts, settings))
            .value();
        switch (settings.on_chat_history.type) {
            case 'mixin':
                assign_inplace(prompt, squash_messages_by_role(_.concat(head, chat_history, tail), settings));
                break;
            case 'seperate':
                assign_inplace(prompt, _.concat(head, chat_history, tail));
                break;
            case 'squash':
                assign_inplace(prompt, _.concat(head, squash_chat_history(chat_history, settings), tail));
                break;
        }
    });
}
//----------------------------------------------------------------------------------------------------------------------
function init_squash(settings) {
    inject_seperators();
    listen_event(settings);
}
function destory_squash() {
    uninject_seperators();
}

;// ./src/酒馆助手/压缩相邻消息/index.ts




$(() => {
    check_minimum_version('3.4.17', '压缩相邻消息');
    load_readme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/压缩相邻消息/README.md');
    init_panel();
    init_squash(use_settings_store().settings);
});
$(window).on('pagehide', () => {
    destroy_panel();
    destory_squash();
});

