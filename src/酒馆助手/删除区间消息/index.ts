$(() => {
  appendInexistentScriptButtons([{ name: '删除区间消息', visible: true }]);
  eventOn(getButtonEvent('删除区间消息'), async () => {
    const min = 0;
    const max = SillyTavern.chat.length - 1;

    const range = await SillyTavern.callGenericPopup(
      `请输入显示区间 (格式: 0-10, 范围: ${min}-${max})`,
      SillyTavern.POPUP_TYPE.INPUT,
    );
    if (!range) {
      toastr.error('未填入有效区间');
      return;
    }
    const [start, end] = String(range).split('-').map(Number);
    if (start < min || start > end || end > max) {
      toastr.error('未填入有效区间');
      return;
    }
    await deleteChatMessages(_.range(start, end + 1));
  });
});
