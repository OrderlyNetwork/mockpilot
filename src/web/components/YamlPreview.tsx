import { useState } from "react";
import { Button } from "@components/ui/button";
import { Copy, Check } from "lucide-react";
import { Rule } from "./RuleItem";

interface ApiConfig {
  name: string;
  description: string;
  method: string;
  endpoint: string;
  rules: Rule[];
}

interface YamlPreviewProps {
  config: ApiConfig;
}

export function YamlPreview({ config }: YamlPreviewProps) {
  const [copied, setCopied] = useState(false);

  const generateYaml = () => {
    const formatBody = (body: string) => {
      try {
        // Try to parse as JSON for proper formatting
        const parsed = JSON.parse(body);
        const jsonString = JSON.stringify(parsed, null, 2);
        // Indent each line for YAML
        return jsonString
          .split("\n")
          .map((line, i) => (i === 0 ? line : `      ${line}`))
          .join("\n");
      } catch {
        // If not JSON, just handle as string
        return body.replace(/\n/g, "\n      ");
      }
    };

    const yaml = `name: ${config.name}
description: ${config.description}
method: ${config.method}
endpoint: ${config.endpoint}
rules:
${config.rules
  .map(
    (rule) => `  - name: ${rule.name}
    status: ${rule.status}
    headers:
${Object.entries(rule.headers)
  .map(([key, value]) => `      ${key}: ${value}`)
  .join("\n")}
    body: ${formatBody(rule.body)}
    delay: ${rule.delay}`
  )
  .join("\n")}`;
    return yaml;
  };

  const copyYaml = () => {
    navigator.clipboard.writeText(generateYaml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-96 border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">YAML Preview</h3>
        <Button size="sm" variant="ghost" onClick={copyYaml}>
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className="overflow-auto p-4 font-mono text-xs text-muted-foreground">
        {generateYaml()}
      </pre>
    </div>
  );
}
