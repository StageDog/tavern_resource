import { loadReadme } from '@util/script';
import { compare } from 'compare-versions';

$(async () => {
  // 酒馆助手 4.7.0+ 已经将本脚本作为了体验优化选项, 则本脚本不生效, 直接返回
  if (compare(await getTavernHelperVersion(), '4.7.0', '>=')) {
    return;
  }

  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/最大化预设上下文长度/README.md');

  function unlock_token_length() {
    const MAX_CONTEXT = 2000000;
    const settings = SillyTavern.chatCompletionSettings;
    if (settings.max_context_unlocked === true && settings.openai_max_context === MAX_CONTEXT) {
      return;
    }

    $('#oai_max_context_unlocked').prop('checked', true).trigger('input');
    $('#openai_max_context_counter').val(MAX_CONTEXT);
    $('#openai_max_context').val(MAX_CONTEXT).trigger('input');
  }

  unlock_token_length();
  eventOn(tavern_events.OAI_PRESET_CHANGED_AFTER, () => {
    unlock_token_length();
  });

  const $inputs = $('#oai_max_context_unlocked, #openai_max_context, #openai_max_context_counter');
  $inputs.prop('disabled', true);
  $(window).on('pagehide', () => {
    $inputs.prop('disabled', false);
  });
});
