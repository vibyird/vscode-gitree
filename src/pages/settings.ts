import { NAME } from '@/states/constants'
import type States from '@/states/states'
import { Page } from '@/utils/page'
import { l10n } from 'vscode'

export default class extends Page<States> {
  get name(): string {
    return 'settings'
  }

  get title(): string {
    return l10n.t(`${NAME} Settings`)
  }

  protected init(): void {}
}
