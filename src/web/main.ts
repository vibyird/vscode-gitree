import { L10N } from '@/states/constants'
import type { Config } from '@/types/data'
import '@/web/main.scss'
import { Runtime } from '@/web/utils/page'
import * as l10n from '@vscode/l10n'
import type { SvelteComponent } from 'svelte'

type Main = (options: {
  props: {
    config: Config
    runtime: Runtime
  }
}) => SvelteComponent

export default async function (main: Main, config: Config): Promise<void> {
  const { l10nUri, language } = config
  if (L10N.split(',').includes(language)) {
    await l10n.config({
      uri: `${l10nUri}/bundle.l10n.${language}.json`,
    })
  }
  window.l10n = l10n
  main({
    props: {
      config,
      runtime: new Runtime(),
    },
  })
}
