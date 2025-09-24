import type { ExtensionMessage, WebviewMessage } from '@/types/data'
import type { WebviewApi } from 'vscode-webview'

class Runtime<StateType = unknown> {
  readonly #api: WebviewApi<StateType>

  constructor() {
    this.#api = acquireVsCodeApi<StateType>()
  }

  getState(): StateType | undefined {
    return this.#api.getState()
  }

  setState<T extends StateType | undefined>(newState: T): T {
    return this.#api.setState(newState)
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

export function acquireRuntime<StateType>(): Runtime<StateType> {
  return new Runtime<StateType>()
}
