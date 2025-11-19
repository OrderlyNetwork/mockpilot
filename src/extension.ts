// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { MockExplorerProvider } from "./web/mockExplorer";
import { MockEditorProvider } from "./web/mockEditorProvider";
import { StatusBarService } from "./web/services/statusBarService";
import { ServerManagerService } from "./desktop/services/serverManagerService";
import { CommandService } from "./web/services/commandService";
import { FileWatcherService } from "./web/services/fileWatcherService";
import { LogOutputService } from "./web/services/logOutputService";

// This method is called when your extension is activated (Desktop version)
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("Mock Server extension is now active! (Desktop Version)");
  console.log("Extension context:", context.extensionUri);
  console.log(
    "Workspace folders:",
    vscode.workspace.workspaceFolders?.map((f) => f.name)
  );

  // Initialize services
  const statusBarService = new StatusBarService();
  context.subscriptions.push(statusBarService.getStatusBarItem());

  const serverManager = new ServerManagerService();

  // Create tree view provider for Mock Explorer
  const mockExplorerProvider = new MockExplorerProvider();
  console.log("MockExplorerProvider created");

  // Create mock editor provider
  const mockEditorProvider = new MockEditorProvider(
    context.extensionUri,
    context
  );
  console.log("MockEditorProvider created");

  // Register tree view
  const treeView = vscode.window.createTreeView("mockExplorer", {
    treeDataProvider: mockExplorerProvider,
    showCollapseAll: false,
  });
  console.log("TreeView registered with ID: mock-server.mockExplorer");

  // Initialize command service and register all commands
  const commandService = new CommandService(
    context,
    mockExplorerProvider,
    mockEditorProvider,
    serverManager,
    statusBarService
  );
  commandService.registerCommands();

  // Initialize file watcher service for hot reload
  const fileWatcherService = new FileWatcherService(
    mockExplorerProvider,
    serverManager,
    statusBarService
  );
  fileWatcherService.initialize(context);

  // Initialize logger service
  const logger = LogOutputService.getInstance();
  logger.info("Mock Server extension initialized (Desktop Version)");

  // Add tree view and mock editor provider to disposables
  context.subscriptions.push(treeView, mockEditorProvider, {
    dispose: () => logger.dispose(),
  });

  // Check if auto-start is enabled
  const config = vscode.workspace.getConfiguration("mockServer");
  const autoStart = config.get<boolean>("autoStart", false);

  if (autoStart) {
    vscode.commands.executeCommand("mock-server.startServer");
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Mock Server extension is being deactivated");
}
