# MockPilot - VS Code Extension

A powerful and intuitive Mock API Server extension for VS Code that helps developers quickly create, manage, and test mock APIs directly within their development environment.

## ✨ Features

- 📁 **YAML-based Configuration** - Simple, version-controllable mock API definitions
- 🚀 **One-Click Server Control** - Start/stop MockPilot server from Status Bar
- 🔄 **Hot Reload** - Automatic reload when configuration files change
- 🎯 **Visual Editor** - User-friendly WebView interface for editing mock APIs
- 📊 **Real-time Status** - Server status display in VS Code Status Bar
- 🧪 **Built-in Testing** - Test APIs directly from the editor
- 📝 **Multiple Response Rules** - Support for different response scenarios
- ⚡ **Zero Configuration** - Works out of the box with sensible defaults

## 🚀 Quick Start

1. **Install the extension** from VS Code Marketplace

2. **Create `.mock` directory** in your project root:

   - Use Command Palette: `MockPilot: Create .mock Directory`
   - Or manually: `mkdir .mock`

3. **Create a mock API configuration** (e.g., `.mock/get_user.yaml`):

```yaml
name: Get User Info
description: Get user information
method: GET
endpoint: /api/user
rules:
  - name: Success
    status: 200
    headers:
      Content-Type: application/json
    body:
      id: 1
      name: John Doe
      email: john@example.com
    delay: 0
```

4. **Start the server**:

   - Click the Status Bar item: `MockPilot: Stopped`
   - Or use Command Palette: `MockPilot: Start Server`

5. **Test your API**:

```bash
curl http://localhost:9527/api/user
```

## 📖 Documentation

For detailed usage instructions, see [USAGE.md](./USAGE.md)

## ⚙️ Configuration

Configure the extension in VS Code settings:

```json
{
  "mockServer.port": 9527, // Server port (default: 9527)
  "mockServer.autoStart": false, // Auto-start server on activation
  "mockServer.mockDirectory": ".mock" // Mock configuration directory
}
```

## 🎮 Commands

Access via Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`):

- `MockPilot: Start Server` - Start the mock server
- `MockPilot: Stop Server` - Stop the mock server
- `MockPilot: Toggle Server` - Toggle server on/off
- `MockPilot: Reload Server` - Reload all configurations
- `MockPilot: Create .mock Directory` - Create mock config directory
- `MockPilot: Test Mock API` - Test a specific API endpoint

## 🎯 Status Bar Integration

The extension adds a Status Bar item showing the server status:

- **Stopped**: `$(debug-stop) MockPilot: Stopped` (yellow background)
- **Running**: `$(server-process) MockPilot: Running (5)` - showing route count

Click the Status Bar item to quickly start/stop the server.

## 📝 YAML Configuration Format

```yaml
name: API Name
description: API Description
method: GET | POST | PUT | DELETE | PATCH | HEAD | OPTIONS
endpoint: /api/path
rules:
  - name: Rule Name
    status: 200
    headers:
      Content-Type: application/json
    body:
      key: value
    delay: 0 # milliseconds
```

## 🔥 Hot Reload

The server automatically reloads when you:

- Modify any `.yaml` or `.yml` file in `.mock` directory
- Create new mock API files
- Delete mock API files

No manual restart required!

## 🛠️ Development

### Prerequisites

- Node.js >= 16
- pnpm (recommended) or npm

### Setup

```bash
git clone <repository>
cd mock-server
pnpm install
```

### Build & Run

```bash
# Development build with watch mode
pnpm run watch-web

# Run in browser
pnpm run run-in-browser

# Production build
pnpm run package-web

# Run tests
pnpm test
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Roadmap

[] Mock data programmatically
[] Mock RPC Server

## 📄 License

MIT License

## 💡 Use Cases

- **Frontend Development** - Mock backend APIs while frontend is under development
- **API Testing** - Test different response scenarios (success, errors, edge cases)
- **Documentation** - Create living API documentation with examples
- **Team Collaboration** - Share mock configurations via version control
- **Offline Development** - Work without backend dependencies

---

**Enjoy mocking!** 🎉

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
