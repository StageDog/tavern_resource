$(() => {
  appendInexistentScriptButtons([
    { name: '推进', visible: true },
    { name: '切换视角推进', visible: true },
    { name: '完结', visible: true },
    { name: '后日谈', visible: true },
  ]);

  eventOn(getButtonEvent('推进'), async () => {
    await createChatMessages([{ role: 'user', message: '延续当前剧情' }]);
    await triggerSlash('/trigger');
  });

  eventOn(getButtonEvent('切换视角推进'), async () => {
    const get_and_invoke = async (
      data: Record<string, string | (() => string | undefined) | (() => Promise<string | undefined>)>,
      path: string | undefined,
    ): Promise<string | undefined> => {
      if (!path) {
        return undefined;
      }
      const result = _.get(data, path, undefined);
      if (typeof result === 'function') {
        return await result();
      }
      return result;
    };

    const query_prompt_from_buttons = async (
      prompt: string,
      options: Record<string, string | (() => string | undefined) | (() => Promise<string | undefined>)>,
    ) => {
      return await get_and_invoke(
        options,
        (await triggerSlash(`/buttons labels=${JSON.stringify(Object.keys(options))} ${prompt}`)) as string,
      );
    };

    const view = await query_prompt_from_buttons('请选择视角', {
      自定义视角: async () => {
        const result = (await SillyTavern.callGenericPopup(
          '接下来一条消息将会以哪些人或社交媒体（如贴吧、论坛、直播平台）的视角进行?',
          SillyTavern.POPUP_TYPE.INPUT,
          '',
          { rows: 4 },
        )) as string;
        if (!result) {
          toastr.error('请填写要采用的视角', '场景感');
          return undefined;
        }
        return `以${result}的视角`;
      },
      随机人物: '与当前剧情末尾不同的人物',
      选择媒体: async () => {
        const options = {
          正常: '',
          随机: () => {
            return get_and_invoke(options, _.sample(Object.keys(options)));
          },
          正经严肃:
            '以正经严肃（以客观中立的态度讨论各类话题，重视事实依据，避免戏谑和轻浮，展现出专业和权威的氛围）类型社交媒体的视角',
          二次元: '以二次元（热衷于发布动漫内容，使用动漫术语、颜文字和表情包）类型社交媒体的视角',
          阴阳怪气: '以阴阳怪气（说话拐弯抹角，充满暗示和影射，阴阳怪气地嘲讽他人）类型社交媒体的视角',
          荒诞搞笑: '以荒诞搞笑（大胆颠覆现实逻辑，充满黑色幽默和荒诞元素，以离奇的展开和疯狂的逻辑引发笑声）类型社交媒体的视角',
          色情淫靡:
            '以色情淫靡（将女性视为泄欲工具，口不遮掩地说肉便器、鸡吧套子等淫语，对女性进行意淫和侮辱，并幻想女性和{{user}}的关系）类型社交媒体的视角',
          痴女发癫:
            '以痴女发癫（都是爱慕{{user}}的痴女，互相之间帮助或雌竞争吵，毫不掩饰地表达对{{user}}各种想法（包括变态、淫乱的想法），最终目的是攻略{{user}}，必须有主要角色在上面偷偷发言）类型社交媒体的视角',
        } as const;

        return get_and_invoke(
          options,
          (await triggerSlash(`/buttons labels=${JSON.stringify(Object.keys(options))} 请选择媒体类型`)) as string,
        );
      },
    });
    if (view === undefined) {
      return;
    }

    const plot = await query_prompt_from_buttons('请选择推进方式', {
      自定义剧情: async () => {
        const result = (await SillyTavern.callGenericPopup('具体会发生什么?', SillyTavern.POPUP_TYPE.INPUT, '', {
          rows: 4,
        })) as string;
        if (!result) {
          toastr.error('请填写要指定的剧情', '场景感');
        }
        return result;
      },
      推进: '延续当前剧情',
      与此同时: '回到上一段剧情的开头，根据前文的内容，于下一个响应从另一个视角重新描述故事情节',
    });
    if (plot === undefined) {
      return;
    }

    const writting_style_options = {
      正常: '',
      随机: async () => {
        return get_and_invoke(writting_style_options, _.sample(Object.keys(writting_style_options)));
      },
      真实心理: '应用真实心理（不隐瞒角色内心真实想法，包括各种丑恶、阴暗、变态的想法）的描写风格',
      极致感官: '应用极致感官（描写感官体验时要极尽细腻,包括视觉、听觉、嗅觉、味觉、触觉等全方位感受）的描写风格',
      原始本能: '应用原始本能（展现角色最原始的生理反应和冲动，不加掩饰，也不遮掩角色的特殊性癖和变态倾向）的描写风格',
      淫乱幻想: '应用淫乱幻想（展现女性角色内心的淫靡幻想，从充满欲望的视角观察和幻想{{user}}）的描写风格',
    };
    const writting_style = await query_prompt_from_buttons('请选择描写风格', writting_style_options);
    if (writting_style === undefined) {
      return;
    }

    await createChatMessages([
      {
        role: 'user',
        message: _([view, plot, writting_style])
          .filter(string => !!string)
          .join('\n'),
      },
    ]);
    await triggerSlash('/trigger');
  });

  eventOn(getButtonEvent('完结'), async () => {
    const result = (await SillyTavern.callGenericPopup('故事将如何完结?', SillyTavern.POPUP_TYPE.INPUT, '', {
      rows: 4,
    })) as string;
    if (!result) {
      return;
    }
    await createChatMessages([
      {
        role: 'user',
        message:
          '<Request:本故事就此完结。请以第三人称结束这个故事，不要再留下悬念或转折，但可以以欧亨利风格结尾，让读者意犹未尽>' +
          result,
      },
    ]);
    await triggerSlash('/trigger');
  });

  eventOn(getButtonEvent('后日谈'), async () => {
    const result = (await SillyTavern.callGenericPopup(
      '该后日谈的标题或详细剧情是?',
      SillyTavern.POPUP_TYPE.INPUT,
      '',
      { rows: 4 },
    )) as string;
    if (!result) {
      return;
    }
    await createChatMessages([
      {
        role: 'user',
        message:
          '<Request:本故事是之前所有故事（包括完结和之前已有的后日谈）的后日谈。你应该依据下面给出的后日谈标题或详细剧情，以第三人称直接叙述一个完整的故事，不要再留下悬念或转折，但可以以欧亨利风格结尾，让读者意犹未尽>' +
          result,
      },
    ]);
    await triggerSlash('/trigger');
  });
});
