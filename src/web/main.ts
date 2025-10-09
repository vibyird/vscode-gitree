import { L10N } from '@/states/constants'
import type { Config } from '@/types/data'
import * as l10n from '@vscode/l10n'
import { Runtime } from '@web/utils/runtime'
import type { SvelteComponent } from 'svelte'

type Main = (options: {
  props: {
    config: Config
    runtime: Runtime
  }
}) => SvelteComponent

export default async function (main: Main, config: Config): Promise<void> {
  const { language, l10nUri } = config
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
