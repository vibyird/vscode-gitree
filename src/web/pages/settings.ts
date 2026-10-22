import * as l10n from '@vscode/l10n'
import { mount } from 'svelte'
import Page from './Settings.svelte'

const { l10nUri } = config
if (l10nUri) {
  await l10n.config({ uri: l10nUri })
}

const page = mount(Page, {
  target: document.body,
})

export default page
