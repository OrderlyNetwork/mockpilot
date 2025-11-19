/**
 * Server Manager Interface - Shared interface for both Desktop and Web versions
 */

import { MockApiConfig } from "../types";

export interface IServerManager {
  /**
   * Get the mock server instance
   */
  getServer(): any;

  /**
   * Load all mock configurations from .mock directory
   */
  loadMockConfigs(): Promise<MockApiConfig[]>;

  /**
   * Start the mock server
   */
  startServer(): Promise<{
    success: boolean;
    port?: number;
    routeCount?: number;
    error?: string;
  }>;

  /**
   * Stop the mock server
   */
  stopServer(): Promise<{ success: boolean; error?: string }>;

  /**
   * Reload server routes
   */
  reloadServer(): Promise<{
    success: boolean;
    routeCount?: number;
    error?: string;
  }>;

  /**
   * Get server status
   */
  getStatus(): {
    running: boolean;
    port: number;
    routeCount: number;
    routes: Array<{ method: string; endpoint: string; name: string }>;
  };

  /**
   * Test a mock API endpoint
   */
  testMockApi(method: string, endpoint: string): Promise<any>;
}
