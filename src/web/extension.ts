// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as yaml from "yaml";
import { MockExplorerProvider } from "./mockExplorer";
import { MockEditorProvider } from "./mockEditorProvider";
import { MockApiConfig } from "./types";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("Mock Server extension is now active!");
  console.log("Extension context:", context.extensionUri);
  console.log(
    "Workspace folders:",
    vscode.workspace.workspaceFolders?.map((f) => f.name)
  );

  // Create tree view provider for Mock Explorer
  const mockExplorerProvider = new MockExplorerProvider();
  console.log("MockExplorerProvider created");

  // Create mock editor provider
  const mockEditorProvider = new MockEditorProvider(
    context.extensionUri,
    context
  );
  console.log("MockEditorProvider created");

  // Register tree view
  const treeView = vscode.window.createTreeView("mockExplorer", {
    treeDataProvider: mockExplorerProvider,
    showCollapseAll: false,
  });
  console.log("TreeView registered with ID: mock-server.mockExplorer");

  // Register commands
  const refreshCommand = vscode.commands.registerCommand(
    "mock-server.refreshExplorer",
    () => {
      mockExplorerProvider.refresh();
    }
  );

  const createMockApiCommand = vscode.commands.registerCommand(
    "mock-server.createMockApi",
    () => {
      vscode.window.showInformationMessage(
        "Create Mock API functionality will be implemented soon!"
      );
    }
  );

  const createMockDirectoryCommand = vscode.commands.registerCommand(
    "mock-server.createMockDirectory",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder found");
        return;
      }

      const mockDirUri = vscode.Uri.joinPath(workspaceFolders[0].uri, ".mock");

      try {
        await vscode.workspace.fs.createDirectory(mockDirUri);
        vscode.window.showInformationMessage(
          ".mock directory created successfully!"
        );
        mockExplorerProvider.refresh();

        // Create a sample YAML file
        const sampleFileUri = vscode.Uri.joinPath(
          mockDirUri,
          "sample_api.yaml"
        );
        const sampleContent = `name: Sample API
description: This is a sample mock API
method: GET
endpoint: /api/sample
rules:
  - name: Success response
    status: 200
    headers:
      Content-Type: application/json
    body:
      message: "Hello from Mock Server!"
      success: true
    delay: 0
`;
        await vscode.workspace.fs.writeFile(
          sampleFileUri,
          new TextEncoder().encode(sampleContent)
        );
        mockExplorerProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to create .mock directory: ${error}`
        );
      }
    }
  );

  const openMockApiCommand = vscode.commands.registerCommand(
    "mock-server.openMockApi",
    async (filePath: string) => {
      try {
        console.log("Opening file with path:", filePath);

        // For web extensions, we need to construct the URI properly
        // Check if the path is already a URI or needs to be converted
        let uri: vscode.Uri;

        if (filePath.startsWith("file://") || filePath.includes("://")) {
          uri = vscode.Uri.parse(filePath);
        } else {
          // Try to resolve the path relative to workspace
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (workspaceFolders && workspaceFolders.length > 0) {
            // Check if it's an absolute path or relative
            if (filePath.startsWith("/")) {
              // Absolute path - create URI with workspace root
              const workspaceRoot = workspaceFolders[0].uri;
              // Remove leading slash and join with workspace URI
              const relativePath = filePath.startsWith(workspaceRoot.path)
                ? filePath.substring(workspaceRoot.path.length + 1)
                : filePath.substring(1);
              uri = vscode.Uri.joinPath(workspaceRoot, relativePath);
            } else {
              // Relative path - join with workspace root
              uri = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
            }
          } else {
            throw new Error("No workspace folder found");
          }
        }

        console.log("Resolved URI:", uri);

        // Read the YAML file and parse it
        const fileContent = await vscode.workspace.fs.readFile(uri);
        const yamlText = new TextDecoder().decode(fileContent);

        // Parse YAML to get config (using the same logic as MockExplorerProvider)
        const mockExplorerProvider = new MockExplorerProvider();
        // We need to access the private method, so we'll use a public approach
        const config = await parseYamlConfig(
          yamlText,
          uri.path.split("/").pop() || "unknown.yaml"
        );

        // Open the WebView editor instead of text editor
        await mockEditorProvider.openEditor(config, uri.toString());
      } catch (error) {
        console.error("Error opening file:", error);
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
      }
    }
  );

  const deleteMockApiCommand = vscode.commands.registerCommand(
    "mock-server.deleteMockApi",
    async (item: any) => {
      if (!item || !item.itemPath) {
        vscode.window.showErrorMessage("Invalid item selected");
        return;
      }

      const fileName = item.label?.replace(/^[➕❌]\s/, "") || "file";
      const result = await vscode.window.showWarningMessage(
        `Are you sure you want to delete ${fileName}?`,
        { modal: true },
        "Delete",
        "Cancel"
      );

      if (result === "Delete") {
        try {
          console.log("Deleting file with path:", item.itemPath);

          // For web extensions, construct URI properly
          let uri: vscode.Uri;

          if (
            item.itemPath.startsWith("file://") ||
            item.itemPath.includes("://")
          ) {
            uri = vscode.Uri.parse(item.itemPath);
          } else {
            // Resolve path relative to workspace
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
              if (item.itemPath.startsWith("/")) {
                // Absolute path - create URI with workspace root
                const workspaceRoot = workspaceFolders[0].uri;
                const relativePath = item.itemPath.startsWith(
                  workspaceRoot.path
                )
                  ? item.itemPath.substring(workspaceRoot.path.length + 1)
                  : item.itemPath.substring(1);
                uri = vscode.Uri.joinPath(workspaceRoot, relativePath);
              } else {
                // Relative path - join with workspace root
                uri = vscode.Uri.joinPath(
                  workspaceFolders[0].uri,
                  item.itemPath
                );
              }
            } else {
              throw new Error("No workspace folder found");
            }
          }

          console.log("Resolved URI for deletion:", uri);
          await vscode.workspace.fs.delete(uri);
          vscode.window.showInformationMessage(
            `${fileName} deleted successfully`
          );
          mockExplorerProvider.refresh();
        } catch (error) {
          console.error("Error deleting file:", error);
          vscode.window.showErrorMessage(`Failed to delete file: ${error}`);
        }
      }
    }
  );

  // Legacy hello world command
  const helloWorldCommand = vscode.commands.registerCommand(
    "mock-server.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from mock-server in a web extension host!"
      );
    }
  );

  // Add all disposables to context
  context.subscriptions.push(
    treeView,
    refreshCommand,
    createMockApiCommand,
    createMockDirectoryCommand,
    openMockApiCommand,
    deleteMockApiCommand,
    helloWorldCommand,
    mockEditorProvider
  );
}

// Helper function to parse YAML configuration
async function parseYamlConfig(
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

// This method is called when your extension is deactivated
export function deactivate() {}
