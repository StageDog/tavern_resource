import iframe_srcdoc from './iframe_srcdoc.html';

export async function loadReadme(url: string): Promise<boolean> {
  const readme = await fetch(url);
  if (!readme.ok) {
    return false;
  }
  const readme_text = await readme.text();
  replaceScriptInfo(readme_text);
  return true;
}

export function teleportStyle(
  append_to: JQuery.Selector | JQuery.htmlString | JQuery.TypeOrArray<Element | DocumentFragment> | JQuery = 'head',
): { destroy: () => void } {
  const $div = $(`<div>`)
    .attr('script_id', getScriptId())
    .append($(`head > style`, document).clone())
    .appendTo(append_to);

  return {
    destroy: () => $div.remove(),
  };
}

export function createScriptIdIframe(): JQuery<HTMLIFrameElement> {
  return $(`<iframe>`).attr({
    script_id: getScriptId(),
    frameborder: 0,
    srcdoc: iframe_srcdoc,
  }) as JQuery<HTMLIFrameElement>;
}

export function createScriptIdDiv(): JQuery<HTMLDivElement> {
  return $('<div>').attr('script_id', getScriptId()) as JQuery<HTMLDivElement>;
}

export function reloadOnChatChange(): EventOnReturn {
  let chat_id = SillyTavern.getCurrentChatId();
  return eventOn(tavern_events.CHAT_CHANGED, new_chat_id => {
    if (chat_id !== new_chat_id) {
      chat_id = new_chat_id;
      window.location.reload();
    }
  });
}

export function registerAsUniqueScript(id: string): {
  unregister: () => void;
  getPreferredScriptId: () => string | undefined;
  listenPreferenceState: (callback: (perferred_script_id: string) => void) => EventOnReturn;
} {
  const script_id = getScriptId();
  const path = `th_unique_check.${id}`;

  const getPreferredScriptId = () => {
    const registered_scripts = _.get(window.parent, path, new Set<string>());
    return _($('#tavern_helper').find('div[data-script-id]').toArray())
      .map(element => String($(element).attr('data-script-id')))
      .filter(element => registered_scripts.has(element))
      .last();
  };

  _.update(window.parent, path, (value: Set<string> | undefined) => {
    if (value === undefined) {
      return new Set([script_id]);
    }
    value.add(script_id);
    return value;
  });
  eventEmit(path, getPreferredScriptId());

  return {
    unregister: () => {
      _.update(window.parent, path, (value: Set<string> | undefined) => {
        if (value !== undefined) {
          value.delete(script_id);
        }
        return value;
      });
      eventEmit(path, getPreferredScriptId());
    },
    getPreferredScriptId,
    listenPreferenceState: (callback: (enabled_script_id: string) => void) => eventOn(path, callback),
  };
}
