# Mock Server - 使用指南

## 🚀 快速开始

### 1. 创建 `.mock` 目录

在你的项目根目录创建 `.mock` 目录来存放 Mock API 配置：

```bash
mkdir .mock
```

或者使用 VS Code 命令面板（`Cmd+Shift+P`）执行：`Mock Server: Create .mock Directory`

### 2. 创建 Mock API 配置文件

在 `.mock` 目录下创建 YAML 文件，例如 `get_user.yaml`：

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
      email: leo@example.com
    delay: 0

  - name: 未找到用户
    status: 404
    headers:
      Content-Type: application/json
    body:
      error: User not found
    delay: 0
```

### 3. 启动 Mock Server

有三种方式启动服务器：

1. **使用 Status Bar**：点击 VS Code 底部状态栏的"Mock Server: Stopped"按钮
2. **使用命令面板**：`Cmd+Shift+P` → `Mock Server: Start Server`
3. **使用侧边栏按钮**：点击 Mock Server 侧边栏的播放按钮

启动成功后：

- Status Bar 会显示：`$(server-process) Mock Server: Running (X)` 其中 X 是加载的路由数
- 会弹出通知：`🚀 Mock Server started on port 9527 with X routes`

### 4. 停止 Mock Server

同样有三种方式：

1. **使用 Status Bar**：点击状态栏的"Mock Server: Running"按钮
2. **使用命令面板**：`Cmd+Shift+P` → `Mock Server: Stop Server`

停止后 Status Bar 会显示：`$(debug-stop) Mock Server: Stopped` (带黄色背景)

### 5. 测试 Mock API

#### 方式 1：使用浏览器或 Postman

```bash
# GET 请求
curl http://localhost:9527/api/user

# POST 请求
curl -X POST http://localhost:9527/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"leo","password":"123456"}'
```

#### 方式 2：使用 VS Code 内的测试按钮

在 Mock API 编辑器中点击"Test API"按钮即可快速测试。

## 📝 YAML 配置详解

### 基本结构

```yaml
name: API名称
description: API描述
method: GET | POST | PUT | DELETE | PATCH | HEAD | OPTIONS
endpoint: /api/path
rules:
  - name: 规则名称
    status: HTTP状态码
    headers:
      Header-Name: value
    body: 响应体
    delay: 延迟毫秒数
```

### 字段说明

| 字段          | 类型   | 必填 | 说明               |
| ------------- | ------ | ---- | ------------------ |
| `name`        | string | ✅   | API 名称，用于标识 |
| `description` | string | ❌   | API 描述信息       |
| `method`      | string | ✅   | HTTP 方法          |
| `endpoint`    | string | ✅   | API 端点路径       |
| `rules`       | array  | ✅   | 响应规则列表       |

### Rules 字段说明

| 字段      | 类型   | 必填 | 说明                                          |
| --------- | ------ | ---- | --------------------------------------------- |
| `name`    | string | ✅   | 规则名称                                      |
| `status`  | number | ✅   | HTTP 状态码（200, 404, 500 等）               |
| `headers` | object | ❌   | 响应头，默认 `Content-Type: application/json` |
| `body`    | any    | ✅   | 响应体，可以是对象或字符串                    |
| `delay`   | number | ❌   | 响应延迟（毫秒），默认 0                      |

### 示例配置

#### 1. 简单 GET 请求

```yaml
name: Get Products
description: 获取产品列表
method: GET
endpoint: /api/products
rules:
  - name: Success
    status: 200
    body:
      - id: 1
        name: Product A
        price: 99.99
      - id: 2
        name: Product B
        price: 149.99
    delay: 0
```

#### 2. POST 请求（登录）

```yaml
name: User Login
description: 用户登录接口
method: POST
endpoint: /api/login
rules:
  - name: 登录成功
    status: 200
    body:
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      user:
        id: 1
        username: admin
    delay: 0

  - name: 用户名密码错误
    status: 401
    body:
      error: Invalid credentials
    delay: 0
```

#### 3. 模拟延迟响应

```yaml
name: Slow API
description: 模拟慢速API
method: GET
endpoint: /api/slow
rules:
  - name: Slow Response
    status: 200
    body:
      message: This response is delayed
    delay: 3000 # 3秒延迟
