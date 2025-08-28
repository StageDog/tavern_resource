# 样式加载

- **作者:** 青空莉想做舞台少女的狗
- **版本:** 2025/04/21
- **原帖:** [点此跳转](https://discord.com/channels/1291925535324110879/1354783717910122496)
- **源文件:** [点此跳转](https://gitgud.io/StageDog/tavern_resource/-/tree/main/src)
- **说明:** 像酒馆主题自定义 css 一样编写角色卡 css

导入脚本后, 点击编辑脚本将会看到变量表中有一个 "样式加载" 变量, 在值中填入要加载的 css 内容即可

例如:

```css
@import url("https://static.zeoseven.com/zsft/510/main/result.css");

:root {
  --lolo-font: "PING FANG SAN SHENG";
}
```

这样, 这个 css 内容将会像酒馆美化的 "自定义 css" 一样被加载.
