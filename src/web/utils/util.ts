import type { Config, ExtensionMessage, GraphState, PageMessage, PageState } from '@/types/data'
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

class RuntimeState {
  readonly #api: WebviewApi<PageState>
  readonly #state: PageState

  constructor(api: WebviewApi<PageState>) {
    this.#api = api
    this.#state = api.getState() || {}
  }

  get graph(): GraphState {
    return this.#state.graph
  }

  set graph(state: GraphState) {
    this.#state.graph = state
    this.#api.setState(this.#state)
  }
}

class Runtime {
  readonly #api: WebviewApi<PageState>
  readonly #state: RuntimeState
  #config: Config

  constructor() {
    const api = acquireVsCodeApi<PageState>()
    this.#api = api
    this.#state = new RuntimeState(api)
  }

  init(config: Config) {
    if (!this.#config) {
      this.#config = config
    }
  }

  get config(): Config {
    return this.#config
  }

  get state(): RuntimeState {
    return this.#state
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

export const runtime = new Runtime()
