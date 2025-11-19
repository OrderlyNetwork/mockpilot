# 发布 VS Code 扩展指南

本指南将帮助你将 Mock Server 扩展发布到 Visual Studio Code Marketplace。

## 📋 前置准备

### 1. 创建 Microsoft 账号

如果还没有 Microsoft 账号，请先注册一个。

### 2. 创建 Azure DevOps 组织

1. 访问 [Azure DevOps](https://dev.azure.com)
2. 使用 Microsoft 账号登录
3. 创建一个新的组织（Organization）

### 3. 创建 Personal Access Token (PAT)

1. 在 Azure DevOps 中，点击右上角的用户设置图标
2. 选择 "Personal Access Tokens"
3. 点击 "New Token"
4. 配置 Token：
   - Name: 例如 "VS Code Extension Publishing"
   - Organization: 选择你刚创建的组织
   - Expiration: 选择过期时间（建议选择较长期限）
   - Scopes: 选择 "Custom defined"
   - 勾选 **Marketplace** → **Manage** (完整权限)
5. 点击 "Create" 并**立即复制保存 Token**（只显示一次）

### 4. 创建 Publisher

1. 访问 [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. 点击 "Create publisher"
3. 填写信息：
   - **ID**: 发布者的唯一标识符（例如：`yourname-extensions`）
   - **Display Name**: 显示名称
   - **Description**: 发布者描述
4. 创建完成后，记住你的 Publisher ID

### 5. 更新 package.json

在 `package.json` 中更新以下字段：

```json
{
  "publisher": "你的-publisher-id",
  "author": {
    "name": "你的名字"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/你的用户名/仓库名.git"
  }
}
```

## 🚀 发布流程

### 方式一：命令行发布（推荐）

#### 1. 登录到 Publisher

```bash
pnpm vsce login <your-publisher-id>
```

输入你之前创建的 Personal Access Token。

#### 2. 打包扩展（可选，用于测试）

```bash
pnpm run vsce:package
```

这将生成一个 `.vsix` 文件，你可以先在本地测试。

#### 3. 发布扩展

```bash
pnpm run vsce:publish
```

或者发布并自动升级版本号：

```bash
# 升级 patch 版本 (0.0.1 -> 0.0.2)
pnpm vsce publish patch

# 升级 minor 版本 (0.0.1 -> 0.1.0)
pnpm vsce publish minor

# 升级 major 版本 (0.0.1 -> 1.0.0)
pnpm vsce publish major
```

### 方式二：Web 界面发布

1. 打包扩展：

   ```bash
   pnpm run vsce:package
   ```

2. 访问 [Publisher Management](https://marketplace.visualstudio.com/manage)

3. 点击你的 Publisher，然后点击 "New Extension" → "Visual Studio Code"

4. 上传生成的 `.vsix` 文件

## 🧪 本地测试

在发布前，建议先在本地测试：

### 安装 .vsix 文件

```bash
# 先打包
pnpm run vsce:package

# 安装到 VS Code
code --install-extension mock-server-0.0.1.vsix
```

### 在 VS Code UI 中安装

1. 打开 VS Code
2. 进入 Extensions 视图 (Cmd+Shift+X 或 Ctrl+Shift+X)
3. 点击 "..." 菜单（右上角）
4. 选择 "Install from VSIX..."
5. 选择你的 `.vsix` 文件

## 📝 发布前检查清单

- [ ] `package.json` 中所有必需字段已填写
  - [ ] `publisher`
  - [ ] `repository`
  - [ ] `description`
  - [ ] `keywords`
  - [ ] `license`
- [ ] `README.md` 包含完整的使用说明和截图
- [ ] `CHANGELOG.md` 记录了版本变更
- [ ] `LICENSE` 文件存在
- [ ] `.vscodeignore` 配置正确
- [ ] 在本地测试扩展功能正常
- [ ] 运行 `pnpm run compile-web` 确保编译成功
- [ ] 运行 `pnpm run lint` 确保没有 lint 错误

## 🔄 更新扩展

当需要发布新版本时：

1. 更新代码和文档
2. 更新 `CHANGELOG.md`
3. 运行以下命令之一：

   ```bash
   # 自动升级版本并发布
   pnpm vsce publish patch  # 或 minor/major

   # 或手动更新 package.json 中的 version，然后
   pnpm run vsce:publish
   ```

## 🔗 有用的链接

- [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Publisher Management](https://marketplace.visualstudio.com/manage)
- [Azure DevOps](https://dev.azure.com)

## ⚠️ 注意事项

1. **Personal Access Token 安全**

   - 永远不要将 PAT 提交到 Git 仓库
   - PAT 只在创建时显示一次，务必保存好
   - 定期更新 PAT

2. **版本号管理**

   - 遵循 [语义化版本](https://semver.org/)
   - 每次发布都要更新版本号
   - 不能发布相同版本号两次

3. **扩展大小**

   - 确保 `.vscodeignore` 正确配置
   - 避免打包不必要的文件
   - 生成的 `.vsix` 文件应该尽可能小

4. **审核时间**
   - 首次发布可能需要人工审核
   - 审核通过后，扩展才会在 Marketplace 上显示
   - 更新通常几分钟内就会生效

## 🎉 发布成功后

发布成功后，你的扩展将在以下位置可见：

- VS Code Marketplace: `https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension-name>`
- 用户可以在 VS Code 的扩展面板中搜索安装你的扩展
