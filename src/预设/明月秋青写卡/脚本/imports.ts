import changelog_content from '../../../../../private/预设/【明月秋青写卡】 - 更新日志.md?raw';
import preset_content from '../../../../../private/预设/【明月秋青写卡】.json?raw';

const preset_name = '【明月秋青写卡】' + (changelog_content.match(/^##\s*(\d+\.\d+\.\d+)\s*$/m)?.[1] ?? '');

export { changelog_content, preset_content, preset_name };
