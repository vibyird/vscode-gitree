import Commands from '@/commands/commands'
import Pages from '@/pages/pages'
import { NAME } from '@/states/constants'
import States from '@/states/states'
import { Subscription } from '@/utils/util'
import type { Disposable, ExtensionContext, LogOutputChannel } from 'vscode'
import { window } from 'vscode'

class Extension extends Subscription {
  constructor(context: ExtensionContext, logger: LogOutputChannel) {
    super()
    this.#init(context, logger, this.subscriptions)
  }

  #init(context: ExtensionContext, logger: LogOutputChannel, subscriptions: Disposable[]): void {
    const states = new States(context, logger)
    const pages = new Pages(states)
    const commands = new Commands(states, pages)
    subscriptions.push(states, pages, commands)
  }
}

export function activate(context: ExtensionContext): void {
  const logger = window.createOutputChannel(NAME, { log: true })
  context.subscriptions.push(logger, new Extension(context, logger))
  logger.info('activated')
}

export function deactivate(): void {}
