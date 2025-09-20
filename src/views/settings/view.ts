import { NAME } from '@/states/constants'
import type { State } from '@/states/state'
import { View } from '@/utils/view'
import type { ExtensionContext, LogOutputChannel } from 'vscode'
import { l10n } from 'vscode'

export class SettingsView extends View {
  constructor(context: ExtensionContext, logger: LogOutputChannel, state: State) {
    super(context, logger, state, {
      title: l10n.t(`${NAME} Settings`),
      path: 'settings',
    })
  }
}
