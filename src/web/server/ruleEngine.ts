/**
 * Rule Engine - Advanced rule matching for mock responses
 */

import { MockRule } from "../types";

export interface MatchContext {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: any;
}

export type MatchType = "manual" | "query" | "header" | "body" | "auto";

export interface RuleMatch {
  type?: MatchType;
  expr?: string; // e.g., "status=401" or "role=admin"
}

/**
 * Rule matching engine
 */
export class RuleEngine {
  /**
   * Find the best matching rule from a list of rules
   */
  public static findMatchingRule(
    rules: MockRule[],
    context: MatchContext
  ): MockRule | null {
    if (!rules || rules.length === 0) {
      return null;
    }

    // Try to find a rule with explicit match criteria
    for (const rule of rules) {
      if (this.matchesRule(rule, context)) {
        return rule;
      }
    }

    // If no explicit match, return the first rule as default
    return rules[0];
  }

  /**
   * Check if a rule matches the request context
   */
  private static matchesRule(rule: MockRule, context: MatchContext): boolean {
    // If rule doesn't have match criteria, it's a default rule
    const match = (rule as any).match as RuleMatch | undefined;

    if (!match || !match.type || !match.expr) {
      return false;
    }

    switch (match.type) {
      case "query":
        return this.matchQuery(match.expr, context.query);

      case "header":
        return this.matchHeader(match.expr, context.headers);

      case "body":
        return this.matchBody(match.expr, context.body);

      case "manual":
        // Manual rules don't auto-match, they need explicit selection
        return false;

      default:
        return false;
    }
  }

  /**
   * Match query parameters
   * expr format: "key=value" or "key=value&key2=value2"
   */
  private static matchQuery(
    expr: string,
    query: Record<string, string>
  ): boolean {
    const pairs = expr.split("&");

    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (!key || !value) {
        continue;
      }

      if (query[key.trim()] !== value.trim()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Match headers
   * expr format: "Header-Name=value"
   */
  private static matchHeader(
    expr: string,
    headers: Record<string, string>
  ): boolean {
    const [key, value] = expr.split("=");
    if (!key || !value) {
      return false;
    }

    const headerKey = key.trim().toLowerCase();
    const headerValue = value.trim();

    // Case-insensitive header matching
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === headerKey && v === headerValue) {
        return true;
      }
    }

    return false;
  }

  /**
   * Match request body
   * expr format: "field.path=value" (supports nested fields with dot notation)
   */
  private static matchBody(expr: string, body: any): boolean {
    if (!body) {
      return false;
    }

    const [path, value] = expr.split("=");
    if (!path || !value) {
      return false;
    }

    const fieldPath = path.trim().split(".");
    const expectedValue = value.trim();

    let current = body;
    for (const field of fieldPath) {
      if (current && typeof current === "object" && field in current) {
        current = current[field];
      } else {
        return false;
      }
    }

    // Convert to string for comparison
    return String(current) === expectedValue;
  }

  /**
   * Parse query string to object
   */
  public static parseQueryString(queryString: string): Record<string, string> {
    const query: Record<string, string> = {};

    if (!queryString) {
      return query;
    }

    const params = queryString.split("&");
    for (const param of params) {
      const [key, value] = param.split("=");
      if (key) {
        query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
      }
    }

    return query;
  }
}
