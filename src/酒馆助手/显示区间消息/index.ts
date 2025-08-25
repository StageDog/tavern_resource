$(() => {
  appendInexistentScriptButtons([
    { name: '显示区间', visible: true },
    { name: '恢复默认', visible: true },
  ]);
  eventOn(getButtonEvent('显示区间'), async () => {
    const min = 0;
    const max = SillyTavern.chat.length - 1;

    const range = (await SillyTavern.callGenericPopup(
      `请输入显示区间 (格式: 0-10, 范围: ${min}-${max})`,
      SillyTavern.POPUP_TYPE.INPUT,
    )) as string | undefined;
    if (!range) {
      toastr.error('未填入有效区间');
      return;
    }
    const [start, end] = range.split('-').map(Number);
    if (start < min || start > end || end > max) {
      toastr.error('未填入有效区间');
      return;
    }
    $('#chat').children().remove();
    for (let i = start; i <= end; i++) {
      builtin.addOneMessage(SillyTavern.chat[i], { forceId: i });
      eventEmit(
        SillyTavern.chat[i].is_user ? tavern_events.USER_MESSAGE_RENDERED : tavern_events.CHARACTER_MESSAGE_RENDERED,
        i,
      );
    }
  });
  eventOn(getButtonEvent('恢复默认'), SillyTavern.reloadCurrentChat);
});
