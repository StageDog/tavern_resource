import { useConfigStore } from './store';

export function injectStyle() {
  const store = useConfigStore();

  $(`<div>`).attr('script_id', getScriptId()).append(`<style>${store.config.样式}</style>`).appendTo('head');

  const stop = watch(
    () => store.config.样式,
    style => {
      $(`head > div[script_id="${getScriptId()}"]`).find('style').text(style);
    },
  );
  return {
    stop: () => {
      stop();
      $(`head > div[script_id="${getScriptId()}"]`).remove();
    },
  };
}
