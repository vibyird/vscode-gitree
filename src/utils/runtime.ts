import { L10N } from '@/states/constants'
import type { Config } from '@/types/data'
import * as l10n from '@vscode/l10n'
import 'carbon-components-svelte/css/all.css'
import type { SvelteComponent } from 'svelte'

async function run(config: Config, main: (config: {}) => SvelteComponent) {
  const { l10nUri, language } = config
  if (L10N.split(',').includes(language)) {
    await l10n.config({
      uri: `${l10nUri}/bundle.l10n.${language}.json`,
    })
  }
  window.l10n = l10n
  main({})
}
export default run
