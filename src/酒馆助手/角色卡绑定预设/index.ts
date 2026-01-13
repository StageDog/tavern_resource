import { loadReadme } from '@util/script';

const Settings = z.object({
  要绑定的预设名称: z.string().default(() => getLoadedPresetName()),
});

$(() => {
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/角色卡绑定预设/README.md');
  const settings = Settings.parse(getVariables({ type: 'script' }));
  insertOrAssignVariables(settings, { type: 'script' });
  loadPreset(settings.要绑定的预设名称);
});
