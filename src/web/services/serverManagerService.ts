import { MockServer } from "../server/mockServer";
import { BaseServerManager } from "../../common/base/baseServerManager";

/**
 * Service for managing the Mock Server instance and configurations (Web Version)
 */
export class ServerManagerService extends BaseServerManager {
  constructor() {
    super('web');
  }

  /**
   * Create platform-specific MockServer instance (Web in-memory server)
   */
  protected createServer(port: number): MockServer {
    return new MockServer({
      port: port,
      mockDirectory: ".mock",
    });
  }
}
