import * as vscode from "vscode";
import { ViewDataProvider } from "./viewDataProvider";
import { CompCommands } from "./commands";

let commands: CompCommands;

export function activate(context: vscode.ExtensionContext) {
  const viewProvider = new ViewDataProvider();
  commands = new CompCommands(context.subscriptions, viewProvider);
  commands.refreshAppsList();

  vscode.window.registerTreeDataProvider("cleanCodeComp", viewProvider);
}

export function deactivate() {
  commands?.dispose();
}
