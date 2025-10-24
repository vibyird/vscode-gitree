import type { GitCommit, GitRef } from '@/types/data'
import type { Git, Repository } from '@/types/git'
import type { ExecException } from 'child_process'
import { exec } from 'child_process'

export class GitAPI {
  #git: Git
  #repo: Repository

  constructor(git: Git, repo: Repository) {
    this.#git = git
    this.#repo = repo
  }

  async showRef(): Promise<{
    HEAD: string
    branches: GitRef[]
    tags: GitRef[]
    remotes: {
      name: string
      HEAD: string
      branches: GitRef[]
    }[]
  }> {
    const output = await this.#exec('show-ref --head')
    let HEAD: string = ''
    const branches: GitRef[] = []
    const tags: GitRef[] = []
    const remotes: { name: string; HEAD: string; branches: GitRef[] }[] = []
    output
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => {
        const [hash, name] = line.split(' ')
        if (name === 'HEAD') {
          HEAD = hash
        } else if (name.startsWith('refs/heads/')) {
          branches.push({
            name: name.replace('refs/heads/', ''),
            hash,
          })
        } else if (name.startsWith('refs/tags/')) {
          tags.push({
            name: name.replace('refs/tags/', ''),
            hash,
          })
        } else if (name.startsWith('refs/remotes/')) {
          const [, remoteName, refName] = name.match(/^refs\/remotes\/([^/]+)\/(.+)$/)
          let remote = remotes.find((r) => r.name === remoteName)
          if (!remote) {
            remote = {
              name: remoteName,
              HEAD: '',
              branches: [],
            }
            remotes.push(remote)
          }
          if (refName === 'HEAD') {
            remote.HEAD = hash
          } else {
            remote.branches.push({
              name: refName,
              hash,
            })
          }
        }
      })
    return {
      HEAD,
      branches,
      tags,
      remotes,
    }
  }

  async showStashList(): Promise<GitRef[]> {
    const output = await this.#exec('stash list --format="%H %gd"')
    const refs = output
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [hash, name] = line.split(' ')
        return { name, hash }
      })
    return refs
  }

  async log({ stashes }: { stashes: GitRef[] }): Promise<GitCommit[]> {
    const output = await this.#exec(
      `log --all --date-order --pretty=format:%H%x1F%P%x1F%an%x1F%ae%x1F%ad%x1F%s%x1E ${stashes
        .map((stash) => stash.name)
        .join(' ')}`,
    )
    const commits: GitCommit[] = output
      .split('\x1E')
      .filter(Boolean)
      .map((line) => {
        const [hash, parents, authorName, authorEmail, commitDate, message] = line.trim().split('\x1F')
        return { hash, parents: parents.split(' '), authorName, authorEmail, commitDate, message }
      })
    const stashWIPComits: GitCommit[] = []
    commits.forEach((commit: GitCommit, index: number) =>
      stashes.forEach((stash: GitRef) => {
        if (stash.hash === commit.hash) {
          stashWIPComits.push(commit)
          commits[index] = {
            ...commit,
            stash: stash.name,
          }
        }
      }),
    )
    return commits.filter(
      (commit: GitCommit) =>
        !stashWIPComits.some((stashWIPComit: GitCommit) => {
          if (stashWIPComit.parents.length > 1) {
            if (commit.hash === stashWIPComit.parents[1]) {
              return true
            }
          }

          if (stashWIPComit.parents.length > 2) {
            if (commit.hash === stashWIPComit.parents[2]) {
              return true
            }
          }
          return false
        }),
    )
  }

  async show(ref: string): Promise<GitCommit> {
    const output = await this.#exec(
      `show --pretty=format:%H%x1F%P%x1F%an%x1F%ae%x1F%ad%x1F%s%x1E --name-status  ${ref}`,
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
