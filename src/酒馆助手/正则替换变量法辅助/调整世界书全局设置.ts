export {};

async function sync_lorebook_settings() {
  const EXPECTED_SETTINGS: Partial<LorebookSettings> = {
    scan_depth: 2,
    context_percentage: 100,
    budget_cap: 0,
    min_activations: 0,
    max_depth: 0,
    max_recursion_steps: 0,

    insertion_strategy: 'character_first',

    include_names: false,
    recursive: true,
    case_sensitive: false,
    match_whole_words: false,
    use_group_scoring: false,
    overflow_alert: false,
  };
  const settings = await getLorebookSettings();
  if (!_.isEqual(_.merge({}, settings, EXPECTED_SETTINGS), settings)) {
    setLorebookSettings(EXPECTED_SETTINGS);
  }
}

$(() => {
  sync_lorebook_settings();
});
