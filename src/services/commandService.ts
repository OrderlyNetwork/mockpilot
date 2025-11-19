import * as vscode from "vscode";
import { MockExplorerProvider } from "../providers/mockExplorer";
import { MockEditorProvider } from "../providers/mockEditorProvider";
import { IServerManager } from "../common/IServerManager";
import { StatusBarService } from "./statusBarService";
import { LogOutputService } from "./logOutputService";
import { parseYamlConfig } from "../utils/yamlParser";

/**
 * Service for registering and handling all extension commands
 */
export class CommandService {
  constructor(
    private context: vscode.ExtensionContext,
    private mockExplorerProvider: MockExplorerProvider,
    private mockEditorProvider: MockEditorProvider,
    private serverManager: IServerManager,
    private statusBarService: StatusBarService
  ) {}

  /**
   * Register all extension commands
   */
  registerCommands(): void {
    // Explorer commands
    this.registerCommand("mock-server.refreshExplorer", () => {
      this.mockExplorerProvider.refresh();
    });

    this.registerCommand("mock-server.createMockApi", () => {
      vscode.window.showInformationMessage(
        "Create Mock API functionality will be implemented soon!"
      );
    });

    this.registerCommand(
      "mock-server.createMockDirectory",
      this.createMockDirectory.bind(this)
    );

    this.registerCommand(
      "mock-server.openMockApi",
      this.openMockApi.bind(this)
    );

    this.registerCommand(
      "mock-server.deleteMockApi",
      this.deleteMockApi.bind(this)
    );

    // Server management commands
    this.registerCommand(
      "mock-server.toggleServer",
      this.toggleServer.bind(this)
    );

    this.registerCommand(
      "mock-server.startServer",
      this.startServer.bind(this)
    );

    this.registerCommand("mock-server.stopServer", this.stopServer.bind(this));

    this.registerCommand(
      "mock-server.getServerStatus",
      this.getServerStatus.bind(this)
    );

    this.registerCommand(
      "mock-server.testMockApi",
      this.testMockApi.bind(this)
    );

    this.registerCommand(
      "mock-server.reloadServer",
      this.reloadServer.bind(this)
    );

    this.registerCommand(
      "mock-server.reloadRoute",
      this.reloadRoute.bind(this)
    );

    // Log output commands
    this.registerCommand("mock-server.showLogs", this.showLogs.bind(this));

    this.registerCommand("mock-server.clearLogs", this.clearLogs.bind(this));

    // Legacy hello world command
    this.registerCommand("mock-server.helloWorld", () => {
      vscode.window.showInformationMessage(
        "Hello World from mock-server in a web extension host!"
      );
    });
  }

  /**
   * Helper method to register a command
   */
  private registerCommand(
    command: string,
    callback: (...args: any[]) => any
  ): void {
    const disposable = vscode.commands.registerCommand(command, callback);
    this.context.subscriptions.push(disposable);
  }

  /**
   * Create .mock directory with sample file
   */
  private async createMockDirectory(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }

    const mockDirUri = vscode.Uri.joinPath(workspaceFolders[0].uri, ".mock");

