import { COMMAND_SETTINGS, COMMAND_VIEW, ID } from '@/states/constants'
import type { State } from '@/states/state'
import { Component } from '@/utils/utils'
import type { Runtime } from '@/utils/view'
import { Panel } from '@/utils/view'
import SettingsApp from '@/views/settings/app'
import type { Disposable, ExtensionContext, LogOutputChannel } from 'vscode'
import { commands, l10n, window, } from 'vscode'

class Controller extends Component {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state)
    this.#init(this.subscriptions, context, logger, state)
  }

  #init(subscriptions: Disposable[], context: ExtensionContext, logger: LogOutputChannel, state: State) {
    const settings = new Panel(
      (runtime: Runtime): SettingsApp => new SettingsApp(context, logger, state, runtime),
      context,
      logger,
      state,
    )
    subscriptions.push(
      settings,
      commands.registerCommand(COMMAND_VIEW, () => {
        if (state.git.repositories.length === 0) {
          window.showInformationMessage(l10n.t('There are no Git repositories in the current workspace.'))
          return
        }
        commands.executeCommand(`workbench.view.extension.${ID}`)
      }),
      commands.registerCommand(COMMAND_SETTINGS, () => settings.show()),
    )
  }
}

export default Controller
