/**
 * 获取按钮对应的事件类型
 *
 * @param button_name 按钮名
 * @returns 事件类型
 *
 * @example
 * const event_type = getButtonEvent('按钮名');
 * eventOn(event_type, () => {
 *   console.log('按钮被点击了');
 * });
 */
declare function getButtonEvent(button_name: string): string;
