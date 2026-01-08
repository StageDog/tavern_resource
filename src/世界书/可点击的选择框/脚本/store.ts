import { LOREBOOK_NAME } from './constant';
import default_css from './络络扁平化暗色紧凑列表.scss?raw';

const Config = z.object({
  输入方式: z.enum(['直接发送', '覆盖输入', '尾附输入']).prefault('直接发送'),
  样式: z.string().prefault(default_css),
});
type Config = z.infer<typeof Config>;

export const useConfigStore = defineStore(
  'config',
  errorCatched(() => {
    const config = ref<Config>(Config.parse({}));

    const reloadConfig = async () => {
      const worldbook = await getWorldbook(LOREBOOK_NAME);
      const old_confg = config.value;
      config.value = Config.parse({
        输入方式: _(worldbook)
          .filter(entry => entry.enabled && entry.name.startsWith('设置-'))
          .map(entry => entry.name.replace('设置-', ''))
          .first(),
        样式: _(worldbook)
          .filter(entry => entry.enabled && entry.name.startsWith('样式-'))
          .map(entry => entry.content.replace('<style>', '').replace('</style>', ''))
          .first(),
      });
      return !_.isEqual(config, old_confg);
    };
    const _wait_init = reloadConfig();
    eventOn(
      tavern_events.WORLDINFO_UPDATED,
      errorCatched(async lorebook => {
        if (lorebook === LOREBOOK_NAME) {
          await reloadConfig();
        }
      }),
    );

    return { config: readonly(config), _wait_init };
  }),
);
