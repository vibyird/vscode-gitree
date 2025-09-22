import { NAME } from '@/states/constants'
import type { State } from '@/states/state'
import type { Runtime } from '@/utils/view'
import { View } from '@/utils/view'
import type { ExtensionContext, LogOutputChannel } from 'vscode'
import { l10n } from 'vscode'

class App extends View {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State, runtime: Runtime) {
    super({
      context,
      logger,
      state,
      runtime,
      title: l10n.t(NAME),
      path: 'panel',
    })
  }

  protected init(): void {
    this.runtime.onMessage(async (message) => {
      switch (message.type) {
        case 'init': {
          const repository = this.state.git.repositories[0]
          const commits = await repository.log()
          if (message != null) {
            this.runtime.sendMessage({
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

export default App
