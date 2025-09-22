import { VIEW_PANEL } from '@/states/constants'
import type { State } from '@/states/state'
import { Component } from '@/utils/utils'
import type { Runtime } from '@/utils/view'
import { Provider } from '@/utils/view'
import PanelApp from '@/views/panel/app'
import type { ExtensionContext, LogOutputChannel } from 'vscode'
import { window } from 'vscode'

class Controller extends Component {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state)
    this.#init(context, logger, state)
  }

  #init(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    const panel = new Provider(
      (runtime: Runtime): PanelApp => new PanelApp(context, logger, state, runtime),
      context,
      logger,
      state,
    )
    this.subscriptions.push(panel, window.registerWebviewViewProvider(VIEW_PANEL, panel))
  }
}

export default Controller
