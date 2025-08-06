# 酒馆相关资源

作者: 想做舞台少女的狗

文档见于: <https://sillytavern-stage-girls-dog.readthedocs.io>

## 参与贡献提示

### 项目结构

为了自动更新和打包一些东西, 本项目直接打包源代码在 `dist/` 文件夹中并随仓库上传, 而这会让开发时经常出现分支冲突.

为了解决这一点, 仓库在 `.gitattribute` 中设置了对于 `dist/` 文件夹中的冲突总是使用当前版本. 这不会有什么问题: 在上传后, ci 会将 `dist/` 文件夹重新打包成最新版本, 因而你上传的 `dist/` 文件夹内容如何无关紧要.

为了启用这个功能, 请执行一次以下命令:

```bash
git config --global merge.ours.driver true
```

### 手动编译

你可以参考 [参与前端插件开发的 VSCode 环境配置](https://sillytavern-stage-girls-dog.readthedocs.io/tool_and_experience/js_slash_runner/index.html) 来得到 VSCode 上更详细的配置和使用教程.

你需要先安装有 node 22+ 和 pnpm. 如果已经安装有 node 22+, 则 pnpm 可以按以下步骤安装:

```bash
npm install -g pnpm
```

然后, 用 pnpm 安装本项目的所有依赖:

```bash
pnpm install
```

之后你就可以对本项目进行编译:

```bash
pnpm build
```

或者, 你可以用 `pnpm watch` 来持续监听代码变动. 这样只需刷新酒馆网页, 酒馆就会使用最新的插件代码.

## 许可证

[Aladdin](LICENSE)
