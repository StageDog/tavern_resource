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
  const prompt_anchors = $('#completion_prompt_manager')
    .find('a[title]')
    .filter(function () {
      return (
        $(this)
          .text()
          .match(/【.*?】/) !== null
      );
    })
    .toArray();

  const prompt_identifiers_to_be_toggled = prompt_anchors
    .map(prompt_anchor => {
      const $anchor = $(prompt_anchor);
      const $li = $anchor.closest('li');

      const identifier = $li.attr('data-pm-identifier') as string;

      const should_enable = check_should_enable($anchor.attr('title') as string, tags);
      const is_enabled = $li.find('.prompt-manager-toggle-action').hasClass('fa-toggle-on');

      return { identifier, should_toggle: should_enable !== is_enabled };
    })
    .filter(({ should_toggle }) => should_toggle)
    .map(({ identifier }) => `identifier=${identifier}`);

  if (prompt_identifiers_to_be_toggled.length !== 0) {
    await triggerSlash(`/setpromptentry ${prompt_identifiers_to_be_toggled.join(' ')}`);
  }
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

async function toggle_tagged_scripts(tags: string[]) {
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

      const is_enabled = $div.find('.toggle-script').prop('checked');
      return {
        button: $div.find(`.script-toggle-${is_enabled ? 'on' : 'off'}`),
        should_toggle: should_enabled !== is_enabled,
      };
    })
    .filter(({ should_toggle }) => should_toggle)
    .map(({ button }) => button);

  for (const script of scripts_to_be_toggled) {
    script.trigger('click');
  }
}

async function toggle_tags(): Promise<void> {
  const tags = extract_control_tags();
  toggle_tagged_preset_prompts(tags);
  toggle_tagged_regexes(tags);
  toggle_tagged_scripts(tags);
}
const toggle_tags_throttled = _.throttle(toggle_tags, 1000, { trailing: false });

$(() => {
  toggle_tags_throttled();
  eventMakeFirst(tavern_events.SETTINGS_UPDATED, toggle_tags_throttled);
});
