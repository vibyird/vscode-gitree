import type { Runtime } from '@/utils/runtime'
import { Component } from '@/utils/utils'
import type { Disposable, Webview } from 'vscode'
import { Uri } from 'vscode'

export abstract class View extends Component {
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

  abstract get page(): string

  get visible(): boolean {
    return this.#visible
  }

  get runtime(): Runtime {
    return this.#runtime
  }

  protected abstract init(subscriptions: Disposable[], runtime: Runtime): void

  render(webview: Webview): void {
    const resourceUri = this.runtime.resourceUri
    const l10nUri = this.runtime.l10nUri
    webview.options = {
      enableScripts: true,
      localResourceRoots: [resourceUri, l10nUri],
    }
    webview.html = `<html theme="${this.state.theme}"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.title}</title>
    <link rel="stylesheet" href="${webview.asWebviewUri(Uri.joinPath(resourceUri, 'css', 'main.css')).toString(true)}" />
    <link rel="stylesheet" href="${webview.asWebviewUri(Uri.joinPath(resourceUri, 'css', `${this.page}.css`)).toString(true)}" />
    <script type ="module">
      import run from "${webview.asWebviewUri(Uri.joinPath(resourceUri, 'js', 'main.js')).toString(true)}"
      import Page from "${webview.asWebviewUri(Uri.joinPath(resourceUri, 'js', `${this.page}.js`)).toString(true)}"
      await run((options) => new Page({
        target: document.body,
        ...options,
      }), ${JSON.stringify(this.state.getWebviewConfig(webview, { l10nUri }))})
    </script>
  </head>
  <body>
  </body>
</html>
`
  }
}
