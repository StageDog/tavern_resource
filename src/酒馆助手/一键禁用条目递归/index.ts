import { loadReadme } from '@util/script';
import { registerDisableRecursionButton } from './button';

$(() => {
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/一键禁用条目递归/README.md');
  registerDisableRecursionButton(true);
});
