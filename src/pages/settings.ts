import { NAME } from '@/states/constants'
import { Page } from '@/utils/util'
import { l10n } from 'vscode'

export default class extends Page {
  get title(): string {
    return l10n.t(`${NAME} Settings`)
  }

  get path(): string {
    return 'Settings'
  }

  protected init(): void {}
}
