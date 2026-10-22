import type { Disposable, ExtensionContext, LogOutputChannel } from 'vscode'

export abstract class Subscription implements Disposable {
  protected readonly subscriptions: Disposable[] = []

  dispose(): void {
    while (this.subscriptions.length) {
      const subscription = this.subscriptions.pop()
      if (subscription) {
        subscription.dispose()
      }
    }
  }
}

export abstract class States extends Subscription {
  readonly context: ExtensionContext
  readonly logger: LogOutputChannel

  constructor(context: ExtensionContext, logger: LogOutputChannel) {
    super()
    this.context = context
    this.logger = logger
  }
}
