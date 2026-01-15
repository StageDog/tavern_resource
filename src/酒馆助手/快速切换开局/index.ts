$(() => {
  appendInexistentScriptButtons([{ name: '快速切换开局', visible: true }]);
  eventOn(getButtonEvent('快速切换开局'), async () => {
    const size = getChatMessages(0, { include_swipes: true })?.[0]?.swipes?.length ?? 0;
    if (size === 0) {
      toastr.error('未找到任何开局');
      return;
    }

    const result = await SillyTavern.callGenericPopup(
      `请输入要选择的开局号 (从 1 开始, 总共有 ${size} 个开局)`,
      SillyTavern.POPUP_TYPE.INPUT,
    );
    const number = parseInt(String(result));
    if (!_.inRange(number, 1, size + 1)) {
      toastr.error('未填入有效开局号');
      return;
    }
    await setChatMessages([{ message_id: 0, swipe_id: number - 1 }]);
  });
});
