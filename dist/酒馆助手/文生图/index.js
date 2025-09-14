
;// ./src/酒馆助手/文生图/分页.scss?raw
const _raw_namespaceObject = ".text_to_image_swipe{margin:auto;width:50%}.text_to_image_swipe_counter{font-weight:600;filter:drop-shadow(black 2px 4px 6px);cursor:default}";
;// ./src/酒馆助手/文生图/按钮.scss?raw
const src_raw_namespaceObject_0 = ".text_to_image_button{align-items:center;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:2px;border:none;box-shadow:0 4px 6px rgba(99,102,241,.2);color:#fff;cursor:pointer;display:inline-flex;font-size:13px;font-weight:600;gap:8px;outline:none;padding:3px 4px;transition:all .3s ease;white-space:nowrap}";
;// ./src/酒馆助手/文生图/index.ts


async function generate_image(prompt) {
    const result = await triggerSlash(`/sd quiet=true ${prompt}`);
    if (!result) {
        return null;
    }
    return result;
}
function extract_button(message_id, index, prompt) {
    const $div = $(`<div class="text_to_image_button" id="text_to_image-${message_id}-${index}">`);
    $div.append(`<style>${src_raw_namespaceObject_0}</style>`);
    $div.append($(`<button class="text_to_image_button" data="${_.escape(prompt.trim())}">生成图片</button>`).on('click', async function () {
        $(this).text('生成中...');
        const result = await generate_image(prompt);
        if (!result) {
            $(this).text('发生错误, 点击重新生成');
            return;
        }
        const image_data = {
            index,
            image_urls: [result],
        };
        const variables = getVariables({ type: 'message', message_id });
        _.set(variables, ['text_to_image', index], image_data);
        await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });
        $div.replaceWith(extract_swipe(message_id, index, prompt, image_data));
    }));
    return $div;
}
function extract_swipe(message_id, index, prompt, image_data) {
    const $div = $(`<div class="text_to_image_swipe" id="text_to_image-${message_id}-${index}">`);
    $div.append(`<style>${_raw_namespaceObject}</style>`);
    const animation_class = 'fa-fade';
    const reset_image = async () => {
        const variables = getVariables({ type: 'message', message_id });
        if (image_data.image_urls.length === 0) {
            _.unset(variables, ['text_to_image', index]);
        }
        else {
            _.set(variables, ['text_to_image', index], image_data);
        }
        await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });
        if (image_data.image_urls.length === 0) {
            $div.replaceWith(extract_button(message_id, index, prompt));
            return;
        }
        $div.find('.mes_img').attr('src', image_data.image_urls[image_data.index]);
        $div.find('.text_to_image_swipe_counter').text(`${image_data.index + 1}/${image_data.image_urls.length}`);
    };
    const swipe_image = async (direction) => {
        if ($div.hasClass(animation_class)) {
            return;
        }
        if (direction === 'left') {
            image_data.index = image_data.index === 0 ? image_data.image_urls.length - 1 : image_data.index - 1;
        }
        else {
            image_data.index =
                image_data.index === image_data.image_urls.length - 1 ? image_data.image_urls.length : image_data.index + 1;
            if (image_data.index === image_data.image_urls.length) {
                $div.addClass(animation_class);
                let image_url = null;
                image_url = await generate_image(prompt);
                if (!image_url) {
                    image_data.index = image_data.image_urls.length - 1;
                    return;
                }
                image_data.image_urls.push(image_url);
                $div.removeClass(animation_class);
            }
        }
        reset_image();
    };
    const enlarge_image = (src) => {
        if (!src) {
            return;
        }
        const image = $('<img>')
            .addClass('img_enlarged')
            .attr('src', src)
            .on('click', function (event) {
            $(this).toggleClass('zoomed');
            event.stopPropagation();
        });
        const $image_container = $('<div>')
            .addClass('img_enlarged_container')
            .append($('<div>').addClass('img_enlarged_holder').append(image), $('<pre>').append($('<code>')
            .addClass('img_enlarged_title txt')
            .text(prompt)
            .on('click', event => {
            event.stopPropagation();
        })
            .append($('<i>')
            .addClass('fa-solid fa-copy code-copy interactable')
            .attr('title', '复制提示词')
            .on('pointerup', async function () {
            window.parent.navigator.clipboard.writeText(prompt);
            toastr.info(`提示词已复制到剪贴板`);
        }))));
        const popup = new SillyTavern.Popup($image_container[0], SillyTavern.POPUP_TYPE.DISPLAY, '', {
            large: true,
            transparent: true,
        });
        popup.dlg.style.width = 'unset';
        popup.dlg.style.height = 'unset';
        popup.dlg.addEventListener('click', () => {
            popup.completeCancelled();
        });
        popup.show();
        return image;
    };
    $div.append($(`<div class=" mes_img_container img_extra img_swipes">`).append($('<div class="mes_img_controls">').append($(`<div title="放大" class="right_menu_button fa-lg fa-solid fa-magnifying-glass">`).on('click', () => {
        enlarge_image($div.find('.mes_img').attr('src'))?.trigger('click');
    }), $(`<div title="删除" class="right_menu_button fa-lg fa-solid fa-trash-can">`).on('click', async () => {
        const confirm = await SillyTavern.callGenericPopup(`是否要删除本图片? 本操作无法撤销 (删除只影响显示, 图片依旧会保存在 '存档/user/images' 目录下)`, SillyTavern.POPUP_TYPE.CONFIRM, '', { okButton: '删除', cancelButton: '取消' });
        if (!confirm) {
            return;
        }
        image_data.image_urls.splice(image_data.index, 1);
        image_data.index = 0;
        reset_image();
    })), $('<div class="mes_img_swipes">').append($(`<div title="左滑" class="right_menu_button fa-lg fa-solid fa-chevron-left">`).on('click', () => swipe_image('left')), $(`<div class="text_to_image_swipe_counter"></div>`), $(`<div title="右滑" class="right_menu_button fa-lg fa-solid fa-chevron-right">`).on('click', () => swipe_image('right'))), $(`<img class="mes_img">`).on('click', function () {
        enlarge_image($(this).attr('src'));
    })));
    $div.css('text-align', 'center');
    reset_image();
    return $div;
}
function extract_element(message_id, index, prompt) {
    const image_data = _.get(getVariables({ type: 'message', message_id }), ['text_to_image', index]);
    return image_data ? extract_swipe(message_id, index, prompt, image_data) : extract_button(message_id, index, prompt);
}
async function renderOneMessage(message_id) {
    const message = getChatMessages(message_id)[0].message;
    const $elements = [...message.matchAll(/<image_tag>(.*?)<\/image_tag>/gs)].map((match, index) => extract_element(message_id, index, match[1]));
    retrieveDisplayedMessage(message_id)
        .find(`.text_to_image_button, .text_to_image_swipe, pre:contains("<image_tag>")`)
        .each(function (index) {
        $(this).replaceWith($elements[index]);
    });
}
async function renderAllMessage() {
    $('#chat')
        .children(".mes[is_user='false'][is_system='false']")
        .each((_index, node) => {
        renderOneMessage(Number(node.getAttribute('mesid')));
    });
}
$(async () => {
    await errorCatched(renderAllMessage)();
    eventOn(tavern_events.CHAT_CHANGED, errorCatched(renderAllMessage));
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, errorCatched(renderOneMessage));
    eventOn(tavern_events.MESSAGE_UPDATED, errorCatched(renderOneMessage));
    eventOn(tavern_events.MESSAGE_SWIPED, errorCatched(renderOneMessage));
    eventOn(tavern_events.MESSAGE_DELETED, () => setTimeout(errorCatched(renderAllMessage), 1000));
});

