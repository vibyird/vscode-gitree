import type { Config, ExtensionMessage, GraphState, PageMessage, State } from '@/types/data'
import type { WebviewApi } from 'vscode-webview'

class RuntimeState {
  readonly #api: WebviewApi<State>
  readonly #state: State

  constructor(api: WebviewApi<State>) {
    this.#api = api
    this.#state = api.getState() || {}
  }

  get graph(): GraphState | undefined {
    return this.#state.graph
  }

  set graph(state: GraphState) {
    this.#state.graph = state
    this.#api.setState(this.#state)
  }
}

class Runtime {
  readonly #api: WebviewApi<State>
  readonly #state: RuntimeState
  #config: Config

  constructor() {
    const api = acquireVsCodeApi<State>()
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

export default new Runtime()