    try {
      await vscode.workspace.fs.createDirectory(mockDirUri);
      vscode.window.showInformationMessage(
        ".mock directory created successfully!"
      );
      this.mockExplorerProvider.refresh();

      // Create a sample YAML file
      const sampleFileUri = vscode.Uri.joinPath(mockDirUri, "sample_api.yaml");
      const sampleContent = `name: Sample API
description: This is a sample mock API
method: GET
endpoint: /api/sample
rules:
  - name: Success response
    status: 200
    headers:
      Content-Type: application/json
    body:
      message: "Hello from Mock Server!"
      success: true
    delay: 0
`;
      await vscode.workspace.fs.writeFile(
        sampleFileUri,
        new TextEncoder().encode(sampleContent)
      );
      this.mockExplorerProvider.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create .mock directory: ${error}`
      );
    }
  }

  /**
   * Open a mock API file in the custom editor
   */
  private async openMockApi(filePath: string): Promise<void> {
    try {
      console.log("Opening file with path:", filePath);

      // For web extensions, we need to construct the URI properly
      let uri: vscode.Uri;

      if (filePath.startsWith("file://") || filePath.includes("://")) {
        uri = vscode.Uri.parse(filePath);
      } else {
        // Try to resolve the path relative to workspace
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          // Check if it's an absolute path or relative
          if (filePath.startsWith("/")) {
            // Absolute path - create URI with workspace root
            const workspaceRoot = workspaceFolders[0].uri;
            const relativePath = filePath.startsWith(workspaceRoot.path)
              ? filePath.substring(workspaceRoot.path.length + 1)
              : filePath.substring(1);
            uri = vscode.Uri.joinPath(workspaceRoot, relativePath);
          } else {
            // Relative path - join with workspace root
            uri = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
          }
        } else {
          throw new Error("No workspace folder found");
        }
      }

      console.log("Resolved URI:", uri);

      // Read the YAML file and parse it
      const fileContent = await vscode.workspace.fs.readFile(uri);
      const yamlText = new TextDecoder().decode(fileContent);

      // Parse YAML to get config
      const config = await parseYamlConfig(
        yamlText,
        uri.path.split("/").pop() || "unknown.yaml"
      );

      // Open the WebView editor
      await this.mockEditorProvider.openEditor(config, uri.toString());
    } catch (error) {
      console.error("Error opening file:", error);
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  /**
   * Delete a mock API file
   */
  private async deleteMockApi(item: any): Promise<void> {
    if (!item || !item.itemPath) {
      vscode.window.showErrorMessage("Invalid item selected");
      return;
    }

    const fileName = item.label?.replace(/^[➕❌]\s/, "") || "file";
    const result = await vscode.window.showWarningMessage(
      `Are you sure you want to delete ${fileName}?`,
      { modal: true },
      "Delete",
      "Cancel"
    );

    if (result === "Delete") {
      try {
        console.log("Deleting file with path:", item.itemPath);

        // For web extensions, construct URI properly
        let uri: vscode.Uri;

        if (
          item.itemPath.startsWith("file://") ||
          item.itemPath.includes("://")
        ) {
          uri = vscode.Uri.parse(item.itemPath);
        } else {
          // Resolve path relative to workspace
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            if (item.itemPath.startsWith("/")) {
              // Absolute path - create URI with workspace root
              const workspaceRoot = workspaceFolders[0].uri;
              const relativePath = item.itemPath.startsWith(workspaceRoot.path)
                ? item.itemPath.substring(workspaceRoot.path.length + 1)
                : item.itemPath.substring(1);
              uri = vscode.Uri.joinPath(workspaceRoot, relativePath);
            } else {
              // Relative path - join with workspace root
              uri = vscode.Uri.joinPath(workspaceFolders[0].uri, item.itemPath);
            }
          } else {
            throw new Error("No workspace folder found");
          }
        }

        console.log("Resolved URI for deletion:", uri);
        await vscode.workspace.fs.delete(uri);
        vscode.window.showInformationMessage(
          `${fileName} deleted successfully`
        );
        this.mockExplorerProvider.refresh();
      } catch (error) {
        console.error("Error deleting file:", error);
        vscode.window.showErrorMessage(`Failed to delete file: ${error}`);
      }
    }
  }

  /**
   * Toggle server on/off
   */
  private async toggleServer(): Promise<void> {
    if (this.serverManager.getServer()?.isServerRunning()) {
      await vscode.commands.executeCommand("mock-server.stopServer");
    } else {
      await vscode.commands.executeCommand("mock-server.startServer");
    }
  }

  /**
   * Start the mock server
   */
  private async startServer(): Promise<void> {
    const result = await this.serverManager.startServer();

    if (result.success) {
      vscode.window.showInformationMessage(
        `🚀 Mock Server started on port ${result.port} with ${result.routeCount} routes`
      );
      this.statusBarService.updateStatusBar(true, result.routeCount || 0);
    } else {
      if (result.error === "Server is already running") {
        vscode.window.showInformationMessage("Mock server is already running");
      } else if (
        result.error === "No mock API configurations found in .mock directory"
      ) {
        vscode.window.showWarningMessage(
          "No mock API configurations found in .mock directory. Create some first!"
        );
      } else {
        vscode.window.showErrorMessage(
          `Failed to start mock server: ${result.error}`
        );
      }
    }
  }

  /**
   * Stop the mock server
   */
  private async stopServer(): Promise<void> {
    const result = await this.serverManager.stopServer();

    if (result.success) {
      vscode.window.showInformationMessage("🛑 Mock Server stopped");
      this.statusBarService.updateStatusBar(false, 0);
    } else {
      if (result.error === "Server is not running") {
        vscode.window.showInformationMessage("Mock server is not running");
      } else {
        vscode.window.showErrorMessage(
          `Failed to stop mock server: ${result.error}`
        );
      }
    }
  }

  /**
   * Get server status
   */
  private getServerStatus() {
    return this.serverManager.getStatus();
  }

  /**
   * Test a mock API endpoint
   */
  private async testMockApi(
    method: string,
    endpoint: string
  ): Promise<any | null> {
    try {
      const response = await this.serverManager.testMockApi(method, endpoint);

      vscode.window.showInformationMessage(
        `Test response: ${response.status} - ${JSON.stringify(
          response.body
        ).substring(0, 50)}...`
      );

      return response;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Mock server is not running"
      ) {
        vscode.window.showWarningMessage(
          "Mock server is not running. Start it first!"
        );
      } else {
        vscode.window.showErrorMessage(`Failed to test API: ${error}`);
        console.error("Error testing API:", error);
      }
      return null;
    }
  }

  /**
   * Reload server routes
   */
  private async reloadServer(): Promise<void> {
    const result = await this.serverManager.reloadServer();

    if (result.success) {
      vscode.window.showInformationMessage(
        `🔄 Mock Server reloaded with ${result.routeCount} routes`
      );
      this.statusBarService.updateStatusBar(true, result.routeCount || 0);
    } else {
      if (result.error === "Server is not running") {
        vscode.window.showInformationMessage("Mock server is not running");
      } else {
        vscode.window.showErrorMessage(
          `Failed to reload server: ${result.error}`
        );
      }
    }
  }

  /**
   * Reload a specific route with updated activeRuleIndex
   */
  private async reloadRoute(params: {
    method: string;
    endpoint: string;
    activeRuleIndex: number;
    ruleName: string;
  }): Promise<void> {
    const logger = LogOutputService.getInstance();

    try {
      // Log the rule change
      logger.info(
        `Setting active rule for ${params.method} ${params.endpoint} to "${params.ruleName}" (index: ${params.activeRuleIndex})`
      );

      // Reload all server routes to pick up the change
      const result = await this.serverManager.reloadServer();

      if (result.success) {
        logger.success(
          `✅ Active rule updated: ${params.method} ${params.endpoint} -> "${params.ruleName}"`
        );
      } else {
        logger.error("Failed to reload route", new Error(result.error));
      }
    } catch (error) {
      logger.error("Error reloading route", error);
    }
  }

  /**
   * Show logs in OUTPUT panel
   */
  private showLogs(): void {
    const logger = LogOutputService.getInstance();
    logger.show();
  }

  /**
   * Clear logs in OUTPUT panel
   */
  private clearLogs(): void {
    const logger = LogOutputService.getInstance();
    logger.clear();
    vscode.window.showInformationMessage("Mock Server logs cleared");
  }
}
