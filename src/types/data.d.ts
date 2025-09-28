export interface Config {
  theme: string
  l10nUri: string
  language: string
}

export interface ConfigMessage {
  type: 'config'
  data: Config
}

export interface CommitsMessage {
  type: 'commits'
  data: Commit[]
}

export interface CommitMessage {
  type: 'commit'
  data: Commit
}

export interface RefreshMessage {
  type: 'refresh'
}

export type ExtensionMessage = ConfigMessage | CommitsMessage | CommitMessage | RefreshMessage

export interface InitMessage {
  type: 'init'
}

export interface GetCommitMessage {
  type: 'get_commit'
  params: { hash: string }
}

export type PageMessage = InitMessage | GetCommitMessage | RefreshMessage

export interface PanelState {
  percent?: {
    aside: number
  }
  scrollTop?: {
    main: number
    aside: number
  }
  commits?: Commit[]
  commit?: Commit
}

export interface CommitShortStat {
  readonly files: number
  readonly insertions: number
  readonly deletions: number
}

export interface Commit {
  readonly hash: string
  readonly message: string
  readonly parents: string[]
  readonly authorDate?: string
  readonly authorName?: string
  readonly authorEmail?: string
  readonly commitDate?: string
  readonly shortStat?: CommitShortStat
  readonly files?: {
    path: string
    status: string
  }[]
}
