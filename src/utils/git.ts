import { spawn } from 'child_process'
import { handleProcess } from './utils'
import { which } from './which'

export interface Git {
  readonly path: string
  readonly version: string
}

export async function findGit(path: string = ''): Promise<Git> {
  if (path.length === 0) {
    path = await which('git')
  }

  const output = await handleProcess(spawn(path, ['--version']))
  if (output.code === 0) {
    return {
      path,
      version: output.stdout.toString().trim().split(' ').pop(),
    }
  }
}
