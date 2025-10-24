import { GRAPH_VIEW_ID, ID, NAME, SETTINGS_PANEL_ID } from '@/states/constants'
import type { Config, GraphState } from '@/types/data'
import type { API, GitExtension, Repository } from '@/types/git'
import { GitAPI } from '@/utils/git'
import { PanelSerializer, Runtime, ViewProvider } from '@/utils/runtime'
import GraphView from '@/views/graph'
import SettingsView from '@/views/settings'
import type {
  ConfigurationChangeEvent,
  ConfigurationScope,
  Disposable,
  ExtensionContext,
  LogOutputChannel,
  Uri,
  Webview,
  WorkspaceConfiguration,
} from 'vscode'
import { ColorThemeKind, env, EventEmitter, extensions, window, workspace } from 'vscode'

export class State {
  protected readonly subscriptions: Disposable[] = []
  readonly #context: ExtensionContext
  readonly #logger: LogOutputChannel

  readonly #gitAPI: API
  readonly #panels: Record<string, PanelSerializer> = {}
  readonly #views: Record<string, ViewProvider> = {}

  readonly #configChangeEventEmitter: EventEmitter<ConfigurationChangeEvent>
  #config: WorkspaceConfiguration

  constructor(context: ExtensionContext) {
    this.#context = context
    const logger = window.createOutputChannel(NAME, { log: true })
    this.#logger = logger
    this.#gitAPI = extensions.getExtension<GitExtension>('vscode.git').exports.getAPI(1)
    this.#configChangeEventEmitter = new EventEmitter<ConfigurationChangeEvent>()
    this.#config = workspace.getConfiguration(ID)
    this.subscriptions.push(logger)
    this.#init(this.subscriptions)
  }

  get context(): ExtensionContext {
    return this.#context
  }

  get logger(): LogOutputChannel {
    return this.#logger
  }

  get theme(): string {
    return window.activeColorTheme.kind === ColorThemeKind.Dark ||
      window.activeColorTheme.kind === ColorThemeKind.HighContrast
      ? 'dark'
      : 'white'
  }

  get language(): string {
    return env.language
  }

  get repositories(): Repository[] {
    return this.#gitAPI.repositories
  }

  get git(): GitAPI {
    return new GitAPI(this.#gitAPI.git, this.#gitAPI.repositories[0])
  }

  get panels(): Record<string, PanelSerializer> {
    return this.#panels
  }

  get views(): Record<string, ViewProvider> {
    return this.#views
  }

  get<T>(section: string): T | undefined {
    return this.#config.get<T>(section)
  }

  getWebviewConfig(
    webview: Webview,
    {
      l10nUri,
    }: {
      l10nUri: Uri
    },
  ): Config {
    return {
      theme: this.theme,
      language: this.language,
      l10nUri: webview.asWebviewUri(l10nUri).toString(true),
    }
  }

  onDidChangeConfiguration(
    listener: (event: ConfigurationChangeEvent) => void,
    thisArgs?: any,
    disposables?: Disposable[],
  ): Disposable {
    return this.#configChangeEventEmitter.event(listener, thisArgs, disposables)
  }

  onDidOpenRepository(listener: (repo: Repository) => void, thisArgs?: any, disposables?: Disposable[]): Disposable {
    return this.#gitAPI.onDidOpenRepository(listener, thisArgs, disposables)
  }

  onDidCloseRepository(listener: (repo: Repository) => void, thisArgs?: any, disposables?: Disposable[]): Disposable {
    return this.#gitAPI.onDidCloseRepository(listener, thisArgs, disposables)
  }

  #init(subscriptions: Disposable[]): void {
    subscriptions.push(
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(ID)) {
          this.#config = workspace.getConfiguration(ID)
          this.#configChangeEventEmitter.fire({
            affectsConfiguration(section: string, scope?: ConfigurationScope): boolean {
              return event.affectsConfiguration(`${ID}.${section}`, scope)
            },
          })
        }
      }),
    )
    this.#initPanels(subscriptions)
    this.#initViews(subscriptions)
  }

  #initPanels(subscriptions: Disposable[]): void {
    const panels = this.#panels
    const settingsPanel = new PanelSerializer<GraphState>(
      (runtime: Runtime): SettingsView => new SettingsView(runtime),
      this,
    )
    subscriptions.push(settingsPanel)
    panels[SETTINGS_PANEL_ID] = settingsPanel
  }

  #initViews(subscriptions: Disposable[]): void {
    const views = this.#views
    const graphView = new ViewProvider((runtime: Runtime): GraphView => new GraphView(runtime), this)
    subscriptions.push(graphView)
    views[GRAPH_VIEW_ID] = graphView
  }

  dispose(): void {
    while (this.subscriptions.length) {
      const subscription = this.subscriptions.pop()
      if (subscription) {
        subscription.dispose()
      }
    }
  }
}
