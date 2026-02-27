export {};

type Settings = z.infer<typeof Settings>;
const Settings = z.object({
  触发字数下限: z.number().default(400),
});

let settings: Settings;
function get_settings() {
  if (!settings) {
    settings = Settings.parse(getVariables({ type: 'script', script_id: getScriptId() }));
    insertVariables(settings, { type: 'script', script_id: getScriptId() });
  }
  return settings;
}

function human_file_size(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + ' ' + units[u];
}

async function on_file_attach(file_list: FileList) {
  if (!file_list || file_list.length === 0) {
    return;
  }

  const name = file_list.length === 1 ? file_list[0].name : SillyTavern.t`${file_list.length} files selected`;
  const size = [...file_list].reduce((acc, file) => acc + file.size, 0);
  const title = [...file_list].map(x => x.name).join('\n');
  $('#file_form .file_name').text(name).attr('title', title);
  $('#file_form .file_size').text(human_file_size(size)).attr('title', size);
  $('#file_form').removeClass('displayNone');

  const currentChatId = SillyTavern.getCurrentChatId();
  if (currentChatId) {
    eventOnce(tavern_events.CHAT_CHANGED, () => {
      $('#file_form').trigger('reset');
    });
  }
}

const files: Map<string, File> = new Map();

function attach_file_from_text(text: string) {
  let file: File;
  if (files.has(text)) {
    file = files.get(text)!;
  } else {
    file = new File([text], 'pasted.txt');
    files.set(text, file);
  }

  const $file_form_input = $('#file_form_input');

  const data_transfer = new DataTransfer();
  _(Array.from($file_form_input.prop('files') as FileList))
    .concat(file)
    .uniqBy(file => `${file.lastModified}-${file.name}-${file.size}-${file.type}`)
    .forEach(file => {
      data_transfer.items.add(file);
    });

  $file_form_input.prop('files', data_transfer.files);
  on_file_attach(data_transfer.files);
}

function on_beforeinput(event: JQuery.TriggeredEvent) {
  const original_event = event.originalEvent as InputEvent;
  if (
    (original_event.inputType === 'insertFromPaste' || original_event.inputType === 'insertText') &&
    original_event.data &&
    original_event.data.length > get_settings().触发字数下限
  ) {
    original_event.preventDefault();
    original_event.stopPropagation();
    attach_file_from_text(original_event.data);
  }
}

$(() => {
  const text_area = $('#send_textarea').first();

  text_area.on('beforeinput', on_beforeinput);

  $(window).on('pagehide', () => {
    text_area.off('beforeinput', on_beforeinput);
  });
});
