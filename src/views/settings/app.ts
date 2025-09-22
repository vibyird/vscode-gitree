import { NAME } from '@/states/constants'
import type { State } from '@/states/state'
import type { Runtime } from '@/utils/view'
import { View } from '@/utils/view'
import type { ExtensionContext, LogOutputChannel } from 'vscode'
import { l10n } from 'vscode'

class App extends View {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State, runtime: Runtime) {
    super({
      context,
      logger,
      state,
      runtime,
      title: l10n.t(`${NAME} Settings`),
      path: 'settings',
    })
  }

  protected init(): void {}
}

export default App
