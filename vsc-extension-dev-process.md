# VS Code 扩展开发与发布流程

以 `send-ref-to-terminal` 为例。

---

## 一、开发

### 1. 初始化项目

使用 Yeoman 脚手架或手动创建，核心文件结构：

```
├── src/
│   └── extension.ts      # 入口文件
├── icon.png              # 扩展图标（128x128）
├── package.json          # 扩展配置
├── tsconfig.json
└── .vscodeignore
```

### 2. package.json 关键字段

```json
{
  "name": "send-ref-to-terminal",
  "displayName": "Send File Reference to Terminal",
  "description": "...",
  "version": "0.0.1",
  "publisher": "Franki",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/NikFranki/send-ref-to-terminal"
  },
  "engines": { "vscode": "^1.80.0" },
  "icon": "icon.png",
  "main": "./out/extension.js",
  "contributes": {
    "commands": [...],
    "keybindings": [...],
    "menus": {...}
  }
}
```

> `publisher` 必须与 Marketplace 上创建的 Publisher ID 一致。

### 3. 编写扩展逻辑

在 `src/extension.ts` 实现 `activate` 和 `deactivate`，注册命令、快捷键等。

### 4. 编译

```bash
npm run compile
```

---

## 二、发布

### 1. 创建 Publisher

访问 [marketplace.visualstudio.com/manage/createpublisher](https://marketplace.visualstudio.com/manage/createpublisher)，用 Microsoft 账号登录，填写 Publisher 名称创建。

> 不需要 Azure 订阅，不需要信用卡。

### 2. 打包为 .vsix

```bash
npm install -g @vscode/vsce
vsce package
```

生成 `send-ref-to-terminal-0.0.1.vsix` 文件。

### 3. 上传到 Marketplace

在 [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) 页面：

1. 点击 **New extension → VS Code**
2. 将 `.vsix` 文件拖入上传框
3. 点击 **Upload**

等待验证（约 5 分钟），状态变为绿色 ✅ 即发布成功。

> Marketplace 搜索索引有延迟，发布后约 15-30 分钟才能搜到。

### 4. 本地安装（可选，不等索引）

```bash
code --install-extension send-ref-to-terminal-0.0.1.vsix
```

全局生效，所有 VS Code 窗口均可使用。

---

## 三、注意事项

- `publisher` 字段必须提前在 Marketplace 创建好，否则上传会失败
- `icon.png` 建议 128x128，格式为 PNG
- `.vscodeignore` 用于排除打包时不需要的文件（如 `src/`、`node_modules/`）
- `repository` 字段缺失会导致 `vsce package` 报 WARNING，建议补全
- 发布后版本号不可重复，更新时需修改 `version` 字段再重新打包上传
