export type Settings = z.infer<typeof Settings>;
export const Settings = z.object({
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
