# 样式加载

**作者:** 青空莉想做舞台少女的狗
**版本:** 2025/04/21
**原帖:** [点此跳转](https://discord.com/channels/1291925535324110879/1354783717910122496)
**源文件:** [点此跳转](https://github.com/StageDog/tavern_resource/tree/main/酒馆助手/样式加载)
**说明:** 像酒馆主题自定义 css 一样编写角色卡 css

在正则中新建一个 "样式-xxx" 正则, 它的`查找正则表达式`部分不必填写, `替换为`部分填入你需要加载的 css 内容

例如:

```css
@import url("https://static.zeoseven.com/zsft/510/main/result.css");

:root {
  --lolo-font: "PING FANG SAN SHENG";
}
```

这样, 这个 css 内容将会像酒馆美化的 "自定义 css" 一样被加载.
