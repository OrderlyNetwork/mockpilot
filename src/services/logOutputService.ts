import * as vscode from "vscode";

/**
 * Service for outputting mock server logs to VS Code OUTPUT panel
 */
export class LogOutputService {
  private static instance: LogOutputService | null = null;
  private outputChannel: vscode.OutputChannel;

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Mock Server");
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LogOutputService {
    if (!LogOutputService.instance) {
      LogOutputService.instance = new LogOutputService();
    }
    return LogOutputService.instance;
  }

  /**
   * Show the output channel
   */
  public show(): void {
    this.outputChannel.show();
  }

  /**
   * Clear the output channel
   */
  public clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Log info message
   */
  public info(message: string): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine(`[${timestamp}] [INFO] ${message}`);
    console.log(message);
  }

  /**
   * Log success message
   */
  public success(message: string): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine(`[${timestamp}] [SUCCESS] ✅ ${message}`);
    console.log(message);
  }

  /**
   * Log warning message
   */
  public warn(message: string): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine(`[${timestamp}] [WARN] ⚠️ ${message}`);
    console.warn(message);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: any): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine(`[${timestamp}] [ERROR] ❌ ${message}`);
    if (error) {
      this.outputChannel.appendLine(`${error.stack || error}`);
    }
    console.error(message, error);
  }

  /**
   * Log request
   */
  public logRequest(
    method: string,
    path: string,
    status: number,
    duration?: number
  ): void {
    const timestamp = this.getTimestamp();
    const statusEmoji = this.getStatusEmoji(status);
    const durationStr = duration ? ` - ${duration}ms` : "";
    this.outputChannel.appendLine(
      `[${timestamp}] [REQUEST] ${statusEmoji} ${method} ${path} → ${status}${durationStr}`
    );
  }

  /**
   * Log server start
   */
  public logServerStart(port: number, routeCount: number): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine("=".repeat(60));
    this.outputChannel.appendLine(
      `[${timestamp}] [SERVER] 🚀 Mock Server started on port ${port}`
    );
    this.outputChannel.appendLine(
      `[${timestamp}] [SERVER] 📋 Registered routes: ${routeCount}`
    );
    this.outputChannel.appendLine("=".repeat(60));
    this.outputChannel.appendLine("");
  }

  /**
   * Log server stop
   */
  public logServerStop(): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine("");
    this.outputChannel.appendLine("=".repeat(60));
    this.outputChannel.appendLine(
      `[${timestamp}] [SERVER] 🛑 Mock Server stopped`
    );
    this.outputChannel.appendLine("=".repeat(60));
    this.outputChannel.appendLine("");
  }

  /**
   * Log route registration
   */
  public logRouteRegistration(
    method: string,
    endpoint: string,
    name: string
  ): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine(
      `[${timestamp}] [ROUTE] ✅ Registered: ${method} ${endpoint} (${name})`
    );
  }

  /**
   * Log route unregistration
   */
  public logRouteUnregistration(
    method: string,
    endpoint: string,
    name?: string
  ): void {
    const timestamp = this.getTimestamp();
    const nameStr = name ? ` (${name})` : "";
    this.outputChannel.appendLine(
      `[${timestamp}] [ROUTE] ❌ Unregistered: ${method} ${endpoint}${nameStr}`
    );
  }

  /**
   * Log route reload
   */
  public logRouteReload(count: number): void {
    const timestamp = this.getTimestamp();
    this.outputChannel.appendLine(
      `[${timestamp}] [ROUTE] 🔄 Reloaded ${count} routes`
    );
  }

  /**
   * Dispose the output channel
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }

  /**
   * Get current timestamp string
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
  }

  /**
   * Get emoji for status code
   */
  private getStatusEmoji(status: number): string {
    if (status >= 200 && status < 300) {
      return "✅";
    } else if (status >= 300 && status < 400) {
      return "↪️";
    } else if (status >= 400 && status < 500) {
      return "⚠️";
    } else {
      return "❌";
    }
  }
}
