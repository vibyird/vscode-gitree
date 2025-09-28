import {
  COMMAND_GRAPH_REFRESH,
  COMMAND_SETTINGS,
  COMMAND_VIEW,
  GRAPH_VIEW_ID,
  ID,
  NAME,
  SETTINGS_PANEL_ID,
} from '@/states/constants'
import { State } from '@/states/state'
import { Component } from '@/utils/utils'
import type { Disposable, ExtensionContext, LogOutputChannel } from 'vscode'
import { commands, l10n, ViewColumn, window } from 'vscode'

class Extension extends Component {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state)
    this.#init(this.subscriptions, context, logger, state)
  }

  #init(subscriptions: Disposable[], context: ExtensionContext, logger: LogOutputChannel, state: State): void {
    // register subscriptions
    subscriptions.push(
      window.registerWebviewPanelSerializer(SETTINGS_PANEL_ID, state.panels[SETTINGS_PANEL_ID]),
      window.registerWebviewViewProvider(GRAPH_VIEW_ID, state.views[GRAPH_VIEW_ID]),
      commands.registerCommand(COMMAND_VIEW, () => this.#showGraphView()),
      commands.registerCommand(COMMAND_GRAPH_REFRESH, () => this.#refreshGraphView()),
      commands.registerCommand(COMMAND_SETTINGS, () => this.#showSettingsPanel()),
    )
  }

  #showGraphView(): void {
    if (this.state.repositories.length === 0) {
      window.showInformationMessage(l10n.t('There are no Git repositories in the current workspace.'))
      return
    }
    commands.executeCommand(`workbench.view.extension.${ID}`)
  }

  #refreshGraphView(): void {
    const graphView = this.state.views[GRAPH_VIEW_ID]
    graphView.sendMessage({
      type: 'refresh',
    })
  }

  #showSettingsPanel(): void {
    const settingsPanel = this.state.panels[SETTINGS_PANEL_ID]
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined
    if (settingsPanel.panel) {
      settingsPanel.panel.reveal(column)
      return
    }
    // create new panel
    const panel = window.createWebviewPanel(SETTINGS_PANEL_ID, settingsPanel.view.title, column || ViewColumn.One)
    settingsPanel.render(panel)
  }
}

export function activate(context: ExtensionContext) {
  // create logger and state
  const logger = window.createOutputChannel(NAME, { log: true })
  const state = new State(context, logger)
  // register subscriptions
  context.subscriptions.push(logger, state, new Extension(context, logger, state))
}

export function deactivate(): void {}
