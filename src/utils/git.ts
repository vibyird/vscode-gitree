import type { Commit } from '@/types/data'
import type { Git, LogOptions, Repository } from '@/types/git'
import type { ExecException } from 'child_process'
import { exec } from 'child_process'

export class GitAPI {
  #git: Git
  #repo: Repository

  constructor(git: Git, repo: Repository) {
    this.#git = git
    this.#repo = repo
  }

  async log(options?: LogOptions): Promise<Commit[]> {
    const commits = await this.#repo.log(options)
    return commits.map((commit) => {
      return {
        ...commit,
        authorDate: commit.authorDate.toISOString(),
        commitDate: commit.commitDate.toISOString(),
      }
    })
  }

  async show(ref: string): Promise<Commit> {
    const output = await this.#exec(
      `show --pretty=format:'%H%x1F%P%x1F%an%x1F%ae%x1F%ad%x1F%s%x1E' --name-status  ${ref}`,
    )
    const [commitGroup, fileGroup] = output.split('\x1E')
    const [hash, parents, authorName, authorEmail, commitDate, message] = commitGroup.split('\x1F')
    const files = fileGroup
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [status, path] = line.split('\t')
        return { path, status }
      })
    return {
      hash,
      parents: parents.split(' '),
      authorName,
      authorEmail,
      commitDate,
      message,
      files,
    }
  }

  #exec(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      exec(
        `${this.#git.path} ${command}`,
        {
          cwd: this.#repo.rootUri.fsPath,
          encoding: 'utf-8',
        },
        (error: ExecException | null, stdout: string, stderr: string): void => {
          if (error) {
            reject(error)
            return
          }
          resolve(stdout)
        },
      )
    })
  }
}
