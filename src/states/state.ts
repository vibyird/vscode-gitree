import type { PanelState } from '@/types/data'
import type { API, GitExtension } from '@/types/git'
import { PanelSerializer, Runtime, ViewProvider } from '@/utils/view'
import PanelView from '@/views/graph'
import SettingsView from '@/views/settings'
import type { Disposable, ExtensionContext, LogOutputChannel, StatusBarItem, WorkspaceConfiguration } from 'vscode'
import { extensions, l10n, StatusBarAlignment, window, workspace } from 'vscode'
import { COMMAND_VIEW, GRAPH_VIEW_ID, ID, NAME, SETTINGS_PANEL_ID } from './constants'

export class State {
  readonly #subscriptions: Disposable[] = []
  readonly #logger: LogOutputChannel
  #config: WorkspaceConfiguration
  readonly #statusBarItem: StatusBarItem

  readonly git: API

  readonly panels: Record<string, PanelSerializer> = {}
  readonly views: Record<string, ViewProvider> = {}

  constructor(context: ExtensionContext, logger: LogOutputChannel) {
    this.#config = workspace.getConfiguration(ID)
    this.#logger = logger
    const subscriptions = this.#subscriptions
    const state = this
    // create status bar item
    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 50)
    statusBarItem.text = `$(git-logo) ${l10n.t(NAME)}`
    statusBarItem.tooltip = l10n.t('Show Git Graph')
    statusBarItem.command = COMMAND_VIEW
    this.#statusBarItem = statusBarItem
    // add git
    const gitExtension = extensions.getExtension<GitExtension>('vscode.git').exports
    const git = gitExtension.getAPI(1)
    this.git = git
    subscriptions.push(
      statusBarItem,
      this.git.onDidOpenRepository(() => this.#changeStatusBar()),
      this.git.onDidCloseRepository(() => this.#changeStatusBar()),
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(ID)) {
          this.#config = workspace.getConfiguration(ID)
          if (event.affectsConfiguration(`${ID}.statusBar`)) {
            this.#changeStatusBar()
          }
        }
      }),
    )
    this.#changeStatusBar()
    // add panels
    const settingsPanel = new PanelSerializer<PanelState>(
      (runtime: Runtime): SettingsView => new SettingsView(context, logger, state, runtime),
      context,
      logger,
      state,
    )
    subscriptions.push(settingsPanel)
    this.panels[SETTINGS_PANEL_ID] = settingsPanel
    // add views
    const panelView = new ViewProvider(
      (runtime: Runtime): PanelView => new PanelView(context, logger, state, runtime),
      context,
      logger,
      state,
    )
    subscriptions.push(panelView)
    this.views[GRAPH_VIEW_ID] = panelView
  }

  get config(): WorkspaceConfiguration {
    return this.#config
  }

  #changeStatusBar(): void {
    if (this.#config.get<boolean>('statusBar.showItem') && this.git.repositories.length > 0) {
      this.#statusBarItem.show()
    } else {
      this.#statusBarItem.hide()
    }
  }

  dispose() {
    while (this.#subscriptions.length) {
      const subscription = this.#subscriptions.pop()
      if (subscription) {
        subscription.dispose()
      }
    }
  }
}
