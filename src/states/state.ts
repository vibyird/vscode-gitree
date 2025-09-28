import { COMMAND_VIEW, GRAPH_VIEW_ID, ID, NAME, SETTINGS_PANEL_ID } from '@/states/constants'
import type { PanelState } from '@/types/data'
import type { API, GitExtension, Repository } from '@/types/git'
import { GitAPI } from '@/utils/git'
import { PanelSerializer, Runtime, ViewProvider } from '@/utils/view'
import GraphView from '@/views/graph'
import SettingsView from '@/views/settings'
import type { Disposable, ExtensionContext, LogOutputChannel, StatusBarItem, WorkspaceConfiguration } from 'vscode'
import { extensions, l10n, StatusBarAlignment, window, workspace } from 'vscode'

export class State {
  readonly #subscriptions: Disposable[] = []

  readonly #statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 50)
  #config: WorkspaceConfiguration = workspace.getConfiguration(ID)

  readonly #gitAPI: API = extensions.getExtension<GitExtension>('vscode.git').exports.getAPI(1)
  readonly #panels: Record<string, PanelSerializer> = {}
  readonly #views: Record<string, ViewProvider> = {}

  constructor(context: ExtensionContext, logger: LogOutputChannel) {
    this.#init(this.#subscriptions, context, logger, this)
  }

  get repositories(): Repository[] {
    return this.#gitAPI.repositories
  }

  get git(): GitAPI {
    return new GitAPI(this.#gitAPI)
  }

  get panels(): Record<string, PanelSerializer> {
    return this.#panels
  }

  get views(): Record<string, ViewProvider> {
    return this.#views
  }

  #init(subscriptions: Disposable[], context: ExtensionContext, logger: LogOutputChannel, state: State): void {
    this.#initStatusBar(subscriptions)
    this.#initPanels(subscriptions, context, logger, state)
    this.#initViews(subscriptions, context, logger, state)
  }

  get config(): WorkspaceConfiguration {
    return this.#config
  }

  #initStatusBar(subscriptions: Disposable[]): void {
    // set statusBarItem
    const statusBarItem = this.#statusBarItem
    statusBarItem.text = `$(git-logo) ${l10n.t(NAME)}`
    statusBarItem.tooltip = l10n.t('Show Git Graph')
    statusBarItem.command = COMMAND_VIEW
    const git = this.#gitAPI
    subscriptions.push(
      statusBarItem,
      git.onDidOpenRepository(() => this.#changeStatusBar()),
      git.onDidCloseRepository(() => this.#changeStatusBar()),
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
  }

  #changeStatusBar(): void {
    if (this.#config.get<boolean>('statusBar.showItem') && this.#gitAPI.repositories.length > 0) {
      this.#statusBarItem.show()
    } else {
      this.#statusBarItem.hide()
    }
  }

  #initPanels(subscriptions: Disposable[], context: ExtensionContext, logger: LogOutputChannel, state: State): void {
    const panels = this.#panels
    const settingsPanel = new PanelSerializer<PanelState>(
      (runtime: Runtime): SettingsView => new SettingsView(context, logger, state, runtime),
      context,
      logger,
      state,
    )
    subscriptions.push(settingsPanel)
    panels[SETTINGS_PANEL_ID] = settingsPanel
  }

  #initViews(subscriptions: Disposable[], context: ExtensionContext, logger: LogOutputChannel, state: State): void {
    const views = this.#views
    const graphView = new ViewProvider(
      (runtime: Runtime): GraphView => new GraphView(context, logger, state, runtime),
      context,
      logger,
      state,
    )
    subscriptions.push(graphView)
    views[GRAPH_VIEW_ID] = graphView
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
