import Commands from '@/commands/commands'
import Pages from '@/pages/pages'
import { NAME } from '@/states/constants'
import State from '@/states/state'
import { Subscription } from '@/utils/util'
import type { Disposable, ExtensionContext, LogOutputChannel } from 'vscode'
import { window } from 'vscode'

class Extension extends Subscription {
  constructor(context: ExtensionContext, logger: LogOutputChannel) {
    super()
    this.#init(context, logger, this.subscriptions)
  }

  #init(context: ExtensionContext, logger: LogOutputChannel, subscriptions: Disposable[]): void {
    const state = new State(context, logger)
    const pages = new Pages(state)
    const commands = new Commands(state, pages)
    subscriptions.push(state, pages, commands)
  }
}

export function activate(context: ExtensionContext): void {
  const logger: LogOutputChannel = window.createOutputChannel(NAME, { log: true })
  context.subscriptions.push(logger, new Extension(context, logger))
  logger.info('activated')
}

export function deactivate(): void {}
