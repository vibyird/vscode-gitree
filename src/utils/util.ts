import type State from '@/states/state'
import type { Config, ExtensionMessage, PageMessage } from '@/types/data'
import type { Disposable, Webview } from 'vscode'
import { ColorThemeKind, env, Uri, window } from 'vscode'

export abstract class Subscription implements Disposable {
  protected readonly subscriptions: Disposable[] = []

  dispose(): void {
    while (this.subscriptions.length) {
      const subscription = this.subscriptions.pop()
      if (subscription) {
        subscription.dispose()
      }
    }
  }
}

export abstract class Component extends Subscription {
  readonly #state: State

  constructor(state: State) {
    super()
    this.#state = state
  }

  get state(): State {
    return this.#state
  }
}

export abstract class Page extends Component {
  #runtime: Runtime
  #visible: boolean

  constructor(runtime: Runtime) {
    super(runtime.state)
    this.#runtime = runtime
    this.#init(this.subscriptions, runtime)
  }

  #init(subscriptions: Disposable[], runtime: Runtime): void {
    subscriptions.push(
      runtime.onDidChangeVisibility((visible: boolean) => {
        if (this.#visible !== visible) {
          this.#visible = visible
        }
      }),
    )
    this.init(subscriptions, runtime)
  }

  abstract get title(): string

  abstract get path(): string

  get visible(): boolean {
    return this.#visible
  }

  get runtime(): Runtime {
    return this.#runtime
  }

  protected abstract init(subscriptions: Disposable[], runtime: Runtime): void
}

export abstract class Runtime extends Component {
  protected readonly resourceUri: Uri
  protected readonly l10nUri: Uri

  constructor(state: State) {
    super(state)
    const extensionUri = state.context.extensionUri
    this.resourceUri = Uri.joinPath(extensionUri, 'assets')
    this.l10nUri = Uri.joinPath(extensionUri, 'l10n')
  }

  abstract onDidChangeVisibility(listener: (visible: boolean) => void): Disposable

  abstract onMessage(listener: (message: PageMessage) => void): Disposable

  abstract sendMessage(message: ExtensionMessage): void

  protected renderWebview(webview: Webview, { title, path }: { title: string; path: string }): void {
    const theme =
      window.activeColorTheme.kind === ColorThemeKind.Dark ||
      window.activeColorTheme.kind === ColorThemeKind.HighContrast
        ? 'dark'
        : 'white'
    const language = env.language
    const resourceUri = this.resourceUri
    const l10nUri = this.l10nUri

    const config: Config = {
      theme,
      language,
      l10nUri: webview.asWebviewUri(l10nUri).toString(true),
    }

    webview.options = {
      enableScripts: true,
      localResourceRoots: [resourceUri, l10nUri],
    }
    webview.html = `<html theme="${theme}"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="${webview.asWebviewUri(Uri.joinPath(resourceUri, 'css', `${path}.css`)).toString(true)}" />
    <script type ="module">
      import run from "${webview.asWebviewUri(Uri.joinPath(resourceUri, 'js', 'main.js')).toString(true)}"
      import Page from "${webview.asWebviewUri(Uri.joinPath(resourceUri, 'js', `${path}.js`)).toString(true)}"
      await run((options) => new Page({
        target: document.body,
        ...options,
      }), ${JSON.stringify(config)})
    </script>
  </head>
  <body>
  </body>
</html>
`
  }
}
