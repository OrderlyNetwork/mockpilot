export interface MockApiRule {
  name: string;
  status: number;
  headers?: Record<string, string>;
  body?: any;
  delay?: number;
  condition?: {
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
  };
}

export interface MockApi {
  id: string;
  name: string;
  description?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  endpoint: string;
  rules: MockApiRule[];
  enabled: boolean;
  filePath?: string;
}

export interface MockApiFile {
  path: string;
  content: string;
  parsed?: MockApi;
}