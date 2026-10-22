import { COMMAND_VIEW, GRAPH_VIEW_ID, NAME, SETTINGS_PANEL_ID } from '@/states/constants'
import States from '@/states/states'
import { Page, Panel, Runtime, View } from '@/utils/page'
import { Subscription } from '@/utils/util'
import type { Disposable, StatusBarItem } from 'vscode'
import { l10n, StatusBarAlignment, ViewColumn, window } from 'vscode'
import GraphPage from './graph'
import SettingsPage from './settings'

export default class extends Subscription {
  readonly #panels: Record<string, Panel<States, unknown>> = {}
  readonly #views: Record<string, View<States>> = {}

  #statusBarItem: StatusBarItem | null = null

  constructor(states: States) {
    super()
    this.#init(this.subscriptions, states)
  }

  getPanel(id: string): Runtime<States> {
    return this.#panels[id]
  }

  getView(id: string): Runtime<States> {
    return this.#views[id]
  }

  async showPanel(id: string): Promise<void> {
    const panel = this.#panels[id]
    await panel.show({
      column: window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined,
      creator: (title: string, column: ViewColumn) => window.createWebviewPanel(id, title, column),
    })
  }

  #init(subscriptions: Disposable[], states: States): void {
    const settingsPanel = new Panel<States, void>(
      (runtime: Runtime<States>): Page<States> => new SettingsPage(runtime),
      states,
    )
    this.#panels[SETTINGS_PANEL_ID] = settingsPanel

    const graphView = new View<States>((runtime: Runtime<States>): Page<States> => new GraphPage(runtime), states)
    this.#views[GRAPH_VIEW_ID] = graphView

    subscriptions.push(
      settingsPanel,
      window.registerWebviewPanelSerializer(SETTINGS_PANEL_ID, settingsPanel),
      graphView,
      window.registerWebviewViewProvider(GRAPH_VIEW_ID, graphView),
      states.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(`statusBar`)) {
          this.#renderStatusBar(states)
        }
      }),
      states.onDidOpenRepository(() => this.#renderStatusBar(states)),
      states.onDidCloseRepository(() => this.#renderStatusBar(states)),
    )

    this.#renderStatusBar(states)
  }

  #renderStatusBar(states: States): void {
    let statusBarItem = this.#statusBarItem
    if (states.get<boolean>('statusBar.showItem') && states.repositories.length > 0) {
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
      this.#statusBarItem = null
      statusBarItem.dispose()
    }
  }
}
