import { COMMAND_CREATE_BRANCH, COMMAND_CREATE_TAG } from '@/states/constants'
import States from '@/states/states'
import { Subscription } from '@/utils/util'
import type { Disposable } from 'vscode'
import { commands, l10n, window } from 'vscode'

export default class extends Subscription {
  constructor(states: States) {
    super()
    this.#init(this.subscriptions, states)
  }

  #init(subscriptions: Disposable[], states: States): void {
    subscriptions.push(
      commands.registerCommand(COMMAND_CREATE_BRANCH, ({ ref }: { ref: string }) => this.#createBranch(states, ref)),
      commands.registerCommand(COMMAND_CREATE_TAG, ({ ref }: { ref: string }) => this.#createTag(states, ref)),
    )
  }

  async #createBranch(states: States, ref: string): Promise<void> {
    const name = await window.showInputBox({
      title: l10n.t('Please provide a new branch name'),
    })
    if (!name) {
      return
    }
    const checkoutItem = await window.showQuickPick(
      [
        { label: l10n.t('Yes'), value: true },
        { label: l10n.t('No'), value: false },
      ],
      { title: l10n.t('Please select whether to checkout') },
    )
    if (!checkoutItem) {
      return
    }
    states.git.createBranch(name, checkoutItem.value, ref)
  }

  async #createTag(states: States, ref: string): Promise<void> {
    const name = await window.showInputBox({
      title: l10n.t('Please provide a new tag name'),
    })
    if (!name) {
      return
    }
    states.git.createTag(name, ref)
  }
}
