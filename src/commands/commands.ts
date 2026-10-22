import GitCommand from '@/commands/git'
import ViewCommand from '@/commands/view'
import Pages from '@/pages/pages'
import States from '@/states/states'
import { Subscription } from '@/utils/util'
import type { Disposable } from 'vscode'

export default class extends Subscription {
  constructor(states: States, pages: Pages) {
    super()
    this.#init(this.subscriptions, states, pages)
  }

  #init(subscriptions: Disposable[], states: States, pages: Pages): void {
    subscriptions.push(new ViewCommand(states, pages), new GitCommand(states))
  }
}
