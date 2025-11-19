# Active Rule Fix Summary

## 问题根因

Mock Server 没有使用 `activeRuleIndex` 响应请求的根本原因：

**`setupRoutes()` 方法中的 Koa 路由处理器直接使用 `RuleEngine.findMatchingRule()` 查找规则，完全忽略了 `activeRuleIndex` 配置。**

### 代码路径分析

1. **HTTP 请求流程** (真实请求):

   - Koa 接收 HTTP 请求
   - 调用 `setupRoutes()` 中注册的路由处理器
   - ❌ 该处理器使用 `RuleEngine.findMatchingRule()` 忽略 `activeRuleIndex`

2. **测试 API 流程** (内置测试按钮):
   - 调用 `handleRequest()` 方法
   - ✅ 该方法正确使用 `activeRuleIndex`
   - ✅ 有详细日志输出

### 为什么之前没有日志？

- 之前添加的日志在 `handleRequest()` 中
- 但真实 HTTP 请求走的是 `setupRoutes()` 中的处理器
- 只有"测试 API"功能才会调用 `handleRequest()`

## 修复内容

### 1. 修复 `setupRoutes()` 方法

**文件**: `src/desktop/mockServer.ts`

将 Koa 路由处理器的逻辑改为与 `handleRequest()` 一致：

```typescript
// 优先使用 activeRuleIndex
const activeRuleIndex = config.activeRuleIndex ?? 0;
let rule: MockRule | undefined;

if (config.rules && config.rules.length > activeRuleIndex) {
  rule = config.rules[activeRuleIndex];
  this.logger.info(
    `[HTTP] Using active rule "${rule.name}" (index: ${activeRuleIndex}) for ${method} ${ctx.path}`
  );
} else {
  // 回退到 RuleEngine 匹配
  rule =
    RuleEngine.findMatchingRule(config.rules || [], matchContext) || undefined;
}
```

### 2. 添加详细日志

每个 HTTP 请求现在会输出：

- `[HTTP] Using active rule "..." (index: n)` - 使用激活规则
- `[HTTP] Using matched rule "..." (index: n)` - 或使用匹配规则
- `[HTTP response] GET /path -> rule="..." index=n activeRuleIndex=n status=200 delay=0` - 最终响应详情
- `[HTTP] No rule found...` - 如果没有找到规则的警告

### 3. 前端修复 (之前已完成)

**文件**: `src/web/components/mock-api-panel.tsx`

- ✅ 点击 "Set Active" 时发送 `setActiveRule` 消息到扩展
- ✅ 保存时包含 `activeRuleIndex` 字段到 YAML

## 验证步骤

### 1. 重启扩展

按 `F5` 或重新加载窗口使新编译的代码生效。

### 2. 启动 Mock Server

执行命令: `Mock Server: Start Server`

### 3. 设置激活规则

1. 打开某个 Mock API 配置文件
2. 点击某个非第一个规则的 "Set Active" 按钮
3. 点击 "Save" 保存

### 4. 发送请求

使用任何 HTTP 客户端请求该接口，例如：

```bash
curl http://localhost:9527/your/endpoint
```

### 5. 查看日志

打开 OUTPUT 面板，选择 "Mock Server"，你会看到：

```
[HH:MM:SS] [HTTP] Using active rule "Rule 2" (index: 1) for GET /your/endpoint
[HH:MM:SS] [HTTP response] GET /your/endpoint -> rule="Rule 2" index=1 activeRuleIndex=1 status=200 delay=0
[HH:MM:SS] [REQUEST] ✅ GET /your/endpoint → 200 - 5ms
```

## 编译状态

✅ 代码已成功编译到 `dist/extension.js`
✅ 日志代码已验证存在于编译输出中
✅ TypeScript 检查通过
✅ ESLint 检查通过

## 下一步

需要你：

1. 重启/重新加载扩展 (F5 或 Developer: Reload Window)
2. 重启 Mock Server
3. 测试真实 HTTP 请求并查看日志输出
