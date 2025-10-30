import Pages from '@/pages/pages'
import {
  COMMAND_GRAPH_REFRESH,
  COMMAND_SETTINGS,
  COMMAND_VIEW,
  GRAPH_VIEW_ID,
  ID,
  SETTINGS_PANEL_ID,
} from '@/states/constants'
import State from '@/states/state'
import { Component } from '@/utils/util'
import type { Disposable } from 'vscode'
import { commands, l10n, window } from 'vscode'

export default class extends Component {
  readonly #pages: Pages

  constructor(state: State, views: Pages) {
    super(state)
    this.#pages = views
    this.#init(this.subscriptions)
  }

  #init(subscriptions: Disposable[]): void {
    subscriptions.push(
      commands.registerCommand(COMMAND_VIEW, () => this.#showViewsContainer(ID)),
      commands.registerCommand(COMMAND_GRAPH_REFRESH, () => this.#refreshView(GRAPH_VIEW_ID)),
      commands.registerCommand(COMMAND_SETTINGS, () => this.#showPanel(SETTINGS_PANEL_ID)),
    )
  }

  #showViewsContainer(id: string): void {
    const state = this.state
    if (state.repositories.length === 0) {
      window.showInformationMessage(l10n.t('There are no Git repositories in the current workspace.'))
      return
    }
    commands.executeCommand(`workbench.view.extension.${id}`)
  }

  #refreshView(id: string): void {
    const view = this.#pages.getView(id)
    view.sendMessage({
      type: 'refresh',
    })
  }

  #showPanel(id: string): void {
    this.#pages.showPanel(id)
  }
}
