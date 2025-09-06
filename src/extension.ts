import type { ExtensionContext } from 'vscode'
import { StatusBarItemSubscription } from './subscriptions/status_bar_item'
import { WorkspaceSubscription } from './subscriptions/workspace'
import { CommandSubscription } from './subscriptions/command'

export async function activate(context: ExtensionContext) {
  const workspaceSubscription = new WorkspaceSubscription(context)
  const commandSubscription = new CommandSubscription(context)
  const statusBarItemSubscription = new StatusBarItemSubscription(context)

  context.subscriptions.push(workspaceSubscription, commandSubscription, statusBarItemSubscription)
}

export function deactivate(): void {}
