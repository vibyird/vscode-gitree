import { L10N } from '@/states/constants'
import type { Config, ExtensionMessage, WebviewMessage } from '@/types/data'
import * as l10n from '@vscode/l10n'
import 'carbon-components-svelte/css/all.css'
import type { SvelteComponent } from 'svelte'
import type { WebviewApi } from 'vscode-webview'

export class Runtime {
  readonly l10n = l10n
  readonly config: Config
  readonly #api: WebviewApi<unknown>

  constructor(config: Config) {
    this.#api = acquireVsCodeApi()
    this.config = config
  }

  onMessage(callback: (message: ExtensionMessage) => void): () => void {
    const listener = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data
      callback(message)
    }
    window.addEventListener('message', listener)
    return () => {
      window.removeEventListener('message', listener)
    }
  }

  sendMessage(message: WebviewMessage): void {
    this.#api.postMessage(message)
  }
}

async function render(config: Config, callback: () => SvelteComponent) {
  const { theme, l10nUri, language } = config
  const runtime = new Runtime(config)
  if (L10N.split(',').includes(language)) {
    await runtime.l10n.config({
      uri: `${l10nUri}/bundle.l10n.${language}.json`,
    })
  }
  if (theme === 'dark') {
    document.documentElement.setAttribute('theme', 'g100')
  }
  window.runtime = runtime
  callback()
}

export default render
