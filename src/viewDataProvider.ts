/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";

import { BaseTreeItem } from "./baseTreeItem";
import { BaseTreeViewDataProvider } from "./baseTreeViewDataProvider";

export class CompTreeItem extends vscode.TreeItem {
  parent: CompTreeItem | undefined;
  children: CompTreeItem[] = [];
  path: string = "";

  constructor(
    label: string,
    path: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None,
    icon: vscode.ThemeIcon = vscode.ThemeIcon.Folder,
    command?: vscode.Command,
    contextValue = "cleancode",
  ) {
    super(label, collapsibleState);
    this.command = command;
    this.iconPath = icon;
    this.path = path;
    this.contextValue = contextValue;
  }
}

export class ViewDataProvider implements vscode.TreeDataProvider<CompTreeItem> {
  private treeItems: CompTreeItem[] | null = null;
  private _onDidChangeTreeData: vscode.EventEmitter<CompTreeItem | null> =
    new vscode.EventEmitter<CompTreeItem | null>();
  readonly onDidChangeTreeData: vscode.Event<CompTreeItem | null> =
    this._onDidChangeTreeData.event;

  public refresh() {
    this.treeItems = null;
    this._onDidChangeTreeData.fire(null);
  }

  public getTreeItem(element: CompTreeItem): CompTreeItem {
    return element;
  }

  public getParent(element: CompTreeItem): CompTreeItem | null {
    if (element instanceof BaseTreeItem && element.parent) {
      return element.parent;
    }
    return null;
  }

  public async getChildren(element?: CompTreeItem): Promise<CompTreeItem[]> {
    if (!this.treeItems) {
      this.treeItems = await this.buildTree();
    }

    if (element instanceof CompTreeItem) {
      return element.children;
    }

    if (!element) {
      if (this.treeItems) {
        return this.treeItems;
      }
    }
    return [];
  }

  async buildTree(): Promise<CompTreeItem[]> {
    if (!vscode.workspace.workspaceFolders) {
      return [];
    }

    const items: CompTreeItem[] = [];

    for (const folder of vscode.workspace.workspaceFolders) {
      const trunk = new CompTreeItem(
        folder.name,
        folder.uri.path,
        vscode.TreeItemCollapsibleState.Expanded,
      );

      let files = await vscode.workspace.findFiles(
        `**/*.md`,
        "**/node_modules/**",
      );

      if (files) {
        for (const file of files) {
          const lastSlash = file.path.lastIndexOf("/");
          const filename = file.path.slice(lastSlash);
          const path = file.path.slice(0, lastSlash);

          const parent = trunk.children.find((c) => c.path === path);

          if (parent) {
            parent.children.push(
              new CompTreeItem(
                filename,
                file.path,
                undefined,
                vscode.ThemeIcon.File,
              ),
            );
          } else {
            let newParent = new CompTreeItem(
              path.slice(path.lastIndexOf("/")),
              path,
              vscode.TreeItemCollapsibleState.Expanded,
            );
            newParent.children.push(
              new CompTreeItem(
                filename,
                file.path,
                undefined,
                vscode.ThemeIcon.File,
              ),
            );
            trunk.children.push(newParent);
          }
        }
      }

      items.push(trunk);
    }

    return items;
  }
}
