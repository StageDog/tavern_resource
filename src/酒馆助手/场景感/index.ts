// @obfuscate
import 写作风格 from '../../../../private/酒馆助手/场景感/写作风格.yaml';
import 媒体 from '../../../../private/酒馆助手/场景感/媒体.yaml';

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
          ...媒体,
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
      ...写作风格,
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
