import type { API, GitExtension } from '@/types/git'
import type { LogOutputChannel } from 'vscode'
import { extensions } from 'vscode'

export class State {
  readonly git: API

  constructor(logger: LogOutputChannel) {
    const gitExtension = extensions.getExtension<GitExtension>('vscode.git').exports
    const git = gitExtension.getAPI(1)
    this.git = git
  }
}
