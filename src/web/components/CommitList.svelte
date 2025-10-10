<script lang="ts">
  import type { Commit } from '@/types/data'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{
    select: Commit
  }>()

  export let commits: Commit[]

  let selected: Commit

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
</script>

<div class="table" role="table">
  <div class="thead row" role="row">
    <div class="cell" role="columnheader">{window.l10n.t('Commit Message')}</div>
    <div class="cell" role="columnheader">{window.l10n.t('Commit Date')}</div>
  </div>
  <div class="tdata">
    {#each commits as commit (commit.hash)}
      <div
        class="row"
        tabindex="0"
        class:selected={selected && commit.hash === selected.hash}
        role="row"
        on:keydown={(e) => keydown(e, () => selectCommit(commit))}
        on:click={() => selectCommit(commit)}
        on:dblclick={() => cancelSelectCommit(commit)}>
        <div class="cell" role="cell">{commit.message}</div>
        <div class="cell" role="cell">{commit.commitDate}</div>
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
      grid-template-columns: 1.5fr 1fr;
      height: 22px;
      line-height: 22px;
      margin: 2px 0;

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
