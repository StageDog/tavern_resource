export const LOREBOOK_NAME = '【可点击的选择框】' as const;
// TODO: 更加拆分这里
export const TAG = '<roleplay_options>' as const;
export const REGEX = /<(roleplay_options)>\s*(?:```.*\n)?((?:(?!<\1>)[\s\S])*?)(?:\n```)?\s*<\/\1>/im;
