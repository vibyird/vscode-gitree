import { Uri, workspace } from 'vscode'
import type { WorkspaceConfiguration } from 'vscode'

export class Config {
  private readonly config: WorkspaceConfiguration

  private static readonly KEYBINDING_REGEXP = /^CTRL\/CMD \+ [A-Z]$/

  constructor(repo?: string) {
    this.config = workspace.getConfiguration('gitree', repo ? Uri.file(repo) : undefined)
  }

  get showStatusBarItem(): boolean {
    return this.config.get<boolean>('showStatusBarItem', true)
  }
}
