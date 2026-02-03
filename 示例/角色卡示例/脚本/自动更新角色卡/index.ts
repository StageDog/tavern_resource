import { checkAndUpdateCharacter } from '@util/common';

$(async () => {
  await checkAndUpdateCharacter(
    '呕吐内心的少女',
    await fetch('https://testingcf.jsdelivr.net/gh/StageDog/tavern_helper_template/dist/角色卡示例/index.yaml')
      .then(response => response.text())
      .then(text => _.get(YAML.parse(text), '版本', '0.0.0'))
      .catch(() => '0.0.0'),
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_helper_template/dist/角色卡示例/角色卡示例.png',
  );
});
