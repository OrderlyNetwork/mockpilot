# Vite + React + TypeScript 配置

本项目已成功配置了 Vite + React + TypeScript 开发环境，专门用于 VS Code Web Extension 的 WebView 部分。

## 配置概览

### 1. 项目结构
```
src/web/
├── components/          # React 组件
│   ├── MockApiExplorer.tsx
│   ├── ApiEditor.tsx
│   └── ServerStatus.tsx
├── webview/            # WebView React 应用
│   ├── index.tsx       # 入口文件
│   ├── App.tsx         # 主应用组件
│   └── styles.css      # 样式文件
├── types/              # TypeScript 类型定义
│   ├── index.ts
│   └── mockApi.ts
├── utils/              # 工具函数
├── hooks/              # React Hooks
└── extension.ts        # VS Code Extension 主文件（仍使用 esbuild）
```

### 2. 构建工具分工
- **Vite**: 负责 WebView React 应用的构建
- **esbuild**: 负责 VS Code Extension 主文件的构建

### 3. 可用命令

#### 前端开发命令
```bash
# 启动React WebView开发服务器（热重载）
pnpm run dev:webview

# 同时启动前端和extension开发
pnpm run dev:extension

# 通用开发命令（默认端口3000）
pnpm run dev

# 预览构建后的前端页面
pnpm run serve
```

#### 构建命令
```bash
# 只构建 React WebView
pnpm run build-web

# 完整构建（extension + webview）
pnpm run compile-web

# 生产构建
pnpm run package-web
```

#### 开发和调试命令
```bash
# 完整开发模式（extension + webview）
pnpm run watch-web

# 类型检查
pnpm run check-types

# 代码检查
pnpm run lint

# 代码修复
pnpm run lint:fix

# 在VS Code中测试Extension
pnpm run run-in-browser
```

### 4. 前端开发使用

#### 独立开发WebView界面
```bash
# 启动前端开发服务器，自动打开浏览器
pnpm run dev:webview
```
- 服务器运行在 `http://localhost:3000/`（或下一个可用端口）
- 支持热重载，修改代码自动刷新
- 适用于单独开发UI界面

#### 同时开发Extension和WebView
```bash
# 同时运行前端开发服务器和extension构建监听
pnpm run dev:extension
```
- 前端热重载开发
- Extension文件变化自动重新构建
- 适用于完整功能开发

#### 开发服务器特性
- **热重载**: 代码修改自动刷新页面
- **TypeScript**: 实时类型检查
- **CSS模块**: 支持CSS热重载
- **自动打开浏览器**: 启动时自动打开页面
- **端口自动分配**: 端口占用时自动切换

### 4. Vite 配置特点

#### 针对VS Code Web Extension优化
- 输出格式：ES模块，适用于WebView环境
- 外部依赖：排除 `vscode` 模块
- 路径别名：支持 `@/`, `@web/`, `@components/`, `@utils/`
- CSS变量：适配VS Code主题

#### 构建输出
- WebView应用：`dist/web/webview.js` 和 `dist/web/webview-webview.css`
- Extension主文件：`dist/web/extension.js`（通过esbuild）

### 5. React 组件说明

#### 核心组件
- **App**: 主应用组件，管理状态和布局
- **MockApiExplorer**: 侧边栏，显示Mock API列表
- **ApiEditor**: 主要编辑器，编辑API配置
- **ServerStatus**: 服务器状态显示和控制

#### 类型定义
```typescript
interface MockApi {
  id: string;
  name: string;
  description?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  endpoint: string;
  rules: MockApiRule[];
  enabled: boolean;
  filePath?: string;
}
```

### 6. 通信机制

#### Extension ↔ WebView
使用 `postMessage` API 进行双向通信：
- WebView通过 `window.parent.postMessage` 发送消息
- Extension通过 `webview.postMessage` 发送消息

#### 消息类型
```typescript
// 从WebView到Extension
{ type: 'ready' }
{ type: 'apiSelected', api: MockApi }
{ type: 'apiUpdated', api: MockApi }
{ type: 'toggleServer' }

// 从Extension到WebView
{ type: 'mockApisUpdated', apis: MockApi[] }
{ type: 'serverStatusChanged', running: boolean }
{ type: 'selectApi', api: MockApi }
```

### 7. 开发建议

#### 添加新组件
1. 在 `src/web/components/` 目录下创建组件
2. 使用相对路径导入类型：`import { MockApi } from '../types/mockApi'`
3. 遵循现有的命名约定和代码风格

#### 样式开发
- 使用CSS变量适配VS Code主题
- 所有样式定义在 `styles.css` 中
- 使用BEM命名约定

#### 类型安全
- 严格使用TypeScript
- 为所有组件定义Props接口
- 使用类型定义的通信消息

### 8. 注意事项

1. **Web Extension限制**:
   - 不能使用Node.js API
   - 必须在浏览器环境运行
   - 文件访问通过VS Code API

2. **构建顺序**:
   - 先构建WebView，再构建Extension
   - 自动通过npm scripts管理

3. **热重载**:
   - React WebView支持热重载
   - Extension修改需要重新加载VS Code窗口

### 9. 故障排除

#### 常见问题
1. **类型错误**: 检查 `tsconfig.json` 路径配置
2. **导入错误**: 确保使用正确的相对路径
3. **构建失败**: 检查外部依赖配置

#### 调试技巧
- 使用 `pnpm run dev` 单独开发WebView
- 使用VS Code开发者工具调试Extension
- 检查控制台错误信息