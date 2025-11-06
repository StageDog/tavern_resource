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
  const response = await fetch(get_settings().链接);
  if (!response.ok) {
    toastr.error(get_settings().链接);
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
  id = setInterval(refresh_css, get_settings().延迟);
});
$(window).on('pagehide', () => {
  clearInterval(id);
});
