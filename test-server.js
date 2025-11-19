/**
 * Test script for Koa.js Mock Server
 * Run this in Node.js to test the server independently
 */

import { MockServer } from './dist/desktop/mockServer.js';

async function testMockServer() {
  console.log('🧪 Testing Mock Server with Koa.js...\n');

  // Create server instance
  const server = new MockServer({
    port: 3000,
    mockDirectory: '.mock'
  });

  // Register a test route
  server.registerRoute({
    name: 'Test User API',
    method: 'GET',
    endpoint: '/api/users',
    rules: [
      {
        name: 'success',
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ]
        },
        delay: 0
      }
    ]
  });

  server.registerRoute({
    name: 'Test Login API',
    method: 'POST',
    endpoint: '/api/login',
    rules: [
      {
        name: 'success',
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          token: 'mock-jwt-token-123456',
          user: {
            id: 1,
            username: 'admin'
          }
        },
        delay: 100
      }
    ]
  });

  try {
    // Start server
    await server.start();
    console.log('✅ Server started successfully!\n');

    // Get status
    const status = server.getStatus();
    console.log('📊 Server Status:');
    console.log(JSON.stringify(status, null, 2));
    console.log('');

    console.log('🌐 You can now test the server:');
    console.log(`   curl http://localhost:${status.port}/_health`);
    console.log(`   curl http://localhost:${status.port}/api/users`);
    console.log(`   curl -X POST http://localhost:${status.port}/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}'`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Stopping server...');
      await server.stop();
      console.log('✅ Server stopped');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run test
testMockServer();
