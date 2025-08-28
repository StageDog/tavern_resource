type InjectionPrompt = {
  id: string;
  /**
   * 要注入的位置
   * - 'in_chat': 插入到聊天中
   * - 'none': 不会发给 AI, 但能用来激活世界书条目.
   */
  position: 'in_chat' | 'none';
  depth: number;

  role: 'system' | 'assistant' | 'user';
  content: string;

  /** 提示词在什么情况下启用; 默认为始终 */
  filter?: (() => boolean) | (() => Promise<boolean>);
  /** 是否作为欲扫描文本, 加入世界书绿灯条目扫描文本中; 默认为任意 */
  should_scan?: boolean;
};

type injectPromptsOptions = {
  /** 是否只在下一次请求生成中有效; 默认为 false */
  once?: boolean;
};

/**
 * 注入提示词
 *
 * @param prompts 要注入的提示词
 * @param options 可选选项
 *   - `once:boolean`: 是否只在下一次请求生成中有效; 默认为 false
 */
declare function injectPrompts(prompts: InjectionPrompt[], options?: injectPromptsOptions): void;

/**
 * 移除注入的提示词
 *
 * @param ids 要移除的提示词的 id 列表
 */
declare function uninjectPrompts(ids: string[]): void;
