import { NAME } from '@/states/constants'
import { View } from '@/utils/view'
import { l10n } from 'vscode'

export default class extends View {
  get title(): string {
    return l10n.t(`${NAME} Settings`)
  }

  get page(): string {
    return 'Settings'
  }

  protected init(): void {}
}
