import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';

export type Settings = z.infer<typeof Settings>;
export const Settings = z
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
    depth_threshold: z.number().int().min(1).default(10),
    move_system_to_front: z.boolean().default(false),
    move_system_to_back: z.boolean().default(false),
    above_placeholder: z.string().default(''),
    below_placeholder: z.string().default(''),
    put_system_injection_after_chat_history: z.boolean().optional(),
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
    if (data.put_system_injection_after_chat_history === true) {
      data.move_system_to_front = true;
      data.move_system_to_back = true;
    }
    delete data.put_system_injection_after_chat_history;
    return data;
  });

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref(Settings.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watchEffect(() => {
    insertOrAssignVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });

  return { settings };
});
