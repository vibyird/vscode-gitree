import { EventEmitter } from 'vscode'
import type { ConfigurationChangeEvent } from 'vscode'

export const configEventEmitter = new EventEmitter<ConfigurationChangeEvent>()
