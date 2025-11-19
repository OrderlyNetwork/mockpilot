/**
 * Mock Server - Real HTTP server using Koa.js for VS Code Desktop Extension
 */

import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { Server } from "http";
import { MockApiConfig, MockRule } from "../types";
import { RuleEngine } from "./ruleEngine";
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
  private app: Koa;
  private router: Router;
  private server: Server | null = null;
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
    this.app = new Koa();
    this.router = new Router();

    // Setup middleware
    this.setupMiddleware();
  }

  /**
   * Setup Koa middleware
   */
  private setupMiddleware(): void {
    // Error handling
    this.app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err: any) {
        ctx.status = err.status || 500;
        ctx.body = {
          error: err.message || "Internal Server Error",
        };
        this.logger.error("Error handling request", err);
      }
    });

    // CORS
    this.app.use(
      cors({
        origin: "*",
        allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Body parser
    this.app.use(bodyParser());

    // Request logging
    this.app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      this.logger.logRequest(ctx.method, ctx.url, ctx.status, ms);

      this.logRequest(ctx.method, ctx.url, ctx.status);
    });
  }

  /**
   * Start the mock server
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        this.logger.warn("Mock server is already running");
        resolve();
        return;
      }

      try {
        // Setup routes before starting
        this.setupRoutes();

        // Apply router middleware
        this.app.use(this.router.routes());
        this.app.use(this.router.allowedMethods());

        // Start server
        this.server = this.app.listen(this.port, () => {
          this.isRunning = true;
          const routeCount = this.getRouteCount();
          this.logger.logServerStart(this.port, routeCount);
          this.logger.info(`📁 Mock directory: ${this.mockDirectory}`);
          resolve();
        });

        this.server.on("error", (err: any) => {
          if (err.code === "EADDRINUSE") {
            reject(new Error(`Port ${this.port} is already in use`));
          } else {
            reject(err);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the mock server
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isRunning || !this.server) {
        this.logger.warn("Mock server is not running");
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.isRunning = false;
          this.server = null;
          this.logger.logServerStop();
          resolve();
        }
      });
    });
  }

  /**
   * Setup Koa router with all registered routes
   */
  private setupRoutes(): void {
    // Create a new router instance
    this.router = new Router();

    // Register each route
    this.routes.forEach((routeList, key) => {
      routeList.forEach((route) => {
        const { method, endpoint } = route;

        // Register route handler - dynamically get config to avoid closure issues
        const handler = async (ctx: Koa.Context) => {
          // Dynamically get the latest config from routes map
          const currentKey = this.getRouteKey(ctx.method, ctx.path);
          const currentRoutes = this.routes.get(currentKey);

          if (!currentRoutes || currentRoutes.length === 0) {
            ctx.status = 404;
            ctx.body = { error: `Route not found: ${ctx.method} ${ctx.path}` };
            return;
          }

          const config = currentRoutes[0].config;

          // Use the active rule based on activeRuleIndex
          const activeRuleIndex = config.activeRuleIndex ?? 0;
          let rule: MockRule | undefined;

          // First try to use the activeRuleIndex
          if (config.rules && config.rules.length > activeRuleIndex) {
            rule = config.rules[activeRuleIndex];
            this.logger.info(
              `[HTTP] Using active rule "${rule.name}" (index: ${activeRuleIndex}) for ${method} ${ctx.path}`
            );
          } else {
            // Fallback to RuleEngine matching if activeRuleIndex is invalid
            const matchContext = {
              method: ctx.method,
              path: ctx.path,
              query: ctx.query as Record<string, string>,
              headers: ctx.headers as Record<string, string>,
              body: ctx.request.body,
            };
            rule =
              RuleEngine.findMatchingRule(config.rules || [], matchContext) ||
              undefined;
            if (rule) {
              const ruleIndex = config.rules?.indexOf(rule) ?? -1;
              this.logger.info(
                `[HTTP] Using matched rule "${rule.name}" (index: ${ruleIndex}) for ${method} ${ctx.path}`
              );
            }
          }

          if (!rule) {
            this.logger.warn(
              `[HTTP] No rule found for ${method} ${
                ctx.path
              } (activeRuleIndex: ${activeRuleIndex}, total rules: ${
                config.rules?.length || 0
              })`
            );
            ctx.status = 404;
            ctx.body = {
              error: `No matching rule found for ${method} ${endpoint}`,
            };
            return;
          }

          // Log final chosen rule details
          const finalIndex = config.rules?.indexOf(rule) ?? -1;
          this.logger.info(
            `[HTTP response] ${method.toUpperCase()} ${ctx.path} -> rule="${
              rule.name
            }" index=${finalIndex} activeRuleIndex=${activeRuleIndex} status=${
              rule.status
            } delay=${rule.delay || 0}`
          );

          // Apply delay if specified
          if (rule.delay && rule.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, rule.delay));
          }

          // Set response
          ctx.status = rule.status;
          if (rule.headers) {
            Object.entries(rule.headers).forEach(([key, value]) => {
              ctx.set(key, value);
            });
          }
          ctx.body = rule.body || {};
        };

        // Register route based on method
        switch (method.toUpperCase()) {
          case "GET":
            this.router.get(endpoint, handler);
            break;
          case "POST":
            this.router.post(endpoint, handler);
            break;
          case "PUT":
            this.router.put(endpoint, handler);
            break;
          case "DELETE":
            this.router.delete(endpoint, handler);
            break;
          case "PATCH":
            this.router.patch(endpoint, handler);
            break;
          default:
            this.logger.warn(`Unsupported HTTP method: ${method}`);
        }

        this.logger.logRouteRegistration(
          method.toUpperCase(),
          endpoint,
          route.config.name
        );
      });
    });

    // Add a health check endpoint
    this.router.get("/_health", (ctx) => {
      ctx.body = {
        status: "ok",
        port: this.port,
        routeCount: this.getRouteCount(),
        timestamp: new Date().toISOString(),
      };
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

    this.logger.info(
      `[registerRoute] ${config.method} ${
        config.endpoint
      } registered with activeRuleIndex: ${
        config.activeRuleIndex ?? 0
      }, total rules: ${config.rules?.length ?? 0}`
    );

    // If server is running, reload routes
    if (this.isRunning) {
      this.setupRoutes();
      // Re-apply router middleware
      this.app.use(this.router.routes());
      this.app.use(this.router.allowedMethods());
    }
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

    // If server is running, reload routes
    if (this.isRunning) {
      this.setupRoutes();
    }
  }

  /**
   * Reload all routes
   */
  public reloadRoutes(configs: MockApiConfig[]): void {
    this.routes.clear();
    configs.forEach((config) => {
      this.logger.info(
        `[reloadRoutes] Registering ${config.method} ${
          config.endpoint
        } with activeRuleIndex: ${config.activeRuleIndex ?? 0}`
      );
      this.registerRoute(config);
    });

    // If server is running, reload routes
    if (this.isRunning) {
      this.setupRoutes();
    }

    this.logger.logRouteReload(configs.length);
  }

  /**
   * Handle incoming request (for testing purposes)
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
    if (!this.isRunning) {
      return {
        status: 503,
        headers: { "Content-Type": "application/json" },
        body: { error: "Mock server is not running" },
      };
    }

    const key = this.getRouteKey(method, path);
    const routes = this.routes.get(key);

    if (!routes || routes.length === 0) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        body: { error: `Route not found: ${method} ${path}` },
      };
    }

    const route = routes[0];
    const config = route.config;

    // Use the active rule based on activeRuleIndex
    const activeRuleIndex = config.activeRuleIndex ?? 0;
    let rule: MockRule | undefined;

    // First try to use the activeRuleIndex
    if (config.rules && config.rules.length > activeRuleIndex) {
      rule = config.rules[activeRuleIndex];
      this.logger.info(
        `Using active rule "${rule.name}" (index: ${activeRuleIndex}) for ${method} ${path}`
      );
    } else {
      // Fallback to RuleEngine matching if activeRuleIndex is invalid
      const matchContext = {
        method,
        path,
        query: {},
        headers,
        body,
      };
      rule =
        RuleEngine.findMatchingRule(config.rules || [], matchContext) ||
        undefined;
      if (rule) {
        const ruleIndex = config.rules?.indexOf(rule) ?? -1;
        this.logger.info(
          `Using matched rule "${rule.name}" (index: ${ruleIndex}) for ${method} ${path}`
        );
      }
    }

    if (!rule) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        body: { error: `No matching rule found` },
      };
    }

    // Log final chosen rule details (active or matched)
    const finalIndex = config.rules?.indexOf(rule) ?? -1;
    this.logger.info(
      `[response] ${method.toUpperCase()} ${path} -> rule="${
        rule.name
      }" index=${finalIndex} activeRuleIndex=${activeRuleIndex} status=${
        rule.status
      } delay=${rule.delay || 0}`
    );
    if (rule.headers) {
      this.logger.info(
        `[response headers] ${Object.entries(rule.headers)
          .map(([k, v]) => `${k}=${v}`)
          .join("; ")}`
      );
    }
    // For large bodies avoid spamming logs; stringify safely
    try {
      const bodyPreview =
        typeof rule.body === "string"
          ? rule.body.slice(0, 300)
          : JSON.stringify(rule.body).slice(0, 300);
      this.logger.info(
        `[response body preview] ${bodyPreview}${
          bodyPreview.length >= 300 ? "…" : ""
        }`
      );
    } catch {
      // ignore body preview errors
    }

    if (rule.delay && rule.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, rule.delay));
    }

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
