import type States from '@/states/states'
import type { GitCommit, GitCommits, GitCommitsItem, GitRef, GitRemote, GitTree, GitTreeRef } from '@/types/data'

interface TreeGroup {
  inited: boolean
  size: number
  next: string
  merged?: string
  stash?: string
  branches: GitRef[]
  remotes: GitRemote[]
}

class TreeBuilder {
  readonly #groups: (TreeGroup | null)[]

  constructor() {
    this.#groups = []
  }

  #mergeBranches(a: GitRef[], b: GitRef[]): GitRef[] {
    return [...a, ...b]
  }

  #mergeRemotes(a: GitRemote[], b: GitRemote[]): GitRemote[] {
    const remotes: GitRemote[] = []
    a.forEach((remote) => {
      remotes.push({
        name: remote.name,
        HEAD: remote.HEAD,
        branches: remote.branches.slice(0),
      })
    })
    b.forEach((remote) => {
      const index = remotes.findIndex((existRemote: GitRemote) => {
        return existRemote.name === remote.name
      })
      if (index < 0) {
        remotes.push({
          name: remote.name,
          HEAD: remote.HEAD,
          branches: remote.branches.slice(0),
        })
        return
      }
      remotes[index] = {
        name: remote.name,
        HEAD: remote.HEAD,
        branches: [...remotes[index].branches, ...remote.branches],
      }
    })
    return remotes
  }

  #findBranchLevel(branch: GitRef): number {
    let level = 0
    if (branch.name === 'master' || branch.name === 'main') {
      level = 3
    } else if (branch.name === 'develop' || branch.name === 'dev') {
      level = 2
    } else if (branch.name.split(/[.\-_/]/).length < 2) {
      level = 1
    }
    return level
  }

  #findTreeGroupLevel(group: TreeGroup): number {
    let level = 0
    group.branches.forEach((branch: GitRef) => {
      const newLevel = this.#findBranchLevel(branch)
      if (newLevel > level) {
        level = newLevel
      }
    })
    group.remotes.forEach((remote: GitRemote) => {
      remote.branches.forEach((branch: GitRef) => {
        const newLevel = this.#findBranchLevel(branch)
        if (newLevel > level) {
          level = newLevel
        }
      })
    })
    return level
  }

  #compareTreeGroup(a: TreeGroup, b: TreeGroup): number {
    const aLevel = this.#findTreeGroupLevel(a)
    const bLevel = this.#findTreeGroupLevel(b)
    if (aLevel !== bLevel) {
      return aLevel - bLevel
    }
    return a.size - b.size
  }

  #createTreeGroup(groups: (TreeGroup | null)[], hash: string): number {
    let findedGroup: TreeGroup | null = null
    let index = -1
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      if (group && group.next === hash && (!findedGroup || this.#compareTreeGroup(group, findedGroup) > 0)) {
        index = i
        findedGroup = group
      }
    }
    if (index < 0) {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]
        if (!group) {
          index = i
          break
        }
      }
    }
    if (index < 0) {
      index = groups.length
      groups.push(null)
    }
    return index
  }

  build({ commit, branches, remotes }: { commit: GitCommit; branches: GitRef[]; remotes: GitRemote[] }): GitTree {
    const groups = this.#groups
    const current = commit.hash
    const next = commit.parents.length > 0 ? commit.parents[0] : ''
    // add current group
    const index = this.#createTreeGroup(groups, current)
    const group = groups[index]
    groups[index] = group
      ? {
          inited: false,
          size: group.size + 1,
          next,
          branches: this.#mergeBranches(group.branches, branches),
          remotes: this.#mergeRemotes(group.remotes, remotes),
          stash: group.stash,
        }
      : {
          inited: true,
          size: 1,
          next,
          branches: branches.slice(0),
          remotes: remotes.slice(0),
          stash: commit.stash,
        }
    // add merged group
    if (!commit.stash && commit.parents.length > 1) {
      const merged = commit.hash
      const next = commit.parents[1]
      const index = this.#createTreeGroup(groups, next)
      const group = groups[index]
      groups[index] = group
        ? {
            inited: false,
            size: group.size,
            next,
            merged,
            branches: group.branches,
            remotes: group.remotes,
          }
        : {
            inited: true,
            size: 0,
            next,
            merged,
            branches: [],
            remotes: [],
          }
    }
    // generate tree
    const tree: GitTree = {
      refs: groups.reduce<GitTreeRef[]>((refs, group, index) => {
        if (group) {
          refs.push({
            index,
            inited: !group.next || group.next === commit.hash,
            continued: !group.inited,
            stash: !!group.stash,
            branched: !!group.next && group.next === commit.hash,
            merged: !!group.merged && group.merged === commit.hash,
          })
        }
        return refs
      }, []),
      index,
    }
    // clean end group and group inited status
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      if (group) {
        if (group.next === commit.hash) {
          groups[i] = null
        } else {
          group.inited = false
        }
      }
    }
    return tree
  }
}

