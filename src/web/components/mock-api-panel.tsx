import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { Plus } from "lucide-react";
import { MockApiConfig } from "../types";
import { postMessageToExtension } from "../utils/vscode";
import { ApiHeader } from "./ApiHeader";
import { ApiInfoSection } from "./ApiInfoSection";
import { RuleItem, type Rule } from "./RuleItem";

interface ApiConfig {
  name: string;
  description: string;
  responseType: string;
  method: string;
  endpoint: string;
  activeRuleIndex: number;
  rules: Rule[];
}

interface MockApiPanelProps {
  initialConfig?: MockApiConfig;
  initialFilePath?: string;
}

export function MockApiPanel({
  initialConfig,
  initialFilePath,
}: MockApiPanelProps) {
  const [filePath, setFilePath] = useState<string>(initialFilePath || "");
  const [isLoading, setIsLoading] = useState(!initialConfig);
  const [newlyCreatedRuleId, setNewlyCreatedRuleId] = useState<string | null>(
    null
  );

  // Convert MockApiConfig to ApiConfig helper function
  const convertToApiConfig = (loadedConfig: MockApiConfig): ApiConfig => {
    const activeIndex = (loadedConfig as any).activeRuleIndex ?? 0;
    const convertedRules: Rule[] = (loadedConfig.rules || []).map(
      (rule, index) => ({
        id: String(index + 1),
        name: rule.name,
        status: rule.status,
        headers: rule.headers || { "Content-Type": "application/json" },
        body:
          typeof rule.body === "string"
            ? rule.body
            : JSON.stringify(rule.body, null, 2),
        delay: rule.delay || 0,
        isActive: index === activeIndex,
      })
    );

    return {
      name: loadedConfig.name,
      description: loadedConfig.description || "",
      responseType: loadedConfig.responseType || "",
      method: loadedConfig.method,
      endpoint: loadedConfig.endpoint,
      activeRuleIndex: activeIndex,
      rules: convertedRules,
    };
  };

  const [config, setConfig] = useState<ApiConfig>(
    initialConfig
      ? convertToApiConfig(initialConfig)
      : {
          name: "Loading...",
          description: "",
          responseType: "",
          method: "GET",
          endpoint: "",
          activeRuleIndex: 0,
          rules: [],
        }
  );

  // Listen for messages from the extension (for non-initial updates)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "loadConfig") {
        const loadedConfig: MockApiConfig = message.config;
        const loadedFilePath: string = message.filePath;

        const converted = convertToApiConfig(loadedConfig);
        setConfig(converted);
        setFilePath(loadedFilePath);
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const addRule = () => {
    const ruleNumber = config.rules.length + 1;
    const newRuleId = Date.now().toString();
    const newRule: Rule = {
      id: newRuleId,
      name: `Rule ${ruleNumber}`,
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Success" }, null, 2),
      delay: 0,
      isActive: false,
    };

    // Set the newly created rule ID to trigger expansion and edit mode
    setNewlyCreatedRuleId(newRuleId);

    setConfig((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  const deleteRule = (id: string) => {
    const newRules = config.rules.filter((r) => r.id !== id);
    if (newRules.length === 0) return; // Don't delete the last rule

    // Clear newly created rule ID if deleting that rule
    if (id === newlyCreatedRuleId) {
      setNewlyCreatedRuleId(null);
    }

    // If deleting the active rule, set the first remaining rule as active
    const deletedRuleWasActive = config.rules.find(
      (r) => r.id === id
    )?.isActive;
    if (deletedRuleWasActive && newRules.length > 0) {
      newRules[0].isActive = true;
    }

    setConfig((prev) => ({
      ...prev,
      rules: newRules,
    }));
  };

  const handleRuleEditComplete = (id: string) => {
    // Clear the newly created rule ID when edit is complete
    if (id === newlyCreatedRuleId) {
      setNewlyCreatedRuleId(null);
    }
  };

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
  };

  const setActiveRule = (id: string) => {
    setConfig((prev) => {
      const index = prev.rules.findIndex((r) => r.id === id);
      const updatedRules = prev.rules.map((r) => ({
        ...r,
        isActive: r.id === id,
      }));
      const selectedRule = updatedRules[index];

      // Persist locally for UI
      const nextState = {
        ...prev,
        activeRuleIndex: index >= 0 ? index : 0,
        rules: updatedRules,
      };

      // Notify extension to update active rule immediately
      if (index >= 0 && selectedRule) {
        postMessageToExtension({
          type: "setActiveRule",
          method: nextState.method,
          endpoint: nextState.endpoint,
          activeRuleIndex: index,
          ruleName: selectedRule.name,
        });
      }

      return nextState;
    });
  };

  const saveConfigToFile = (configToSave: ApiConfig) => {
    // Validate all rule bodies are valid JSON
    const validationErrors: string[] = [];

    configToSave.rules.forEach((rule, index) => {
      try {
        JSON.parse(rule.body);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid JSON";
        validationErrors.push(
          `Rule "${rule.name}" (${index + 1}): ${errorMessage}`
        );
      }
    });

    // If there are validation errors, show them and don't save
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.join("\\n");
      postMessageToExtension({
        type: "showError",
        message: `Cannot save: Invalid JSON in rule bodies\\n\\n${errorMsg}`,
      });
      return;
    }

    // Convert ApiConfig back to MockApiConfig format
    const activeIndex = Math.max(
      0,
      configToSave.rules.findIndex((r) => r.isActive)
    );

    const mockApiConfig: any = {
      name: configToSave.name,
      description: configToSave.description,
      responseType: configToSave.responseType,
      method: configToSave.method as any,
      endpoint: configToSave.endpoint,
      activeRuleIndex: activeIndex,
      rules: configToSave.rules.map((rule) => {
        // Parse body if it's a JSON string
        let parsedBody: any;
        try {
          parsedBody = JSON.parse(rule.body);
        } catch {
          // If parsing fails, use as-is
          parsedBody = rule.body;
        }

        return {
          name: rule.name,
          status: rule.status,
          headers: rule.headers,
          body: parsedBody,
          delay: rule.delay,
        };
      }),
    };

    postMessageToExtension({
      type: "saveConfig",
      config: mockApiConfig,
      filePath: filePath,
    });
  };

  const handleSave = () => {
    saveConfigToFile(config);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-medium text-foreground">
            Loading Mock API...
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <ApiHeader
        method={config.method}
        endpoint={config.endpoint}
        onMethodChange={(method) => setConfig({ ...config, method })}
        onEndpointChange={(endpoint) => setConfig({ ...config, endpoint })}
        onSave={handleSave}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Rules Section - Left */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
          <div className="bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Mock Rules</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addRule}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </div>
          </div>

          {/* Rules List */}
          <div className="flex-1 overflow-auto">
            <div className="divide-y divide-border">
              {config.rules.map((rule) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  isOnlyRule={config.rules.length === 1}
                  isNewlyCreated={rule.id === newlyCreatedRuleId}
                  onSetActive={setActiveRule}
                  onUpdate={updateRule}
                  onDelete={deleteRule}
                  onEditComplete={handleRuleEditComplete}
                />
              ))}
            </div>
          </div>
        </div>

        {/* API Info Section - Right */}
        <div className="w-[400px] overflow-auto">
          <ApiInfoSection
            name={config.name}
            description={config.description}
            responseType={config.responseType}
            onNameChange={(name) => setConfig({ ...config, name })}
            onDescriptionChange={(description) =>
              setConfig({ ...config, description })
            }
            onResponseTypeChange={(responseType) =>
              setConfig({ ...config, responseType })
            }
          />
        </div>
      </div>
    </div>
  );
}
