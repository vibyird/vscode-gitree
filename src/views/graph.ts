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
            const { HEAD, branches, tags, remotes } = await this.state.git.showRef()
            const stashes = await this.state.git.showStashList()
            const commits = await this.state.git.log({
              stashes,
            })
            this.runtime.sendMessage({
              type: 'init',
              data: {
                HEAD,
                branches,
                tags,
                remotes,
                commits,
              },
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
