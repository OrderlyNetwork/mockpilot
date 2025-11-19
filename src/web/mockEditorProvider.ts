import * as vscode from "vscode";
import { MockApiConfig } from "./types";

export class MockEditorProvider {
  public static readonly viewType = "mock-editor.mock-server";

  private _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public async openEditor(config: MockApiConfig, filePath: string) {
    const panel = vscode.window.createWebviewPanel(
      MockEditorProvider.viewType,
      `Edit Mock API: ${config.name}`,
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
        });
        return;
      }
      this._handleWebviewMessage(message, panel, filePath);
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
      vscode.Uri.joinPath(
        this._extensionUri,
        "dist",
        "web",
        "webview-webview.css"
      )
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
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
    <script nonce="${nonce}" src="${webviewScriptUri}"></script>
</body>
</html>`;
  }

  private _handleWebviewMessage(
    message: any,
    _panel: vscode.WebviewPanel,
    filePath: string
  ) {
    switch (message.type) {
      case "saveConfig":
        this._saveConfig(message.config, filePath);
        break;
      case "showError":
        vscode.window.showErrorMessage(message.message);
        break;
    }
  }

  private async _saveConfig(config: MockApiConfig, filePath: string) {
    try {
      // Generate YAML content
      const yamlContent = this._generateYamlContent(config);

      // Write to file
      const uri = vscode.Uri.parse(filePath);
      await vscode.workspace.fs.writeFile(
        uri,
        new TextEncoder().encode(yamlContent)
      );

      vscode.window.showInformationMessage(
        `Mock API "${config.name}" saved successfully!`
      );

      // Refresh the explorer
      vscode.commands.executeCommand("mock-server.refreshExplorer");
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
endpoint: ${config.endpoint}
rules:`;

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
