import * as vscode from "vscode";
import { MockExplorerProvider } from "../providers/mockExplorer";
import { IServerManager } from "../common/IServerManager";
import { StatusBarService } from "./statusBarService";

/**
 * Service for watching mock configuration files and handling hot reload
 */
export class FileWatcherService {
  private fileWatcher: vscode.FileSystemWatcher | null = null;

  constructor(
    private mockExplorerProvider: MockExplorerProvider,
    private serverManager: IServerManager,
    private statusBarService: StatusBarService
  ) {}

  /**
   * Initialize file watcher for .mock directory
   */
  initialize(context: vscode.ExtensionContext): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.warn("No workspace folders found for file watcher");
      return;
    }

    const mockDirPattern = new vscode.RelativePattern(
      workspaceFolders[0],
      ".mock/**/*.{yaml,yml}"
    );

    this.fileWatcher = vscode.workspace.createFileSystemWatcher(mockDirPattern);

    // Watch for file changes
    this.fileWatcher.onDidChange(async (uri) => {
      console.log("Mock file changed:", uri.path);
      await this.handleFileChange();
    });

    this.fileWatcher.onDidCreate(async (uri) => {
      console.log("Mock file created:", uri.path);
      await this.handleFileChange();
    });

    this.fileWatcher.onDidDelete(async (uri) => {
      console.log("Mock file deleted:", uri.path);
      await this.handleFileChange();
    });

    context.subscriptions.push(this.fileWatcher);
  }

  /**
   * Handle file change events
   */
  private async handleFileChange(): Promise<void> {
    const server = this.serverManager.getServer();
    if (server?.isServerRunning()) {
      const configs = await this.serverManager.loadMockConfigs();
      server.reloadRoutes(configs);
      this.statusBarService.updateStatusBar(true, configs.length);
      vscode.window.showInformationMessage("🔄 Mock configs reloaded");
    }
    this.mockExplorerProvider.refresh();
  }

  /**
   * Dispose the file watcher
   */
  dispose(): void {
    this.fileWatcher?.dispose();
  }
}