```

#### 4. 自定义响应头

```yaml
name: Custom Headers
description: 自定义响应头示例
method: GET
endpoint: /api/custom
rules:
  - name: With Custom Headers
    status: 200
    headers:
      Content-Type: application/json
      X-Custom-Header: custom-value
      Cache-Control: no-cache
    body:
      message: Response with custom headers
    delay: 0
```

## 🎯 常用命令

### 命令面板命令（`Cmd+Shift+P`）

- `Mock Server: Start Server` - 启动 Mock 服务器
- `Mock Server: Stop Server` - 停止 Mock 服务器
- `Mock Server: Reload Server` - 重新加载所有配置
- `Mock Server: Get Server Status` - 获取服务器状态
- `Mock Server: Create .mock Directory` - 创建.mock 目录

### 侧边栏功能

- **刷新按钮** - 刷新 Mock API 列表
- **添加按钮** - 创建新的 Mock API
- **播放按钮** - 启动/停止服务器
- **右键菜单**：
  - Open Mock API - 打开编辑器
  - Delete Mock API - 删除配置

## ⚙️ 配置选项

在 VS Code 设置中（`settings.json`）可配置：

```json
{
  "mockServer.port": 9527, // 服务器端口
  "mockServer.autoStart": false, // 是否自动启动
  "mockServer.mockDirectory": ".mock" // Mock配置目录
}
```

## 🔥 热重载

Mock Server 支持热重载功能：

- 当你修改`.mock`目录下的 YAML 文件时
- 当你添加新的 YAML 文件时
- 当你删除 YAML 文件时

如果服务器正在运行，会自动重新加载配置，无需手动重启！

## 📊 服务器状态

服务器状态会实时显示在 VS Code 底部的 Status Bar 上：

### 停止状态

- 图标：`$(debug-stop)`
- 文本：`Mock Server: Stopped`
- 背景：黄色警告背景
- Tooltip：`Mock Server is stopped\nClick to start`

### 运行状态

- 图标：`$(server-process)`
- 文本：`Mock Server: Running (X)` - X 是加载的路由数量
- 背景：默认背景
- Tooltip：`Mock Server is running on port 9527\nX routes loaded\nClick to stop`

点击 Status Bar 项可快速切换服务器启动/停止状态。

## 🐛 常见问题

### Q: 端口被占用怎么办？

A: 修改 `mockServer.port` 配置到其他端口：

```json
{
  "mockServer.port": 3000
}
```

### Q: Mock Server 没有自动重载？

A: 确保：

1. 服务器正在运行
2. 修改的是 `.mock` 目录下的 `.yaml` 或 `.yml` 文件
3. 检查 VS Code 输出面板是否有错误信息

### Q: 如何调试请求？

A: 查看 VS Code 的输出面板（Output），选择"Mock Server"频道查看详细日志。

### Q: 支持哪些 HTTP 方法？

A: 支持所有标准 HTTP 方法：

- GET
- POST
- PUT
- DELETE
- PATCH
- HEAD
- OPTIONS

## 💡 最佳实践

### 1. 文件组织

按功能模块组织 Mock 文件：

```
.mock/
├── auth/
│   ├── login.yaml
│   └── logout.yaml
├── user/
│   ├── get_user.yaml
│   └── update_user.yaml
└── products/
    ├── list_products.yaml
    └── get_product.yaml
```

### 2. 规则命名

使用清晰的规则名称：

```yaml
rules:
  - name: 成功返回-管理员用户
    ...
  - name: 成功返回-普通用户
    ...
  - name: 错误-权限不足
    ...
```

### 3. 版本控制

将 `.mock` 目录提交到 Git，让团队共享 Mock 配置：

```bash
git add .mock/
git commit -m "Add mock API configurations"
```

### 4. 环境变量

在不同环境使用不同的端口：

```json
// .vscode/settings.json (开发环境)
{
  "mockServer.port": 9527
}

// 生产环境使用真实API
```

## 🚧 路线图

- [ ] 支持高级规则匹配（query、header、body）
- [ ] 支持 CORS 配置
- [ ] 支持 HTTPS
- [ ] 请求日志查看器
- [ ] Mock 数据生成器
- [ ] 支持导入 Postman/Swagger

## 📄 许可证

MIT License
