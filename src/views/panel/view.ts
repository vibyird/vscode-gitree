import { NAME } from '@/states/constants'
import type { State } from '@/states/state'
import { View } from '@/utils/view'
import type { ExtensionContext, LogOutputChannel } from 'vscode'
import { l10n } from 'vscode'

export class PanelView extends View {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state, {
      title: l10n.t(NAME),
      path: 'panel',
    })
    this.#init()
  }

  #init(): void {
    this.onMessage(async (message) => {
      switch (message.type) {
        case 'init': {
          const repository = this.state.git.repositories[0]
          const commits = await repository.log()
          if (message != null) {
            this.sendMessage({
              type: 'commits',
              data: commits,
            })
          }
          break
        }
      }
    })
  }
}
