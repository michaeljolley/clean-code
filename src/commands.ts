import * as vscode from "vscode";
import { ViewDataProvider } from "./viewDataProvider";

export class CompCommands {
  refreshAppsList = () => {
    this.viewDataProvider.refresh();
  };

  private refreshListCommand = vscode.commands.registerCommand(
    "cleancode.refresh",
    this.refreshAppsList,
  );

  constructor(
    subscriptions: { dispose(): any }[],
    private viewDataProvider: ViewDataProvider,
  ) {
    subscriptions.push(this.refreshListCommand);
  }

  dispose() {
    this.refreshListCommand.dispose();
  }
}
