export function registerDisableRecursionButton(visible: boolean) {
  // @ts-expect-error 为了向后兼容性
  appendInexistentScriptButtons(getScriptId(), [
    {
      name: '处理要禁用递归扫描的世界书',
      visible,
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
