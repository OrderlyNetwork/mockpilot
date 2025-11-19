import { MockServer } from "../mockServer";
import { BaseServerManager } from "../../common/base/baseServerManager";

/**
 * Service for managing the Mock Server instance and configurations (Desktop Version)
 */
export class ServerManagerService extends BaseServerManager {
  constructor() {
    super('desktop');
  }

  /**
   * Create platform-specific MockServer instance (Desktop with Koa.js)
   */
  protected createServer(port: number): MockServer {
    return new MockServer({
      port: port,
      mockDirectory: ".mock",
    });
  }
}
