export {};

import default_css from './络络扁平化暗色紧凑列表.scss?raw';

const lorebook_name = '酒馆助手编写示例' as const;
const roleplay_options_tag = '<roleplay_options>' as const;
const roleplay_options_regex = /```\S*\s*<roleplay_options>(.*)<\/roleplay_options>\s*```/is;

//----------------------------------------------------------------------------------------------------------------------
namespace option_section {
  interface Option {
    input_mode: '直接发送' | '覆盖输入' | '尾附输入' | '自动推进';
  }
  const default_option: Option = {
    input_mode: '直接发送',
  };

  export let option: Option;

  async function parse_option(): Promise<Option> {
    const options: Record<string, string> = _.merge(
      {},
      ...(await getLorebookEntries(lorebook_name))
        .filter(entry => entry.comment.startsWith('设置-') && entry.enabled)
        .map(entry => {
          const value = entry.comment.replace('设置-', '');
          return { [value]: entry.content };
        }),
    );

    const result = default_option;
    if (_.has(options, '直接发送')) {
      result.input_mode = '直接发送';
    } else if (_.has(options, '覆盖输入')) {
      result.input_mode = '覆盖输入';
    } else if (_.has(options, '尾附输入')) {
      result.input_mode = '尾附输入';
    }
    return result;
  }

  export async function update(): Promise<boolean> {
    const old_option = option;
    option = await parse_option();
    return !_.isEqual(option, old_option);
  }
}

//----------------------------------------------------------------------------------------------------------------------
namespace render_section {
  async function divclick($element: JQuery<HTMLDivElement>) {
    if ($element.parents('.last_mes').length > 0) {
      const content = $element.find('.roleplay_options_content').text().trim();
      if (option_section.option.input_mode === '直接发送') {
        triggerSlash(`/send ${content} || /trigger`);
      } else if (option_section.option.input_mode === '覆盖输入') {
        triggerSlash(`/setinput ${content}`);
      } else if (option_section.option.input_mode === '尾附输入') {
        const old_content = $('#send_textarea').val();
        $('#send_textarea')
          .val([old_content, content].join('\n') || '')[0]
          .dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  let style: string;

  async function extract_style(): Promise<string> {
    const entries = (await getLorebookEntries(lorebook_name)).filter(
      entry => entry.comment.startsWith('样式-') && entry.enabled,
    );
    if (entries.length === 0) {
      return `<style>${default_css}</style>`;
    }
    return entries[0].content;
  }

  export async function update(): Promise<boolean> {
    const old_style = style;
    style = await extract_style();
    return !_.isEqual(style, old_style);
  }

  export function extract_roleplay_options_element(text: string): JQuery<HTMLDivElement> {
    const $div = $('<div class="roleplay_options">') as JQuery<HTMLDivElement>;
    $div.append(style);
    $div.append(
      ($('<div class="roleplay_options_back">') as JQuery<HTMLDivElement>).append(
        [...text.matchAll(/(.+?)[:：]\s*(.+)/gm)]
          .map(match => ({
            title: match[1],
            content: match[2].replace(/^\$\{(.+)\}$/, '$1').replace(/^「(.+)」$/, '$1'),
          }))
          .map(({ title, content }) =>
            $('<div class="roleplay_options_item" tabindex="1">')
              .on('click', function (this: HTMLDivElement) {
                divclick($(this));
              })
              .append(`<span class="roleplay_options_title"><strong>${title}</strong></span>`)
              .append('<hr class="roleplay_options_hr">')
              .append(`<span class="roleplay_options_content">${content}</span>`),
          ),
      ),
    );
    return $div;
  }
}

//----------------------------------------------------------------------------------------------------------------------
async function renderOneMessage(message_id: number) {
  const message: string = getChatMessages(message_id)[0].message;
  const match = message.match(roleplay_options_regex);
  if (!match) {
    return;
  }
  const $roleplay_options_element = render_section.extract_roleplay_options_element(match[1]);

  const $mes_text = retrieveDisplayedMessage(message_id);
  const to_render = $mes_text.find(`.roleplay_options, pre:contains("${roleplay_options_tag}")`);
  if (to_render.length > 0) {
    to_render.remove();
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
  eventOn(
    tavern_events.WORLDINFO_UPDATED,
    errorCatched(async lorebook => {
      if (lorebook !== lorebook_name) {
        return;
      }
      if (!(await option_section.update()) && !(await render_section.update())) {
        return;
      }
      await renderAllMessage();
    }),
  );
});

function promoteOnce() {
  const contents = $('.mes[is_user="false"][is_system="false"]')
    .last()
    .find('.roleplay_options_content')
    .map((_index, element) => $(element).text().trim())
    .toArray();
  triggerSlash(`/send ${contents.length === 0 ? '继续推进' : _.sample(contents)} || /trigger`);
}
const promoteOnceDelayed = () =>
  setTimeout(promoteOnce, _.get(getVariables({ type: 'global' }), [lorebook_name, '自动推进发送间隔'], 3000));

let current_loop_times: number | null = null;
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
    const result = Number(
      await SillyTavern.callGenericPopup(
        `设置循环次数 (-1 为直到按下 '停止自动推进')`,
        SillyTavern.POPUP_TYPE.INPUT,
        _.get(getVariables({ type: 'global' }), [lorebook_name, '自动推进循环次数'], '-1'),
      ),
    );
    if (result !== -1 && result <= 0) {
      toastr.error('循环次数要么是 -1, 要么是大于 0 的整数');
      return;
    }
    insertOrAssignVariables({ [lorebook_name]: { 自动推进循环次数: result } }, { type: 'global' });
    if (result === -1) {
      toastr.success('已设置推进次数为 -1, 即直到按下 "停止自动推进" 才会停止', lorebook_name);
    } else {
      toastr.success(`已设置推进次数为 ${result} 次`, lorebook_name);
    }
  });

  eventOnButton('设置发送间隔', async () => {
    const result = Number(
      await SillyTavern.callGenericPopup(
        `设置发送间隔 (单位: 毫秒)`,
        SillyTavern.POPUP_TYPE.INPUT,
        _.get(getVariables({ type: 'global' }), [lorebook_name, '自动推进发送间隔'], '3000'),
      ),
    );
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
