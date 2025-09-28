import { NAME } from '@/states/constants'
import type { State } from '@/states/state'
import type { Runtime } from '@/utils/view'
import { View } from '@/utils/view'
import type { Disposable, ExtensionContext, LogOutputChannel } from 'vscode'
import { l10n } from 'vscode'

export default class extends View {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State, runtime: Runtime) {
    super({
      context,
      logger,
      state,
      runtime,
      title: l10n.t(NAME),
      page: 'Graph',
    })
  }

  protected init(subscriptions: Disposable[], runtime: Runtime): void {
    subscriptions.push(
      runtime.onMessage(async (message) => {
        switch (message.type) {
          case 'init': {
            const commits = await this.state.git.log()
            if (message != null) {
              this.runtime.sendMessage({
                type: 'commits',
                data: commits,
              })
            }
            break
          }
          case 'get_commit': {
            const { hash } = message.params
            const commit = await this.state.git.show(hash)
            this.runtime.sendMessage({
              type: 'commit',
              data: commit,
            })
          }
        }
      }),
    )
  }
}
