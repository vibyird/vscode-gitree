import { Config } from '@/states/config'
import { State } from '@/states/state'
import { Component } from '@/utils/utils'
import { PanelView } from '@/views/panel/view'
import { SettingsView } from '@/views/settings/view'
import type { ExtensionContext, LogOutputChannel, StatusBarItem } from 'vscode'
import { commands, l10n, StatusBarAlignment, window, workspace } from 'vscode'
import { COMMAND_SETTINGS, COMMAND_VIEW, NAME } from './states/constants'

class Gitree extends Component {
  readonly #config: Config
  readonly #panelView: PanelView
  readonly #settingsView: SettingsView
  readonly #statusBarItem: StatusBarItem

  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state)
    // create config
    this.#config = new Config()
    // create views
    this.#panelView = new PanelView(context, logger, state)
    this.#settingsView = new SettingsView(context, logger, state)
    // create status bar item
    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 50)
    statusBarItem.text = `$(git-logo) ${l10n.t(NAME)}`
    statusBarItem.tooltip = l10n.t('Show Git Panel')
    statusBarItem.command = COMMAND_VIEW
    this.#statusBarItem = statusBarItem
    this.#init()
  }

  #init() {
    // register subscriptions
    this.subscriptions.push(
      this.#panelView,
      this.#settingsView,
      commands.registerCommand(COMMAND_VIEW, () => {
        if (this.state.git.repositories.length === 0) {
          window.showInformationMessage(l10n.t('There are no Git repositories in the current workspace.'))
          return
        }
        this.#panelView.show()
      }),
      commands.registerCommand(COMMAND_SETTINGS, () => {
        this.#settingsView.show()
      }),
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
  context.subscriptions.push(new Gitree(context, logger, new State(logger)), logger)
}

export function deactivate(): void {}
