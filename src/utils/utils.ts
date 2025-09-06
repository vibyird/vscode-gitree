import type { Disposable } from 'vscode'
import type { ChildProcess } from 'child_process'

export abstract class Component implements Disposable {
  private subscriptions: Disposable[] = []

  constructor(...subscriptions: Disposable[]) {
    this.subscriptions = subscriptions
  }

  public dispose() {
    for (const subscription of this.subscriptions) {
      subscription.dispose()
    }
  }
}

interface ProcessOutput {
  readonly code: number
  readonly error: Error | null
  readonly stdout: Buffer
  readonly stderr: Buffer
}

export async function handleProcess(process: ChildProcess): Promise<ProcessOutput> {
  const [{ code, error }, stdout, stderr] = await Promise.all([
    new Promise<{ code: number; error: Error | null }>((resolve) => {
      let resolved = false
      process.on('error', (error) => {
        if (resolved) return
        resolve({ code: -1, error })
        resolved = true
      })
      process.on('exit', (code) => {
        if (resolved) return
        resolve({ code, error: null })
        resolved = true
      })
    }),
    new Promise<Buffer>((resolve) => {
      const buffers: Buffer[] = []
      process.stdout.on('data', (buffer: Buffer) => buffers.push(buffer))
      process.stdout.on('close', () => resolve(Buffer.concat(buffers)))
    }),
    new Promise<Buffer>((resolve) => {
      const buffers: Buffer[] = []
      process.stderr.on('data', (buffer: Buffer) => buffers.push(buffer))
      process.stderr.on('close', () => resolve(Buffer.concat(buffers)))
    }),
  ])
  return { code, error, stdout, stderr }
}
