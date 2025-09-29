import type { State } from '@/states/state'
import type { Disposable } from 'vscode'

export abstract class Component implements Disposable {
  protected readonly subscriptions: Disposable[] = []
  readonly #state: State

  constructor(state: State) {
    this.#state = state
  }

  get state(): State {
    return this.#state
  }

  dispose(): void {
    while (this.subscriptions.length) {
      const subscription = this.subscriptions.pop()
      if (subscription) {
        subscription.dispose()
      }
    }
  }
}
