import * as vscode from "vscode";
import { MockApiConfig } from "../types";

export class MockEditorProvider {
  public static readonly viewType = "mock-editor.mock-server";

  private _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public async openEditor(
    config: MockApiConfig,
    filePath: string,
    isNewFile: boolean = false
  ) {
    const panelTitle = isNewFile
      ? `Create Mock API: ${config.name}`
      : `Edit Mock API: ${config.name}`;

    const panel = vscode.window.createWebviewPanel(
      MockEditorProvider.viewType,
      panelTitle,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this._extensionUri],
      }
    );

    panel.webview.html = this._getHtmlForWebview(panel.webview);

    // Handle messages from the webview and wait for 'ready' before sending config
    panel.webview.onDidReceiveMessage((message) => {
      if (message?.type === "ready") {
        panel.webview.postMessage({
          type: "loadConfig",
          config,
          filePath,
          isNewFile,
        });
        return;
      }
      this._handleWebviewMessage(message, panel, filePath, isNewFile);
    });

    return panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Use a nonce for security
    const nonce = getNonce();

    // Get the webview script URI - this will point to our React bundle
    const webviewScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "web", "webview.js")
    );

    // Get the CSS URI for styles
    const webviewStylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "web", "webview.css")
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; script-src-elem 'nonce-${nonce}';">
    <title>Mock API Editor</title>
    <link rel="stylesheet" href="${webviewStylesUri}">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8f9fa;
            height: 100vh;
            overflow: hidden;
        }
        #root {
            height: 100vh;
            width: 100vw;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #656d76;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">Loading Mock Editor...</div>
    </div>
    <script type="module" nonce="${nonce}" src="${webviewScriptUri}"></script>
</body>
</html>`;
  }

  private _handleWebviewMessage(
    message: any,
    panel: vscode.WebviewPanel,
    filePath: string,
    isNewFile: boolean = false
  ) {
    console.log(`[mockEditorProvider] Received message:`, message.type);
    switch (message.type) {
      case "saveConfig":
        this._saveConfig(message.config, filePath, isNewFile, panel);
        break;
      case "showError":
        vscode.window.showErrorMessage(message.message);
        break;
      case "testApi":
        this._testApi(message.method, message.endpoint, panel);
        break;
      case "setActiveRule":
        this._setActiveRule(
          message.method,
          message.endpoint,
          message.activeRuleIndex,
          message.ruleName
        );
        break;
    }
  }

  private async _setActiveRule(
    method: string,
    endpoint: string,
    activeRuleIndex: number,
    ruleName: string
  ) {
    console.log(
      `[_setActiveRule] Called with: ${method} ${endpoint}, rule: ${ruleName}, index: ${activeRuleIndex}`
    );
    try {
      // Find the YAML file for this endpoint
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error("No workspace folder open");
      }

      const mockDirUri = vscode.Uri.joinPath(workspaceFolders[0].uri, ".mock");
      const files = await vscode.workspace.fs.readDirectory(mockDirUri);

      // Find the matching YAML file
      for (const [filename, fileType] of files) {
        if (fileType === vscode.FileType.File && /\.ya?ml$/.test(filename)) {
          const fileUri = vscode.Uri.joinPath(mockDirUri, filename);
          const fileContent = await vscode.workspace.fs.readFile(fileUri);
          const yamlText = new TextDecoder().decode(fileContent);

          // Parse to check if it matches our endpoint
          const yaml = require("yaml");
          const parsed = yaml.parse(yamlText);

          if (parsed.method === method && parsed.endpoint === endpoint) {
            // Update activeRuleIndex in the parsed object
            parsed.activeRuleIndex = activeRuleIndex;

            // Re-generate YAML using the same format as _generateYamlContent
            const updatedYaml = this._generateYamlContentFromParsed(parsed);

            // Save back to file
            await vscode.workspace.fs.writeFile(
              fileUri,
              new TextEncoder().encode(updatedYaml)
            );

            console.log(
              `[_setActiveRule] Updated ${filename} with activeRuleIndex: ${activeRuleIndex}`
            );
            console.log(
              `[_setActiveRule] Updated YAML content:\n${updatedYaml.substring(
                0,
                200
              )}...`
            );

            // Now reload the route in the server
            await vscode.commands.executeCommand("mock-server.reloadRoute", {
              method,
              endpoint,
              activeRuleIndex,
              ruleName,
            });

            return;
          }
        }
      }

      throw new Error(`YAML file not found for ${method} ${endpoint}`);
    } catch (error) {
      console.error("[_setActiveRule] Error:", error);
      vscode.window.showErrorMessage(`Failed to set active rule: ${error}`);
    }
  }

  private _generateYamlContentFromParsed(config: any): string {
    let yaml = `name: ${config.name}
