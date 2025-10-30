import { ID } from '@/states/constants'
import type { API, GitExtension, Repository } from '@/types/git'
import { GitAPI } from '@/utils/git'
import { Subscription } from '@/utils/util'
import type {
  ConfigurationChangeEvent,
  ConfigurationScope,
  Disposable,
  ExtensionContext,
  LogOutputChannel,
  WorkspaceConfiguration,
} from 'vscode'
import { EventEmitter, extensions, workspace } from 'vscode'

export default class extends Subscription {
  readonly #context: ExtensionContext
  readonly #logger: LogOutputChannel

  readonly #gitAPI: API
  readonly #configChangeEventEmitter: EventEmitter<ConfigurationChangeEvent>
  #config: WorkspaceConfiguration

  constructor(context: ExtensionContext, logger: LogOutputChannel) {
    super()
    this.#context = context
    this.#logger = logger
    this.#gitAPI = extensions.getExtension<GitExtension>('vscode.git').exports.getAPI(1)
    this.#configChangeEventEmitter = new EventEmitter<ConfigurationChangeEvent>()
    this.#config = workspace.getConfiguration(ID)
    this.#init(this.subscriptions)
  }

  get context(): ExtensionContext {
    return this.#context
  }

  get logger(): LogOutputChannel {
    return this.#logger
  }

  get repositories(): Repository[] {
    return this.#gitAPI.repositories
  }

  get git(): GitAPI {
    return new GitAPI(this.#gitAPI.git, this.#gitAPI.repositories[0])
  }

  get<T>(section: string): T | undefined {
    return this.#config.get<T>(section)
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
  }
}
