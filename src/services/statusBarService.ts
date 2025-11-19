import * as vscode from "vscode";

/**
 * Service for managing the status bar item for the Mock Server
 */
export class StatusBarService {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "mock-server.toggleServer";
    this.updateStatusBar(false, 0);
    this.statusBarItem.show();
  }

  /**
   * Update the status bar display
   */
  updateStatusBar(running: boolean, routeCount: number): void {
    const config = vscode.workspace.getConfiguration("mockServer");
    const port = config.get<number>("port", 9527);

    if (running) {
      this.statusBarItem.text = `$(server-process) Mock Server: Running (${routeCount})`;
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.tooltip = `Mock Server is running on port ${port}\n${routeCount} routes loaded\nClick to stop`;
    } else {
      this.statusBarItem.text = `$(debug-stop) Mock Server: Stopped`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
      this.statusBarItem.tooltip = `Mock Server is stopped\nClick to start`;
    }
  }

  /**
   * Get the status bar item for disposal
   */
  getStatusBarItem(): vscode.StatusBarItem {
    return this.statusBarItem;
  }

  /**
   * Dispose the status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
