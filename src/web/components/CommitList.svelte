<script lang="ts">
  import { GRAPH_COLORS } from '@/states/constants'
  import type { GitCommit, GitRef, GitRemote } from '@/types/data'
  import CommitTree from '@web/components/CommitTree.svelte'
  import Vm from '@web/icons/Vm.svelte'
  import VmActive from '@web/icons/VmActive.svelte'
  import { keydown } from '@web/utils/event'
  import { formatDate, runtime } from '@web/utils/util'
  import { createEventDispatcher, onMount } from 'svelte'

  const config = runtime.config

  const height = 28

  export let HEAD: string
  export let branches: GitRef[]
  export let tags: GitRef[]
  export let remotes: GitRemote[]
  export let commits: GitCommit[]
  export let scrollTop: number = 0
  export let selected: string

  const dispatch = createEventDispatcher<{
    select: string
    scroll: number
  }>()

  interface Group {
    inited: boolean
    size: number
    next: string
    merged?: string
    stash?: string
    branches: GitRef[]
    remotes: GitRemote[]
  }

  interface Tree {
    refs: {
      index: number
      color: string
      inited: boolean
      continued: boolean
      branched: boolean
      merged: boolean
      stash: boolean
    }[]
    index: number
  }

  interface Item {
    index: number
    color: string
    branches: GitRef[]
    tags: GitRef[]
    remotes: GitRemote[]
    tree: Tree
    commit: GitCommit
  }

  let data: {
    head: number
    body: Item[]
    tail: number
  } = {
    head: 0,
    body: [],
    tail: 0,
  }

  function selectCommit(commit: GitCommit): void {
    if (selected === commit.hash) {
      return
    }
    dispatch('select', commit.hash)
  }

  function cancelSelectCommit(commit: GitCommit): void {
    if (selected && selected === commit.hash) {
      dispatch('select', '')
    }
  }

  function mergeBranches(a: GitRef[], b: GitRef[]): GitRef[] {
    return [...a, ...b]
  }

  function mergeRemotes(a: GitRemote[], b: GitRemote[]): GitRemote[] {
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

  function findBranchLevel(branch: GitRef): number {
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

  function findGroupLevel(group: Group): number {
    let level = 0
    group.branches.forEach((branch: GitRef) => {
      const newLevel = findBranchLevel(branch)
      if (newLevel > level) {
        level = newLevel
      }
    })
    group.remotes.forEach((remote: GitRemote) => {
      remote.branches.forEach((branch: GitRef) => {
        const newLevel = findBranchLevel(branch)
        if (newLevel > level) {
          level = newLevel
        }
      })
    })
    return level
  }

  function compareGroup(a: Group, b: Group): number {
    const aLevel = findGroupLevel(a)
    const bLevel = findGroupLevel(b)
    if (aLevel !== bLevel) {
      return aLevel - bLevel
    }
    return a.size - b.size
  }

  function createGroup(groups: Group[], hash: string): number {
    let findedGroup: Group
    let index = -1
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      if (group && group.next === hash && (findedGroup === undefined || compareGroup(group, findedGroup) > 0)) {
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

  function initGroups(
    groups: Group[],
    commit: GitCommit,
    {
      branches,
      remotes,
    }: {
      branches: GitRef[]
      remotes: GitRemote[]
    },
  ): number {
    const current = commit.hash
    const next = commit.parents.length > 0 ? commit.parents[0] : ''
    // add current group
    const index = createGroup(groups, current)
    const group = groups[index]
    groups[index] = group
      ? {
          inited: false,
          size: group.size + 1,
          next,
          branches: mergeBranches(group.branches, branches),
          remotes: mergeRemotes(group.remotes, remotes),
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
      const index = createGroup(groups, next)
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
    return index
  }

  function createTreeData(commit: GitCommit, groups: Group[], index: number): Tree {
    const refs = groups
      .map((group, index) =>
        group
          ? {
              index,
              color: GRAPH_COLORS[index % GRAPH_COLORS.length],
              inited: !group.next || group.next === commit.hash,
              continued: !group.inited,
              stash: !!group.stash,
              branched: group.next && group.next === commit.hash,
              merged: group.merged && group.merged === commit.hash,
            }
          : null,
      )
      .filter(Boolean)
    return {
      refs,
      index,
    }
  }

  function resetGroups(groups: Group[], commit: GitCommit): void {
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
  }

  const render: { top: number; height: number } = {
    top: 0,
    height: 0,
  }

  function scroll(e: Event) {
    const element = e.currentTarget as HTMLElement
    const scrollTop = element.scrollTop
    const { top, height } = render
    if (scrollTop < top - 0.8 * height) {
      render.top = Math.min(scrollTop, top - height)
    } else if (scrollTop > top + 0.8 * height) {
      render.top = Math.max(scrollTop, top + height)
    }
    dispatch('scroll', scrollTop)
  }

  let element: HTMLDivElement

  onMount(() => {
    element.scrollTop = scrollTop
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.contentRect.height > render.height) {
          render.height = (Math.ceil(entry.contentRect.height / height) + 5) * height
        }
      }
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  })

  $: {
    const start = Math.max(Math.floor((render.top - render.height) / height), 0)
    const end = Math.min(Math.ceil((render.top + 2 * render.height) / height), commits.length)
    const items: Item[] = []
    const groups: Group[] = []
    for (let index = 0; index < end; index++) {
      const commit = commits[index]
      const itemBranches = branches.filter((branch) => branch.hash === commit.hash)
      const itemTags = tags.filter((tag) => tag.hash === commit.hash)
      const itemRemotes = remotes
        .map((remote) => {
          const branches = remote.branches.filter((branch) => branch.hash === commit.hash)
          return branches.length > 0
            ? {
                name: remote.name,
                HEAD: '',
                branches,
              }
            : null
        })
        .filter(Boolean)
      const groupIndex = initGroups(groups, commit, {
        branches: itemBranches,
        remotes: itemRemotes,
      })
      const color = GRAPH_COLORS[groupIndex % GRAPH_COLORS.length]
      if (index >= start) {
        const tree = createTreeData(commit, groups, groupIndex)
        items.push({
          index,
          color,
          branches: itemBranches,
          tags: itemTags,
          remotes: itemRemotes,
          tree,
          commit,
        })
      }
      resetGroups(groups, commit)
    }
    data = {
      head: start,
      body: items,
      tail: commits.length - end,
    }
  }
</script>

<div class="container" role="table">
  <div class="head">
    <div class="group head-section" role="row">
      <div class="cell" role="columnheader">
        <span>{window.l10n.t('Branch / Tag')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{window.l10n.t('Tree')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{window.l10n.t('Message')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{window.l10n.t('Author')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{window.l10n.t('Commit Date')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{window.l10n.t('Hash')}</span>
      </div>
    </div>
  </div>
  <div bind:this={element} class="data" style:grid-auto-rows="{height}px" on:scroll={scroll}>
    {#if data.head}
      {@const start = 0}
      {@const end = start + data.head}
      <div style:grid-area="{start + 1} / 1 / {end + 1} / -1" />
    {/if}
    {#each data.body as item (item.index)}
      {@const commit = item.commit}
      {@const tree = item.tree}
      <div class="group ref-section">
        <div class="cell refs" role="cell">
          {#if item.branches.length}
            <div class="ref">
              <div
                class="layer-0"
                role="row"
                tabindex="0"
                data-vscode-context={JSON.stringify({ webviewSection: 'commit', commit: item.branches[0].name })}
                on:keydown={(e) => keydown(e, () => selectCommit(commit))}
                on:click={() => selectCommit(commit)}
                on:dblclick={() => cancelSelectCommit(commit)}>
                <div class="icon">
                  {#if commit.hash === HEAD}
                    <VmActive width={16} height={16} />
                  {:else}
                    <Vm width={16} height={16} />
                  {/if}
                </div>
                <span>{item.branches.length ? item.branches[0].name : ''}</span>
              </div>
              <div class="layer-1" style:opacity={selected && commit.hash === selected ? 0.1 : 0.5} />
              <div class="layer-2" style:background-color={item.color} />
            </div>
            <div
              style:flex="1 1 auto"
              style:height="{commit.hash === HEAD ? 2 : 1}px"
              style:background-color={item.color}
              style:opacity={commit.hash === HEAD ? 1 : 0.25} />
          {/if}
        </div>
        <div class="cell tree" role="cell">
          <div class="layer-0">
            <div style:flex="0 1 {(tree.index + 0.5) * 24}px" />
            <div
              role="row"
              tabindex="0"
              style:flex="1 1 auto"
              style:height="100%"
              style:border-right="2px solid {item.color}"
              on:keydown={(e) => keydown(e, () => selectCommit(commit))}
              on:click={() => selectCommit(commit)}
              on:dblclick={() => cancelSelectCommit(commit)} />
          </div>
          <div class="layer-1">
            <CommitTree refs={tree.refs} index={tree.index} {height} width={24} />
          </div>
          <div class="layer-2">
            <div
              style:width="{(tree.index + 0.5) * 24}px"
              style:height="{item.branches.length ? (commit.hash === HEAD ? 2 : 1) : 0}px"
              style:background-color={item.color}
              style:opacity={commit.hash === HEAD ? 1 : 0.25} />
            <div
              style:flex="1 1 auto"
              style:height="100%"
              style:background-color={item.color}
              style:opacity={selected && commit.hash === selected ? 0.5 : 0.1} />
          </div>
        </div>
      </div>
      <div
        class="group commit-section"
        class:selected={selected && commit.hash === selected}
        role="row"
        tabindex="0"
        data-vscode-context={JSON.stringify({ webviewSection: 'commit', commit: commit.hash })}
        on:keydown={(e) => keydown(e, () => selectCommit(commit))}
        on:click={() => selectCommit(commit)}
        on:dblclick={() => cancelSelectCommit(commit)}>
        <div class="cell" role="cell">
          <span>{commit.message}</span>
        </div>
        <div class="cell" role="cell">
          <span>{commit.authorName}</span>
        </div>
        <div class="cell" role="cell">
          <span>{formatDate(commit.commitDate, config.language)}</span>
        </div>
        <div class="cell" role="cell">
          <span>{commit.hash.slice(0, 7)}</span>
        </div>
      </div>
    {/each}
    {#if data.tail}
      {@const start = data.head + data.body.length}
      {@const end = start + data.tail}
      <div style:grid-area="{start + 1} / 1 / {end + 1} / -1" />
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    display: grid;
    grid-template-columns: 16% 16% 32% 10% 16% 10%;
    grid-template-rows: 28px 1fr;
    height: 100%;
    width: 100%;

    .group {
      display: contents;

      .cell {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 100%;
        height: 22px;
        line-height: 22px;

        > {
          div {
            display: inline-flex;
            align-items: center;
          }
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .head-section {
      .cell {
        > span {
          padding-left: 3px;
        }
      }
    }

    .ref-section {
      .refs {
        padding-left: 3px;
        width: calc(100% - 3px);

        .ref {
          position: relative;
          max-width: 100%;
          cursor: pointer;
          user-select: none;

          .layer-0 {
            box-sizing: border-box;
            width: 100%;
            padding: 0 5px;
            display: inline-flex;
            align-items: center;
            border-radius: 2px;

            .icon {
              display: inline-flex;
              align-items: center;
              margin-right: 3px;
            }
          }

          .layer-1 {
            position: absolute;
            z-index: -1;
            width: 100%;
            height: 100%;
            background-color: black;
            border-radius: 2px;
          }

          .layer-2 {
            position: absolute;
            z-index: -2;
            width: 100%;
            height: 100%;
            border-radius: 2px;
          }
        }
      }

      .tree {
        .layer-0 {
          width: 100%;
          height: 100%;

          > * {
            box-sizing: border-box;
            cursor: pointer;
            user-select: none;
          }
        }

        .layer-1 {
          position: absolute;
          z-index: -1;
          width: 100%;
          height: 100%;
        }

        .layer-2 {
          position: absolute;
          z-index: -2;
          width: 100%;
          height: 100%;
        }
      }
    }

    .commit-section {
      .cell {
        cursor: pointer;

        > span {
          padding-left: 3px;
        }
      }

      &:hover {
        .cell {
          color: var(--vscode-list-hoverForeground);
          background-color: var(--vscode-list-hoverBackground);
        }
      }

      &.selected {
        .cell {
          color: var(--vscode-list-activeSelectionForeground);
          background-color: var(--vscode-list-activeSelectionBackground);
        }
      }
    }

    > {
      * {
        grid-column: 1 / -1;
        display: grid;
        width: 100%;
        grid-template-columns: subgrid;
        align-items: center;
      }

      .head {
        position: sticky;
        top: 0;
        z-index: 1;
        font-weight: bold;
        background-color: var(--vscode-panel-background);
        border-bottom: 1px solid var(--vscode-panel-border);
      }

      .data {
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: thin;
      }
    }
  }
</style>