description: ${config.description || ""}`;

    // Add responseType if it exists and is not empty
    if (config.responseType && config.responseType.trim()) {
      if (config.responseType.includes("\n")) {
        yaml += `\nresponseType: |\n`;
        const indentedLines = config.responseType
          .split("\n")
          .map((line: string) => `  ${line}`)
          .join("\n");
        yaml += indentedLines;
      } else {
        yaml += `\nresponseType: ${config.responseType}`;
      }
    }

    yaml += `\nmethod: ${config.method}
endpoint: ${config.endpoint}`;

    // Add activeRuleIndex
    if (config.activeRuleIndex !== undefined && config.activeRuleIndex >= 0) {
      yaml += `\nactiveRuleIndex: ${config.activeRuleIndex}`;
    }

    yaml += `\nrules:`;

    (config.rules || []).forEach((rule: any) => {
      yaml += `
  - name: ${rule.name}
    status: ${rule.status}
    delay: ${rule.delay || 0}
    headers:`;

      Object.entries(rule.headers || {}).forEach(([key, value]) => {
        yaml += `
      ${key}: ${value}`;
      });

      yaml += `
    body: ${JSON.stringify(rule.body)}`;
    });

    return yaml;
  }

  private async _testApi(
    method: string,
    endpoint: string,
    panel: vscode.WebviewPanel
  ) {
    try {
      const response = await vscode.commands.executeCommand(
        "mock-server.testMockApi",
        method,
        endpoint
      );

      if (response) {
        panel.webview.postMessage({
          type: "testResult",
          response,
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to test API: ${error}`);
    }
  }

  private async _saveConfig(
    config: MockApiConfig,
    filePath: string,
    isNewFile: boolean = false,
    panel?: vscode.WebviewPanel
  ) {
    console.log(
      `[_saveConfig] Saving config with activeRuleIndex: ${config.activeRuleIndex}`
    );
    try {
      // Generate YAML content
      const yamlContent = this._generateYamlContent(config);
      console.log(`[_saveConfig] Generated YAML:\n${yamlContent}`);

      // Write to file
      const uri = vscode.Uri.parse(filePath);
      await vscode.workspace.fs.writeFile(
        uri,
        new TextEncoder().encode(yamlContent)
      );

      console.log(`[_saveConfig] File saved successfully: ${filePath}`);

      const action = isNewFile ? "created" : "saved";
      vscode.window.showInformationMessage(
        `Mock API "${config.name}" ${action} successfully! ActiveRuleIndex: ${
          config.activeRuleIndex ?? 0
        }`
      );

      // Refresh the explorer
      vscode.commands.executeCommand("mock-server.refreshExplorer");

      // Reload server to pick up the changes
      vscode.commands.executeCommand("mock-server.reloadServer");

      // Close the panel after successful save for new files
      if (isNewFile && panel) {
        panel.dispose();
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save mock API: ${error}`);
    }
  }

  private _generateYamlContent(config: MockApiConfig): string {
    let yaml = `name: ${config.name}
description: ${config.description}`;

    // Add responseType if it exists and is not empty
    if (config.responseType && config.responseType.trim()) {
      // Check if it's a multi-line responseType
      if (config.responseType.includes("\n")) {
        yaml += `\nresponseType: |\n`;
        // Indent each line by 2 spaces
        const indentedLines = config.responseType
          .split("\n")
          .map((line) => `  ${line}`)
          .join("\n");
        yaml += indentedLines;
      } else {
        yaml += `\nresponseType: ${config.responseType}`;
      }
    }

    yaml += `\nmethod: ${config.method}
endpoint: ${config.endpoint}`;

    // Add activeRuleIndex if specified
    if (config.activeRuleIndex !== undefined && config.activeRuleIndex >= 0) {
      yaml += `\nactiveRuleIndex: ${config.activeRuleIndex}`;
    }

    yaml += `\nrules:`;

    config.rules.forEach((rule) => {
      yaml += `
  - name: ${rule.name}
    status: ${rule.status}
    delay: ${rule.delay}
    headers:`;

      Object.entries(rule.headers || {}).forEach(([key, value]) => {
        yaml += `
      ${key}: ${value}`;
      });

      yaml += `
    body: ${JSON.stringify(rule.body)}`;
    });

    return yaml;
  }

  public dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