interface RawData {
  readonly repositories: string[]
  readonly HEAD: string
  readonly branches: GitRef[]
  readonly remotes: GitRemote[]
  readonly tags: GitRef[]
  readonly commits: GitCommit[]
}

class CommitsBuilder {
  readonly #data: RawData

  constructor(data: RawData) {
    this.#data = data
  }

  #buildCache(): {
    branches: Map<string, GitRef[]>
    remotes: Map<string, Array<{ name: string; HEAD: string; branches: GitRef[] }>>
    tags: Map<string, GitRef[]>
  } {
    const { branches, tags, remotes } = this.#data

    const cache = {
      branches: new Map<string, GitRef[]>(),
      remotes: new Map<string, Array<{ name: string; HEAD: string; branches: GitRef[] }>>(),
      tags: new Map<string, GitRef[]>(),
    }

    for (const branch of branches) {
      const list = cache.branches.get(branch.hash)
      if (list) {
        list.push(branch)
      } else {
        cache.branches.set(branch.hash, [branch])
      }
    }

    for (const tag of tags) {
      const list = cache.tags.get(tag.hash)
      if (list) {
        list.push(tag)
      } else {
        cache.tags.set(tag.hash, [tag])
      }
    }

    for (const remote of remotes) {
      for (const branch of remote.branches) {
        let remoteList = cache.remotes.get(branch.hash)
        if (!remoteList) {
          remoteList = []
          cache.remotes.set(branch.hash, remoteList)
        }

        let remoteItem = remoteList.find((r) => r.name === remote.name)
        if (!remoteItem) {
          remoteItem = { name: remote.name, HEAD: '', branches: [] }
          remoteList.push(remoteItem)
        }
        remoteItem.branches.push(branch)
      }
    }

    return cache
  }

  async build(start: number, end: number): Promise<GitCommits> {
    const { repositories } = this.#data
    if (!repositories.length) {
      return {
        head: 0,
        body: [],
        tail: 0,
      }
    }

    const cache = this.#buildCache()

    const items: GitCommitsItem[] = []
    const { commits } = this.#data
    const bottom = Math.max(Math.min(end, commits.length), 0)
    const top = Math.max(Math.min(start, bottom), 0)
    const builder = new TreeBuilder()

    for (let index = 0; index < bottom; index++) {
      const commit = commits[index]
      const hash = commit.hash
      const branches = cache.branches.get(hash) ?? []
      const remotes = cache.remotes.get(hash) ?? []
      const tags = cache.tags.get(hash) ?? []
      const tree = builder.build({ commit, branches, remotes })

      if (index >= top) {
        items.push({
          index,
          commit,
          branches,
          remotes,
          tags,
          tree,
        })
      }
    }

    return {
      head: top,
      body: items,
      tail: commits.length - bottom,
    }
  }
}
export default class {
  readonly #states: States

  constructor(states: States) {
    this.#states = states
  }

  #data?: RawData

  async #getDataWithCache(): Promise<RawData> {
    if (this.#data) {
      return this.#data
    }
    const states = this.#states
    if (!states.repositories.length) {
      this.#data = undefined
      return {
        repositories: [],
        HEAD: '',
        branches: [],
        tags: [],
        remotes: [],
        commits: [],
      }
    }
    const data = await this.#getData()
    this.#data = data
    return data
  }

  async #getData(): Promise<RawData> {
    const states = this.#states
    const git = states.git
    const { HEAD, branches, remotes, tags } = await git.showRef()
    const stashes = await git.showStashList()
    const commits = await git.log({
      stashes,
    })
    return {
      repositories: states.repositories.map((repository) => repository.rootUri.toString()),
      HEAD,
      branches,
      remotes,
      tags,
      commits,
    }
  }

  changeRepository(): { repository: string } {
    const states = this.#states
    const repositories = states.repositories.map((repository) => repository.rootUri.toString())
    if (
      this.#data &&
      !(this.#data.repositories.length && repositories.length && this.#data.repositories[0] === repositories[0])
    ) {
      this.#data = undefined
    }
    return { repository: repositories[0] ?? '' }
  }

  async getCommits({ start = 0, end = 100 }: { start?: number; end?: number } = {}): Promise<{
    repository: string
    branches: GitRef[]
    remotes: GitRemote[]
    tags: GitRef[]
    commits: GitCommits
  }> {
    const data = await this.#getDataWithCache()
    const { repositories, branches, remotes, tags } = data

    const builder = new CommitsBuilder(data)
    const commits = await builder.build(start, end)

    return {
      repository: repositories.length ? repositories[0] : '',
      branches,
      remotes,
      tags,
      commits,
    }
  }

  async getCommit({ hash }: { hash: string }): Promise<{ commit: GitCommit }> {
    const commit = await this.#states.git.show(hash)
    return { commit }
  }

  clearCache(): void {
    this.#data = undefined
  }
}
