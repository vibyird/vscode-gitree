import { L10N } from '@/states/constants'
import type { Config, ExtensionMessage, WebviewMessage } from '@/types/data'
import * as l10n from '@vscode/l10n'
import 'carbon-components-svelte/css/all.css'
import type { SvelteComponent } from 'svelte'
import type { WebviewApi } from 'vscode-webview'

class RuntimeImp {
  readonly #config: Config
  readonly #api: WebviewApi<unknown>

  constructor(config: Config) {
    this.#api = acquireVsCodeApi()
    this.#config = config
  }

  get config(): Config {
    return this.#config
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

async function run(config: Config, main: (config: {}) => SvelteComponent) {
  const { l10nUri, language } = config
  if (L10N.split(',').includes(language)) {
    await l10n.config({
      uri: `${l10nUri}/bundle.l10n.${language}.json`,
    })
  }
  window.l10n = l10n
  window.runtime = new RuntimeImp(config)
  main({})
}

export type Runtime = RuntimeImp

export default run
