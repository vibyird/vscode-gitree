import { Config } from '@/states/config'
import { State } from '@/states/state'
import { Component } from '@/utils/utils'
import type { ExtensionContext, LogOutputChannel, StatusBarItem } from 'vscode'
import { l10n, StatusBarAlignment, window, workspace } from 'vscode'
import Command from './controllers/command'
import Window from './controllers/window'
import { COMMAND_VIEW, NAME } from './states/constants'

class Extension extends Component {
  readonly #config: Config
  readonly #statusBarItem: StatusBarItem

  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state)
    // create config
    this.#config = new Config()
    // create status bar item
    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 50)
    statusBarItem.text = `$(git-logo) ${l10n.t(NAME)}`
    statusBarItem.tooltip = l10n.t('Show Git Panel')
    statusBarItem.command = COMMAND_VIEW
    this.#statusBarItem = statusBarItem
    this.#init(this.context, this.logger, this.state)
  }

  #init(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    // register subscriptions
    this.subscriptions.push(
      new Command(context, logger, state),
      new Window(context, logger, state),
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(this.#config.key('show-in-status-bar'))) {
          this.#changeStatusBar()
        }
      }),
      this.state.git.onDidOpenRepository(() => {
        this.#changeStatusBar()
      }),
      this.state.git.onDidCloseRepository(() => {
        this.#changeStatusBar()
      }),
      this.#statusBarItem,
    )
    this.#changeStatusBar()
  }

  #changeStatusBar() {
    if (this.#config.showInStatusBar && this.state.git.repositories.length > 0) {
      this.#statusBarItem.show()
    } else {
      this.#statusBarItem.hide()
    }
  }
}

export function activate(context: ExtensionContext) {
  // create logger
  const logger = window.createOutputChannel(NAME, { log: true })
  // register subscriptions
  context.subscriptions.push(new Extension(context, logger, new State(logger)), logger)
}

export function deactivate(): void {}
