# MockPilot - 产品需求文档（PRD）

## 1. 概述（Overview）

MockPilot 是一个 VS Code 插件，旨在为开发者提供一种在本地项目中快速、可视化、可配置地构建 Mock API 服务的方式。  
插件基于项目根目录下的 `.mock/` 配置目录，加载其中的 `.yaml` 文件，并在 VS Code 中以 WebView + Sidebar 的方式提供：

- API 配置可视化管理
- 本地 mock server 启动与自动刷新
- 多响应规则（Rules）的智能匹配与模拟
- 适配前端/后端开发的轻量 mock API 体验

适用于：前端工程师、后端工程师、测试工程师。

---

## 2. 目标与价值（Goals & Values）

### 2.1 插件提供的价值

- 提供 API 未完成时的快速开发能力
- 集中管理 Mock API，无需使用额外工具
- YAML 配置可版本化，适合多人协作
- WebView 提供可视化编辑界面，降低 YAML 配置门槛
- Mock 服务本地可控、可读、可追踪

### 2.2 成功指标（Success Metrics）

| 指标              | 描述                               |
| ----------------- | ---------------------------------- |
| 配置加载成功率    | ≥99% 的 YAML 文件可成功解析        |
| 入口操作简单度    | 用户可在 30 秒内完成 Mock 接口创建 |
| Mock 服务启动性能 | 冷启动耗时 < 200ms                 |
| 匹配准确率        | Mock API 响应规则匹配 ≥ 99%        |

---

## 3. 用户场景（User Scenarios）

### 场景 1：前端调试未完成的接口

用户在 VS Code 内查看 Mock API → 启动 MockPilot → 前端请求指向 `localhost:9527` → 快速完成调试。

### 场景 2：创建新 API Mock

右键 `.mock` → “新建 Mock API” → WebView 自动生成 YAML → 编辑并保存。

### 场景 3：给同一 API 添加多个响应规则

用户通过 WebView 添加/切换 rule，例如正常返回、错误返回、延迟返回等。

### 场景 4：版本控制

所有 `.yaml` 文件可提交到 Git，全团队共享 Mock 配置。

---

## 4. 系统架构（Architecture）

```
VS Code Extension
       |
       ├── Sidebar View：展示 .mock/ 下 YAML 文件树
       ├── WebView Panel：用于编辑 API Mock 配置
       ├── File System Watcher：监听 YAML 更新
       ├── Mock Server（Node.js）
       |       ├── 解析 YAML
       |       ├── 注册 API 路由
       |       ├── 匹配规则并返回响应
       └── Commands：Start / Stop Server, New API, Refresh
```

---

## 5. 功能需求（Functional Requirements）

# 5.1 `.mock` 目录规范

## 5.1.1 目录结构

```
project-root/
  ├── src/
  ├── .mock/
  │     ├── get_user.yaml
  │     ├── update_profile.yaml
  │     ├── login.yaml
```

## 5.1.2 YAML 文件结构

```yaml
name: Get User Info
description: 获取用户基本信息
method: GET
endpoint: /api/user
rules:
  - name: 正常返回
    status: 200
    headers:
      Content-Type: application/json
    body:
      id: 1
      name: Leo
    delay: 0

  - name: Token 过期
    status: 401
    headers:
      Content-Type: application/json
    body:
      error: "Token expired"
    delay: 300
```

字段说明：

| 字段        | 类型         | 描述         |
| ----------- | ------------ | ------------ |
| name        | string       | API 名称     |
| description | string       | 说明         |
| method      | GET/POST/... | 方法         |
| endpoint    | string       | 请求路径     |
| rules       | Rule[]       | 响应规则数组 |

---

# 5.2 Mock Server 功能

## 5.2.1 启动/停止

- 用户可从 Activity Bar / Command Palette 启动
- 默认监听端口 `9527`（可修改）
- 支持热更新（监听文件变化）

## 5.2.2 路由注册

- 所有 YAML 自动生成路由，无需额外代码

## 5.2.3 Rule 匹配策略

第一版本支持：

- UI 手动选择当前激活的 rule

后续版本：

- 基于 URL query 条件匹配
- 基于 header 匹配

---

# 5.3 VS Code UI

---

## 5.3.1 Activity Bar 图标

添加一个独立图标"MockPilot"，点击后进入插件主界面。

---

## 5.3.2 Sidebar：Mock 文件管理 TreeView

功能包括：

| 功能                    | 描述              |
| ----------------------- | ----------------- |
| 展示 `.mock` 文件       | 树状展示所有 YAML |
| 点击文件 → WebView 编辑 | 可视化地编辑      |
| 右键：新建 API          | 自动创建模板      |
| 右键：删除              | 删除 YAML 文件    |
| 自动刷新                | 监听文件系统      |

---

## 5.3.3 WebView：API 编辑界面

包含：

### API 基本信息编辑

- name
- description
- method
- endpoint

### Rules 编辑

- 规则列表
- 添加规则
- 编辑 status、headers、body、delay
- 删除规则
- 设置当前激活 rule

### YAML preview（只读）

---

# 5.4 配置（Settings）

| Key                      | 描述          | 默认    |
| ------------------------ | ------------- | ------- |
| mockServer.port          | 本地端口      | 9527    |
| mockServer.autoStart     | 自动启动      | false   |
| mockServer.mockDirectory | mock 配置路径 | `.mock` |

---

## 6. 用户流程（User Flow）

---

### 流程 1：加载 Mock 配置

1. 打开项目
2. 自动扫描 `.mock`
3. 解析 YAML → Sidebar 展示
4. 点击某个 API → WebView 打开

---

### 流程 2：编辑保存 YAML

1. 用户编辑 UI
2. 点击保存
3. 写入 YAML
4. Mock Server 自动 reload

---

### 流程 3：运行 MockPilot

1. 点击 Start
2. Node mock server 启动
3. 根据 YAML 注册路由
4. 前端访问 → 返回 Mock 响应

---

## 7. 非功能需求（NFR）

### 性能

- 启动 < 200ms
- 单文件 YAML 解析 < 20ms

### 稳定性

- YAML 错误需提示
- Mock Server crash 自动重启

### 兼容性

- macOS / Windows / Linux
- VS Code ≥ 1.80

---

## 8. 后续迭代（Roadmap）

- 支持 OpenAPI 导入
- 支持 faker.js 生成随机数据
- 支持 response preview
- 支持请求日志
- 支持条件匹配 rule
- 内置 API 测试器（send request）

---

## 9. 附录：YAML 新建模板

```yaml
name: API Name
description: Description here
method: GET
endpoint: /api/example
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
```
