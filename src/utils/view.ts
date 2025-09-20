import { ID, L10N } from '@/states/constants'
import type { State } from '@/states/state'
import type { ExtensionMessage, WebviewMessage } from '@/types/data'
import { Component } from '@/utils/utils'
import type { Disposable, ExtensionContext, LogOutputChannel, Webview, WebviewPanel } from 'vscode'
import { ColorThemeKind, env, EventEmitter, Uri, ViewColumn, window } from 'vscode'

export abstract class View extends Component {
  protected readonly title: string
  protected readonly path: string

  protected readonly resourceUri: Uri
  protected readonly l10nUri: Uri

  #messageEmitter: EventEmitter<WebviewMessage>
  #panel: WebviewPanel
  #visible: boolean

  constructor(
    context: ExtensionContext,
    logger: LogOutputChannel,
    state: State,
    {
      title,
      path,
    }: {
      title: string
      path: string
    },
  ) {
    super(context, logger, state)
    this.title = title
    this.path = path

    this.resourceUri = Uri.joinPath(context.extensionUri, 'assets')
    this.l10nUri = Uri.joinPath(context.extensionUri, 'l10n')

    this.#messageEmitter = new EventEmitter<WebviewMessage>()
  }

  get visible(): boolean {
    return this.#visible
  }

  #renderWebview(webview: Webview): void {
    // get config
    const theme = window.activeColorTheme.kind === ColorThemeKind.Dark || ColorThemeKind.HighContrast ? 'dark' : 'light'
    const l10nUrl = L10N.split(',').includes(env.language)
      ? webview.asWebviewUri(Uri.joinPath(this.l10nUri, `bundle.l10n.${env.language}.json`)).toString(true)
      : undefined
    // write html
    webview.html = `<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.title}</title>
    <link rel="stylesheet" href="${webview.asWebviewUri(Uri.joinPath(this.resourceUri, 'css', 'webview.css')).toString(true)}" />
    <link rel="stylesheet" href="${webview.asWebviewUri(Uri.joinPath(this.resourceUri, 'css', `${this.path}.css`)).toString(true)}" />
    <script type ="module">
      import Webview from "${webview.asWebviewUri(Uri.joinPath(this.resourceUri, 'js', 'webview.js')).toString(true)}"
      import App from "${webview.asWebviewUri(Uri.joinPath(this.resourceUri, 'js', `${this.path}.js`)).toString(true)}"
      const config = ${JSON.stringify({
        theme,
        l10nUrl,
      })}
      const webview = new Webview(config)
      window.webview = webview
      ;(async() => {
        if (config.l10nUrl) {
          await webview.l10n.config({
            uri: config.l10nUrl,
          })
        }
        if (config.theme === 'dark') {
          document.documentElement.setAttribute('theme', 'g100')
        }
        new App({
          target: document.body,
        })
      })()
    </script>
  </head>
  <body>
  </body>
</html>
`
  }

  #initPanel(panel: WebviewPanel): void {
    const subscriptions: Disposable[] = []
    subscriptions.push(
      panel.onDidDispose(() => {
        while (subscriptions.length) {
          const subscription = subscriptions.pop()
          if (subscription) {
            subscription.dispose()
          }
        }
        this.logger.info('onDidDispose')
        this.#panel = null
      }),
      panel.onDidChangeViewState(async () => {
        this.logger.info('state change')
        if (panel.visible !== this.#visible) {
          this.#visible = panel.visible
        }
      }),
      panel.webview.onDidReceiveMessage((message: WebviewMessage) => this.#messageEmitter.fire(message)),
    )
    this.#renderWebview(panel.webview)
  }

  onMessage(listener: (message: WebviewMessage) => void): Disposable {
    return this.#messageEmitter.event(listener)
  }

  sendMessage(message: ExtensionMessage): void {
    if (this.#panel) {
      this.#panel.webview.postMessage(message)
    }
  }

  show(): void {
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined
    let panel = this.#panel
    if (panel) {
      panel.reveal(column)
      this.#visible = true
      return
    }
    // create new panel
    panel = window.createWebviewPanel(`${ID}.${this.path}`, this.title, column || ViewColumn.One, {
      retainContextWhenHidden: false,
      enableScripts: true,
      localResourceRoots: [this.resourceUri, this.l10nUri],
    })
    panel.iconPath = {
      light: Uri.joinPath(this.resourceUri, 'icons', 'git-black.svg'),
      dark: Uri.joinPath(this.resourceUri, 'icons', 'git-white.svg'),
    }
    this.#initPanel(panel)
    this.#panel = panel
    this.#visible = true
  }
}
