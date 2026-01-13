import { registerDisableRecursionButton } from '@/酒馆助手/一键禁用条目递归/button';
import { loadReadme } from '@util/script';

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
  setLorebookSettings(EXPECTED_SETTINGS);
}

async function toggle_lock(should_lock: boolean) {
  $('#wiActivationSettings').find('input, select').prop('disabled', should_lock);
}

$(() => {
  loadReadme(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/世界书强制用推荐的全局设置/README.md',
  );
  registerDisableRecursionButton(false);
  sync_lorebook_settings();
  toggle_lock(true);
});

$(window).on('pagehide', () => toggle_lock(false));
