import './index.scss';
import './加载和卸载时执行函数';

function capture_display_text() {
  // 通过 substitudeMacros 我们可以解析酒馆宏
  const character_name = substitudeMacros('{{char}}');

  // 通过 getCurrentMessageId 我们可以获取界面所在的楼层号
  const message_id = getCurrentMessageId();
  // 通过 getChatMessages 我们可以获取楼层内容
  const chat_message = getChatMessages(message_id)[0];
  // 我们可以从楼层的消息中通过正则提取出对话内容, 由于这是在代码中做, 相比起直接用酒馆正则会更加方便: 我们完全可以用其他代码对文本进行更多处理
  const dialogue = chat_message.message.match(/\[查看日记[:：]\s*(.+)\]/)?.[1] ?? '';

  const text = `${character_name}: ${dialogue}`;

  // 将提取出的文本显示在 index.html 的 message-content 类中
  $('.message-content').text(text);
}

function register_click_event() {
  // 为对 .clickdiv 类的点击事件添加响应函数
  $('.clickdiv').on('click', () => {
    triggerSlash(`/send 查看日记\n<UpdateVariable>\n_.set('世界.下次响应界面选择判断', 1)\n</UpdateVariable> || /trigger`);
  });
}

function render() {
  capture_display_text();
  register_click_event();
}

$(() => {
  render();
});
