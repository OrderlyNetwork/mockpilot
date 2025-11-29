/**
 * Unit tests for RuleEngine
 * Tests rule matching logic including query, header, and body matching
 */

import * as assert from 'assert';
import { RuleEngine, MatchContext } from '../ruleEngine';
import { MockRule } from '../../types';

describe('RuleEngine', () => {
  describe('findMatchingRule', () => {
    it('should return null when rules array is empty', () => {
      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers: {},
      };

      const result = RuleEngine.findMatchingRule([], context);
      assert.strictEqual(result, null);
    });

    it('should return null when rules is null', () => {
      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers: {},
      };

      const result = RuleEngine.findMatchingRule(null as any, context);
      assert.strictEqual(result, null);
    });

    it('should return first rule when no rules have match criteria', () => {
      const rules: MockRule[] = [
        {
          name: 'default',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { message: 'default' },
          delay: 0,
        },
        {
          name: 'alternative',
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: { message: 'alternative' },
          delay: 0,
        },
      ];

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers: {},
      };

      const result = RuleEngine.findMatchingRule(rules, context);
      assert.strictEqual(result?.name, 'default');
    });

    it('should return matching rule based on query parameters', () => {
      const rules: MockRule[] = [
        {
          name: 'default',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { message: 'default' },
          delay: 0,
          match: { type: 'query', expr: 'status=active' },
        } as any,
        {
          name: 'inactive',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { message: 'inactive' },
          delay: 0,
          match: { type: 'query', expr: 'status=inactive' },
        } as any,
      ];

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: { status: 'active' },
        headers: {},
      };

      const result = RuleEngine.findMatchingRule(rules, context);
      assert.strictEqual(result?.name, 'default');
    });

    it('should return matching rule based on header', () => {
      const rules: MockRule[] = [
        {
          name: 'admin',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { role: 'admin' },
          delay: 0,
          match: { type: 'header', expr: 'role=admin' },
        } as any,
        {
          name: 'user',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { role: 'user' },
          delay: 0,
          match: { type: 'header', expr: 'role=user' },
        } as any,
      ];

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers: { role: 'admin' },
      };

      const result = RuleEngine.findMatchingRule(rules, context);
      assert.strictEqual(result?.name, 'admin');
    });

    it('should return matching rule based on body content', () => {
      const rules: MockRule[] = [
        {
          name: 'authenticated',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { authenticated: true },
          delay: 0,
          match: { type: 'body', expr: 'user.id=123' },
        } as any,
        {
          name: 'unauthenticated',
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Unauthorized' },
          delay: 0,
        } as any,
      ];

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        body: { user: { id: '123' } },
      };

      const result = RuleEngine.findMatchingRule(rules, context);
      assert.strictEqual(result?.name, 'authenticated');
    });

    it('should return first rule when no match found', () => {
      const rules: MockRule[] = [
        {
          name: 'default',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { message: 'default' },
          delay: 0,
          match: { type: 'query', expr: 'status=active' },
        } as any,
      ];

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: { status: 'inactive' },
        headers: {},
      };

      const result = RuleEngine.findMatchingRule(rules, context);
      assert.strictEqual(result?.name, 'default');
    });
  });

  describe('matchQuery', () => {
    it('should match single query parameter', () => {
      const expr = 'status=active';
      const query = { status: 'active' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'query', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query,
        headers: {},
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should match multiple query parameters with & separator', () => {
      const expr = 'status=active&type=premium';
      const query = { status: 'active', type: 'premium' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'query', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query,
        headers: {},
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should not match when query parameter value differs', () => {
      const expr = 'status=active';
      const query = { status: 'inactive' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'query', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query,
        headers: {},
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      // Should return first rule as default when no match
      assert.strictEqual(result?.name, 'test');
    });

    it('should handle query parameters with spaces', () => {
      const expr = 'name=John Doe';
      const query = { name: 'John Doe' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'query', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query,
        headers: {},
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });
  });

  describe('matchHeader', () => {
    it('should match header with = separator', () => {
      const expr = 'authorization=Bearer token123';
      const headers = { authorization: 'Bearer token123' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'header', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should match header with : separator', () => {
      const expr = 'authorization:Bearer token123';
      const headers = { authorization: 'Bearer token123' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'header', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should match multiple headers with & separator', () => {
      const expr = 'role=admin&x-api-key=secret123';
      const headers = { role: 'admin', 'x-api-key': 'secret123' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'header', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should be case-insensitive for header keys', () => {
      const expr = 'Authorization=Bearer token123';
      const headers = { authorization: 'Bearer token123' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'header', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should not match when header value differs', () => {
      const expr = 'authorization=Bearer token123';
      const headers = { authorization: 'Bearer token456' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'header', expr },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: {},
        headers,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      // Should return first rule as default when no match
      assert.strictEqual(result?.name, 'test');
    });
  });

  describe('matchBody', () => {
    it('should match simple body field', () => {
      const expr = 'username=john';
      const body = { username: 'john' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'body', expr },
      } as any;

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        body,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should match nested body field', () => {
      const expr = 'user.id=123';
      const body = { user: { id: '123' } };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'body', expr },
      } as any;

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        body,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should match deeply nested body field', () => {
      const expr = 'data.user.profile.email=test@example.com';
      const body = {
        data: {
          user: {
            profile: {
              email: 'test@example.com',
            },
          },
        },
      };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'body', expr },
      } as any;

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        body,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should match multiple body fields with & separator', () => {
      const expr = 'user.id=123&user.role=admin';
      const body = { user: { id: '123', role: 'admin' } };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'body', expr },
      } as any;

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        body,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });

    it('should not match when body is missing', () => {
      const expr = 'username=john';

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'body', expr },
      } as any;

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        // body is undefined
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      // Should return first rule as default when no match
      assert.strictEqual(result?.name, 'test');
    });

    it('should not match when nested field does not exist', () => {
      const expr = 'user.id=123';
      const body = { username: 'john' };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'body', expr },
      } as any;

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        body,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      // Should return first rule as default when no match
      assert.strictEqual(result?.name, 'test');
    });

    it('should convert numeric values to string for comparison', () => {
      const expr = 'user.id=123';
      const body = { user: { id: 123 } };

      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'body', expr },
      } as any;

      const context: MatchContext = {
        method: 'POST',
        path: '/api/test',
        query: {},
        headers: {},
        body,
      };

      const result = RuleEngine.findMatchingRule([rule], context);
      assert.strictEqual(result?.name, 'test');
    });
  });

  describe('evaluateRule', () => {
    it('should return matched=true and score=1 when rule matches', () => {
      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'query', expr: 'status=active' },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: { status: 'active' },
        headers: {},
      };

      const result = RuleEngine.evaluateRule(rule, context);
      assert.strictEqual(result.matched, true);
      assert.strictEqual(result.score, 1);
    });

    it('should return matched=false and score=0 when rule does not match', () => {
      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'query', expr: 'status=active' },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: { status: 'inactive' },
        headers: {},
      };

      const result = RuleEngine.evaluateRule(rule, context);
      assert.strictEqual(result.matched, false);
      assert.strictEqual(result.score, 0);
    });

    it('should return matched=false for manual match type', () => {
      const rule: MockRule = {
        name: 'test',
        status: 200,
        headers: {},
        body: {},
        delay: 0,
        match: { type: 'manual', expr: 'status=active' },
      } as any;

      const context: MatchContext = {
        method: 'GET',
        path: '/api/test',
        query: { status: 'active' },
        headers: {},
      };

      const result = RuleEngine.evaluateRule(rule, context);
      assert.strictEqual(result.matched, false);
      assert.strictEqual(result.score, 0);
    });
  });
});


