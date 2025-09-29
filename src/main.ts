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
import type { Disposable, ExtensionContext, StatusBarItem, ViewColumn } from 'vscode'
import { commands, l10n, StatusBarAlignment, window } from 'vscode'

class Extension extends State {
  #statusBarItem: StatusBarItem

  constructor(context: ExtensionContext) {
    super(context)
    this.#init(this.subscriptions, this)
  }

  #init(subscriptions: Disposable[], state: State): void {
    subscriptions.push(
      window.registerWebviewViewProvider(GRAPH_VIEW_ID, state.views[GRAPH_VIEW_ID]),
      window.registerWebviewPanelSerializer(SETTINGS_PANEL_ID, state.panels[SETTINGS_PANEL_ID]),
      commands.registerCommand(COMMAND_VIEW, () => this.#showViewsContainer(ID)),
      commands.registerCommand(COMMAND_GRAPH_REFRESH, () => this.#refreshView(GRAPH_VIEW_ID)),
      commands.registerCommand(COMMAND_SETTINGS, () => this.#showPanel(SETTINGS_PANEL_ID)),
      state.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(`statusBar`)) {
          this.#renderStatusBar()
        }
      }),
      state.onDidOpenRepository(() => this.#renderStatusBar()),
      state.onDidCloseRepository(() => this.#renderStatusBar()),
    )
    this.#renderStatusBar()
  }

  #showViewsContainer(id: string): void {
    const state = this
    if (state.repositories.length === 0) {
      window.showInformationMessage(l10n.t('There are no Git repositories in the current workspace.'))
      return
    }
    commands.executeCommand(`workbench.view.extension.${id}`)
  }

  #refreshView(id: string): void {
    const state = this
    const view = state.views[id]
    view.sendMessage({
      type: 'refresh',
    })
  }

  #showPanel(id: string): void {
    const state = this
    const panel = state.panels[id]
    panel.show({
      column: window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined,
      creator: (title: string, column: ViewColumn) => window.createWebviewPanel(id, title, column),
    })
  }

  #renderStatusBar(): void {
    const state = this
    let statusBarItem = this.#statusBarItem
    if (this.get<boolean>('statusBar.showItem') && state.repositories.length > 0) {
      if (!statusBarItem) {
        statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 50)
        statusBarItem.text = `$(git-logo) ${l10n.t(NAME)}`
        statusBarItem.tooltip = l10n.t('Show Git Graph')
        statusBarItem.command = COMMAND_VIEW
        this.#statusBarItem = statusBarItem
      }
      statusBarItem.show()
    } else {
      if (statusBarItem) {
        statusBarItem.hide()
      }
    }
  }

  dispose(): void {
    super.dispose()
    const statusBarItem = this.#statusBarItem
    if (statusBarItem) {
      this.#statusBarItem = undefined
      statusBarItem.dispose()
    }
  }
}

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(new Extension(context))
}

export function deactivate(): void {}
