export interface MockRule {
  name: string;
  status: number;
  headers: Record<string, string>;
  body: any;
  delay: number;
}

export interface MockApiConfig {
  name: string;
  description: string;
  responseType?: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  endpoint: string;
  rules: MockRule[];
  activeRuleIndex?: number;
}

export interface MockFileItem {
  filename: string;
  path: string;
  config: MockApiConfig;
}
