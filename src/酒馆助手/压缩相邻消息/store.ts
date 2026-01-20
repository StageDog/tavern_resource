const OldSettings = z
  .object({
    name: z.string().default('压缩相邻消息'),
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
        user_prefix: z.string().default('[{{user}}]\n'),
        user_suffix: z.string().default('\n[/{{user}}]'),
        assistant_prefix: z.string().default('[剧情]\n'),
        assistant_suffix: z.string().default('\n[/剧情]'),
        system_prefix: z.string().default('[设定]\n'),
        system_suffix: z.string().default('\n[/设定]'),
      })
      .prefault({}),
    stop_string: z.string().default('<|im_end|>').catch('<|im_end|>'),
  })
  .transform(data => {
    return NewSettings.parse({
      name: data.name,
      delimiter: data.seperator,
      stop_string: data.stop_string,
      depth_injection: {
        threshold: 10,
        above: {
          enabled: data.put_system_injection_after_chat_history,
          type: 'exclude',
          placeholder: `{{${data.name}::above_dx}}`,
        },
        below: {
          enabled: data.put_system_injection_after_chat_history,
          type: 'exclude',
          placeholder: `{{${data.name}::below_dx}}`,
        },
      },
      chat_history: data.on_chat_history,
    } satisfies z.infer<typeof NewSettings>);
  });

const NewSettings = z
  .object({
    name: z.string().default('压缩相邻消息'),

    delimiter: z
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

    stop_string: z.string().default('<|im_end|>').catch('<|im_end|>'),

    depth_injection: z
      .object({
        threshold: z.number().int().min(1).default(10).catch(10),
        above: z
          .object({
            enabled: z.boolean().default(false),
            type: z.enum(['exclude', 'placeholder']).default('exclude'),
          })
          .prefault({}),
        below: z
          .object({
            enabled: z.boolean().default(false),
            type: z.enum(['exclude', 'placeholder']).default('exclude'),
          })
          .prefault({}),
      })
      .prefault({}),

    chat_history: z
      .object({
        type: z.enum(['mixin', 'seperate', 'squash']).default('squash'),

        squash_role: z.enum(['user', 'assistant', 'system']).default('assistant'),
        user_prefix: z.string().default('{{user}}:\n'),
        user_suffix: z.string().default(''),
        assistant_prefix: z.string().default('剧情:\n'),
        assistant_suffix: z.string().default(''),
        system_prefix: z.string().default('设定:\n'),
        system_suffix: z.string().default(''),
      })
      .prefault({}),
  })
  .transform(data => ({
    ...data,
    depth_injection: {
      ...data.depth_injection,
      above: {
        ...data.depth_injection.above,
        placeholder: `{{${data.name}::above_dx}}`,
      },
      below: {
        ...data.depth_injection.below,
        placeholder: `{{${data.name}::below_dx}}`,
      },
    },
  }));

export type Settings = z.infer<typeof Settings>;
export const Settings = z.union([OldSettings, NewSettings]);

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watchEffect(() => {
    insertOrAssignVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });

  const useEscapedNewline = (path: string) => {
    return computed({
      get: () => _.get(settings.value, path).replace(/\n/g, '\\n'),
      set: value => _.set(settings.value, path, value.replace(/\\n/g, '\n')),
    });
  };

  return { settings, useEscapedNewline };
});
