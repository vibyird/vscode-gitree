import type { ExtensionMessage, PageMessage } from '@/types/data'
import type { WebviewApi } from 'vscode-webview'

export function formatDate(date: string, locale: string): string {
  return Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date))
}

export class Runtime<T> {
  readonly #api: WebviewApi<T>

  constructor() {
    const api = acquireVsCodeApi<T>()
    this.#api = api
  }

  getState(): T | undefined {
    return this.#api.getState()
  }

  setState(state: T): T {
    return this.#api.setState(state)
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

  sendMessage(message: PageMessage): void {
    this.#api.postMessage(message)
  }
}
