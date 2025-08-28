type Settings = z.infer<typeof Settings>;
const Settings = z.object({
  seperator: z
    .object({
      type: z.enum(['space', 'newline', 'double newline', 'custom']).default('double newline'),
      value: z.string().default('\n\n'),
    })
    .default({
      type: 'double newline',
      value: '\n\n',
    })
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
    .default({
      type: 'squash',

      squash_role: 'assistant',
      user_prefix: '{{user}}: ',
      user_suffix: '',
      assistant_prefix: '剧情: ',
      assistant_suffix: '',
      system_prefix: '',
      system_suffix: '',
    }),
});

let settings: Settings;
export function get_settings(): Settings {
  if (!settings) {
    settings = Settings.parse(getVariables({ type: 'script', script_id: getScriptId() }));
    insertVariables(settings, { type: 'script', script_id: getScriptId() });
  }
  return settings;
}
export function set_settings(new_settings: Settings) {
  settings = new_settings;
  insertOrAssignVariables(settings, { type: 'script', script_id: getScriptId() });
}
