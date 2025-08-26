# 资源预载

- **作者:** 青空莉想做舞台少女的狗
- **版本:** 2025/04/21
- **原帖:** [点此跳转](https://discord.com/channels/1291925535324110879/1354791063935520898)
- **源文件:** [点此跳转](https://gitgud.io/StageDog/tavern_resource/-/tree/main/src)
- **说明:** 提前缓存

导入脚本后, 点击编辑脚本将会看到变量表中有一个 "资源预载" 变量, 在值中填入要预载的图片链接, 每行一个

```txt
https://gitgud.io/lolodesu/lolobabytutorial/-/raw/master/lologame/角色/水手服/猫爪生气.png&inline=false
https://gitgud.io/lolodesu/lolobabytutorial/-/raw/070ad4237dde7122c64facbd101fc89c9238a767/lologame/角色/水手服/猫爪生气.png?inline=false
https://files.catbox.moe/bhxtss.png
```

## 注意

这样的预载效果取决于保存图片的网站和浏览器设置，保底效果是图片本身被缓存到浏览器中，但需要加载图片时还会发送网络请求来询问缓存了的图片是否有效
