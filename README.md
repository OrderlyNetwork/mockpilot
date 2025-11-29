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
- 🤖 **AI-Powered Mock Generation** - Generate mock rules using your IDE's AI (Copilot, Cursor, etc.)
- 🎯 **Claude Skill Auto-Installation** - Automatically installs a specialized Claude Skill for generating mock rules

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

MockPilot is designed to work seamlessly with your IDE's AI capabilities (such as **GitHub Copilot**, **Cursor**, **Claude in VS Code**, etc.) to help you generate mock API configurations using natural language descriptions.

**Special Feature**: When you install MockPilot, it automatically installs a dedicated **Claude Skill** that's specifically trained to generate mock API configurations following MockPilot's YAML format standards. This ensures optimal AI-generated outputs when using Claude.

### How It Works

Instead of providing a built-in AI command, MockPilot leverages your existing IDE AI tools. You simply describe your API requirements using a structured prompt template, and your AI assistant will generate the YAML configuration. MockPilot then manages and serves these mock APIs.

### Using AI to Generate Mock Rules

#### 1. **Prerequisites**

- Have an AI assistant enabled in your IDE:
  - **VS Code**: GitHub Copilot, Claude, or other AI extensions
  - **Cursor**: Built-in AI capabilities
  - **Other IDEs**: Any AI coding assistant
- MockPilot extension installed (includes auto-installed Claude Skill for Claude users)
- A project with a `.mock` directory

#### 2. **Using Claude Skill (Auto-Installed)**

If you're using Claude in VS Code, MockPilot automatically installs a specialized Claude Skill on first activation. This skill is optimized for generating MockPilot-compatible YAML configurations.

**Simply ask Claude:**

```
Generate a mock API for [your requirement]
```

The skill understands MockPilot's format and will generate properly structured YAML configurations automatically.

#### 3. **Prompt Template (For Other AI Assistants)**

Use this template with your AI assistant to generate mock rules:

```
Create a mock API YAML configuration with the following requirements:
- Method: [GET/POST/PUT/DELETE/etc.]
- Endpoint: [/api/path]
- Description: [What this API does]
- Response scenarios: [success, error cases, edge cases]
- Data structure: [describe the expected response format]

Format the output as a YAML file following this structure:
name: [API Name]
description: [API Description]
method: [HTTP Method]
endpoint: [API Path]
rules:
  - name: [Rule Name]
    status: [HTTP Status Code]
    headers:
      Content-Type: application/json
    body:
      [response body]
    delay: [milliseconds]
```

#### 4. **Example Usage**

**Prompt to your AI assistant:**

```
Create a mock API YAML configuration with the following requirements:
- Method: GET
- Endpoint: /v1/positions
- Description: Get all trading positions information
- Response scenarios:
  1. Success with positions data
  2. Success with empty positions
- Data structure: Include margin ratios, collateral info, and position details with symbol, quantity, price, and PnL
```

#### 5. **Workflow**

1. **Ask your AI assistant** using the prompt template above
2. **AI generates the YAML** configuration based on your requirements
3. **Save the file** in your `.mock` directory (e.g., `.mock/get_positions.yaml`)
4. **MockPilot automatically detects** the new file and reloads
5. **Test your API** immediately using the mock server

#### 6. **AI Generation Capabilities**

Your AI assistant can help you create:

- **Complete Mock APIs** - From endpoint definition to response bodies
- **Multiple Rules** - Different scenarios (success, errors, edge cases)
- **Realistic Data** - Sample user data, product catalogs, financial data, etc.
- **Complex Structures** - Nested objects, arrays, and relationships
- **Headers and Delays** - Simulate real-world API behavior
- **RESTful Patterns** - Follow REST conventions automatically

#### 7. **Example Generated Output**

**Your AI assistant will generate:**

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

**Then simply:**

1. Save this as `.mock/get_positions.yaml`
2. MockPilot automatically loads it
3. Start testing at `http://localhost:9527/v1/positions`

#### 8. **Best Practices**

- **Be Specific**: Provide clear descriptions of expected responses
- **Include Scenarios**: Mention different cases (success, errors, edge cases)
- **Specify Data Types**: Indicate if you need numbers, dates, booleans, etc.
- **Mention Constraints**: Include any validation rules or business logic
- **Review Output**: Always review AI-generated configs before using
- **Iterate**: Refine your prompt if the output needs adjustments

### Benefits of AI-Assisted Generation

- ⚡ **Save Time**: Generate complex mock rules in seconds
- 🎯 **Claude Skill Integration**: Auto-installed skill ensures optimal results with Claude
- 🤝 **Use Your Preferred AI**: Works with Copilot, Cursor, Claude, or any AI assistant
- 📚 **Best Practices**: AI follows YAML and REST conventions
- 🎯 **Comprehensive**: Automatically includes multiple scenarios
- 🔄 **Iterative**: Easily refine by adjusting your prompt
- 📖 **Learning Tool**: Learn proper mock API structure from examples
- 🎨 **Flexibility**: Combine AI generation with manual editing as needed

### MockPilot's Role

MockPilot focuses on what it does best:

- 📁 **Managing** your mock configurations
- 🚀 **Serving** mock APIs with hot reload
- 🎯 **Testing** APIs directly from VS Code
- 📊 **Monitoring** server status and routes

You bring the AI tool you're already comfortable with, and MockPilot handles the rest!

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
