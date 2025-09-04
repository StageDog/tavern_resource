import { destory_squash as _destory_squash, init_squash as _init_squash } from '../../../酒馆助手/压缩相邻消息/squash';

export function init_squash() {
  _init_squash({
    seperator: {
      type: 'newline',
      value: '\n',
    },
    on_chat_history: {
      type: 'squash',
      squash_role: 'assistant',
      user_prefix: 'Explorer: ',
      user_suffix: '',
      assistant_prefix: 'Design/Story: ',
      assistant_suffix: '',
      system_prefix: '',
      system_suffix: '',
    },
  });
}

export function destory_squash() {
  _destory_squash();
}
