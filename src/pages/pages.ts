import GraphPage from '@/pages/graph'
import SettingsPage from '@/pages/settings'
import { COMMAND_VIEW, GRAPH_VIEW_ID, NAME, SETTINGS_PANEL_ID } from '@/states/constants'
import State from '@/states/state'
import type { ExtensionMessage, PageMessage, PageState } from '@/types/data'
import { Component, Page, Runtime } from '@/utils/util'
import type {
  CancellationToken,
  Disposable,
  StatusBarItem,
  WebviewPanel,
  WebviewPanelSerializer,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from 'vscode'
import { EventEmitter, l10n, StatusBarAlignment, Uri, ViewColumn, window } from 'vscode'

class Panel extends Runtime implements WebviewPanelSerializer {
  readonly #visibilityEmitter: EventEmitter<boolean>
  readonly #messageEmitter: EventEmitter<PageMessage>
  readonly #page: Page
  #panel: WebviewPanel

  constructor(creator: (runtime: Runtime) => Page, state: State) {
    super(state)
    this.#visibilityEmitter = new EventEmitter<boolean>()
    this.#messageEmitter = new EventEmitter<PageMessage>()
    const page = creator(this)
    this.#page = page
    this.subscriptions.push(page)
  }

  async deserializeWebviewPanel(panel: WebviewPanel, state: PageState): Promise<void> {
    this.#renderPanel(panel)
  }

  onDidChangeVisibility(listener: (visible: boolean) => void): Disposable {
    return this.#visibilityEmitter.event(listener)
  }

  onMessage(listener: (message: PageMessage) => void): Disposable {
    return this.#messageEmitter.event(listener)
  }

  sendMessage(message: ExtensionMessage): void {
    if (this.#panel) {
      this.#panel.webview.postMessage(message)
    }
  }

  show({
    column,
    creator,
  }: {
    column: ViewColumn
    creator: (title: string, column: ViewColumn) => WebviewPanel
  }): void {
    if (this.#panel) {
      this.#panel.reveal(column)
      return
    }
    const panel = creator(this.#page.title, column || ViewColumn.One)
    this.#renderPanel(panel)
  }

  #renderPanel(panel: WebviewPanel): void {
    panel.iconPath = {
      light: Uri.joinPath(this.resourceUri, 'icons', 'git-black.svg'),
      dark: Uri.joinPath(this.resourceUri, 'icons', 'git-white.svg'),
    }
    this.#panel = panel
    const webview = panel.webview
    const subscriptions: Disposable[] = []
    subscriptions.push(
      panel.onDidDispose(() => {
        while (subscriptions.length) {
          const subscription = subscriptions.pop()
          if (subscription) {
            subscription.dispose()
          }
        }
        this.#panel = undefined
        this.#visibilityEmitter.fire(false)
      }),
      panel.onDidChangeViewState(() => this.#visibilityEmitter.fire(panel.visible)),
      webview.onDidReceiveMessage((message: PageMessage) => this.#messageEmitter.fire(message)),
    )
    this.renderWebview(webview, this.#page)
  }

  dispose(): void {
    super.dispose()
    if (this.#panel) {
      this.#panel.dispose()
      this.#panel = undefined
    }
  }
}

class View extends Runtime implements WebviewViewProvider {
  readonly #visibilityEmitter: EventEmitter<boolean>
  readonly #messageEmitter: EventEmitter<PageMessage>
  readonly #page: Page
  #view: WebviewView

  constructor(creator: (runtime: Runtime) => Page, state: State) {
    super(state)
    this.#visibilityEmitter = new EventEmitter<boolean>()
    this.#messageEmitter = new EventEmitter<PageMessage>()
    const page = creator(this)
    this.#page = page
    this.subscriptions.push(page)
  }

  resolveWebviewView(view: WebviewView, context: WebviewViewResolveContext, token: CancellationToken): void {
    this.#renderView(view)
  }

  onDidChangeVisibility(listener: (visible: boolean) => void): Disposable {
    return this.#visibilityEmitter.event(listener)
  }

  onMessage(listener: (message: PageMessage) => void): Disposable {
    return this.#messageEmitter.event(listener)
  }

  sendMessage(message: ExtensionMessage): void {
    if (this.#view) {
      this.#view.webview.postMessage(message)
    }
  }

  #renderView(view: WebviewView): void {
    view.title = this.#page.title
    this.#view = view
    const webview = view.webview
    const subscriptions: Disposable[] = []
    subscriptions.push(
      view.onDidDispose(() => {
        while (subscriptions.length) {
          const subscription = subscriptions.pop()
          if (subscription) {
            subscription.dispose()
          }
        }
        this.#view = undefined
      }),
      view.onDidChangeVisibility(async () => this.#visibilityEmitter.fire(view.visible)),
      webview.onDidReceiveMessage((message: PageMessage) => this.#messageEmitter.fire(message)),
    )
    this.renderWebview(webview, this.#page)
  }
}

export default class extends Component {
  readonly #panels: Record<string, Panel> = {}
  readonly #views: Record<string, View> = {}

  #statusBarItem: StatusBarItem

  constructor(state: State) {
    super(state)
    this.#init(this.subscriptions, state)
  }

  getPanel(id: string): Runtime {
    return this.#panels[id]
  }

  getView(id: string): Runtime {
    return this.#views[id]
  }

  showPanel(id: string): void {
    const panel = this.#panels[id]
    panel.show({
      column: window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined,
      creator: (title: string, column: ViewColumn) => window.createWebviewPanel(id, title, column),
    })
  }

  #init(subscriptions: Disposable[], state: State): void {
    const settingsPanel = new Panel((runtime: Runtime): SettingsPage => new SettingsPage(runtime), this.state)
    this.#panels[SETTINGS_PANEL_ID] = settingsPanel

    const graphView = new View((runtime: Runtime): GraphPage => new GraphPage(runtime), this.state)
    this.#views[GRAPH_VIEW_ID] = graphView

    subscriptions.push(
      settingsPanel,
      window.registerWebviewPanelSerializer(SETTINGS_PANEL_ID, settingsPanel),
      graphView,
      window.registerWebviewViewProvider(GRAPH_VIEW_ID, graphView),
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

  #renderStatusBar(): void {
    const state = this.state
    let statusBarItem = this.#statusBarItem
    if (state.get<boolean>('statusBar.showItem') && state.repositories.length > 0) {
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
