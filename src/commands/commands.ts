import ViewCommand from '@/commands/view'
import Pages from '@/pages/pages'
import State from '@/states/state'
import { Component } from '@/utils/util'
import type { Disposable } from 'vscode'

export default class extends Component {
  constructor(state: State, pages: Pages) {
    super(state)
    this.#init(this.subscriptions, state, pages)
  }

  #init(subscriptions: Disposable[], state: State, pages: Pages): void {
    subscriptions.push(new ViewCommand(state, pages))
  }
}
