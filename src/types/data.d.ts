export interface Config {
  readonly theme: string
  readonly locale: string
  readonly l10nUri?: string
}

export interface GitFile {
  readonly path: string
  readonly status: string
}

export interface GitCommit {
  readonly hash: string
  readonly message: string
  readonly parents: string[]
  readonly authorDate?: string
  readonly authorName?: string
  readonly authorEmail?: string
  readonly commitDate: string
  readonly shortStat?: {
    readonly files: number
    readonly insertions: number
    readonly deletions: number
  }
  readonly files?: GitFile[]
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

interface GitTreeRef {
  index: number
  inited: boolean
  continued: boolean
  branched: boolean
  merged: boolean
  stash: boolean
}

interface GitTree {
  refs: GitTreeRef[]
  index: number
}

interface GitCommitsItem {
  index: number
  commit: GitCommit
  branches: GitRef[]
  remotes: GitRemote[]
  tags: GitRef[]
  tree: GitTree
}

interface GitCommits {
  head: number
  body: GitCommitsItem[]
  tail: number
}
export interface ConfigMessage {
  readonly type: 'config'
  readonly data: Config
}

export interface InitedMessage {
  readonly type: 'inited'
  readonly data: {
    repository: string
    branches: GitRef[]
    remotes: GitRemote[]
    tags: GitRef[]
    commits: GitCommits
  }
}

export interface CommitsMessage {
  readonly type: 'commits'
  readonly data: {
    sequenceId: number
    repository: string
    branches: GitRef[]
    remotes: GitRemote[]
    tags: GitRef[]
    commits: GitCommits
  }
}

export interface ChangeRepository {
  readonly type: 'change-repository'
  readonly data: {
    repository: string
  }
}

export interface CommitMessage {
  readonly type: 'commit'
  readonly data: {
    commit: GitCommit
  }
}

export interface RefreshMessage {
  readonly type: 'refresh'
}

export type ExtensionMessage =
  ConfigMessage | InitedMessage | CommitsMessage | CommitMessage | RefreshMessage | ChangeRepository

export interface InitPageMessage {
  readonly type: 'init'
}

export interface GetCommitListMessage {
  readonly type: 'get_commits'
  readonly params: {
    readonly sequenceId: number
    readonly start: number
    readonly end: number
  }
}

export interface GetCommitMessage {
  readonly type: 'get_commit'
  readonly params: {
    readonly hash: string
  }
}

export type PageMessage = InitPageMessage | GetCommitListMessage | GetCommitMessage | RefreshMessage
