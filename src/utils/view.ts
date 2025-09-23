import { ID } from '@/states/constants'
import type { State } from '@/states/state'
import type { Config, ExtensionMessage, WebviewMessage } from '@/types/data'
import { Component } from '@/utils/utils'
import type {
  CancellationToken,
  Disposable,
  ExtensionContext,
  LogOutputChannel,
  Webview,
  WebviewPanel,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
} from 'vscode'
import { ColorThemeKind, env, EventEmitter, Uri, ViewColumn, window } from 'vscode'

export abstract class Runtime extends Component {
  protected readonly view: View
  protected readonly visibilityEmitter: EventEmitter<boolean>
  protected readonly messageEmitter: EventEmitter<WebviewMessage>
  protected webview: Webview

  constructor(factory: (runtime: Runtime) => View, context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state)

    this.visibilityEmitter = new EventEmitter<boolean>()
    this.messageEmitter = new EventEmitter<WebviewMessage>()
    const view = factory(this)
    this.subscriptions.push(view)
    this.view = view
  }

  onDidChangeVisibility(listener: (visible: boolean) => void): Disposable {
    return this.visibilityEmitter.event(listener)
  }

  onMessage(listener: (message: WebviewMessage) => void): Disposable {
    return this.messageEmitter.event(listener)
  }

  sendMessage(message: ExtensionMessage): void {
    if (this.webview) {
      this.webview.postMessage(message)
    }
  }
}

export class Panel extends Runtime {
  #panel: WebviewPanel

  show(): void {
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined
    let panel = this.#panel
    if (panel) {
      panel.reveal(column)
      return
    }
    // create new panel
    panel = window.createWebviewPanel(`${ID}.${this.view.path}`, this.view.title, column || ViewColumn.One, {
      retainContextWhenHidden: false,
    })
    panel.iconPath = {
      light: Uri.joinPath(this.view.resourceUri, 'icons', 'git-black.svg'),
      dark: Uri.joinPath(this.view.resourceUri, 'icons', 'git-white.svg'),
    }
    this.#render(panel)
  }

  #render(panel: WebviewPanel): void {
    const webview = panel.webview
    this.webview = webview
    this.#panel = panel
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

        this.webview = null
        this.#panel = null
        this.visibilityEmitter.fire(false)
      }),
      panel.onDidChangeViewState(() => this.visibilityEmitter.fire(panel.visible)),
      webview.onDidReceiveMessage((message: WebviewMessage) => this.messageEmitter.fire(message)),
    )
    this.view.render(webview)
  }
}

export class Provider extends Runtime implements WebviewViewProvider {
  resolveWebviewView(view: WebviewView, context: WebviewViewResolveContext, token: CancellationToken): void {
    view.title = this.view.title
    this.#render(view)
  }

  #render(view: WebviewView): void {
    const webview = view.webview
    this.webview = webview
    const subscriptions: Disposable[] = []
    subscriptions.push(
      view.onDidDispose(() => {
        while (subscriptions.length) {
          const subscription = subscriptions.pop()
          if (subscription) {
            subscription.dispose()
          }
        }
        this.webview = null
      }),
      view.onDidChangeVisibility(async () => this.visibilityEmitter.fire(view.visible)),
      webview.onDidReceiveMessage((message: WebviewMessage) => this.messageEmitter.fire(message)),
    )
    this.view.render(webview)
  }
}

export abstract class View extends Component {
  readonly #title: string
  readonly #path: string

  readonly #resourceUri: Uri
  readonly #l10nUri: Uri

  #runtime: Runtime
  #visible: boolean

  constructor({
    context,
    logger,
    state,
    runtime,
    title,
    path,
  }: {
    context: ExtensionContext
    logger: LogOutputChannel
    state: State
    runtime: Runtime
    title: string
    path: string
  }) {
    super(context, logger, state)
    this.#runtime = runtime
    this.#title = title
    this.#path = path

    this.#resourceUri = Uri.joinPath(context.extensionUri, 'assets')
    this.#l10nUri = Uri.joinPath(context.extensionUri, 'l10n')
    this.#runtime = runtime

    const subscriptions = this.subscriptions
    subscriptions.push(
      runtime.onDidChangeVisibility((visible: boolean) => {
        if (this.#visible !== visible) {
          this.#visible = visible
        }
      }),
    )
    this.init(subscriptions, runtime)
  }

  get title(): string {
    return this.#title
  }

  get path(): string {
    return this.#path
  }

  get visible(): boolean {
    return this.#visible
  }

  get resourceUri(): Uri {
    return this.#resourceUri
  }

  get runtime(): Runtime {
    return this.#runtime
  }

  protected init(subscriptions: Disposable[], runtime: Runtime): void {}

  render(webview: Webview): void {
    // get config
    const theme =
      window.activeColorTheme.kind === ColorThemeKind.Dark ||
      window.activeColorTheme.kind === ColorThemeKind.HighContrast
        ? 'g100'
        : 'white'
    const config: Config = {
      theme,
      l10nUri: webview.asWebviewUri(this.#l10nUri).toString(true),
      language: env.language,
    }
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.#resourceUri, this.#l10nUri],
    }
    // write html
    webview.html = `<html theme="${theme}"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.#title}</title>
    <link rel="stylesheet" href="${webview.asWebviewUri(Uri.joinPath(this.#resourceUri, 'css', 'runtime.css')).toString(true)}" />
    <link rel="stylesheet" href="${webview.asWebviewUri(Uri.joinPath(this.#resourceUri, 'css', `${this.#path}.css`)).toString(true)}" />
    <script type ="module">
      import run from "${webview.asWebviewUri(Uri.joinPath(this.#resourceUri, 'js', 'runtime.js')).toString(true)}"
      import App from "${webview.asWebviewUri(Uri.joinPath(this.#resourceUri, 'js', `${this.#path}.js`)).toString(true)}"
      await run(${JSON.stringify(config)}, (config) => new App({
        target: document.body,
        ...config,
      }))
    </script>
  </head>
  <body>
  </body>
</html>
`
  }
}
