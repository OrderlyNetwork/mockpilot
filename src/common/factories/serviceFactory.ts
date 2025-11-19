import { IServerManager } from "../IServerManager";
import { BaseServerManager } from "../base/baseServerManager";

/**
 * Factory for creating platform-specific services
 */
export class ServiceFactory {
  /**
   * Create server manager instance based on platform
   */
  static createServerManager(platform: 'desktop' | 'web'): IServerManager {
    switch (platform) {
      case 'desktop':
        return new (require("../../desktop/services/serverManagerService").ServerManagerService)();
      case 'web':
        return new (require("../../web/services/serverManagerService").ServerManagerService)();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Create MockExplorer provider based on platform
   */
  static createMockExplorerProvider(platform: 'desktop' | 'web'): any {
    switch (platform) {
      case 'desktop':
        return new (require("../../providers/mockExplorer").MockExplorerProvider)();
      case 'web':
        return new (require("../../web/mockExplorer").MockExplorerProvider)();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}