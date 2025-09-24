import type { Commit } from '@/types/git'

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

export interface RefreshMessage {
  type: 'refresh'
}

export type ExtensionMessage = ConfigMessage | CommitsMessage | RefreshMessage

export interface InitMessage {
  type: 'init'
}

export type WebviewMessage = InitMessage | RefreshMessage

interface CommitRow {
  id: string
  message: string
  authorDate: Date
}

export interface PanelState {
  scrollY: number
  commitRows: CommitRow[]
}
