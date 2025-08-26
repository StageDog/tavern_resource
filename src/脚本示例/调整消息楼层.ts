$(async () => {
  const message_id = getLastMessageId();
  if (message_id !== 0) {
    return;
  }
  await createChatMessages(
    [
      { role: 'assistant', message: '[查看日记: 这是第二次看我的日记了呢~]' },
      { role: 'assistant', message: '[查看日记: 真是的, 就这么喜欢看吗(v〃ω〃)]' },
    ],
    { refresh: 'all' },
  );
});
