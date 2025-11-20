/**
 * Mock Server - Real HTTP server using Koa.js for VS Code Desktop Extension
 * Refactored: single config per route; dynamic rule selection helpers; stable router middleware.
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

export class MockServer {
  private app: Koa;
  private router: Router;
  private server: Server | null = null;
  private routes: Map<string, MockApiConfig> = new Map();
  private registeredRouteKeys: Set<string> = new Set();
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
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err: any) {
        ctx.status = err.status || 500;
        ctx.body = { error: err.message || "Internal Server Error" };
        this.logger.error("Error handling request", err);
      }
    });
    this.app.use(
      cors({
        origin: "*",
        allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      })
    );
    this.app.use(bodyParser());
    this.app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      this.logger.logRequest(ctx.method, ctx.url, ctx.status, ms);
      this.logRequest(ctx.method, ctx.url, ctx.status);
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        this.logger.warn("Mock server is already running");
        resolve();
        return;
      }
      try {
        this.setupRoutes();
        this.app.use(this.router.routes());
        this.app.use(this.router.allowedMethods());
        this.server = this.app.listen(this.port, () => {
          this.isRunning = true;
          this.logger.logServerStart(this.port, this.getRouteCount());
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

  private setupRoutes(): void {
    this.routes.forEach((config, key) =>
      this.ensureRouteRegistered(key, config)
    );
    const healthKey = this.getRouteKey("GET", "/_health");
    if (!this.registeredRouteKeys.has(healthKey)) {
      this.router.get("/_health", (ctx) => {
        ctx.body = {
          status: "ok",
          port: this.port,
          routeCount: this.getRouteCount(),
          timestamp: new Date().toISOString(),
        };
      });
      this.registeredRouteKeys.add(healthKey);
    }
  }

  private ensureRouteRegistered(key: string, config: MockApiConfig): void {
    if (this.registeredRouteKeys.has(key)) {
      return;
    }
    const { method, endpoint } = config;
    const handler = async (ctx: Koa.Context) => {
      const currentKey = this.getRouteKey(ctx.method, ctx.path);
      const currentConfig = this.routes.get(currentKey);
      if (!currentConfig) {
        ctx.status = 404;
        ctx.body = { error: `Route not found: ${ctx.method} ${ctx.path}` };
        return;
      }
      const selection = this.selectRule(currentConfig, {
        method: ctx.method,
        path: ctx.path,
        query: ctx.query as Record<string, string>,
        headers: ctx.headers as Record<string, string>,
        body: (ctx.request as any).body,
      });
      if (!selection.rule) {
        this.logger.warn(
          `[HTTP] No matching rule for ${ctx.method} ${
            ctx.path
          } (activeRuleIndex: ${
            currentConfig.activeRuleIndex ?? 0
          }, total rules: ${currentConfig.rules?.length || 0})`
        );
        ctx.status = 404;
        ctx.body = {
          error: `No matching rule found for ${ctx.method} ${ctx.path}`,
        };
        return;
      }
      await this.applyRule(ctx, selection.rule, currentConfig, selection);
    };
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
    this.registeredRouteKeys.add(key);
    this.logger.logRouteRegistration(
      method.toUpperCase(),
      endpoint,
      config.name
    );
  }

  private selectRule(
    config: MockApiConfig,
    ctx: {
      method: string;
      path: string;
      query: Record<string, string>;
      headers: Record<string, string>;
      body: any;
    }
  ): { rule?: MockRule; index: number; source: "active" | "matched" | "none" } {
    const activeIndex = config.activeRuleIndex ?? 0;
    if (config.rules && config.rules[activeIndex]) {
      return {
        rule: config.rules[activeIndex],
        index: activeIndex,
        source: "active",
      };
    }
    const matched = RuleEngine.findMatchingRule(config.rules || [], ctx);
    if (!matched) {
      return { rule: undefined, index: -1, source: "none" };
    }
    return {
      rule: matched,
      index: config.rules?.indexOf(matched) ?? -1,
      source: "matched",
    };
  }

  private async applyRule(
    ctx: Koa.Context,
    rule: MockRule,
    config: MockApiConfig,
    selection: { index: number; source: string }
  ): Promise<void> {
    if (rule.delay && rule.delay > 0) {
      await new Promise((r) => setTimeout(r, rule.delay));
    }
    ctx.status = rule.status;
    Object.entries(rule.headers || {}).forEach(([k, v]) => ctx.set(k, v));
    ctx.body = rule.body ?? {};
    this.logger.info(
      `[HTTP response] ${ctx.method} ${ctx.path} -> rule="${rule.name}" index=${
        selection.index
      } source=${selection.source} activeRuleIndex=${
        config.activeRuleIndex ?? 0
      } status=${rule.status} delay=${rule.delay || 0}`
    );
  }

  public registerRoute(config: MockApiConfig): void {
    const key = this.getRouteKey(config.method, config.endpoint);
    this.routes.set(key, config);
    this.logger.info(
      `[registerRoute] ${config.method} ${config.endpoint} activeRuleIndex=${
        config.activeRuleIndex ?? 0
      } rules=${config.rules?.length ?? 0}`
    );
    if (this.isRunning) {
      this.ensureRouteRegistered(key, config);
    }
  }

  public unregisterRoute(
    method: string,
    endpoint: string,
    _name?: string
  ): void {
    const key = this.getRouteKey(method, endpoint);
    this.routes.delete(key);
    this.logger.logRouteUnregistration(method, endpoint, undefined);
  }

  public reloadRoutes(configs: MockApiConfig[]): void {
    this.routes.clear();
    configs.forEach((config) => {
      const key = this.getRouteKey(config.method, config.endpoint);
      this.routes.set(key, config);
      this.logger.info(
        `[reloadRoutes] ${config.method} ${config.endpoint} activeRuleIndex=${
          config.activeRuleIndex ?? 0
        }`
      );
      if (this.isRunning) {
        this.ensureRouteRegistered(key, config);
      }
    });
    this.logger.logRouteReload(configs.length);
  }

  public async handleRequest(
    method: string,
    path: string,
    headers: Record<string, string> = {},
    body?: any
  ): Promise<{ status: number; headers: Record<string, string>; body: any }> {
    if (!this.isRunning) {
      return {
        status: 503,
        headers: { "Content-Type": "application/json" },
        body: { error: "Mock server is not running" },
      };
    }
    const key = this.getRouteKey(method, path);
    const config = this.routes.get(key);
    if (!config) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        body: { error: `Route not found: ${method} ${path}` },
      };
    }
    const selection = this.selectRule(config, {
      method,
      path,
      query: {},
      headers,
      body,
    });
    const rule = selection.rule;
    if (!rule) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        body: { error: "No matching rule found" },
      };
    }
    if (rule.delay && rule.delay > 0) {
      await new Promise((r) => setTimeout(r, rule.delay));
    }
    return {
      status: rule.status,
      headers: rule.headers || { "Content-Type": "application/json" },
      body: rule.body || {},
    };
  }

  public getStatus(): {
    running: boolean;
    port: number;
    routeCount: number;
    routes: Array<{ method: string; endpoint: string; name: string }>;
  } {
    const routes: Array<{ method: string; endpoint: string; name: string }> =
      [];
    this.routes.forEach((config) => {
      routes.push({
        method: config.method,
        endpoint: config.endpoint,
        name: config.name,
      });
    });
    return {
      running: this.isRunning,
      port: this.port,
      routeCount: routes.length,
      routes,
    };
  }

  public getLogs(
    limit: number = 100
  ): Array<{ timestamp: Date; method: string; path: string; status: number }> {
    return this.requestLog.slice(-limit);
  }

  public clearLogs(): void {
    this.requestLog = [];
  }

  private getRouteCount(): number {
    return this.routes.size;
  }

  private getRouteKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  private logRequest(method: string, path: string, status: number): void {
    this.requestLog.push({ timestamp: new Date(), method, path, status });
    if (this.requestLog.length > 1000) {
      this.requestLog = this.requestLog.slice(-1000);
    }
  }

  public isServerRunning(): boolean {
    return this.isRunning;
  }
}
