import type { Config, ExtensionMessage, PageMessage } from '@/types/data'
import { States, Subscription } from '@/utils/util'
import type {
  Disposable,
  Webview,
  WebviewPanel,
  WebviewPanelSerializer,
  WebviewView,
  WebviewViewProvider,
} from 'vscode'
import { ColorThemeKind, env, EventEmitter, Uri, ViewColumn, window, workspace } from 'vscode'

export abstract class Page<T extends States> extends Subscription {
  #runtime: Runtime<T>
  #visible: boolean

  constructor(runtime: Runtime<T>) {
    super()
    this.#runtime = runtime
    this.#visible = false
    this.#init(this.subscriptions, runtime)
  }

  #init(subscriptions: Disposable[], runtime: Runtime<T>): void {
    subscriptions.push(
      runtime.onDidChangeVisibility((visible: boolean) => {
        if (this.#visible !== visible) {
          this.#visible = visible
        }
      }),
    )
    this.init(subscriptions, runtime)
  }

  abstract get name(): string

  abstract get title(): string

  get visible(): boolean {
    return this.#visible
  }

  get runtime(): Runtime<T> {
    return this.#runtime
  }

  get states(): T {
    return this.#runtime.states
  }

  protected abstract init(subscriptions: Disposable[], runtime: Runtime<T>): void

  async refresh(): Promise<void> {
    return
  }

  getWebviewContent(baseUrl: string, config: Config): string {
    const { locale: lang, theme } = config
    const { title, name } = this
    return `<!doctype html>
<html lang="${lang}" theme="${theme}"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="${baseUrl}/${name}/index.css" />
    <script>window.config = ${JSON.stringify(config)};</script>
    <script type="module" src="${baseUrl}/${name}/index.js"></script>
  </head>
  <body>
  </body>
</html>
`
  }
}

export abstract class Runtime<T extends States> extends Subscription {
  readonly #states: T

  constructor(states: T) {
    super()
    this.#states = states
  }

  get states(): T {
    return this.#states
  }

  abstract onDidChangeVisibility(listener: (visible: boolean) => void): Disposable

  abstract onMessage(listener: (message: PageMessage) => void): Disposable

  abstract sendMessage(message: ExtensionMessage): void

  abstract refresh(): Promise<void>

  protected async renderWebview(webview: Webview, page: Page<States>): Promise<void> {
    const resourceRoot = Uri.joinPath(this.states.context.extensionUri, 'assets')

    // detect whether the dark theme is enabled
    const isDark =
      window.activeColorTheme.kind === ColorThemeKind.Dark ||
      window.activeColorTheme.kind === ColorThemeKind.HighContrast

    // check if the l10n file exists
    const filenames = await workspace.fs.readDirectory(Uri.joinPath(resourceRoot, 'l10n'))
    const l10nFileExists = filenames.some(([filename]) => filename === `bundle.l10n.${env.language}.json`)

    // render webview
    webview.options = {
      enableScripts: true,
      localResourceRoots: [resourceRoot],
    }
    webview.html = page.getWebviewContent(webview.asWebviewUri(Uri.joinPath(resourceRoot, 'pages')).toString(true), {
      theme: isDark ? 'dark' : 'white',
      locale: l10nFileExists ? env.language : 'en-us',
      l10nUri: l10nFileExists
        ? webview.asWebviewUri(Uri.joinPath(resourceRoot, 'l10n', `bundle.l10n.${env.language}.json`)).toString(true)
        : undefined,
    })
  }
}

export class Panel<T extends States, U = unknown> extends Runtime<T> implements WebviewPanelSerializer<U> {
  readonly #visibilityEmitter: EventEmitter<boolean> = new EventEmitter<boolean>()
  readonly #messageEmitter: EventEmitter<PageMessage> = new EventEmitter<PageMessage>()
  readonly #page: Page<T>
  #panel: WebviewPanel | null = null

  constructor(creator: (runtime: Runtime<T>) => Page<T>, states: T) {
    super(states)
    const page = creator(this)
    this.#page = page
    this.subscriptions.push(page)
  }

  async deserializeWebviewPanel(panel: WebviewPanel): Promise<void> {
    await this.#renderPanel(panel)
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

  async refresh(): Promise<void> {
    if (this.#panel) {
      await this.#page.refresh()
    }
  }

  async show({
    column,
    creator,
  }: {
    column?: ViewColumn
    creator: (title: string, column: ViewColumn) => WebviewPanel
  }): Promise<void> {
    if (this.#panel) {
      this.#panel.reveal(column)
      return
    }
    const panel = creator(this.#page.title, column ?? ViewColumn.One)
    await this.#renderPanel(panel)
  }

  async #renderPanel(panel: WebviewPanel): Promise<void> {
    const resourceRoot = Uri.joinPath(this.states.context.extensionUri, 'assets', 'icons')
    panel.iconPath = {
      light: Uri.joinPath(resourceRoot, 'git-black.svg'),
      dark: Uri.joinPath(resourceRoot, 'git-white.svg'),
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
        this.#panel = null
        this.#visibilityEmitter.fire(false)
      }),
      panel.onDidChangeViewState(() => this.#visibilityEmitter.fire(panel.visible)),
      webview.onDidReceiveMessage((message: PageMessage) => this.#messageEmitter.fire(message)),
    )
    await this.renderWebview(webview, this.#page)
  }

  dispose(): void {
    super.dispose()
    if (this.#panel) {
      this.#panel.dispose()
      this.#panel = null
    }
  }
}

export class View<T extends States> extends Runtime<T> implements WebviewViewProvider {
  readonly #visibilityEmitter: EventEmitter<boolean> = new EventEmitter<boolean>()
  readonly #messageEmitter: EventEmitter<PageMessage> = new EventEmitter<PageMessage>()
  readonly #page: Page<T>
  #view: WebviewView | null = null

  constructor(creator: (runtime: Runtime<T>) => Page<T>, states: T) {
    super(states)
    const page = creator(this)
    this.#page = page
    this.subscriptions.push(page)
  }

  async resolveWebviewView(view: WebviewView): Promise<void> {
    await this.#renderView(view)
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

  async refresh(): Promise<void> {
    if (this.#view) {
      await this.#page.refresh()
    }
  }

  async #renderView(view: WebviewView): Promise<void> {
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
        this.#view = null
      }),
      view.onDidChangeVisibility(async () => this.#visibilityEmitter.fire(view.visible)),
      webview.onDidReceiveMessage((message: PageMessage) => this.#messageEmitter.fire(message)),
    )
    await this.renderWebview(webview, this.#page)
  }
}
