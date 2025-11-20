import * as vscode from "vscode";

/**
 * Version information for the skill installation
 */
interface SkillInstallationInfo {
  version: string;
  installedAt: number;
}

/**
 * Parse version from SKILL.md frontmatter
 * Looks for version field in YAML frontmatter, falls back to "1.0.0" if not found
 */
export async function parseSkillVersion(
  extensionUri: vscode.Uri
): Promise<string> {
  try {
    const skillFileUri = vscode.Uri.joinPath(
      extensionUri,
      ".claude",
      "skills",
      "SKILL.md"
    );
    const fileContent = await vscode.workspace.fs.readFile(skillFileUri);
    const content = Buffer.from(fileContent).toString("utf8");

    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const versionMatch = frontmatter.match(/version:\s*["']?([^"'\n]+)["']?/);
      if (versionMatch) {
        return versionMatch[1].trim();
      }
    }

    // Fallback to default version
    return "1.0.0";
  } catch (error) {
    console.error("Failed to parse skill version:", error);
    return "1.0.0";
  }
}

/**
 * Get storage key for a workspace folder
 */
function getStorageKey(workspaceUri: vscode.Uri): string {
  return `mock-server.skills.${workspaceUri.toString()}`;
}

/**
 * Check if skills need to be installed or updated for a workspace
 */
export async function checkSkillsNeedUpdate(
  context: vscode.ExtensionContext,
  workspaceUri: vscode.Uri,
  currentVersion: string
): Promise<boolean> {
  const storageKey = getStorageKey(workspaceUri);
  const installed = context.globalState.get<SkillInstallationInfo>(storageKey);

  if (!installed) {
    return true; // Not installed yet
  }

  return installed.version !== currentVersion; // Version mismatch
}

/**
 * Copy a single file from extension to workspace
 */
async function copyFile(
  sourceUri: vscode.Uri,
  targetUri: vscode.Uri,
  shouldOverwrite: boolean
): Promise<boolean> {
  try {
    // Check if target exists
    let exists = false;
    try {
      await vscode.workspace.fs.stat(targetUri);
      exists = true;
    } catch {
      exists = false;
    }

    // Skip if exists and we shouldn't overwrite
    if (exists && !shouldOverwrite) {
      const fileName = targetUri.path.split("/").pop();
      const choice = await vscode.window.showWarningMessage(
        `File "${fileName}" already exists. Overwrite?`,
        "Yes",
        "No",
        "Yes to All"
      );

      if (choice === "No") {
        return false;
      }
      if (choice === "Yes to All") {
        shouldOverwrite = true;
      }
    }

    // Copy the file
    const content = await vscode.workspace.fs.readFile(sourceUri);
    await vscode.workspace.fs.writeFile(targetUri, content);
    return true;
  } catch (error) {
    console.error(
      `Failed to copy file from ${sourceUri.path} to ${targetUri.path}:`,
      error
    );
    return false;
  }
}

/**
 * Install skills to a specific workspace folder
 */
async function installSkillsToWorkspace(
  extensionUri: vscode.Uri,
  workspaceUri: vscode.Uri,
  overwriteAll: boolean = false
): Promise<{ success: boolean; filesCopied: number }> {
  let filesCopied = 0;

  try {
    const skillsSourceUri = vscode.Uri.joinPath(
      extensionUri,
      ".claude",
      "skills"
    );

    // Target directories
    const claudeTargetUri = vscode.Uri.joinPath(
      workspaceUri,
      ".claude",
      "skills",
      "mock-server"
    );
    const cursorTargetUri = vscode.Uri.joinPath(
      workspaceUri,
      ".cursor",
      "skills",
      "mock-server"
    );

    // Ensure target directories exist
    await vscode.workspace.fs.createDirectory(claudeTargetUri);
    await vscode.workspace.fs.createDirectory(cursorTargetUri);

    // Files to copy
    const filesToCopy = ["SKILL.md", "examples.md"];

    // Copy main files
    for (const fileName of filesToCopy) {
      const sourceUri = vscode.Uri.joinPath(skillsSourceUri, fileName);
      const claudeTargetFileUri = vscode.Uri.joinPath(
        claudeTargetUri,
        fileName
      );
      const cursorTargetFileUri = vscode.Uri.joinPath(
        cursorTargetUri,
        fileName
      );

      if (await copyFile(sourceUri, claudeTargetFileUri, overwriteAll)) {
        filesCopied++;
      }
      if (await copyFile(sourceUri, cursorTargetFileUri, overwriteAll)) {
        filesCopied++;
      }
    }

    // Copy templates directory
    const templatesSourceUri = vscode.Uri.joinPath(
      skillsSourceUri,
      "templates"
    );
    const claudeTemplatesTargetUri = vscode.Uri.joinPath(
      claudeTargetUri,
      "templates"
    );
    const cursorTemplatesTargetUri = vscode.Uri.joinPath(
      cursorTargetUri,
      "templates"
    );

    // Ensure templates directories exist
    await vscode.workspace.fs.createDirectory(claudeTemplatesTargetUri);
    await vscode.workspace.fs.createDirectory(cursorTemplatesTargetUri);

    // Read template files
    const templateFiles = await vscode.workspace.fs.readDirectory(
      templatesSourceUri
    );

    // Copy each template file
    for (const [fileName, fileType] of templateFiles) {
      if (fileType === vscode.FileType.File) {
        const sourceUri = vscode.Uri.joinPath(templatesSourceUri, fileName);
        const claudeTargetFileUri = vscode.Uri.joinPath(
          claudeTemplatesTargetUri,
          fileName
        );
        const cursorTargetFileUri = vscode.Uri.joinPath(
          cursorTemplatesTargetUri,
          fileName
        );

        if (await copyFile(sourceUri, claudeTargetFileUri, overwriteAll)) {
          filesCopied++;
        }
        if (await copyFile(sourceUri, cursorTargetFileUri, overwriteAll)) {
          filesCopied++;
        }
      }
    }

    return { success: true, filesCopied };
  } catch (error) {
    console.error("Failed to install skills:", error);
    vscode.window.showErrorMessage(`Failed to install skills: ${error}`);
    return { success: false, filesCopied };
  }
}

