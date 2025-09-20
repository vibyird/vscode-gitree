import type { WorkspaceConfiguration } from 'vscode'
import { Uri, workspace } from 'vscode'
import { ID } from './constants'

export class Config {
  readonly #config: WorkspaceConfiguration

  constructor(repo?: string) {
    this.#config = workspace.getConfiguration(ID, repo ? Uri.file(repo) : undefined)
  }

  get showInStatusBar(): boolean {
    return this.#config.get<boolean>('show-in-status-bar', true)
  }

  key(name: string): string {
    return `${ID}.${name}`
  }
}
