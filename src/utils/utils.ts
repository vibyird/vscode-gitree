import type { State } from '@/states/state'
import type { Disposable, ExtensionContext, LogOutputChannel } from 'vscode'

export abstract class Component implements Disposable {
  protected readonly subscriptions: Disposable[] = []
  protected readonly context: ExtensionContext
  protected readonly logger: LogOutputChannel
  protected readonly state: State

  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    this.subscriptions = []
    this.context = context
    this.logger = logger
    this.state = state
  }

  dispose() {
    while (this.subscriptions.length) {
      const subscription = this.subscriptions.pop()
      if (subscription) {
        subscription.dispose()
      }
    }
  }
}
