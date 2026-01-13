import { loadReadme } from '@util/script';

export {};

const Settings = z.object({
  链接: z.string().default(''),
  延迟: z.number().default(1000),
});
type Settings = z.infer<typeof Settings>;

const variable_option = { type: 'script', script_id: getScriptId() } as const;

function get_settings(): Settings {
  const settings = Settings.parse(getVariables(variable_option));
  insertVariables(settings, variable_option);
  return settings;
}

let css: string;
async function refresh_css() {
  if (!get_settings().链接) {
    return;
  }
  const response = await fetch(get_settings().链接);
  if (!response.ok) {
    toastr.error(`未能从 '${get_settings().链接}' 获取 css 文件, 请确认链接是否有效`, '实时修改css');
    return;
  }

  const new_css = await response.text();
  if (css != new_css) {
    css = new_css;
    $('#customCSS').val(css)[0].dispatchEvent(new Event('input'));
  }
}

let id: number;
$(() => {
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/实时修改css/README.md');
  id = setInterval(refresh_css, get_settings().延迟);
});
$(window).on('pagehide', () => {
  clearInterval(id);
});
