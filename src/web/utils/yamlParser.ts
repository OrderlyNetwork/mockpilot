import * as yaml from "yaml";
import { MockApiConfig } from "../types";

/**
 * Parse YAML configuration and convert it to MockApiConfig
 * @param yamlText - The YAML content as string
 * @param filename - The filename for fallback naming
 * @returns Parsed MockApiConfig object
 */
export async function parseYamlConfig(
  yamlText: string,
  filename: string
): Promise<MockApiConfig> {
  console.log("🔍 [DEBUG] parseYamlConfig called for:", filename);
  console.log("🔍 [DEBUG] YAML content:", yamlText);

  try {
    // Parse YAML using the yaml library
    const parsed = yaml.parse(yamlText) as any;

    // Extract and validate the configuration
    const config: Partial<MockApiConfig> = {
      name: parsed.name || filename.replace(/\.(ya?ml)$/, ""),
      description: parsed.description || "No description",
      responseType: parsed.responseType || "",
      method: parsed.method || "GET",
      endpoint: parsed.endpoint || "/api/unknown",
      rules: parsed.rules || [],
    };

    // If no rules, create a default rule
    if (!config.rules || config.rules.length === 0) {
      config.rules = [
        {
          name: "default",
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: {},
          delay: 0,
        },
      ];
    }

    // Add defaults for rules
    config.rules = config.rules.map((rule: any) => ({
      name: rule.name || "default",
      status: rule.status || 200,
      headers: rule.headers || { "Content-Type": "application/json" },
      body: rule.body || {},
      delay: rule.delay || 0,
    }));

    console.log(
      "🔍 [DEBUG] Final parsed config:",
      JSON.stringify(config, null, 2)
    );
    console.log("🔍 [DEBUG] Rules count:", config.rules?.length || 0);

    return config as MockApiConfig;
  } catch (error) {
    console.error("🔍 [DEBUG] YAML parsing error:", error);

    // Return a default config if parsing fails
    const defaultConfig: MockApiConfig = {
      name: filename.replace(/\.(ya?ml)$/, ""),
      description: "Failed to parse YAML",
      method: "GET",
      endpoint: "/api/unknown",
      rules: [
        {
          name: "default",
          status: 500,
          headers: { "Content-Type": "application/json" },
          body: { error: "Failed to parse YAML configuration" },
          delay: 0,
        },
      ],
    };

    return defaultConfig;
  }
}
