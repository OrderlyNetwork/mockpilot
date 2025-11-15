# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **VS Code Web Extension** project called "mock-server" that provides developers with a visual mock API server within VS Code. The extension loads mock API configurations from `.mock/` directory containing YAML files and provides a visual interface for managing mock APIs and running a local mock server.

**Current Status**: Early development (scaffolding phase) - basic extension structure is in place but core mock server functionality is not yet implemented.

## Development Commands

### Build & Development
- `pnpm run compile-web` - Type checking, linting, and compilation for development
- `pnpm run watch-web` - Concurrent watching with esbuild and TypeScript compiler for development
- `pnpm run package-web` - Production build with minification
- `pnpm run check-types` - TypeScript type checking only
- `pnpm run lint` - ESLint code quality checks

### Testing & Running
- `pnpm test` - Run web extension tests in Chromium browser
- `pnpm run run-in-browser` - Launch extension in browser environment for development/debugging

## Architecture & Technology Stack

### Extension Framework
- **VS Code Web Extension** (TypeScript) - Runs in browser environment, not Node.js
- **Build System**: esbuild with custom configuration for browser compatibility
- **Package Manager**: pnpm
- **Testing**: Mocha with VS Code test runner (@vscode/test-web)

### Build Configuration (esbuild.js)
- Outputs to `dist/web/` directory
- Supports development (`--watch`) and production (`--production`) modes
- Includes Node.js polyfills for browser compatibility (process, buffer, global)
- Custom plugins for test bundling and VS Code problem matching

### Current Code Structure
```
src/
├── web/
│   ├── extension.ts           # Main extension entry point
│   └── test/
│       └── suite/
│           ├── extension.test.ts    # Basic test suite
│           └── mochaTestRunner.ts   # Test runner setup
```

## Planned Architecture (From Documentation)

The project has comprehensive technical documentation outlining the planned architecture:

### Extension Components (To Be Implemented)
- **Sidebar TreeView** for `.mock/` file management
- **WebView** with React UI for visual API editing
- **File System Watcher** for hot reload
- **Mock Server Manager** process

### Server Components (To Be Implemented)
- **Node.js-based mock server** (Fastify/Express)
- **Route Registry** for API endpoints
- **Rule Engine** for response matching
- **Admin endpoints** for hot reload

### UI Components (To Be Implemented)
- **React + TypeScript + Tailwind CSS**
- **Zustand** for state management
- **Monaco Editor** for JSON/YAML editing

## Configuration

### Mock Directory Structure
The extension will use a `.mock/` directory in the project root containing YAML files:

```yaml
# .mock/get_user.yaml
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
```

### VS Code Extension Settings (Planned)
- `mockServer.port` - Local server port (default: 9527)
- `mockServer.autoStart` - Auto-start server (default: false)
- `mockServer.mockDirectory` - Mock config path (default: `.mock`)

## Key Implementation Notes

### Web Extension Constraints
- This is a **web extension**, not a Node.js extension
- Must run in browser environment with proper polyfills
- File system access through VS Code API only
- Cannot directly spawn processes - will need alternative approach for mock server

### File Operations
- All file I/O must go through VS Code Extension API (`vscode.workspace.fs`)
- WebView cannot directly access file system for security
- YAML parsing and validation should happen in extension context

### Communication Patterns
- Extension ↔ WebView: `postMessage` API with typed message envelopes
- Extension ↔ Mock Server: HTTP admin endpoints (`/__mock/reload`, `/__mock/status`)
- File System Watcher: VS Code workspace file system events

### Error Handling Strategy
- YAML parsing errors should be captured and displayed in UI
- Mock server crashes should trigger automatic restart with user notification
- Port conflicts should auto-resolve or prompt for configuration changes

## Development Workflow

### Making Changes
1. Use `pnpm run watch-web` for development with hot reload
2. Test changes with `pnpm run run-in-browser`
3. Run tests with `pnpm test`
4. Build production version with `pnpm run package-web`

### Testing
- Test files follow pattern `*.test.ts`
- Tests run in Chromium via `@vscode/test-web`
- Current basic test suite can be extended as functionality grows

## Next Development Steps

Based on the technical documentation, the implementation priorities are:

1. **Sidebar TreeView** - Display and manage `.mock/` YAML files
2. **WebView React Interface** - Visual API editing interface
3. **YAML Parser** - Load and validate mock configurations
4. **Mock Server** - HTTP server with route registration and rule matching
5. **File Watcher** - Hot reload when YAML files change
6. **Rule Engine** - Response matching strategies (manual, query, header, body)

## Important Constraints

- Must remain compatible with VS Code 1.106.0+
- All code must work in browser environment (web extension)
- Security boundaries: WebView cannot access file system directly
- Performance targets: Server start < 200ms, YAML parsing < 20ms per file
- Mock server should bind to localhost only for security