import CHANGELOG_CONTENT from '../../../../../private/预设/【门之主】写卡助手 - 更新日志.md?raw';
import EXAMPLE_CHAT_CONTENT from '../../../../../private/预设/【门之主】写卡助手 - 示例.jsonl?raw';
import PRESET_CONTENT from '../../../../../private/预设/【门之主】写卡助手.json?raw';

const PRESET_NAME = CHANGELOG_CONTENT.match(/^##\s*(\d+\.\d+\.\d+)\s*$/m)?.[1] ?? '';

export { CHANGELOG_CONTENT, EXAMPLE_CHAT_CONTENT, PRESET_CONTENT, PRESET_NAME };
