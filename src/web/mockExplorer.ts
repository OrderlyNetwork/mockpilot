import * as vscode from 'vscode';
import { MockApiConfig } from './types';

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
    this.description = '';
    this.contextValue = config ? 'mockFile' : 'mockFolder';

    if (config) {
      this.iconPath = new vscode.ThemeIcon('file-code');
    } else {
      this.iconPath = new vscode.ThemeIcon('folder');
    }
  }
}

export class MockExplorerProvider implements vscode.TreeDataProvider<MockFileTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MockFileTreeItem | undefined | null | void> = new vscode.EventEmitter<MockFileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<MockFileTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private workspaceRoot: string | undefined;

  constructor() {
    // Get the workspace root folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    console.log('MockExplorerProvider constructor');
    console.log('Workspace folders:', workspaceFolders);
    console.log('Workspace folders length:', workspaceFolders?.length);

    if (workspaceFolders && workspaceFolders.length > 0) {
      const folder = workspaceFolders[0];
      console.log('First workspace folder:', folder);
      console.log('Folder URI:', folder.uri);
      console.log('Folder URI scheme:', folder.uri.scheme);
      console.log('Folder URI path:', folder.uri.path);
      console.log('Folder URI fsPath:', folder.uri.fsPath);

      // Store the workspace URI directly for web extensions
      this.workspaceRoot = folder.uri.path;
      console.log('Workspace root set to:', this.workspaceRoot);
    } else {
      console.log('No workspace folders found');
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MockFileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MockFileTreeItem): Thenable<MockFileTreeItem[]> {
    console.log('getChildren called, element:', element);
    console.log('workspaceRoot:', this.workspaceRoot);

    if (!this.workspaceRoot) {
      console.log('No workspace root found');
      vscode.window.showInformationMessage('No workspace opened');
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - show .mock directory
      return this.getMockDirectoryItem();
    }

    return Promise.resolve([]);
  }

  private async getMockDirectoryItem(): Promise<MockFileTreeItem[]> {
    console.log('getMockDirectoryItem called');

    // For web extensions, get the workspace folder URI
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      console.log('No workspace folders found in getMockDirectoryItem');
      return Promise.resolve([]);
    }

    const workspaceUri = workspaceFolders[0].uri;
    console.log('Workspace URI:', workspaceUri);

    const mockUri = vscode.Uri.joinPath(workspaceUri, '.mock');
    console.log('Looking for .mock directory at:', mockUri);
    console.log('Mock URI fsPath:', mockUri.fsPath);
    console.log('Mock URI path:', mockUri.path);
    console.log('Mock URI scheme:', mockUri.scheme);

    try {
      // Check if .mock directory exists
      const mockDirUri = mockUri;
      try {
        console.log('Checking if directory exists...');
        const stat = await vscode.workspace.fs.stat(mockDirUri);
        console.log('Directory stat:', stat);
        console.log('Directory exists, isDirectory?', stat.type === vscode.FileType.Directory);
      } catch (error) {
        console.log('Directory does not exist or error:', error);
        // Directory doesn't exist, show empty state
        return [new MockFileTreeItem(
          'No .mock directory found',
          vscode.TreeItemCollapsibleState.None,
          mockUri.path,
          undefined,
          {
            command: 'mock-server.createMockDirectory',
            title: 'Create .mock Directory'
          }
        )];
      }

      // Read all YAML files in .mock directory
      const entries = await vscode.workspace.fs.readDirectory(mockDirUri);
      const yamlFiles = entries
        .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.yaml') || name.endsWith('.yml'))
        .map(([name]) => name);

      if (yamlFiles.length === 0) {
        return [new MockFileTreeItem(
          'No YAML files found in .mock directory',
          vscode.TreeItemCollapsibleState.None,
          mockUri.path,
          undefined,
          {
            command: 'mock-server.createMockApi',
            title: 'Create Mock API'
          }
        )];
      }

      // Parse each YAML file and create tree items
      const mockItems: MockFileTreeItem[] = [];
      for (const filename of yamlFiles) {
        try {
          const fileUri = vscode.Uri.joinPath(mockUri, filename);
          const fileContent = await vscode.workspace.fs.readFile(fileUri);
          const yamlText = new TextDecoder().decode(fileContent);

          // Simple YAML parsing (basic implementation)
          const config = this.parseYamlContent(yamlText, filename);

          const item = new MockFileTreeItem(
            `${config.method} ${config.endpoint}`,
            vscode.TreeItemCollapsibleState.None,
            fileUri.path,
            config,
            {
              command: 'mock-server.openMockApi',
              title: 'Open Mock API',
              arguments: [fileUri.toString()]
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
              command: 'mock-server.openMockApi',
              title: 'Open File',
              arguments: [errorFileUri.toString()]
            }
          );
          item.description = 'Parse error';
          mockItems.push(item);
        }
      }

      return mockItems.sort((a, b) => a.label.localeCompare(b.label));

    } catch (error) {
      vscode.window.showErrorMessage(`Error reading .mock directory: ${error}`);
      return [];
    }
  }

  private parseYamlContent(yamlText: string, filename: string): MockApiConfig {
    console.log('🔍 [DEBUG] MockExplorer.parseYamlContent called for:', filename);
    console.log('🔍 [DEBUG] YAML content:', yamlText);

    // Basic YAML parser - in a real implementation, you'd use a proper YAML library
    // For now, we'll do simple text parsing to extract the required fields
    const lines = yamlText.split('\n');
    const config: Partial<MockApiConfig> = {
      rules: []
    };

    let currentRule: any = {};
    let inRules = false;
    let inHeaders = false;
    let bodyStart = false;
    let bodyLines: string[] = [];
    let currentIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      if (!trimmed || trimmed.startsWith('#')) {continue;}

      // Parse top-level fields
      if (indent === 0 || indent === 2) {
        if (trimmed.startsWith('name:')) {
          config.name = trimmed.substring(5).trim().replace(/['"]/g, '');
        } else if (trimmed.startsWith('description:')) {
          config.description = trimmed.substring(13).trim().replace(/['"]/g, '');
        } else if (trimmed.startsWith('method:')) {
          config.method = trimmed.substring(7).trim() as any;
        } else if (trimmed.startsWith('endpoint:')) {
          config.endpoint = trimmed.substring(10).trim().replace(/['"]/g, '');
        } else if (trimmed.startsWith('rules:')) {
          console.log('🔍 [DEBUG] MockExplorer: Found rules section');
          inRules = true;
          currentIndent = indent;
        }
      }

      // Parse rules (indent 4+)
      else if (inRules && indent >= 4) {
        if (trimmed.startsWith('- name:')) {
          console.log('🔍 [DEBUG] MockExplorer: Found rule:', trimmed.substring(7).trim());
          // Save previous rule if exists
          if (currentRule.name) {
            if (bodyLines.length > 0) {
              const bodyContent = bodyLines.join('\n');
              try {
                currentRule.body = JSON.parse(bodyContent);
              } catch (e) {
                // If JSON parsing fails, try to fix common YAML formatting issues
                const fixedContent = bodyContent
                  .replace(/"/g, '"')  // Fix quote escaping
                  .replace(/'/g, "'");  // Fix single quotes
                try {
                  currentRule.body = JSON.parse(fixedContent);
                } catch (e2) {
                  // If still fails, store as raw string
                  currentRule.body = { raw: bodyContent };
                }
              }
              bodyLines = [];
            }
            config.rules!.push({ ...currentRule });
          }
          currentRule = { name: trimmed.substring(7).trim().replace(/['"]/g, '') };
          inHeaders = false;
          bodyStart = false;
        } else if (indent === 6 && trimmed.startsWith('status:')) {
          currentRule.status = parseInt(trimmed.substring(7).trim());
        } else if (indent === 6 && trimmed.startsWith('delay:')) {
          currentRule.delay = parseInt(trimmed.substring(6).trim());
        } else if (indent === 6 && trimmed.startsWith('headers:')) {
          currentRule.headers = {};
          inHeaders = true;
          bodyStart = false;
        } else if (inHeaders && indent === 8 && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();
          currentRule.headers[key.trim()] = value.replace(/['"]/g, '');
        } else if (indent === 6 && (trimmed.startsWith('body:') || trimmed.startsWith('body: |'))) {
          console.log('🔍 [DEBUG] MockExplorer: Found body field');
          inHeaders = false;
          bodyStart = true;
          // Handle both single-line and multi-line body formats
          if (trimmed.startsWith('body: |')) {
            // Multi-line format, start collecting body lines
            const bodyContent = trimmed.substring(8).trim();
            if (bodyContent) {
              bodyLines.push(bodyContent);
            }
          } else {
            // Single-line format
            const bodyContent = trimmed.substring(5).trim();
            if (bodyContent) {
              try {
                currentRule.body = JSON.parse(bodyContent);
              } catch (e) {
                bodyLines.push(bodyContent);
              }
            }
          }
        } else if (bodyStart && indent >= 8) {
          // For multi-line YAML content, include lines with proper indentation
          if (trimmed) {
            bodyLines.push(trimmed);
          } else {
            bodyLines.push(line.substring(indent)); // Remove indentation but preserve structure
          }
        }
      }
    }

    // Add the last rule if exists
    if (currentRule.name) {
      if (bodyLines.length > 0) {
        const bodyContent = bodyLines.join('\n');
        try {
          currentRule.body = JSON.parse(bodyContent);
        } catch (e) {
          // If JSON parsing fails, try to fix common YAML formatting issues
          const fixedContent = bodyContent
            .replace(/"/g, '"')  // Fix quote escaping
            .replace(/'/g, "'");  // Fix single quotes
          try {
            currentRule.body = JSON.parse(fixedContent);
          } catch (e2) {
            // If still fails, store as raw string
            currentRule.body = { raw: bodyContent };
          }
        }
      }
      config.rules!.push({ ...currentRule });
    }

    // Set defaults for required fields
    if (!config.name) {config.name = filename.replace(/\.(ya?ml)$/, '');}
    if (!config.description) {config.description = 'No description';}
    if (!config.method) {config.method = 'GET';}
    if (!config.endpoint) {config.endpoint = '/api/unknown';}
    if (!config.rules || config.rules.length === 0) {
      config.rules = [{
        name: 'default',
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {},
        delay: 0
      }];
    }

    // Add defaults for rules
    config.rules = config.rules.map(rule => ({
      ...rule,
      status: rule.status || 200,
      headers: rule.headers || { 'Content-Type': 'application/json' },
      body: rule.body || {},
      delay: rule.delay || 0
    }));

    console.log('🔍 [DEBUG] MockExplorer: Final parsed config:', JSON.stringify(config, null, 2));
    console.log('🔍 [DEBUG] MockExplorer: Rules count:', config.rules?.length || 0);

    return config as MockApiConfig;
  }
}