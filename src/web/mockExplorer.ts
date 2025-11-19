import * as vscode from "vscode";
import { MockApiConfig } from "./types";

export class MockFileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemPath: string,
    public readonly config?: MockApiConfig,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    this.description = "";
    this.contextValue = config ? "mockFile" : "mockFolder";

    if (config) {
      this.iconPath = new vscode.ThemeIcon("file-code");
    } else {
      this.iconPath = new vscode.ThemeIcon("folder");
    }
  }
}

export class MockExplorerProvider
  implements vscode.TreeDataProvider<MockFileTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    MockFileTreeItem | undefined | null | void
  > = new vscode.EventEmitter<MockFileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    MockFileTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private workspaceRoot: string | undefined;

  constructor() {
    // Get the workspace root folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    // console.log("MockExplorerProvider constructor");
    // console.log("Workspace folders:", workspaceFolders);
    // console.log("Workspace folders length:", workspaceFolders?.length);

    if (workspaceFolders && workspaceFolders.length > 0) {
      const folder = workspaceFolders[0];
      // console.log("First workspace folder:", folder);
      // console.log("Folder URI:", folder.uri);
      // console.log("Folder URI scheme:", folder.uri.scheme);
      // console.log("Folder URI path:", folder.uri.path);
      // console.log("Folder URI fsPath:", folder.uri.fsPath);

      // Store the workspace URI directly for web extensions
      this.workspaceRoot = folder.uri.path;
      console.log("Workspace root set to:", this.workspaceRoot);
    } else {
      console.log("No workspace folders found");
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MockFileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MockFileTreeItem): Thenable<MockFileTreeItem[]> {
    // console.log("getChildren called, element:", element);
    // console.log("workspaceRoot:", this.workspaceRoot);

    if (!this.workspaceRoot) {
      // console.log("No workspace root found");
      vscode.window.showInformationMessage("No workspace opened");
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - show .mock directory
      return this.getMockDirectoryItem();
    }

    return Promise.resolve([]);
  }

  private async getMockDirectoryItem(): Promise<MockFileTreeItem[]> {
    console.log("getMockDirectoryItem called");

    // For web extensions, get the workspace folder URI
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log("No workspace folders found in getMockDirectoryItem");
      return Promise.resolve([]);
    }

    const workspaceUri = workspaceFolders[0].uri;
    console.log("Workspace URI:", workspaceUri);

    const mockUri = vscode.Uri.joinPath(workspaceUri, ".mock");
    // console.log("Looking for .mock directory at:", mockUri);
    // console.log("Mock URI fsPath:", mockUri.fsPath);
    // console.log("Mock URI path:", mockUri.path);
    // console.log("Mock URI scheme:", mockUri.scheme);

    try {
      // Check if .mock directory exists
      const mockDirUri = mockUri;
      try {
        console.log("Checking if directory exists...");
        const stat = await vscode.workspace.fs.stat(mockDirUri);
        console.log("Directory stat:", stat);
        console.log(
          "Directory exists, isDirectory?",
          stat.type === vscode.FileType.Directory
        );
      } catch (error) {
        console.log("Directory does not exist or error:", error);
        // Directory doesn't exist, show empty state
        return [
          new MockFileTreeItem(
            "No .mock directory found",
            vscode.TreeItemCollapsibleState.None,
            mockUri.path,
            undefined,
            {
              command: "mock-server.createMockDirectory",
              title: "Create .mock Directory",
            }
          ),
        ];
      }

      // Read all YAML files in .mock directory
      const entries = await vscode.workspace.fs.readDirectory(mockDirUri);
      const yamlFiles = entries
        .filter(
          ([name, type]) =>
            (type === vscode.FileType.File && name.endsWith(".yaml")) ||
            name.endsWith(".yml")
        )
        .map(([name]) => name);

      if (yamlFiles.length === 0) {
        return [
          new MockFileTreeItem(
            "No YAML files found in .mock directory",
            vscode.TreeItemCollapsibleState.None,
            mockUri.path,
            undefined,
            {
              command: "mock-server.createMockApi",
              title: "Create Mock API",
            }
          ),
        ];
      }

      // Parse each YAML file and create tree items
      const mockItems: MockFileTreeItem[] = [];
      for (const filename of yamlFiles) {
        try {
          const fileUri = vscode.Uri.joinPath(mockUri, filename);
          const fileContent = await vscode.workspace.fs.readFile(fileUri);
          const yamlText = new TextDecoder().decode(fileContent);

          // Use shared YAML parsing service
          const { parseYamlConfig } = await import("../utils/yamlParser.js");
          const config = await parseYamlConfig(yamlText, filename);

          const item = new MockFileTreeItem(
            `${config.method} ${config.endpoint}`,
            vscode.TreeItemCollapsibleState.None,
            fileUri.path,
            config,
            {
              command: "mock-server.openMockApi",
              title: "Open Mock API",
              arguments: [fileUri.toString()],
            }
          );
          item.description = config.name;
          item.tooltip = `${config.name}\n${config.description}\nMethod: ${config.method}\nEndpoint: ${config.endpoint}\nRules: ${config.rules.length}`;

          mockItems.push(item);
        } catch (error) {
          // Create error item for files that can't be parsed
          const errorFileUri = vscode.Uri.joinPath(mockUri, filename);
          const item = new MockFileTreeItem(
            `❌ ${filename}`,
            vscode.TreeItemCollapsibleState.None,
            errorFileUri.path,
            undefined,
            {
              command: "mock-server.openMockApi",
              title: "Open File",
              arguments: [errorFileUri.toString()],
            }
          );
          item.description = "Parse error";
          mockItems.push(item);
        }
      }

      return mockItems.sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      vscode.window.showErrorMessage(`Error reading .mock directory: ${error}`);
      return [];
    }
  }
}
