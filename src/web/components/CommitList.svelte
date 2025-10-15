<script lang="ts">
  import type { Commit } from '@/types/data'
  import GraphItem from '@web/components/GraphItem.svelte'
  import { createEventDispatcher } from 'svelte'

  const colors: string[] = [
    'rgba(21, 160, 191, 1)',
    'rgba(6, 105, 247, 1)',
    'rgba(142, 0, 194, 1)',
    'rgba(197, 23, 182, 1)',
    'rgba(217, 1, 113, 1)',
    'rgba(205, 1, 1, 1)',
    'rgba(243, 93, 46, 1)',
    'rgba(242, 202, 51, 1)',
    'rgba(123, 217, 56, 1)',
    'rgba(46, 206, 157, 1)',
  ]

  interface Group {
    inited: boolean
    size: number
    next: string
    merged?: string
  }

  interface Row {
    commit: Commit
    color: string
    graph: {
      refs: {
        index: number
        color: string
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
      const current = commit.hash
      const next = commit.parents.length > 0 ? commit.parents[0] : ''
      // add current group
      const i = createGroup(groups, current)
      const group = groups[i]
      groups[i] = group
        ? {
            inited: false,
            size: group.size + 1,
            next,
          }
        : {
            inited: true,
            size: 1,
            next,
          }
      index = i
      // add merged group
      if (commit.parents.length > 1) {
        const merged = commit.hash
        const next = commit.parents[1]
        const i = createGroup(groups, next)
        const group = groups[i]
        groups[i] = group
          ? {
              inited: false,
              size: group.size,
              next,
              merged,
            }
          : {
              inited: true,
              size: 0,
              next,
              merged,
            }
      }
      // convert groups to refs
      const refs = groups
        .map((group, index) =>
          group
            ? {
                index,
                color: colors[index % colors.length],
                inited: !group.next || group.next === commit.hash,
                continued: !group.inited,
                branched: group.next && group.next === commit.hash,
                merged: group.merged && group.merged === commit.hash,
              }
            : null,
        )
        .filter(Boolean)
      // push row
      rows.push({
        color: colors[index % colors.length],
        commit,
        graph: {
          refs,
          index,
        },
      })
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
        <div class="cell graph" style:border-right="2px solid {row.color}" role="cell">
          <GraphItem refs={row.graph.refs} index={row.graph.index} height={28} width={24} />
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
    height: 100%;

    .row {
      display: grid;
      grid-template-rows: 28px;
      grid-template-columns: 1fr 1.5fr 1fr;
      align-items: center;

      .cell {
        height: 22px;
        line-height: 22px;
        padding: 0 3px;
      }

      .graph {
        display: inline-flex;
        align-items: center;
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
