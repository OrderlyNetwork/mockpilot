import * as vscode from "vscode";
import { StatusBarService } from "../services/statusBarService";
import { LogOutputService } from "../services/logOutputService";
import { ServiceFactory } from "./factories/serviceFactory";
import { MockExplorerProvider } from "../providers/mockExplorer";
import { MockEditorProvider } from "../providers/mockEditorProvider";
import { FileWatcherService } from "../services/fileWatcherService";
import { CommandService } from "../services/commandService";
import { checkAndPromptSkillInstallation } from "../utils/skillInstaller";

export interface ExtensionContext {
  extensionUri: vscode.Uri;
  subscriptions: vscode.Disposable[];
}

export interface PlatformServices {
  mockExplorerProvider: MockExplorerProvider;
  mockEditorProvider: MockEditorProvider;
  serverManager: any;
}

/**
 * Bootstrap class for extension initialization
 * Contains shared logic for both desktop and web versions
 */
export class ExtensionBootstrap {
  private statusBarService: StatusBarService;
  private logger: LogOutputService;
  private platform: "desktop" | "web";

  constructor(platform: "desktop" | "web") {
    this.platform = platform;
    this.statusBarService = new StatusBarService();
    this.logger = LogOutputService.getInstance();
  }

  /**
   * Activate the extension with shared logic
   */
  async activate(context: vscode.ExtensionContext): Promise<void> {
    // Log platform-specific activation
    const platformInfo =
      this.platform === "desktop" ? "Desktop Version" : "Web Version";
    console.log(`Mock Server extension is now active! (${platformInfo})`);
    console.log("Extension context:", context.extensionUri);
    console.log(
      "Workspace folders:",
      vscode.workspace.workspaceFolders?.map((f) => f.name)
    );

    // Check and prompt for skill installation/update (non-blocking)
    checkAndPromptSkillInstallation(context).catch((error) => {
      console.error("Skill installation check failed:", error);
    });

    // Add status bar to subscriptions
    context.subscriptions.push(this.statusBarService.getStatusBarItem());

    // Create platform-specific services
    const services = this.createPlatformServices(context);

    // Register tree view (shared logic)
    const treeView = vscode.window.createTreeView("mockExplorer", {
      treeDataProvider: services.mockExplorerProvider,
      showCollapseAll: false,
    });
    console.log("TreeView registered with ID: mock-server.mockExplorer");

    // Initialize command service and register all commands (shared logic)
    const commandService = new CommandService(
      context,
      services.mockExplorerProvider,
      services.mockEditorProvider,
      services.serverManager,
      this.statusBarService
    );
    commandService.registerCommands();

    // Initialize file watcher service for hot reload (shared logic)
    const fileWatcherService = new FileWatcherService(
      services.mockExplorerProvider,
      services.serverManager,
      this.statusBarService
    );
    fileWatcherService.initialize(context);

    // Log initialization
    this.logger.info(`Mock Server extension initialized (${platformInfo})`);

    // Add disposables to subscriptions
    context.subscriptions.push(treeView, services.mockEditorProvider, {
      dispose: () => this.logger.dispose(),
    });

    // Check if auto-start is enabled and start server (shared logic)
    this.checkAutoStart();
  }

  /**
   * Create platform-specific services
   */
  private createPlatformServices(
    context: vscode.ExtensionContext
  ): PlatformServices {
    const mockExplorerProvider =
      this.platform === "desktop"
        ? new (require("../providers/mockExplorer").MockExplorerProvider)()
        : new (require("../web/mockExplorer").MockExplorerProvider)();

    const mockEditorProvider = new MockEditorProvider(
      context.extensionUri,
      context
    );

    const serverManager = ServiceFactory.createServerManager(this.platform);

    console.log(
      `${
        this.platform === "desktop" ? "Desktop" : "Web"
      } MockExplorerProvider created`
    );
    console.log("MockEditorProvider created");

    return {
      mockExplorerProvider,
      mockEditorProvider,
      serverManager,
    };
  }

  /**
   * Check auto-start configuration
   */
  private checkAutoStart(): void {
    const config = vscode.workspace.getConfiguration("mockServer");
    const autoStart = config.get<boolean>("autoStart", false);

    if (autoStart) {
      vscode.commands.executeCommand("mock-server.startServer");
    }
  }

  /**
   * Deactivate the extension (shared logic)
   */
  deactivate(): void {
    console.log("Mock Server extension is being deactivated");
    this.logger.dispose();
  }
}
