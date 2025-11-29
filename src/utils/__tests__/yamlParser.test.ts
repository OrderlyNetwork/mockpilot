/**
 * Unit tests for YAML Parser
 * Tests YAML configuration parsing and error handling
 */

import * as assert from 'assert';
import { parseYamlConfig } from '../yamlParser';
import { MockApiConfig } from '../../types';

describe('yamlParser', () => {
  describe('parseYamlConfig', () => {
    it('should parse valid YAML configuration', async () => {
      const yamlText = `
name: Test API
description: Test description
method: GET
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body:
      message: success
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.name, 'Test API');
      assert.strictEqual(result.description, 'Test description');
      assert.strictEqual(result.method, 'GET');
      assert.strictEqual(result.endpoint, '/api/test');
      assert.strictEqual(result.rules.length, 1);
      assert.strictEqual(result.rules[0].name, 'default');
      assert.strictEqual(result.rules[0].status, 200);
    });

    it('should use filename as fallback name when name is missing', async () => {
      const yamlText = `
method: GET
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'my-api.yaml');
      assert.strictEqual(result.name, 'my-api');
    });

    it('should remove .yml extension from filename when used as name', async () => {
      const yamlText = `
method: GET
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'my-api.yml');
      assert.strictEqual(result.name, 'my-api');
    });

    it('should use default description when description is missing', async () => {
      const yamlText = `
name: Test API
method: GET
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.description, 'No description');
    });

    it('should use GET as default method when method is missing', async () => {
      const yamlText = `
name: Test API
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.method, 'GET');
    });

    it('should use /api/unknown as default endpoint when endpoint is missing', async () => {
      const yamlText = `
name: Test API
method: GET
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.endpoint, '/api/unknown');
    });

    it('should create default rule when rules array is empty', async () => {
      const yamlText = `
name: Test API
method: GET
endpoint: /api/test
rules: []
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.rules.length, 1);
      assert.strictEqual(result.rules[0].name, 'default');
      assert.strictEqual(result.rules[0].status, 200);
      assert.strictEqual(
        result.rules[0].headers['Content-Type'],
        'application/json'
      );
    });

    it('should create default rule when rules is missing', async () => {
      const yamlText = `
name: Test API
method: GET
endpoint: /api/test
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.rules.length, 1);
      assert.strictEqual(result.rules[0].name, 'default');
      assert.strictEqual(result.rules[0].status, 200);
    });

    it('should set default values for rule properties', async () => {
      const yamlText = `
name: Test API
method: GET
endpoint: /api/test
rules:
  - name: custom-rule
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.rules[0].name, 'custom-rule');
      assert.strictEqual(result.rules[0].status, 200);
      assert.strictEqual(
        result.rules[0].headers['Content-Type'],
        'application/json'
      );
      assert.deepStrictEqual(result.rules[0].body, {});
      assert.strictEqual(result.rules[0].delay, 0);
    });

    it('should parse multiple rules', async () => {
      const yamlText = `
name: Test API
method: GET
endpoint: /api/test
rules:
  - name: rule1
    status: 200
    headers:
      Content-Type: application/json
    body:
      message: rule1
    delay: 0
  - name: rule2
    status: 404
    headers:
      Content-Type: application/json
    body:
      message: rule2
    delay: 100
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.rules.length, 2);
      assert.strictEqual(result.rules[0].name, 'rule1');
      assert.strictEqual(result.rules[0].status, 200);
      assert.strictEqual(result.rules[1].name, 'rule2');
      assert.strictEqual(result.rules[1].status, 404);
      assert.strictEqual(result.rules[1].delay, 100);
    });

    it('should set activeRuleIndex when provided', async () => {
      const yamlText = `
name: Test API
method: GET
endpoint: /api/test
activeRuleIndex: 1
rules:
  - name: rule1
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
  - name: rule2
    status: 404
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.activeRuleIndex, 1);
    });

    it('should default activeRuleIndex to 0 when not provided', async () => {
      const yamlText = `
name: Test API
method: GET
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.activeRuleIndex, 0);
    });

    it('should handle complex nested body structures', async () => {
      const yamlText = `
name: Test API
method: POST
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body:
      user:
        id: 123
        name: John
        profile:
          email: john@example.com
          roles:
            - admin
            - user
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.rules[0].body.user.id, 123);
      assert.strictEqual(result.rules[0].body.user.name, 'John');
      assert.strictEqual(
        result.rules[0].body.user.profile.email,
        'john@example.com'
      );
      assert.strictEqual(
        result.rules[0].body.user.profile.roles.length,
        2
      );
    });

    it('should return default config on invalid YAML syntax', async () => {
      const invalidYaml = `
name: Test API
method: GET
endpoint: /api/test
rules:
  - name: default
    status: 200
    invalid: [unclosed bracket
`;

      const result = await parseYamlConfig(invalidYaml, 'test.yaml');
      assert.strictEqual(result.name, 'test');
      assert.strictEqual(result.description, 'Failed to parse YAML');
      assert.strictEqual(result.method, 'GET');
      assert.strictEqual(result.endpoint, '/api/unknown');
      assert.strictEqual(result.rules.length, 1);
      assert.strictEqual(result.rules[0].status, 500);
      assert.strictEqual(
        result.rules[0].body.error,
        'Failed to parse YAML configuration'
      );
    });

    it('should return default config on completely invalid YAML', async () => {
      const invalidYaml = 'this is not yaml at all!!!';

      const result = await parseYamlConfig(invalidYaml, 'test.yaml');
      assert.strictEqual(result.name, 'test');
      assert.strictEqual(result.description, 'Failed to parse YAML');
      assert.strictEqual(result.method, 'GET');
      assert.strictEqual(result.endpoint, '/api/unknown');
      assert.strictEqual(result.rules.length, 1);
      assert.strictEqual(result.rules[0].status, 500);
    });

    it('should handle empty YAML string', async () => {
      const result = await parseYamlConfig('', 'test.yaml');
      assert.strictEqual(result.name, 'test');
      assert.strictEqual(result.method, 'GET');
      assert.strictEqual(result.endpoint, '/api/unknown');
      assert.strictEqual(result.rules.length, 1);
    });

    it('should preserve responseType when provided', async () => {
      const yamlText = `
name: Test API
responseType: application/json
method: GET
endpoint: /api/test
rules:
  - name: default
    status: 200
    headers:
      Content-Type: application/json
    body: {}
    delay: 0
`;

      const result = await parseYamlConfig(yamlText, 'test.yaml');
      assert.strictEqual(result.responseType, 'application/json');
    });
  });
});


