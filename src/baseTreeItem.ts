import * as vscode from "vscode";

export class BaseTreeItem extends vscode.TreeItem {
  parent: BaseTreeItem | undefined;
  children: BaseTreeItem[] = [];

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None,
    command?: vscode.Command,
    contextValue = "cleancode",
  ) {
    super(label, collapsibleState);
    this.command = command;
    this.contextValue = contextValue;
  }

  makeCollapsible() {
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
  expand() {
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  }
}
