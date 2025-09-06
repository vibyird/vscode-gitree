import { commands, window } from 'vscode'
import type { ExtensionContext } from 'vscode'
import { GraphView } from '../views/graph'
import { Component } from '../utils/utils'

export class CommandSubscription extends Component {
  public static graphView: GraphView | undefined

  constructor(context: ExtensionContext) {
    super(commands.registerCommand('gitree.view', () => this.viewGitree(context)))
  }

  private viewGitree(context: ExtensionContext) {
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined
    if (CommandSubscription.graphView) {
      // If Git Graph panel already exists
      if (CommandSubscription.graphView.visible) {
        // If the Git Graph panel is visible
        // if (loadViewTo !== null) {
        //   CommandSubscription.graphView.respondLoadRepos(repoManager.getRepos(), loadViewTo)
        // }
      } else {
        // If the Git Graph panel is not visible
        // CommandSubscription.graphView.loadViewTo = loadViewTo
      }
      CommandSubscription.graphView.panel.reveal(column)
    } else {
      // If Git Graph panel doesn't already exist
      CommandSubscription.graphView = new GraphView(context, column)
    }
  }
}
