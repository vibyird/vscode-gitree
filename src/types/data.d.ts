export interface Config {
  readonly theme: string
  readonly language: string
  readonly l10nUri: string
}

export interface GitCommit {
  readonly hash: string
  readonly message: string
  readonly parents: string[]
  readonly authorDate?: string
  readonly authorName?: string
  readonly authorEmail?: string
  readonly commitDate?: string
  readonly shortStat?: {
    readonly files: number
    readonly insertions: number
    readonly deletions: number
  }
  readonly files?: {
    readonly path: string
    readonly status: string
  }[]
  readonly stash?: string
}

export interface GitRef {
  readonly name: string
  readonly hash: string
}

export interface GitRemote {
  readonly name: string
  readonly HEAD: string
  readonly branches: GitRef[]
}

export interface ConfigMessage {
  readonly type: 'config'
  readonly data: Config
}

export interface InitExtensionMessage {
  readonly type: 'init'
  readonly data: {
    readonly HEAD: string
    readonly branches: GitRef[]
    readonly tags: GitRef[]
    readonly remotes: GitRemote[]
    readonly commits: GitCommit[]
  }
}

export interface CommitMessage {
  readonly type: 'commit'
  readonly data: GitCommit
}

export interface RefreshMessage {
  readonly type: 'refresh'
}

export type ExtensionMessage = ConfigMessage | InitExtensionMessage | CommitMessage | RefreshMessage

export interface InitPageMessage {
  readonly type: 'init'
}

export interface GetCommitMessage {
  readonly type: 'get_commit'
  readonly params: { readonly hash: string }
}

export type PageMessage = InitPageMessage | GetCommitMessage | RefreshMessage

export interface GraphState {
  scrollTop?: number
  asideWidth?: string
  sectionWidth: {
    main: string
    aside: string
  }
  HEAD?: string
  branches?: GitRef[]
  tags?: GitRef[]
  remotes?: GitRemote[]
  commits?: GitCommit[]
  commit?: GitCommit
}

interface PageState {
  graph?: GraphState
}
