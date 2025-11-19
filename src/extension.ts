// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ExtensionBootstrap } from "./common/extensionBootstrap";

// Store bootstrap instance for cleanup
let bootstrap: ExtensionBootstrap;

// This method is called when your extension is activated (Desktop version)
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use shared bootstrap logic for desktop
  bootstrap = new ExtensionBootstrap('desktop');
  return bootstrap.activate(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (bootstrap) {
    bootstrap.deactivate();
  }
}
