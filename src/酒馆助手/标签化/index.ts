import { compare } from 'compare-versions';

export {};

function get_current_preset_name(): string {
  return $('#settings_preset_openai').find(':selected').text();
}

function get_current_global_lorebooks(): string[] {
  return $('#world_info')
    .find(':selected')
    .toArray()
    .map(node => $(node).text());
}

function get_current_connection_profile(): string {
  return $('#connection_profiles').find(':checked').text();
}

function extract_tags_from(name: string): string[] {
  return [...name.matchAll(/【(.*?)】/g)].map(match => match[1].toLowerCase());
}

function extract_control_tags(): string[] {
  return _.sortedUniq(
    _.sortBy([
      ...extract_tags_from(get_current_preset_name()),
      ...get_current_global_lorebooks().flatMap(extract_tags_from),
      ...extract_tags_from(get_current_connection_profile()),
    ]),
  );
}

function check_should_enable(title: string, tags: string[]): boolean {
  return [...title.matchAll(/【(.*?)】/g)]
    .map(match => match[1])
    .some(tag_list =>
      tag_list
        .split('&')
        .map(tag => tag.toLowerCase())
        .every(expected => tags.includes(expected)),
    );
}

async function toggle_tagged_preset_prompts(tags: string[]) {
  const preset = getPreset('in_use');

  const new_preset = structuredClone(preset);
  new_preset.prompts
    .filter(prompt => prompt.name.match(/【.*?】/) !== null)
    .forEach(prompt => {
      prompt.enabled = check_should_enable(prompt.name, tags);
    });

  if (_.isEqual(preset, new_preset)) {
    return;
  }
  await replacePreset('in_use', new_preset);
}

async function toggle_tagged_regexes(tags: string[]) {
  const regexes = getTavernRegexes({ scope: 'all' });

  const new_regexes = structuredClone(regexes);
  new_regexes
    .filter(regex => regex.script_name.match(/【.*?】/) !== null)
    .forEach(regex => {
      regex.enabled = check_should_enable(regex.script_name, tags);
    });

  if (_.isEqual(regexes, new_regexes)) {
    return;
  }
  await replaceTavernRegexes(new_regexes, { scope: 'all' });
}

async function toggle_tagged_scripts_backward(tags: string[]) {
  const scripts = $('#script-settings-content')
    .find('.script-item')
    .filter(function () {
      return (
        $(this)
          .find('.script-item-name')
          .text()
          .match(/【.*?】/) !== null
      );
    })
    .toArray();

  const scripts_to_be_toggled = scripts
    .map(script => {
      const $div = $(script);

      const title = $div.find('.script-item-name').text();
      const should_enabled = check_should_enable(title, tags);

      const $toggle_button = $div.find('.script-toggle');
      const is_enabled = $toggle_button.hasClass('enabled');
      return {
        button: $toggle_button,
        should_toggle: should_enabled !== is_enabled,
      };
    })
    .filter(({ should_toggle }) => should_toggle)
    .map(({ button }) => button);

  for (const script of scripts_to_be_toggled) {
    script.trigger('click');
  }
}

async function toggle_tagged_scripts(tags: string[]) {
  // TODO: 4.0 正式合并后移除 #tavern_helper_new
  const scripts = $('#tavern_helper, #tavern_helper_new')
    .find('[data-script-id]')
    .filter(function () {
      return (
        $(this)
          .children('div')
          .first()
          .text()
          .match(/【.*?】/) !== null
      );
    })
    .toArray();

  const scripts_to_be_toggled = scripts
    .map(script => {
      const $script = $(script);
      const $divs = $script.children('div');

      const title = $divs.first().text();
      const should_enabled = check_should_enable(title, tags);

      const $toggle_button = $divs.last().children('div').first();
      const is_enabled = $toggle_button.hasClass('enabled');
      return {
        button: $toggle_button,
        should_toggle: should_enabled !== is_enabled,
      };
    })
    .filter(({ should_toggle }) => should_toggle)
    .map(({ button }) => button);

  for (const script of scripts_to_be_toggled) {
    script.trigger('click');
  }
}

let version_greater_than_4 = false;
async function toggle_tags(): Promise<void> {
  const tags = extract_control_tags();
  toggle_tagged_preset_prompts(tags);
  toggle_tagged_regexes(tags);
  if (version_greater_than_4) {
    toggle_tagged_scripts(tags);
  } else {
    toggle_tagged_scripts_backward(tags);
  }
}
const toggle_tags_throttled = _.throttle(toggle_tags, 1000, { trailing: false });

$(async () => {
  const version = await getTavernHelperVersion();
  version_greater_than_4 = compare(version, '4.0.0', '>=');
  toggle_tags_throttled();
  eventMakeFirst(tavern_events.SETTINGS_UPDATED, toggle_tags_throttled);
});
