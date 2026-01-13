import { loadReadme } from '@util/script';
import { toSimplified, toTraditional } from 'chinese-simple2traditional';

async function chooseLorebook(): Promise<string | null> {
  const lorebooks = getLorebooks();

  let chosen_worldbook: string | null = null;
  const $template = $('<div>').append(
    '<div><h4><span>请选择你要处理的世界书</span></h4></div>',
    $('<div>').append(
      $('<select><option value="">--- None ---</option></select>')
        .append(lorebooks.map((lorebook, index) => new Option(lorebook, String(index))))
        .on('change', async function () {
          const value = String($(this).val());
          if (value === '') {
            chosen_worldbook = null;
            return;
          }
          const lorebook = lorebooks.at(Number(value));
          chosen_worldbook = lorebook ?? null;
        }),
    ),
  );

  const result = await SillyTavern.callGenericPopup($template[0], SillyTavern.POPUP_TYPE.CONFIRM);
  if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE || !chosen_worldbook) {
    return null;
  }

  return chosen_worldbook;
}

async function translateLorebook(
  lorebook: string | null,
  translator: (text: string) => string,
  translator_name: string,
) {
  if (lorebook === null) {
    return;
  }

  await updateLorebookEntriesWith(lorebook, entries => {
    entries.forEach(entry => {
      entry.comment = translator(entry.comment ?? '');
      entry.content = translator(entry.content ?? '');
      entry.keys = entry.keys.map(key => translator(key ?? ''));
      entry.filters = entry.filters.map(key => translator(key ?? ''));
    });
    return entries;
  });

  SillyTavern.callGenericPopup(`已将 '${lorebook}' 完全翻译成${translator_name}`, SillyTavern.POPUP_TYPE.TEXT);
}

$(() => {
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/世界书繁简互换/README.md');
  appendInexistentScriptButtons([
    {
      name: '将世界书翻译成简体',
      visible: true,
    },
    {
      name: '将世界书翻译成繁体',
      visible: true,
    },
  ]);

  eventOn(getButtonEvent('将世界书翻译成繁体'), async () => {
    await translateLorebook(await chooseLorebook(), toTraditional, '繁体');
  });

  eventOn(getButtonEvent('将世界书翻译成简体'), async () => {
    await translateLorebook(await chooseLorebook(), toSimplified, '简体');
  });
});
