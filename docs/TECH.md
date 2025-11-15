# VS Code Mock Server 插件 - 技术设计文档（TECH.md）

## 1. 总览（High Level Summary）

目标是实现一个可嵌入 VS Code 的 Mock Server 插件，具备：

- 从项目根 `.mock/` 目录加载 YAML 配置（每个 API 一个 YAML）
- 在 Sidebar 展示并管理这些 YAML
- 使用 WebView（React + Tailwind）提供可视化编辑器
- 在本地运行 Node.js mock server（独立进程或内嵌）并支持热更新
- 使用 Zustand 管理 WebView 内部状态
- 提供稳定的 YAML 解析、规则匹配引擎与日志功能

---

## 2. 技术栈

- VS Code Extension：TypeScript、VS Code Extension API
- UI（WebView）：React + TypeScript + Tailwind CSS + Vite （或 CRA），打包使用 esbuild/webpack
- 客户端状态管理：zustand
- Node Mock Server：Node.js (>=16) + Express / Fastify（推荐 Fastify 用于性能）
- YAML 解析：yaml 或 js-yaml
- 测试：Jest / Vitest（前端） + Supertest（mock server API 测试）
- 格式化：Prettier、ESLint
- CI/CD：GitHub Actions

---

## 3. 高级架构与边界（Architecture & Boundaries）

```
VS Code Host (主进程)
├── Extension Controller (TS)
│    ├─ Sidebar TreeView (注册 TreeView)
│    ├─ Commands (Start/Stop/New/Refresh)
│    └─ WebView Host (向 WebView 注入 HTML/JS)
│
├── File System Watcher (vscode.workspace.fs / chokidar 作为备选)
├── Mock Server Manager
│    ├─ 管理 Node 进程（spawn）
│    └─ 通过 IPC/HTTP 与 Mock Server 通信（热重载、状态查询）
└── User Workspace (.mock/ YAML 文件)

WebView (React)
├── UI（编辑器、规则管理、预览）
└── 状态（zustand）

Node Mock Server (独立进程)
├── Route Registry（基于 YAML 构建路由）
├── Rule Engine（匹配规则并返回 response）
├── Logger / Request Recorder
└── Admin API（用于接收热更新、获取状态）
```

**边界说明**：

- Extension 负责与 VS Code 集成、文件 I/O、进程管理与安全权限。WebView 仅做 UI 与用户交互（通过 postMessage 与 Extension 通信）。
- Mock Server 负责真正的 HTTP 路由与响应逻辑，并对外暴露单一内部 admin 接口（如 `POST /__mock/reload`）供 extension 调用以触发热更新。

---

## 4. 设计原则与模式

- **单一职责（SRP）**：每个模块只做一件事（例如：YAML 解析、路由注册、UI 渲染、规则匹配）。
- **观察者模式（File Watcher）**：监听 `.mock/` 文件变化，触发 reload。
- **发布/订阅（Event Bus）**：Extension Host 与 WebView、Node Server 间使用事件（postMessage + admin API）进行解耦通信。
- **策略模式（Rule Matching）**：不同匹配策略（manual、query、header、body）以策略对象实现，便于扩展。
- **工厂模式（Route Factory）**：基于 YAML 动态生成路由与 handler。
- **抗错误设计**：任何 YAML 解析错误应被捕获并写入 UI 错误区；不应导致服务器崩溃。

---

## 5. YAML Schema（详化）

使用 JSON Schema 表达用于校验和自动补全（可用于 future 的 VS Code JSON schema 插件）：

