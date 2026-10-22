import GitService from '@/services/git'
import { NAME } from '@/states/constants'
import type States from '@/states/states'
import type { Runtime } from '@/utils/page'
import { Page } from '@/utils/page'
import type { Disposable } from 'vscode'
import { l10n } from 'vscode'

export default class extends Page<States> {
  #git: GitService

  constructor(runtime: Runtime<States>) {
    super(runtime)
    this.#git = new GitService(this.states)
  }

  get name(): string {
    return 'graph'
  }

  get title(): string {
    return l10n.t(NAME)
  }

  protected init(subscriptions: Disposable[], runtime: Runtime<States>): void {
    subscriptions.push(
      this.states.onDidOpenRepository(() => {
        const data = this.#git.changeRepository()
        this.runtime.sendMessage({
          type: 'change-repository',
          data,
        })
      }),
      this.states.onDidCloseRepository(() => {
        const data = this.#git.changeRepository()
        this.runtime.sendMessage({
          type: 'change-repository',
          data,
        })
      }),
      runtime.onMessage(async (message) => {
        switch (message.type) {
          case 'init': {
            const data = await this.#git.getCommits()
            this.runtime.sendMessage({
              type: 'inited',
              data,
            })
            break
          }
          case 'get_commits': {
            const { sequenceId, start, end } = message.params
            const data = await this.#git.getCommits({ start, end })
            this.runtime.sendMessage({
              type: 'commits',
              data: {
                sequenceId,
                ...data,
              },
            })
            break
          }
          case 'get_commit': {
            const { hash } = message.params
            const data = await this.#git.getCommit({ hash })
            this.runtime.sendMessage({
              type: 'commit',
              data,
            })
            break
          }
        }
      }),
    )
  }

  async refresh(): Promise<void> {
    this.#git.clearCache()
    this.runtime.sendMessage({
      type: 'refresh',
    })
  }
}
