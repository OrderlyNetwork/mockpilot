import * as vscode from "vscode";
import { MockServer } from "../mockServer";
import { MockApiConfig } from "../../web/types";
import { parseYamlConfig } from "../../web/utils/yamlParser";
import { IServerManager } from "../../common/IServerManager";
import { LogOutputService } from "../../web/services/logOutputService";

/**
 * Service for managing the Mock Server instance and configurations (Desktop Version)
 */
export class ServerManagerService implements IServerManager {
  private mockServer: MockServer | null = null;

  constructor() {
    const defaultPort = vscode.workspace
      .getConfiguration("mockServer")
      .get<number>("port", 9527);

    this.mockServer = new MockServer({
      port: defaultPort,
      mockDirectory: ".mock",
    });
    const logger = LogOutputService.getInstance();
    logger.info("MockServer instance created (Desktop with Koa.js)");
  }

  /**
   * Get the mock server instance
   */
  getServer(): MockServer | null {
    return this.mockServer;
  }

  /**
   * Load all mock configurations from .mock directory
   */
  async loadMockConfigs(): Promise<MockApiConfig[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const mockDirUri = vscode.Uri.joinPath(workspaceFolders[0].uri, ".mock");
    const configs: MockApiConfig[] = [];

    try {
      const files = await vscode.workspace.fs.readDirectory(mockDirUri);

      for (const [filename, fileType] of files) {
        if (fileType === vscode.FileType.File && /\.ya?ml$/.test(filename)) {
          const fileUri = vscode.Uri.joinPath(mockDirUri, filename);
          const fileContent = await vscode.workspace.fs.readFile(fileUri);
          const yamlText = new TextDecoder().decode(fileContent);
          const config = await parseYamlConfig(yamlText, filename);
          configs.push(config);
        }
      }
    } catch (error) {
      const logger = LogOutputService.getInstance();
      logger.error("Error loading mock configs", error);
    }

    return configs;
  }

  /**
   * Start the mock server
   */
  async startServer(): Promise<{
    success: boolean;
    port?: number;
    routeCount?: number;
    error?: string;
  }> {
    try {
      if (this.mockServer?.isServerRunning()) {
        return { success: false, error: "Server is already running" };
      }

      // Load all mock configs from .mock directory
      const configs = await this.loadMockConfigs();

      if (configs.length === 0) {
        return {
          success: false,
          error: "No mock API configurations found in .mock directory",
        };
      }

      // Register routes
      this.mockServer?.reloadRoutes(configs);

      // Start server
      await this.mockServer?.start();

      const status = this.mockServer?.getStatus();
      return {
        success: true,
        port: status?.port,
        routeCount: status?.routeCount,
      };
    } catch (error) {
      const logger = LogOutputService.getInstance();
      logger.error("Error starting server", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Stop the mock server
   */
  async stopServer(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.mockServer?.isServerRunning()) {
        return { success: false, error: "Server is not running" };
      }

      await this.mockServer?.stop();
      return { success: true };
    } catch (error) {
      const logger = LogOutputService.getInstance();
      logger.error("Error stopping server", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reload server routes
   */
  async reloadServer(): Promise<{
    success: boolean;
    routeCount?: number;
    error?: string;
  }> {
    try {
      if (!this.mockServer?.isServerRunning()) {
        return { success: false, error: "Server is not running" };
      }

      const configs = await this.loadMockConfigs();
      this.mockServer.reloadRoutes(configs);

      return { success: true, routeCount: configs.length };
    } catch (error) {
      const logger = LogOutputService.getInstance();
      logger.error("Error reloading server", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get server status
   */
  getStatus() {
    if (!this.mockServer) {
      return { running: false, port: 0, routeCount: 0, routes: [] };
    }
    return this.mockServer.getStatus();
  }

  /**
   * Test a mock API endpoint
   */
  async testMockApi(method: string, endpoint: string) {
    if (!this.mockServer?.isServerRunning()) {
      throw new Error("Mock server is not running");
    }
    return await this.mockServer.handleRequest(method, endpoint);
  }
}
