import path from 'path'
import { Uri, ViewColumn, window } from 'vscode'
import type { ExtensionContext, WebviewPanel } from 'vscode'
import { Component } from '../utils/utils'

export class GraphView extends Component {
  public readonly panel: WebviewPanel
  public visible: boolean = true

  constructor(context: ExtensionContext, column: ViewColumn | undefined) {
    const panel = window.createWebviewPanel('git-graph', 'Git Graph', column || ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [Uri.file(path.join(context.extensionPath, 'media'))],
      // retainContextWhenHidden: config.retainContextWhenHidden,
    })
    super(
      panel.onDidDispose(() => this.dispose()),
      // Register a callback that is called when the view is shown or hidden
      panel.onDidChangeViewState(() => {
        if (panel.visible !== this.visible) {
          if (panel.visible) {
            this.render()
          } else {
            // this.currentRepo = null
            // this.repoFileWatcher.stop()
          }
          this.visible = panel.visible
        }
      }),
      {
        dispose: () => {
          // GitGraphView.currentPanel = undefined
          // this.repoFileWatcher.stop()
        },
      },
    )
    this.panel = panel
    this.render()
  }

  private render() {
    this.panel.webview.html = `<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gitree</title>
    <link rel="stylesheet" href="./assets/graph.css" />
  </head>
  <body>
    <script src="./assets/graph.js"></script>
  </body>
</html>
`
  }
}