```json
{
  "$id": "https://example.com/mock-api.schema.json",
  "type": "object",
  "required": ["name", "method", "endpoint", "rules"],
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "method": {
      "type": "string",
      "enum": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    },
    "endpoint": { "type": "string" },
    "rules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "status", "body"],
        "properties": {
          "name": { "type": "string" },
          "status": { "type": "integer" },
          "headers": { "type": "object" },
          "body": {},
          "delay": { "type": "integer", "minimum": 0 },
          "match": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": ["manual", "query", "header", "body"]
              },
              "expr": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

字段说明：

- `rules[].match.type` 定义匹配策略，`expr` 可以是简单的表达式（例如 `status=401` 或 `role=admin`），后续版本可以用更强的表达式语言（如 JEXL）。

---

## 6. Mock Server 实现细节

### 6.1 选型：Fastify vs Express

- **推荐 Fastify**：性能更优、内置 schema 支持，生命周期钩子良好。若工程团队对 Express 更熟悉，可替换为 Express。

### 6.2 进程管理

- 扩展（extension host）使用 `child_process.spawn` 启动 Node 服务，保持 stdout/stderr 监听并在 Output Channel 打印日志。
- 传参：端口、mockDirectory、debugFlag。
- 若检测到端口冲突，返回友好错误并提示修改端口。

### 6.3 Admin 接口

- `POST /__mock/reload`：触发重载所有 YAML（返回解析结果/错误清单）
- `GET /__mock/status`：返回当前路由数、已加载的文件列表
- `GET /__mock/logs`：分页请求日志（请求记录）

### 6.4 Route Registry

- 启动时解析 `.mock` 下所有 YAML -> 生成路由配置对象 -> 调用 `fastify.route(...)` 注册
- 路由 handler 为通用函数：根据请求信息在对应 YAML 的 `rules` 中按匹配策略选出 rule，然后产生响应（headers, status, body, delay）

### 6.5 Rule Engine（策略）

- 以策略模式实现：每个策略实现 `match(request, ruleMatchSpec) => boolean`。
- 策略优先级：header > query > body > manual（可配置）
- Manual 模式用于 UI 指定当前激活 rule（最简单稳定的实现），其它模式需解析 `expr`。
- 支持随机策略（例如 `weight` 字段）或者按顺序 fallback。

### 6.6 性能考量

- 路由匹配尽量使用 O(1) 或 O(log n) 数据结构：先使用 endpoint+method map 快速定位 candidate，然后遍历少量 rules 进行策略判断。
- 为高频请求提供可选缓存（基于 request fingerprint）。

### 6.7 日志与请求记录

- 将每次请求摘要（时间、path、method、status、ruleName、latency）写入内存环形 buffer（可配置大小），并支持 admin API 导出为 JSON。

---

## 7. VS Code Extension 与 WebView 交互

### 7.1 通信渠道

- Extension 通过 `vscode.Webview.postMessage` 向 WebView 发送事件（如 `filesLoaded`, `serverStatus`, `reloadResult`）。
- WebView 向 Extension 发送消息（`vscode.postMessage`），如 `openFile`, `saveFile`, `startServer`, `stopServer`, `newApi`。
- 所有消息使用统一 envelope： `{ type: string, requestId?: string, payload?: any }`，以便追踪与回复。

### 7.2 文件操作策略

- WebView 不直接访问文件系统，所有读写通过 Extension 完成（安全边界）。
- Extension 使用 `vscode.workspace.fs` 读取 `.mock` 下文件并返回内容给 WebView。写操作应先在 Extension 中做语法校验（使用 YAML parser），再写磁盘。

### 7.3 Hot Reload 流程

1. File Watcher 监听到文件变化。
2. Extension 解析改动并调用 `POST /__mock/reload`。
3. Mock Server 处理并返回解析结果。
4. Extension 将结果通知 WebView（更新 UI、显示错误）。

---

## 8. WebView（React）结构与状态管理

### 8.1 目录与构建

- 推荐使用 Vite 打包 React 应用，输出为单个 html + js 文件注入 WebView。
- 目录示例：

```
webview/
├─ src/
│  ├─ App.tsx
│  ├─ components/
│  │   ├─ SidebarMockTree.tsx
│  │   ├─ ApiEditor.tsx
│  │   ├─ RuleEditor.tsx
│  │   ├─ YamlPreview.tsx
│  │   └─ ServerControl.tsx
│  ├─ stores/
│  │   └─ useMockStore.ts  (zustand)
│  └─ utils/
│      └─ messageBridge.ts
└─ index.html
```

### 8.2 状态设计（zustand）

- store 状态示例：

```ts
interface MockState {
  files: Array<{ path: string; content: string; parsed?: any }>;
  selectedFile?: string;
  serverStatus: { running: boolean; port: number };
  logs: any[];
  actions: {
    loadFiles: (files) => void;
    selectFile: (path) => void;
    saveFile: (path, content) => Promise<void>;
    startServer: () => void;
    stopServer: () => void;
  };
}
```

- 使用浅拷贝与局部订阅（zustand 的 `subscribe`）来减少不必要 rerender。

### 8.3 Message Bridge

- `messageBridge` 负责将 WebView 消息封装并发送给 Extension，同时处理来自 Extension 的事件推送。
- 所有长耗时操作（save、startServer）由 Extension 执行；WebView 只显示状态与结果。

### 8.4 UI 交互细节

- 编辑器区使用表单化控件编辑基本信息，Rule body 支持 JSON 编辑器（可内嵌 monaco-editor 或简单 textarea + JSON 校验）。
- 支持一键格式化（Prettier 在前端运行，或交给 Extension）。

---

## 9. 安全性与权限边界

- WebView 不能直接访问工作区文件系统，所有文件 I/O 由 Extension 代理执行。
- Mock Server 监听本地回环地址（127.0.0.1）或仅本机接口，避免暴露到公网。
- 管理接口（`/__mock/*`）应非公开（不注册为外网可达路由），并在 Extension 启动时将其绑定到本地端口。
- 在日志中避免输出敏感 body 内容，提供 redaction 选项。

---

## 10. 错误处理与恢复策略

- YAML 解析错误：返回结构化错误信息（文件名、行列、错误描述），并在 WebView 中高亮。
- Mock Server 崩溃：Extension 检测到 child process 退出后自动尝试 1 次重启并提示用户；连续失败建议用户查看 Output Channel 并手动重启。
- 端口冲突：自动尝试下一个端口（如 +1），或提示用户修改配置。

---

## 11. 测试计划

### 11.1 单元测试

- YAML parser（正确 / 错误情形）
- Rule 引擎的各种匹配策略
- Route Factory

### 11.2 集成测试

- 使用 Supertest 启动 mock server，验证路由注册与响应
- 文件 watcher + reload 功能的端到端测试（模拟文件修改）

### 11.3 前端测试

- 使用 Vitest/Jest 测试 React 组件与 zustand store
- WebView messageBridge 的消息正确性测试

### 11.4 CI

- GitHub Actions：push/run tests, build webview bundle, lint

---

## 12. 性能目标与监控

- 冷启动（Extension 启动并 start server）< 200ms
- 单文件 YAML 解析 < 20ms
- 支持同时注册 1000+ 路由（高负载下 degrade 提示）

提供内建 Metrics（可选）以输出：路由数、QPS、平均延迟、内存占用等（仅用于本地调试）。

---

## 13. Developer Experience（DX）与可维护性

- 提供 `extension:dev` 脚本：启动 extension host 并使用本地 webview bundle
- WebView 使用 HMR（开发模式），但生产打包为单文件
- 代码分层清晰：`extension/`, `server/`, `webview/`, `tests/`
- 提供详细 README、贡献指南与 schema 文件便于团队接入

---

## 14. 路线图（实现分阶段建议）

- **MVP（Sprint 1）**

  - Sidebar 展示 `.mock` 文件树
  - WebView 编辑单个 YAML（表单 + 保存）
  - 启动/停止 Node Mock Server
  - 基本规则（manual）匹配
  - 文件 watcher + 热更新

- **V1（Sprint 2）**

  - 多规则匹配策略（query/header/body）
  - 日志 & 请求记录 UI
  - YAML schema 校验 & 错误高亮

- **V2**
  - OpenAPI 导入、faker 支持、response preview
  - 权限与团队协作特性（共享模板）

---

## 15. 示例代码片段（关键实现思路）

### 15.1 Extension 中启动 server（伪代码）

```ts
// extension.ts
import { spawn } from "child_process";
function startServer(port: number, mockDir: string) {
  const child = spawn(
    process.execPath,
    ["./server/index.js", `--port=${port}`, `--mockDir=${mockDir}`],
    {
      cwd: extensionPath,
      env: process.env,
    }
  );
  child.stdout.on("data", (d) => outputChannel.appendLine(d.toString()));
  child.stderr.on("data", (d) => outputChannel.appendLine(d.toString()));
  child.on("exit", (code) => handleExit(code));
  return child;
}
```

### 15.2 Server reload endpoint（伪代码）

```js
// server/index.js (fastify)
fastify.post("/__mock/reload", async (req, reply) => {
  try {
    const result = await reloadAllYaml();
    // unregister old routes and register new ones
    await updateRoutes(result.routes);
    reply.send({ ok: true, files: result.files, errors: result.errors });
  } catch (e) {
    reply.code(500).send({ ok: false, error: e.message });
  }
});
```

### 15.3 Rule 策略接口（伪代码）

```ts
interface RuleMatcher {
  match(req: Request, matchSpec: any): boolean;
}

class HeaderMatcher implements RuleMatcher {
  match(req, spec) {
    /* parse spec.expr and compare headers */
  }
}
```

---

## 16. 交付物（Deliverables）

- `docs/TECH.md`（本文件）
- `docs/PRD.md`（已存在）
- Extension scaffold：`extension/`、`webview/`、`server/`
- YAML JSON Schema：`schema/mock-api.schema.json`
- CI 配置与测试套件

---

## 17. 附录：术语表

- **WebView**：VS Code 中内嵌的 HTML+JS 渲染层
- **Extension Host**：运行在 VS Code 的 Node 环境，用于插件逻辑
- **Rule**：YAML 中定义的某个响应样式
