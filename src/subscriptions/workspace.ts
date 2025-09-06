import { workspace } from 'vscode'
import type { ExtensionContext } from 'vscode'
import { Component } from '../utils/utils'
import { configEventEmitter } from '../states/event'

export class WorkspaceSubscription extends Component {
  constructor(context: ExtensionContext) {
    super(
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('gitree')) {
          configEventEmitter.fire(event)
        }
      }),
      workspace.onDidChangeWorkspaceFolders(async (event) => {}),
    )
  }
}
