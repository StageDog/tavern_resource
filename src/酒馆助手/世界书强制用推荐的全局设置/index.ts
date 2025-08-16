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
  setLorebookSettings(EXPECTED_SETTINGS);
}

async function toggle_lock(should_lock: boolean) {
  $('#wiActivationSettings').find('input, select').prop('disabled', should_lock);
}

function register_button() {
  appendInexistentScriptButtons(getScriptId(), [
    {
      name: '处理要禁用递归扫描的世界书',
      visible: false,
    },
  ]);

  eventOnButton('处理要禁用递归扫描的世界书', async () => {
    const lorebooks = getLorebooks();

    let choosen_lorebook: string | null = null;
    const $template = $('<div>').append(
      '<div><h4><span>请选择你要处理的世界书</span></h4></div>',
      $('<div>').append(
        $('<select><option value="">--- None ---</option></select>')
          .append(lorebooks.map((lorebook, index) => new Option(lorebook, String(index))))
          .on('change', async function () {
            const value = String($(this).val());
            if (value === '') {
              choosen_lorebook = null;
              return;
            }
            const lorebook = lorebooks.at(Number(value));
            choosen_lorebook = lorebook ?? null;
          }),
      ),
    );

    const result = await SillyTavern.callGenericPopup($template[0], SillyTavern.POPUP_TYPE.CONFIRM);
    if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE || !choosen_lorebook) {
      return;
    }

    await updateLorebookEntriesWith(choosen_lorebook, entries => {
      entries.forEach(entry => {
        entry.exclude_recursion = true;
        entry.prevent_recursion = true;
      });
      return entries;
    });
    SillyTavern.callGenericPopup(`已禁用 '${choosen_lorebook}' 的递归扫描`, SillyTavern.POPUP_TYPE.TEXT);
  });
}

$(() => {
  register_button();
  sync_lorebook_settings();
  toggle_lock(true);
});

$(window).on('pagehide', () => toggle_lock(false));
