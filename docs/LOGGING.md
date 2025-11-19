# Mock Server Logging

The Mock Server extension now outputs all logs to VS Code's OUTPUT panel for easy monitoring and debugging.

## Features

- **Automatic Logging**: All server activities are automatically logged to the OUTPUT panel
- **Timestamped Entries**: Each log entry includes a timestamp for tracking when events occurred
- **Categorized Messages**: Logs are categorized as INFO, SUCCESS, WARN, ERROR, REQUEST, SERVER, and ROUTE
- **Request Tracking**: HTTP requests are logged with method, path, status code, and response time

## Accessing Logs

### View Logs

1. **Using the Command Palette**:

   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Mock Server: Show Logs"
   - Press Enter

2. **Using the Mock Explorer**:

   - Click the "Show Logs" icon (📋) in the Mock Explorer toolbar

3. **Using the VS Code Panel**:
   - Go to View → Output
   - Select "Mock Server" from the dropdown

### Clear Logs

1. **Using the Command Palette**:

   - Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Mock Server: Clear Logs"
   - Press Enter

2. **Manually**:
   - Open the OUTPUT panel
   - Select "Mock Server" from the dropdown
   - Click the "Clear Output" icon in the panel toolbar

## Log Types

### Server Events

```
[14:30:25] [SERVER] 🚀 Mock Server started on port 9527
[14:30:25] [SERVER] 📋 Registered routes: 3
[14:32:10] [SERVER] 🛑 Mock Server stopped
```

### Route Management

```
[14:30:25] [ROUTE] ✅ Registered: GET /api/users (Get Users)
[14:31:15] [ROUTE] 🔄 Reloaded 3 routes
[14:32:05] [ROUTE] ❌ Unregistered: GET /api/users
```

### HTTP Requests

```
[14:30:45] [REQUEST] ✅ GET /api/users → 200 - 15ms
[14:31:02] [REQUEST] ⚠️ GET /api/missing → 404 - 2ms
[14:31:30] [REQUEST] ❌ POST /api/error → 500 - 120ms
```

### General Information

```
[14:30:20] [INFO] Mock Server extension initialized
[14:30:25] [INFO] 📁 Mock directory: .mock
[14:30:40] [SUCCESS] ✅ Server started successfully
```

### Warnings and Errors

```
[14:31:50] [WARN] ⚠️ Mock server is already running
[14:32:15] [ERROR] ❌ Error starting server
```

## Log Format

Each log entry follows this format:

```
[HH:MM:SS] [CATEGORY] [EMOJI] Message
```

- **Timestamp**: 24-hour format (HH:MM:SS)
- **Category**: INFO, SUCCESS, WARN, ERROR, REQUEST, SERVER, or ROUTE
- **Emoji**: Visual indicator of the event type
- **Message**: Detailed information about the event

## Status Code Indicators

Request logs include emoji indicators based on HTTP status codes:

- ✅ **2xx Success** (200-299): Successful responses
- ↪️ **3xx Redirect** (300-399): Redirection responses
- ⚠️ **4xx Client Error** (400-499): Client-side errors
- ❌ **5xx Server Error** (500-599): Server-side errors

## Request Timing

All HTTP requests include response time in milliseconds:

```
[14:30:45] [REQUEST] ✅ GET /api/users → 200 - 15ms
```

This helps identify slow endpoints and performance issues.

## Tips

1. **Keep Logs Open**: Keep the OUTPUT panel open while testing to monitor requests in real-time
2. **Clear Regularly**: Clear logs periodically to keep the view manageable
3. **Check for Errors**: Red ERROR messages indicate issues that need attention
4. **Monitor Performance**: Watch response times to identify slow endpoints
5. **Debugging**: Use logs to debug routing issues and rule matching

## Automatic Features

- Logs are automatically limited to the last 1000 request entries to prevent memory issues
- Both console output and OUTPUT panel receive the same messages
- Logs persist while VS Code is running but are cleared when the extension reloads
