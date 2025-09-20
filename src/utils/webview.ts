import type { Config, ExtensionMessage, WebviewMessage } from '@/types/data'
import * as l10n from '@vscode/l10n'
import 'carbon-components-svelte/css/all.css'
import type { WebviewApi } from 'vscode-webview'

export default class Webview {
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
