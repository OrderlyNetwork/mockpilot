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
   * expr format: "key=value" or "key:value"
   */
  private static matchHeader(
    expr: string,
    headers: Record<string, string>
  ): boolean {
    const pairs = expr.split("&");

    for (const pair of pairs) {
      const [key, value] = pair.includes(":")
        ? pair.split(":")
        : pair.split("=");
      if (!key || !value) {
        continue;
      }

      const headerKey = key.trim().toLowerCase();
      const headerValue = value.trim();

      if (!headers[headerKey] || headers[headerKey] !== headerValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Match body content
   * expr format: JSON path expression or simple key=value
   */
  private static matchBody(expr: string, body: any): boolean {
    if (!body) {
      return false;
    }

    // Simple key=value matching for JSON body
    const pairs = expr.split("&");

    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (!key || !value) {
        continue;
      }

      const keys = key.trim().split(".");
      let current = body;

      // Traverse nested object
      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = current[k];
        } else {
          return false;
        }
      }

      // Compare value
      if (String(current) !== value.trim()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a rule against context (for future advanced matching)
   */
  public static evaluateRule(
    rule: MockRule,
    context: MatchContext
  ): {
    matched: boolean;
    score: number;
  } {
    const matched = this.matchesRule(rule, context);
    const score = matched ? 1 : 0;

    return { matched, score };
  }
}
