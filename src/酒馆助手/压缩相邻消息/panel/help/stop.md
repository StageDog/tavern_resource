# 停止字符串

如果填入停止字符串, 则 AI 输出了对应文本时将会直接停止输出. 停止字符串可以是字符串或正则, 如 `User:` 或 `/User:|System:/`.

这可以避免 AI 在输出完剧情后自己和自己对话. 例如, AI 直接回复了以下内容:

```text
<|im_start|> assistant
剧情……
<|im_end|>

<|im_start|> user
AI 自己作为 user 继续发送消息了!
<|im_end|>

<|im_start|> assistant
剧情……
<|im_end|>
```

那么可以把 `<|im_end|>` 作为停止字符串.

这样一来,

- 对于流式传输: 当 AI 输出完剧情, 输出到 `<|im_end|>` 时, 就会直接停止输出
- 对于非流式传输: 当 AI 回复后, 脚本会删去 `<|im_end|>` 及以后的所有文本
