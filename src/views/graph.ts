import { NAME } from '@/states/constants'
import type { Runtime } from '@/utils/runtime'
import { View } from '@/utils/view'
import type { Disposable } from 'vscode'
import { l10n } from 'vscode'

export default class extends View {
  get title(): string {
    return l10n.t(NAME)
  }

  get page(): string {
    return 'Graph'
  }

  protected init(subscriptions: Disposable[], runtime: Runtime): void {
    subscriptions.push(
      runtime.onMessage(async (message) => {
        switch (message.type) {
          case 'init': {
            const commits = await this.state.git.log()
            this.runtime.sendMessage({
              type: 'commits',
              data: commits,
            })
            break
          }
          case 'get_commit': {
            const { hash } = message.params
            const commit = await this.state.git.show(hash)
            this.runtime.sendMessage({
              type: 'commit',
              data: commit,
            })
            break
          }
        }
      }),
    )
  }
}
