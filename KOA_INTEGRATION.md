# Mock Server with Koa.js Integration

## 集成完成 ✅

已成功集成 Koa.js 实现真正的 HTTP Mock Server！

### 主要变更

1. **安装依赖**

   - `koa` - Web 框架
   - `@koa/router` - 路由
   - `@koa/cors` - CORS 支持
   - `koa-bodyparser` - 请求体解析

2. **架构调整**

   - **桌面版** (`src/extension.ts`): 使用真实的 Koa.js HTTP 服务器
   - **Web 版** (`src/web/extension.ts`): 保留原有的内存模拟实现
   - 共享接口 `IServerManager` 确保两个版本 API 一致

3. **目录结构**

   ```
   src/
   ├── extension.ts (桌面版入口)
   ├── desktop/
   │   ├── mockServer.ts (Koa.js实现)
   │   ├── ruleEngine.ts
   │   └── services/
   │       └── serverManagerService.ts
   ├── web/ (Web版)
   │   ├── extension.ts
   │   ├── server/ (内存模拟)
   │   └── services/
   └── common/
       └── IServerManager.ts (共享接口)
   ```

4. **Koa.js 功能**
   - ✅ 真实的 HTTP 服务器，监听指定端口
   - ✅ 支持 GET/POST/PUT/DELETE/PATCH 方法
   - ✅ CORS 跨域支持
   - ✅ 请求体解析
   - ✅ 路由匹配和规则引擎
   - ✅ 请求日志记录
   - ✅ 延迟响应支持
   - ✅ 健康检查端点 `/_health`
   - ✅ 热重载支持

### 使用方法

#### 在 VS Code 桌面版中

1. 启动扩展（按 F5 调试）
2. 在工作区创建 `.mock` 目录
3. 添加 YAML 配置文件
4. 执行命令 `Mock Server: Start Server`
5. 访问 `http://localhost:9527`

#### 测试 Mock API

```bash
# 健康检查
curl http://localhost:9527/_health

# 调用 mock API (根据你的配置)
curl http://localhost:9527/api/users
curl -X POST http://localhost:9527/api/login -H "Content-Type: application/json" -d '{"username":"admin"}'
```

### 配置示例

`.mock/user-api.yaml`:

```yaml
name: User API
method: GET
endpoint: /api/users
rules:
  - name: success
    status: 200
    headers:
      Content-Type: application/json
    body:
      - id: 1
        name: John Doe
      - id: 2
        name: Jane Smith
    delay: 0
```

### 编译和运行

```bash
# 编译桌面版
pnpm run compile

# 编译 Web 版
pnpm run compile-web

# 开发模式（桌面版）
pnpm run watch

# 开发模式（Web版）
pnpm run watch-web
```

### package.json 配置

- `"main": "./dist/extension.js"` - 桌面版入口
- `"browser": "./dist/web/extension.js"` - Web 版入口

扩展会根据运行环境自动选择合适的实现。

### 下一步

可以添加更多功能：

- [ ] WebSocket 支持
- [ ] 文件上传/下载模拟
- [ ] 更高级的规则匹配
- [ ] 请求/响应拦截器
- [ ] Mock 数据生成器
- [ ] 性能监控面板
