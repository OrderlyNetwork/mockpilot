/**
 * Mock Server - In-memory HTTP server for VS Code Web Extension
 * Since we can't spawn Node.js processes in web extensions,
 * we'll use a lightweight in-memory approach with fetch API interception
 */

import { MockApiConfig } from "../types";
import { LogOutputService } from "../services/logOutputService";

export interface ServerConfig {
  port: number;
  mockDirectory: string;
}

export interface MockRoute {
  method: string;
  endpoint: string;
  config: MockApiConfig;
}

export class MockServer {
  private routes: Map<string, MockRoute[]> = new Map();
  private isRunning: boolean = false;
  private port: number;
  private mockDirectory: string;
  private logger: LogOutputService;
  private requestLog: Array<{
    timestamp: Date;
    method: string;
    path: string;
    status: number;
  }> = [];

  constructor(config: ServerConfig) {
    this.port = config.port;
    this.mockDirectory = config.mockDirectory;
    this.logger = LogOutputService.getInstance();
  }

  /**
   * Start the mock server
   */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isRunning) {
        this.logger.warn("Mock server is already running");
        resolve();
        return;
      }

      this.isRunning = true;
      const routeCount = this.getRouteCount();
      this.logger.logServerStart(this.port, routeCount);
      this.logger.info(`📁 Mock directory: ${this.mockDirectory}`);
      resolve();
    });
  }

  /**
   * Stop the mock server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning) {
        this.logger.warn("Mock server is not running");
        resolve();
        return;
      }

      this.isRunning = false;
      this.logger.logServerStop();
      resolve();
    });
  }

  /**
   * Register a mock API route
   */
  public registerRoute(config: MockApiConfig): void {
    const key = this.getRouteKey(config.method, config.endpoint);

    if (!this.routes.has(key)) {
      this.routes.set(key, []);
    }

    const routes = this.routes.get(key)!;
    // Remove existing route with same config if exists
    const index = routes.findIndex((r) => r.config.name === config.name);
    if (index >= 0) {
      routes.splice(index, 1);
    }

    routes.push({
      method: config.method,
      endpoint: config.endpoint,
      config,
    });

    this.logger.logRouteRegistration(
      config.method,
      config.endpoint,
      config.name
    );
  }

  /**
   * Unregister a mock API route
   */
  public unregisterRoute(
    method: string,
    endpoint: string,
    name?: string
  ): void {
    const key = this.getRouteKey(method, endpoint);

    if (!this.routes.has(key)) {
      return;
    }

    if (name) {
      const routes = this.routes.get(key)!;
      const index = routes.findIndex((r) => r.config.name === name);
      if (index >= 0) {
        routes.splice(index, 1);
        if (routes.length === 0) {
          this.routes.delete(key);
        }
      }
    } else {
      this.routes.delete(key);
    }

    this.logger.logRouteUnregistration(method, endpoint, name);
  }

  /**
   * Reload all routes
   */
  public reloadRoutes(configs: MockApiConfig[]): void {
    this.routes.clear();
    configs.forEach((config) => this.registerRoute(config));
    this.logger.logRouteReload(configs.length);
  }

  /**
   * Handle incoming request and match against rules
   */
  public async handleRequest(
    method: string,
    path: string,
    headers: Record<string, string> = {},
    body?: any
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
  }> {
    const startTime = Date.now();

    if (!this.isRunning) {
      const status = 503;
      const duration = Date.now() - startTime;
      this.logger.logRequest(method, path, status, duration);
      return {
        status,
        headers: { "Content-Type": "application/json" },
        body: { error: "Mock server is not running" },
      };
    }

    const key = this.getRouteKey(method, path);
    const routes = this.routes.get(key);

    if (!routes || routes.length === 0) {
      // Route not found
      const status = 404;
      const duration = Date.now() - startTime;
      this.logRequest(method, path, status);
      this.logger.logRequest(method, path, status, duration);
      return {
        status,
        headers: { "Content-Type": "application/json" },
        body: { error: `Route not found: ${method} ${path}` },
      };
    }

    // Use the first matching route (can be enhanced with rule matching)
    const route = routes[0];
    const config = route.config;

    // Find matching rule (for now, use the first rule)
    // TODO: Implement advanced rule matching based on query, headers, body
    const rule =
      config.rules && config.rules.length > 0
        ? config.rules[0]
        : {
            name: "default",
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: {},
            delay: 0,
          };

    // Apply delay if specified
    if (rule.delay && rule.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, rule.delay));
    }

    const duration = Date.now() - startTime;
    this.logRequest(method, path, rule.status);
    this.logger.logRequest(method, path, rule.status, duration);

    return {
      status: rule.status,
      headers: rule.headers || { "Content-Type": "application/json" },
      body: rule.body || {},
    };
  }

  /**
   * Get server status
   */
  public getStatus(): {
    running: boolean;
    port: number;
    routeCount: number;
    routes: Array<{ method: string; endpoint: string; name: string }>;
  } {
    const routes: Array<{ method: string; endpoint: string; name: string }> =
      [];

    this.routes.forEach((routeList) => {
      routeList.forEach((route) => {
        routes.push({
          method: route.method,
          endpoint: route.endpoint,
          name: route.config.name,
        });
      });
    });

    return {
      running: this.isRunning,
      port: this.port,
      routeCount: routes.length,
      routes,
    };
  }

  /**
   * Get request logs
   */
  public getLogs(limit: number = 100): Array<{
    timestamp: Date;
    method: string;
    path: string;
    status: number;
  }> {
    return this.requestLog.slice(-limit);
  }

  /**
   * Clear request logs
   */
  public clearLogs(): void {
    this.requestLog = [];
  }

  /**
   * Get route count
   */
  private getRouteCount(): number {
    let count = 0;
    this.routes.forEach((routes) => {
      count += routes.length;
    });
    return count;
  }

  /**
   * Generate route key
   */
  private getRouteKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  /**
   * Log request
   */
  private logRequest(method: string, path: string, status: number): void {
    this.requestLog.push({
      timestamp: new Date(),
      method,
      path,
      status,
    });

    // Keep only last 1000 logs
    if (this.requestLog.length > 1000) {
      this.requestLog = this.requestLog.slice(-1000);
    }
  }

  /**
   * Check if server is running
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }
}
