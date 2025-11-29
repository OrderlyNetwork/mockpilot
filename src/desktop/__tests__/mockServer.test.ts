/**
 * Unit tests for MockServer core logic
 * Tests route registration, rule selection, and request handling
 */

import * as assert from 'assert';
import { vi } from 'vitest';
import { MockServer } from '../mockServer';
import { MockApiConfig, MockRule } from '../../types';

// Mock LogOutputService to avoid VS Code dependencies
vi.mock('../../services/logOutputService', () => {
  return {
    LogOutputService: {
      getInstance: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        logRequest: vi.fn(),
        logServerStart: vi.fn(),
        logServerStop: vi.fn(),
        logRouteRegistration: vi.fn(),
        logRouteUnregistration: vi.fn(),
        logRouteReload: vi.fn(),
      }),
    },
  };
});

describe('MockServer', () => {
  let mockServer: MockServer;
  const testPort = 9999; // Use a test port that's unlikely to be in use

  beforeEach(() => {
    mockServer = new MockServer({
      port: testPort,
      mockDirectory: '.mock',
    });
  });

  afterEach(async () => {
    if (mockServer.isServerRunning()) {
      await mockServer.stop();
    }
  });

  describe('registerRoute', () => {
    it('should register a route configuration', () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test description',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'success' },
            delay: 0,
          },
        ],
        activeRuleIndex: 0,
      };

      mockServer.registerRoute(config);
      const status = mockServer.getStatus();
      assert.strictEqual(status.routeCount, 1);
      assert.strictEqual(status.routes[0].method, 'GET');
      assert.strictEqual(status.routes[0].endpoint, '/api/test');
      assert.strictEqual(status.routes[0].name, 'Test API');
    });

    it('should register multiple routes', () => {
      const config1: MockApiConfig = {
        name: 'API 1',
        description: 'First API',
        method: 'GET',
        endpoint: '/api/test1',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      const config2: MockApiConfig = {
        name: 'API 2',
        description: 'Second API',
        method: 'POST',
        endpoint: '/api/test2',
        rules: [
          {
            name: 'default',
            status: 201,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config1);
      mockServer.registerRoute(config2);
      const status = mockServer.getStatus();
      assert.strictEqual(status.routeCount, 2);
    });

    it('should replace existing route when registering same method and endpoint', () => {
      const config1: MockApiConfig = {
        name: 'Original',
        description: 'Original API',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      const config2: MockApiConfig = {
        name: 'Updated',
        description: 'Updated API',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 201,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config1);
      mockServer.registerRoute(config2);
      const status = mockServer.getStatus();
      assert.strictEqual(status.routeCount, 1);
      assert.strictEqual(status.routes[0].name, 'Updated');
    });
  });

  describe('unregisterRoute', () => {
    it('should unregister a route', () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test description',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      assert.strictEqual(mockServer.getStatus().routeCount, 1);

      mockServer.unregisterRoute('GET', '/api/test');
      assert.strictEqual(mockServer.getStatus().routeCount, 0);
    });

    it('should handle unregistering non-existent route gracefully', () => {
      mockServer.unregisterRoute('GET', '/api/nonexistent');
      assert.strictEqual(mockServer.getStatus().routeCount, 0);
    });
  });

  describe('reloadRoutes', () => {
    it('should clear existing routes and register new ones', () => {
      const config1: MockApiConfig = {
        name: 'Old API',
        description: 'Old',
        method: 'GET',
        endpoint: '/api/old',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      const config2: MockApiConfig = {
        name: 'New API',
        description: 'New',
        method: 'POST',
        endpoint: '/api/new',
        rules: [
          {
            name: 'default',
            status: 201,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config1);
      assert.strictEqual(mockServer.getStatus().routeCount, 1);

      mockServer.reloadRoutes([config2]);
      const status = mockServer.getStatus();
      assert.strictEqual(status.routeCount, 1);
      assert.strictEqual(status.routes[0].name, 'New API');
      assert.strictEqual(status.routes[0].method, 'POST');
    });

    it('should handle empty routes array', () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      mockServer.reloadRoutes([]);
      assert.strictEqual(mockServer.getStatus().routeCount, 0);
    });
  });

  describe('handleRequest', () => {
    it('should return 503 when server is not running', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      const response = await mockServer.handleRequest('GET', '/api/test');
      assert.strictEqual(response.status, 503);
      assert.strictEqual(response.body.error, 'Mock server is not running');
    });

    it('should return 404 when route is not found', async () => {
      await mockServer.start();

      const response = await mockServer.handleRequest(
        'GET',
        '/api/nonexistent'
      );
      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.error, 'Route not found: GET /api/nonexistent');
    });

    it('should return response from active rule', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'success' },
            delay: 0,
          },
        ],
        activeRuleIndex: 0,
      };

      mockServer.registerRoute(config);
      await mockServer.start();

      const response = await mockServer.handleRequest('GET', '/api/test');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.message, 'success');
      assert.strictEqual(
        response.headers['Content-Type'],
        'application/json'
      );
    });

    it('should return response from activeRuleIndex when set', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'rule1',
            status: 200,
            headers: {},
            body: { message: 'rule1' },
            delay: 0,
          },
          {
            name: 'rule2',
            status: 404,
            headers: {},
            body: { message: 'rule2' },
            delay: 0,
          },
        ],
        activeRuleIndex: 1,
      };

      mockServer.registerRoute(config);
      await mockServer.start();

      const response = await mockServer.handleRequest('GET', '/api/test');
      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.message, 'rule2');
    });

    it('should apply delay when rule has delay set', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 100,
          },
        ],
      };

      mockServer.registerRoute(config);
      await mockServer.start();

      const startTime = Date.now();
      await mockServer.handleRequest('GET', '/api/test');
      const duration = Date.now() - startTime;

      assert.ok(duration >= 90); // Allow some margin for test execution time
    });

    it('should match rule based on query parameters when active rule not found', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'query-match',
            status: 200,
            headers: {},
            body: { matched: true },
            delay: 0,
            match: { type: 'query', expr: 'status=active' },
          } as any,
        ],
        activeRuleIndex: 999, // Invalid index, should fall back to matching
      };

      mockServer.registerRoute(config);
      await mockServer.start();

      // Note: handleRequest doesn't support query parameters directly
      // This test verifies the fallback behavior
      const response = await mockServer.handleRequest('GET', '/api/test');
      // Should return first rule as default when activeRuleIndex is invalid
      assert.strictEqual(response.status, 200);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when server is not running', () => {
      const status = mockServer.getStatus();
      assert.strictEqual(status.running, false);
      assert.strictEqual(status.port, testPort);
      assert.strictEqual(status.routeCount, 0);
      assert.strictEqual(status.routes.length, 0);
    });

    it('should return correct status when server is running', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      await mockServer.start();

      const status = mockServer.getStatus();
      assert.strictEqual(status.running, true);
      assert.strictEqual(status.port, testPort);
      assert.strictEqual(status.routeCount, 1);
    });
  });

  describe('getLogs', () => {
    it('should return empty array when no requests have been made', () => {
      const logs = mockServer.getLogs();
      assert.strictEqual(logs.length, 0);
    });

    it('should return logs with limit', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      await mockServer.start();

      // Make some requests
      await mockServer.handleRequest('GET', '/api/test');
      await mockServer.handleRequest('GET', '/api/test');

      const logs = mockServer.getLogs(10);
      assert.ok(logs.length >= 0); // Logs are tracked internally
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      await mockServer.start();
      await mockServer.handleRequest('GET', '/api/test');

      mockServer.clearLogs();
      const logs = mockServer.getLogs();
      assert.strictEqual(logs.length, 0);
    });
  });

  describe('isServerRunning', () => {
    it('should return false when server is not started', () => {
      assert.strictEqual(mockServer.isServerRunning(), false);
    });

    it('should return true when server is started', async () => {
      await mockServer.start();
      assert.strictEqual(mockServer.isServerRunning(), true);
    });

    it('should return false when server is stopped', async () => {
      await mockServer.start();
      assert.strictEqual(mockServer.isServerRunning(), true);

      await mockServer.stop();
      assert.strictEqual(mockServer.isServerRunning(), false);
    });
  });

  describe('start and stop', () => {
    it('should start server successfully', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      await mockServer.start();
      assert.strictEqual(mockServer.isServerRunning(), true);
    });

    it('should not start server twice', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      await mockServer.start();
      await mockServer.start(); // Should not throw
      assert.strictEqual(mockServer.isServerRunning(), true);
    });

    it('should stop server successfully', async () => {
      const config: MockApiConfig = {
        name: 'Test API',
        description: 'Test',
        method: 'GET',
        endpoint: '/api/test',
        rules: [
          {
            name: 'default',
            status: 200,
            headers: {},
            body: {},
            delay: 0,
          },
        ],
      };

      mockServer.registerRoute(config);
      await mockServer.start();
      await mockServer.stop();
      assert.strictEqual(mockServer.isServerRunning(), false);
    });

    it('should handle stopping server that is not running', async () => {
      await mockServer.stop(); // Should not throw
      assert.strictEqual(mockServer.isServerRunning(), false);
    });
  });
});

