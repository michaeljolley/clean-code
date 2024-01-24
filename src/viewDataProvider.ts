/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";

const componentRegex = /.*\.(tsx)|(jsx)|(ts)|(js)|(vue)/g;
const componentGlob = "**/*.{ts,tsx,js,jsx,vue}";

export class CompTreeItem extends vscode.TreeItem {
  parent: CompTreeItem | undefined;
  children: CompTreeItem[] = [];
  path: string = "";
  isFolder: boolean = false;

  constructor(
    label: string,
    path: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.None,
    icon: vscode.ThemeIcon = vscode.ThemeIcon.Folder,
    command?: vscode.Command,
    isFolder?: boolean = false
  ) {
    super(label.replace("/", ""), collapsibleState);
    this.command = command;
    this.iconPath = icon;
    this.path = path;
    this.isFolder = isFolder;
  }
}

export class ViewDataProvider implements vscode.TreeDataProvider<CompTreeItem> {
  private treeItems: CompTreeItem[] | null = null;
  private _onDidChangeTreeData: vscode.EventEmitter<CompTreeItem | null> =
   new vscode.EventEmitter<CompTreeItem | null>();
  readonly onDidChangeTreeData: vscode.Event<CompTreeItem | null> =
     this._onDidChangeTreeData.event;

  private _fsWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    this._fsWatcher = vscode.workspace.createFileSystemWatcher(componentGlob);

    this._fsWatcher.onDidChange((event) => this.fileChanged(event));
    this._fsWatcher.onDidCreate((event) => this.fileChanged(event));
    this._fsWatcher.onDidDelete((event) => this.fileChanged(event));

    this.buildTree();
  }

  dispose() {
    this._fsWatcher?.dispose();
  }

  public refresh() {
    this.treeItems = null;
  }

  public getTreeItem(element: CompTreeItem): CompTreeItem {
    return element;
  }

  public getParent(element: CompTreeItem): CompTreeItem | null {
    if (element instanceof CompTreeItem && element.parent) {
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

  private fileChanged(event: vscode.Uri) {
    if (event.path.match(componentRegex) && this.treeItems) {
      const lastSlash = event.path.lastIndexOf("/");
      const filename = event.path.slice(lastSlash);
      const path = event.path.slice(0, lastSlash);

      const parent = this.treeItems.find((c) => c.path.toLocaleLowerCase() === path.toLocaleLowerCase());
      if (parent) {
        parent.children.push(
          new CompTreeItem(
            filename,
            event.path,
            undefined,
            vscode.ThemeIcon.File,
          ),
        );
        parent.children = parent.children.sort((a, b) => a.path.localeCompare(b.path));
      }
    }

    this._onDidChangeTreeData.fire(null);
  }

  private async buildTree(): Promise<CompTreeItem[]> {
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
        componentGlob,
        "**/node_modules/**",
      );

      if (files) {

        files = files.sort(this.treeSort);

        for (const file of files) {
          const lastSlash = file.path.lastIndexOf("/");
          const filename = file.path.slice(lastSlash);
          const path = file.path.slice(0, lastSlash);

          const parent = trunk.children.find((c) => c.path === path);
          if (folder.uri.path.toLocaleLowerCase() === path.toLocaleLowerCase()) {
            trunk.children.push(
              new CompTreeItem(
                filename,
                file.path,
                undefined,
                vscode.ThemeIcon.File,
              ),
            );
          }
          else if (parent) {
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

  private treeSort(a: CompTreeItem, b: CompTreeItem): number {
    return a.isFolder > b.isFolder && a.path.localeCompare(b.path) ? 1 : -1;
  }
}
