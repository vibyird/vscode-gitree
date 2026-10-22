import Pages from '@/pages/pages'
import {
  COMMAND_GRAPH_REFRESH,
  COMMAND_SETTINGS,
  COMMAND_VIEW,
  GRAPH_VIEW_ID,
  ID,
  SETTINGS_PANEL_ID,
} from '@/states/constants'
import States from '@/states/states'
import { Subscription } from '@/utils/util'
import type { Disposable } from 'vscode'
import { commands, l10n, window } from 'vscode'

export default class extends Subscription {
  readonly #pages: Pages

  constructor(states: States, views: Pages) {
    super()
    this.#pages = views
    this.#init(this.subscriptions, states)
  }

  #init(subscriptions: Disposable[], states: States): void {
    subscriptions.push(
      commands.registerCommand(COMMAND_VIEW, () => this.#showViewsContainer(states, ID)),
      commands.registerCommand(COMMAND_GRAPH_REFRESH, () => this.#refreshView(GRAPH_VIEW_ID)),
      commands.registerCommand(COMMAND_SETTINGS, () => this.#showPanel(SETTINGS_PANEL_ID)),
    )
  }

  #showViewsContainer(states: States, id: string): void {
    if (states.repositories.length === 0) {
      window.showInformationMessage(l10n.t('There are no Git repositories in the current workspace.'))
      return
    }
    commands.executeCommand(`workbench.view.extension.${id}`)
  }

  async #refreshView(id: string): Promise<void> {
    const view = this.#pages.getView(id)
    await view.refresh()
  }

  async #showPanel(id: string): Promise<void> {
    await this.#pages.showPanel(id)
  }
}
