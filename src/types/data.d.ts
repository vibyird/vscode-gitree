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

export type ExtensionMessage = ConfigMessage | CommitsMessage

export interface InitMessage {
  type: 'init'
}

export type WebviewMessage = InitMessage
