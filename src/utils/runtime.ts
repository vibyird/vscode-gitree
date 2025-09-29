import type { State } from '@/states/state'
import type { ExtensionMessage, PageMessage } from '@/types/data'
import { Component } from '@/utils/utils'
import { View } from '@/utils/view'
import type {
  CancellationToken,
  Disposable,
  Webview,
  WebviewPanel,
  WebviewPanelSerializer,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from 'vscode'
import { EventEmitter, Uri, ViewColumn } from 'vscode'

export abstract class Runtime extends Component {
  readonly #resourceUri: Uri
  readonly #l10nUri: Uri
  protected readonly visibilityEmitter: EventEmitter<boolean>
  protected readonly messageEmitter: EventEmitter<PageMessage>
  protected readonly view: View
  protected webview: Webview

  constructor(factory: (runtime: Runtime) => View, state: State) {
    super(state)
    const extensionUri = state.context.extensionUri
    this.#resourceUri = Uri.joinPath(extensionUri, 'assets')
    this.#l10nUri = Uri.joinPath(extensionUri, 'l10n')
    this.visibilityEmitter = new EventEmitter<boolean>()
    this.messageEmitter = new EventEmitter<PageMessage>()
    const view = factory(this)
    this.subscriptions.push(view)
    this.view = view
  }

  get resourceUri(): Uri {
    return this.#resourceUri
  }

  get l10nUri(): Uri {
    return this.#l10nUri
  }

  onDidChangeVisibility(listener: (visible: boolean) => void): Disposable {
    return this.visibilityEmitter.event(listener)
  }

  onMessage(listener: (message: PageMessage) => void): Disposable {
    return this.messageEmitter.event(listener)
  }

  sendMessage(message: ExtensionMessage): void {
    if (this.webview) {
      this.webview.postMessage(message)
    }
  }
}

export class PanelSerializer<T = unknown> extends Runtime implements WebviewPanelSerializer {
  #panel: WebviewPanel

  async deserializeWebviewPanel(panel: WebviewPanel, state: T): Promise<void> {
    this.#render(panel)
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
    const panel = creator(this.view.title, column || ViewColumn.One)
    this.#render(panel)
  }

  #render(panel: WebviewPanel): void {
    const webview = panel.webview
    this.webview = webview
    this.#panel = panel
    // init panel icon
    panel.iconPath = {
      light: Uri.joinPath(this.resourceUri, 'icons', 'git-black.svg'),
      dark: Uri.joinPath(this.resourceUri, 'icons', 'git-white.svg'),
    }
    // register subscriptions
    const subscriptions: Disposable[] = []
    subscriptions.push(
      panel.onDidDispose(() => {
        while (subscriptions.length) {
          const subscription = subscriptions.pop()
          if (subscription) {
            subscription.dispose()
          }
        }

        this.webview = undefined
        this.#panel = undefined
        this.visibilityEmitter.fire(false)
      }),
      panel.onDidChangeViewState(() => this.visibilityEmitter.fire(panel.visible)),
      webview.onDidReceiveMessage((message: PageMessage) => this.messageEmitter.fire(message)),
    )
    // render
    this.view.render(webview)
  }

  dispose(): void {
    super.dispose()
    if (this.#panel) {
      this.#panel.dispose()
      this.#panel = undefined
    }
  }
}

export class ViewProvider extends Runtime implements WebviewViewProvider {
  resolveWebviewView(view: WebviewView, context: WebviewViewResolveContext, token: CancellationToken): void {
    view.title = this.view.title
    this.#render(view)
  }

  #render(view: WebviewView): void {
    const webview = view.webview
    this.webview = webview
    // register subscriptions
    const subscriptions: Disposable[] = []
    subscriptions.push(
      view.onDidDispose(() => {
        while (subscriptions.length) {
          const subscription = subscriptions.pop()
          if (subscription) {
            subscription.dispose()
          }
        }
        this.webview = undefined
      }),
      view.onDidChangeVisibility(async () => this.visibilityEmitter.fire(view.visible)),
      webview.onDidReceiveMessage((message: PageMessage) => this.messageEmitter.fire(message)),
    )
    // render
    this.view.render(webview)
  }
}
