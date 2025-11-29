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
- 🤖 **AI-Powered Mock Generation** - Generate mock rules using Claude AI with natural language

## 🚀 Quick Start

1. **Install the extension** from VS Code Marketplace

2. **Create `.mock` directory** in your project root:

   - Use Command Palette: `MockPilot: Create .mock Directory`
   - Or manually: `mkdir .mock`

3. **Create a mock API configuration** (e.g., `.mock/get_positions.yaml`):

```yaml
name: Get All Positions Info
description: Get all trading positions information
method: GET
endpoint: /v1/positions
rules:
  - name: Success
    status: 200
    headers:
      Content-Type: application/json
    body:
      success: true
      timestamp: 1702989203989
      data:
        current_margin_ratio_with_orders: 1.2385
        free_collateral: 450315.09115
        total_collateral_value: 489865.71329
        rows:
          - symbol: PERP_BTC_USDC
            position_qty: -5
            average_open_price: 27908.14386047
            mark_price: 27794.9
            unsettled_pnl: 354.858492
            leverage: 10
    delay: 0
```

4. **Start the server**:

   - Click the Status Bar item: `MockPilot: Stopped`
   - Or use Command Palette: `MockPilot: Start Server`

5. **Test your API**:

```bash
curl http://localhost:9527/v1/positions
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
- `MockPilot: Generate Mock with AI` - Generate mock rules using Claude AI

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

## 🤖 AI-Powered Features

MockPilot integrates with **Claude Skills** to provide intelligent mock API generation capabilities. This feature allows you to describe your API requirements in natural language and let AI generate the corresponding mock rules automatically.

### What are Claude Skills?

Claude Skills is a powerful AI integration that allows VS Code extensions to leverage Claude AI's capabilities directly within the development environment. MockPilot uses Claude Skills to understand your API requirements and generate accurate, well-structured mock configurations.

### How to Use AI to Generate Mock Rules

#### 1. **Prerequisites**

- Install the Claude AI extension in VS Code (if required)
- Ensure you have an active Claude API key configured
- Open a project with MockPilot installed

#### 2. **Generate Mock Rules with Natural Language**

You can generate mock rules by simply describing what you need:

**Example 1: Trading Positions API**

```
Create a GET endpoint for /v1/positions that returns trading positions with margin ratios, collateral info, and position details including symbol, quantity, price, and PnL
```

**Example 2: Complex E-commerce API**

```
Create a POST endpoint for /api/orders with the following scenarios:
1. Success case: returns order ID, status, and total
2. Invalid payment: returns 400 error
3. Out of stock: returns 409 error with available quantity
```

**Example 3: Authentication API**

```
Create mock rules for login endpoint:
- POST /api/auth/login
- Success: return JWT token and user info
- Invalid credentials: return 401 error
- Account locked: return 403 error
```

#### 3. **Using the Command**

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Run: `MockPilot: Generate Mock with AI`
3. Describe your API requirements in the input box
4. AI will generate the YAML configuration automatically
5. Review and save the generated mock rule

#### 4. **AI Generation Features**

The AI assistant can help you:

- **Generate Complete Mock APIs** - From endpoint definition to response bodies
- **Create Multiple Rules** - Different scenarios (success, errors, edge cases)
- **Generate Realistic Data** - Sample user data, product catalogs, etc.
- **Handle Complex Structures** - Nested objects, arrays, and relationships
- **Add Headers and Delays** - Simulate real-world API behavior
- **Create RESTful Patterns** - Follow REST conventions automatically

#### 5. **Example Generated Output**

Given the prompt: "Create a GET endpoint for positions info at /v1/positions with success and empty positions cases"

The AI will generate:

```yaml
name: Get All Positions Info
description: Get all trading positions information
method: GET
endpoint: /v1/positions
rules:
  - name: Success - With Positions
    status: 200
    headers:
      Content-Type: application/json
    body:
      success: true
      timestamp: 1702989203989
      data:
        current_margin_ratio_with_orders: 1.2385
        free_collateral: 450315.09115
        initial_margin_ratio: 0.1
        maintenance_margin_ratio: 0.05
        margin_ratio: 1.2385
        total_collateral_value: 489865.71329
        total_pnl_24_h: 0
        rows:
          - symbol: PERP_BTC_USDC
            position_qty: -5
            average_open_price: 27908.14386047
            mark_price: 27794.9
            unsettled_pnl: 354.858492
            leverage: 10
            imr: 0.1
            mmr: 0.05
    delay: 100

  - name: Success - No Positions
    status: 200
    headers:
      Content-Type: application/json
    body:
      success: true
      timestamp: 1702989203989
      data:
        current_margin_ratio_with_orders: 0
        free_collateral: 0
        total_collateral_value: 0
        rows: []
    delay: 50
```

#### 6. **Best Practices**

- **Be Specific**: Provide clear descriptions of expected responses
- **Include Scenarios**: Mention different cases (success, errors, edge cases)
- **Specify Data Types**: Indicate if you need numbers, dates, booleans, etc.
- **Mention Constraints**: Include any validation rules or business logic
- **Review Output**: Always review AI-generated configs before using in production

### Benefits of AI Generation

- ⚡ **Save Time**: Generate complex mock rules in seconds
- 📚 **Best Practices**: AI follows YAML and REST conventions
- 🎯 **Comprehensive**: Automatically includes multiple scenarios
- 🔄 **Iterative**: Easily refine by providing more context
- 📖 **Learning Tool**: Learn proper mock API structure from examples

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
