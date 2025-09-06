import { window, StatusBarAlignment } from 'vscode'
import type { ExtensionContext, StatusBarItem } from 'vscode'
import { Component } from '../utils/utils'
import { GitState } from '../states/git'
import { Config } from '../states/config'
import { configEventEmitter } from '../states/event'

export class StatusBarItemSubscription extends Component {
  private readonly gitState: GitState
  private readonly statusBarItem: StatusBarItem
  private readonly config: Config

  constructor(context: ExtensionContext) {
    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
    statusBarItem.text = 'Git Graph'
    statusBarItem.tooltip = 'View Git Graph'
    statusBarItem.command = 'gitree.view-graph'
    super(
      configEventEmitter.event((event) => {
        if (event.affectsConfiguration('gitree.showStatusBarItem')) {
          this.render()
        }
      }),
      statusBarItem,
    )
    this.gitState = new GitState(context)
    this.statusBarItem = statusBarItem
    this.config = new Config()
    this.render()
  }

  private render() {
    if (Object.keys(this.gitState.getRepos()).length > 0 && this.config.showStatusBarItem) {
      this.statusBarItem.show()
    } else {
      this.statusBarItem.hide()
    }
  }
}
