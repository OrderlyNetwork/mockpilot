import React, { useState, useEffect } from "react";
import { MockApiConfig, MockRule } from "../types";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader } from "@components/ui/card";

interface MockEditorProps {
  config: MockApiConfig;
  filePath: string;
  onConfigChange?: (config: MockApiConfig) => void;
  onSave?: (config: MockApiConfig, filePath: string) => void;
}

export const MockEditor: React.FC<MockEditorProps> = ({
  config: initialConfig,
  filePath,
  onConfigChange,
  onSave,
}) => {
  const [config, setConfig] = useState<MockApiConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"preview" | "yaml" | "test">(
    "preview"
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const updateConfig = (field: keyof MockApiConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setHasUnsavedChanges(true);
    onConfigChange?.(newConfig);
  };

  const updateMethod = (
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
  ) => {
    updateConfig("method", method);
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...config.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    updateConfig("rules", newRules);
  };

  const updateRuleBody = (index: number, content: string) => {
    try {
      const body = JSON.parse(content);
      updateRule(index, "body", body);
    } catch (e) {
      console.error("Invalid JSON:", e);
    }
  };

  const updateHeader = (
    ruleIndex: number,
    oldKey: string,
    type: "key" | "value",
    value: string
  ) => {
    const rule = config.rules[ruleIndex];
    const headers = { ...rule.headers };

    if (type === "key") {
      if (oldKey === value) return;
      const headerValue = headers[oldKey];
      delete headers[oldKey];
      headers[value] = headerValue;
    } else {
      headers[oldKey] = value;
    }

    updateRule(ruleIndex, "headers", headers);
  };

  const removeHeader = (ruleIndex: number, key: string) => {
    const rule = config.rules[ruleIndex];
    const headers = { ...rule.headers };
    delete headers[key];
    updateRule(ruleIndex, "headers", headers);
  };

  const addHeader = (ruleIndex: number) => {
    const rule = config.rules[ruleIndex];
    const headers = { ...rule.headers };
    headers["New-Header"] = "value";
    updateRule(ruleIndex, "headers", headers);
  };

  const addRule = () => {
    const newRule: MockRule = {
      name: `Rule ${config.rules.length + 1}`,
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { message: "Hello World" },
      delay: 0,
    };
    updateConfig("rules", [...config.rules, newRule]);
  };

  const duplicateRule = (index: number) => {
    const rule = config.rules[index];
    const newRule = { ...rule, name: `${rule.name} (Copy)` };
    const newRules = [...config.rules];
    newRules.splice(index + 1, 0, newRule);
    updateConfig("rules", newRules);
  };

  const deleteRule = (index: number) => {
    if (config.rules.length > 1) {
      const newRules = config.rules.filter((_, i) => i !== index);
      updateConfig("rules", newRules);
    }
  };

  const handleSave = () => {
    onSave?.(config, filePath);
    setHasUnsavedChanges(false);
  };

  const testApi = () => {
    // Mock test functionality
    alert("Test API functionality - Mock server not implemented yet");
  };

  const generateYaml = (): string => {
    let yaml = `name: ${config.name}
description: ${config.description}
method: ${config.method}
endpoint: ${config.endpoint}
rules:`;

    config.rules.forEach((rule) => {
      yaml += `
  - name: ${rule.name}
    status: ${rule.status}
    delay: ${rule.delay}
    headers:`;

      Object.entries(rule.headers).forEach(([key, value]) => {
        yaml += `
      ${key}: ${value}`;
      });

      yaml += `
    body: ${JSON.stringify(rule.body)}`;
    });

    return yaml;
  };

  const renderHeaderRow = (key: string, value: string, ruleIndex: number) => (
    <div className="flex gap-2 mb-2 items-center" key={key}>
      <Input
        type="text"
        value={key}
        placeholder="Header name"
        onChange={(e) => updateHeader(ruleIndex, key, "key", e.target.value)}
        className="flex-1 h-8 text-xs"
      />
      <Input
        type="text"
        value={value}
        placeholder="Header value"
        onChange={(e) => updateHeader(ruleIndex, key, "value", e.target.value)}
        className="flex-1 h-8 text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2 text-xs"
        onClick={() => removeHeader(ruleIndex, key)}
      >
        Remove
      </Button>
    </div>
  );

  const renderRule = (rule: MockRule, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="flex items-center justify-between">
        <div className="font-semibold text-(--vscode-foreground) flex-1">
          Rule: {rule.name}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => duplicateRule(index)}
            title="Duplicate"
            className="h-8 w-8"
          >
            📋
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteRule(index)}
            title="Delete"
            className="h-8 w-8"
          >
            🗑️
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
              Rule Name
            </label>
            <Input
              type="text"
              value={rule.name}
              onChange={(e) => updateRule(index, "name", e.target.value)}
            />
          </div>
          <div className="w-28">
            <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
              Status Code
            </label>
            <Input
              type="number"
              value={rule.status}
              onChange={(e) =>
                updateRule(index, "status", parseInt(e.target.value))
              }
            />
          </div>
          <div className="w-28">
            <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
              Delay (ms)
            </label>
            <Input
              type="number"
              value={rule.delay}
              onChange={(e) =>
                updateRule(index, "delay", parseInt(e.target.value))
              }
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
            Headers
          </label>
          <div className="bg-(--vscode-textBlockQuote-background) border border-(--vscode-input-border) rounded p-3 min-h-[100px]">
            {Object.entries(rule.headers).map(([key, value]) =>
              renderHeaderRow(key, value, index)
            )}
            <Button
              variant="outline"
              onClick={() => addHeader(index)}
              className="mt-1 text-sm"
            >
              + Add Header
            </Button>
          </div>
        </div>

        <div className="mb-2">
          <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
            Response Body (JSON)
          </label>
          <Textarea
            className="font-mono text-xs min-h-[200px]"
            style={{ fontFamily: '"Monaco", "Menlo", monospace' }}
            onBlur={(e) => updateRuleBody(index, e.currentTarget.value || "{}")}
            defaultValue={JSON.stringify(rule.body || {}, null, 2)}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderPreview = () => (
    <div className="p-5">
      <h3 className="text-lg font-semibold mb-4 text-(--vscode-foreground)">
        API Configuration Preview
      </h3>
      <div className="mt-4 space-y-2">
        <div>
          <strong className="text-(--vscode-foreground)">Endpoint:</strong>{" "}
          {config.method} {config.endpoint}
        </div>
        <div>
          <strong className="text-(--vscode-foreground)">Description:</strong>{" "}
          {config.description}
        </div>
        <div>
          <strong className="text-(--vscode-foreground)">Rules:</strong>{" "}
          {config.rules.length} configured
        </div>
      </div>

      <h4 className="text-base font-medium mt-6 mb-3 text-(--vscode-foreground)">
        Response Rules:
      </h4>
      {config.rules.map((rule, index) => (
        <Card key={index} className="mb-2">
          <CardHeader className="py-3">
            <h5 className="font-medium text-(--vscode-foreground)">
              {rule.name}
            </h5>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <strong className="text-(--vscode-foreground)">Status:</strong>{" "}
              {rule.status}
            </div>
            <div>
              <strong className="text-(--vscode-foreground)">Delay:</strong>{" "}
              {rule.delay}ms
            </div>
            <div>
              <strong className="text-(--vscode-foreground)">Headers:</strong>
            </div>
            <pre className="bg-(--vscode-editor-background) p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(rule.headers, null, 2)}
            </pre>
            <div>
              <strong className="text-(--vscode-foreground)">Body:</strong>
            </div>
            <pre className="bg-(--vscode-editor-background) p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(rule.body, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderYamlView = () => (
    <div className="p-5">
      <h3 className="text-lg font-semibold mb-4 text-(--vscode-foreground)">
        YAML Configuration
      </h3>
      <Textarea
        className="w-full h-96 font-mono text-sm mt-4 p-3 border border-(--vscode-input-border) rounded bg-(--vscode-editor-background) text-(--vscode-editor-foreground)"
        readOnly
        value={generateYaml()}
        style={{ fontFamily: '"Monaco", "Menlo", monospace' }}
      />
    </div>
  );

  const renderTestView = () => (
    <div className="p-5">
      <h3 className="text-lg font-semibold mb-4 text-(--vscode-foreground)">
        Test API
      </h3>
      {/* Postman-like request bar */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="px-3 py-2">
          {config.method}
        </Badge>
        <Input value={config.endpoint} readOnly className="flex-1" />
        <Button onClick={testApi}>Send</Button>
      </div>
      <div className="mt-4">
        <Button variant="secondary" onClick={testApi}>
          Send Test Request
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-(--vscode-panel-border)">
        <h1 className="text-base font-semibold text-[#24292e] m-0">
          📝 Edit Mock API: {config.name}
        </h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSave}>
            💾 Save
          </Button>
          <Button size="sm" onClick={testApi}>
            🚀 Test API
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-[360px] bg-white border-r border-(--vscode-panel-border) overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
              API Name
            </label>
            <Input
              type="text"
              value={config.name}
              onChange={(e) => updateConfig("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
              Description
            </label>
            <Textarea
              value={config.description}
              onChange={(e) => updateConfig("description", e.target.value)}
              className="min-h-20 resize-y"
              style={{ fontFamily: '"Monaco", "Menlo", monospace' }}
            />
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
              HTTP Method
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "GET",
                  "POST",
                  "PUT",
                  "DELETE",
                  "PATCH",
                  "HEAD",
                  "OPTIONS",
                ] as const
              ).map((method) => (
                <Button
                  key={method}
                  size="sm"
                  variant={config.method === method ? "default" : "outline"}
                  onClick={() => updateMethod(method)}
                  className="font-semibold"
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-(--vscode-foreground) text-sm">
              Endpoint
            </label>
            <Input
              type="text"
              value={config.endpoint}
              onChange={(e) => updateConfig("endpoint", e.target.value)}
              placeholder="/api/example"
            />
          </div>

          <div className="pt-1">
            <h3 className="text-base font-medium mb-3 text-(--vscode-foreground)">
              Response Rules
            </h3>
            <div className="max-h-96 overflow-y-auto pr-1">
              {config.rules.map((rule, index) => renderRule(rule, index))}
            </div>
            <Button variant="outline" className="w-full mt-2" onClick={addRule}>
              <span className="mr-1">+</span> Add New Rule
            </Button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Tabs */}
          <div className="flex bg-white border-b border-(--vscode-panel-border)">
            {(
              [
                { key: "preview", label: "📋 Preview" },
                { key: "yaml", label: "📄 YAML" },
                { key: "test", label: "🧪 Test" },
              ] as const
            ).map((tab) => (
              <div
                key={tab.key}
                className={`px-5 py-3 cursor-pointer border-b-2 border-transparent text-sm font-medium text-(--vscode-descriptionForeground) ${
                  activeTab === tab.key
                    ? "text-(--vscode-foreground) border-b-[#fd8c73]"
                    : "hover:text-(--vscode-foreground)"
                }`}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "preview" && renderPreview()}
            {activeTab === "yaml" && renderYamlView()}
            {activeTab === "test" && renderTestView()}
          </div>
        </div>
      </div>
    </div>
  );
};
