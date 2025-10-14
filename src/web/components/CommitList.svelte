<script lang="ts">
  import type { Commit } from '@/types/data'
  import CommitGraph from '@web/components/CommitGraph.svelte'
  import { createEventDispatcher } from 'svelte'

  interface Group {
    inited: boolean
    size: number
    next: string
    start?: string
  }

  interface Row {
    commit: Commit
    graph: {
      refs: {
        index: number
        inited: boolean
        continued: boolean
        branched: boolean
        merged: boolean
      }[]
      index: number
    }
  }

  const dispatch = createEventDispatcher<{
    select: Commit
  }>()

  export let commits: Commit[]

  let selected: Commit
  let rows: Row[]

  function keydown(e: KeyboardEvent, callback: () => void): void {
    if (e.key === 'Enter' || e.key === ' ') {
      callback()
    }
  }

  function selectCommit(commit: Commit): void {
    if (selected && selected.hash === commit.hash) {
      return
    }
    selected = commit
    dispatch('select', selected)
  }

  function cancelSelectCommit(commit: Commit): void {
    if (selected && selected.hash === commit.hash) {
      selected = null
      dispatch('select', null)
    }
  }

  function createGroup(groups: Group[], hash: string): number {
    let size = -1
    let index = -1
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      if (group && group.next === hash && group.size > size) {
        index = i
        size = group.size
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

  $: {
    rows = []
    const groups: Group[] = []
    let index: number
    for (const commit of commits) {
      // add current group
      index = createGroup(groups, commit.hash)
      const group = groups[index]
      groups[index] = group
        ? {
            inited: false,
            size: group.size + 1,
            next: commit.parents[0],
          }
        : {
            inited: true,
            size: 1,
            next: commit.parents[0],
          }
      // add merged group
      if (commit.parents.length > 1) {
        const index = createGroup(groups, commit.parents[1])
        const group = groups[index]
        groups[index] = group
          ? {
              inited: false,
              size: group.size,
              next: commit.parents[1],
              start: commit.hash,
            }
          : {
              inited: true,
              size: 0,
              next: commit.parents[1],
              start: commit.hash,
            }
      }
      // push row
      rows.push({
        commit,
        graph: {
          refs: groups
            .map((group, index) =>
              group
                ? {
                    index,
                    inited: !group.next,
                    continued: !group.inited,
                    branched: group.next && group.next === commit.hash,
                    merged: group.start && group.start === commit.hash,
                  }
                : null,
            )
            .filter(Boolean),
          index,
        },
      })
      // clean end group
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
  }
</script>

<div class="table" role="table">
  <div class="thead row" role="row">
    <div class="cell" role="columnheader">{window.l10n.t('Graph')}</div>
    <div class="cell" role="columnheader">{window.l10n.t('Commit Message')}</div>
    <div class="cell" role="columnheader">{window.l10n.t('Commit Date')}</div>
  </div>
  <div class="tdata">
    {#each rows as row (row.commit.hash)}
      <div
        class="row"
        tabindex="0"
        class:selected={selected && row.commit.hash === selected.hash}
        role="row"
        on:keydown={(e) => keydown(e, () => selectCommit(row.commit))}
        on:click={() => selectCommit(row.commit)}
        on:dblclick={() => cancelSelectCommit(row.commit)}>
        <div class="cell graph" role="cell">
          <CommitGraph refs={row.graph.refs} index={row.graph.index} height={24} />
        </div>
        <div class="cell" role="cell">{row.commit.message}</div>
        <div class="cell" role="cell">{row.commit.commitDate}</div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .table {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;

    .row {
      display: grid;
      grid-template-columns: 1fr 1.5fr 1fr;
      height: 22px;
      line-height: 22px;
      padding-bottom: 2px;

      .graph {
        padding-bottom: 0;
      }

      .cell {
        padding-left: 8px;
      }
    }

    .thead {
      position: sticky;
      top: 0;
      z-index: 1;
      font-weight: bold;
      background-color: var(--vscode-panel-background);
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .tdata {
      overflow-y: auto;
      scrollbar-width: none;

      .row {
        align-content: start;
        cursor: pointer;
        user-select: none;

        &:hover {
          color: var(--vscode-list-hoverForeground);
          background-color: var(--vscode-list-hoverBackground);
        }

        &.selected {
          color: var(--vscode-list-activeSelectionForeground);
          background-color: var(--vscode-list-activeSelectionBackground);
        }
      }
    }
  }
</style>