/**
 * Install or update skills to workspace folders
 */
export async function installSkills(
  context: vscode.ExtensionContext,
  workspaceFolders: readonly vscode.WorkspaceFolder[],
  currentVersion: string,
  isUpdate: boolean = false
): Promise<void> {
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showWarningMessage(
      "No workspace folder found. Please open a folder or workspace first."
    );
    return;
  }

  let totalFilesCopied = 0;
  let successCount = 0;

  // Install to all workspace folders
  for (const folder of workspaceFolders) {
    const result = await installSkillsToWorkspace(
      context.extensionUri,
      folder.uri,
      false // Don't overwrite all by default, ask per file
    );

    if (result.success) {
      successCount++;
      totalFilesCopied += result.filesCopied;

      // Update installation info in global state
      const storageKey = getStorageKey(folder.uri);
      const installInfo: SkillInstallationInfo = {
        version: currentVersion,
        installedAt: Date.now(),
      };
      await context.globalState.update(storageKey, installInfo);
    }
  }

  // Show completion message
  if (successCount > 0) {
    const action = isUpdate ? "updated" : "installed";
    const message =
      workspaceFolders.length === 1
        ? `Mock Server skills ${action} successfully! (${totalFilesCopied} files copied)`
        : `Mock Server skills ${action} to ${successCount} workspace folder(s)! (${totalFilesCopied} files copied)`;

    vscode.window.showInformationMessage(message);
  } else {
    vscode.window.showErrorMessage(
      "Failed to install skills. Please check the output for errors."
    );
  }
}

/**
 * Check all workspaces and prompt user to install/update skills if needed
 */
export async function checkAndPromptSkillInstallation(
  context: vscode.ExtensionContext
): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return; // No workspace, skip
  }

  try {
    const currentVersion = await parseSkillVersion(context.extensionUri);

    // Check which workspaces need updates
    const workspacesNeedingUpdate: vscode.WorkspaceFolder[] = [];
    const isNewInstall: boolean[] = [];

    for (const folder of workspaceFolders) {
      const needsUpdate = await checkSkillsNeedUpdate(
        context,
        folder.uri,
        currentVersion
      );
      if (needsUpdate) {
        workspacesNeedingUpdate.push(folder);
        const storageKey = getStorageKey(folder.uri);
        const installed =
          context.globalState.get<SkillInstallationInfo>(storageKey);
        isNewInstall.push(!installed);
      }
    }

    if (workspacesNeedingUpdate.length === 0) {
      return; // All up to date
    }

    // Determine if this is a new install or update
    const hasNewInstalls = isNewInstall.some((v) => v);
    const hasUpdates = isNewInstall.some((v) => !v);

    let message: string;
    let actionLabel: string;

    if (hasNewInstalls && !hasUpdates) {
      // Only new installs
      message =
        workspacesNeedingUpdate.length === 1
          ? "Mock Server skills are not installed. Would you like to install them now?"
          : `Mock Server skills are not installed in ${workspacesNeedingUpdate.length} workspace(s). Would you like to install them now?`;
      actionLabel = "Install Skills";
    } else if (!hasNewInstalls && hasUpdates) {
      // Only updates
      message =
        workspacesNeedingUpdate.length === 1
          ? `Mock Server skills have been updated to v${currentVersion}. Would you like to update now?`
          : `Mock Server skills have been updated to v${currentVersion} in ${workspacesNeedingUpdate.length} workspace(s). Would you like to update now?`;
      actionLabel = "Update Skills";
    } else {
      // Mixed
      message = `Mock Server skills need to be installed or updated in ${workspacesNeedingUpdate.length} workspace(s). Continue?`;
      actionLabel = "Install/Update";
    }

    // Prompt user
    const choice = await vscode.window.showInformationMessage(
      message,
      actionLabel,
      "Later"
    );

    if (choice === actionLabel) {
      await installSkills(
        context,
        workspacesNeedingUpdate,
        currentVersion,
        hasUpdates && !hasNewInstalls
      );
    }
  } catch (error) {
    console.error("Failed to check skill installation:", error);
  }
}
