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

function attach_file_from_text(text: string) {
  const file = new File([text], 'text.txt');

  const data_transfer = new DataTransfer();
  data_transfer.items.add(file);
  const $file_form_input = $('#file_form_input');
  $file_form_input.prop('files', data_transfer.files);
  $file_form_input[0].dispatchEvent(new Event('change'));
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

const text_area = $('#send_textarea').first();
$(() => {
  text_area.on('beforeinput', on_beforeinput);
});
$(window).on('pagehide', () => {
  text_area.on('beforeinput', on_beforeinput);
});
