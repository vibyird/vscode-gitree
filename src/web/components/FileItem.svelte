<script lang="ts">
  import ChevronRight from '@web/icons/ChevronRight.svelte'
  import { createEventDispatcher } from 'svelte'

  interface Item {
    id: number
    name: string
    status?: string
    children?: Item[]
    expanded?: boolean
  }

  export let item: Item
  export let selected: Item
  export let depth: number = 0

  const dispatch = createEventDispatcher<{
    select: Item
  }>()

  function keydown(e: KeyboardEvent, callback: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
      callback()
    }
  }

  function click() {
    item.expanded = !item.expanded
    dispatch('select', item)
  }
</script>

<div
  class="row"
  class:selected={selected && item.id === selected.id}
  style:padding-left="{depth * 8}px"
  role="row"
  tabindex="0"
  on:keydown={(e) => keydown(e, click)}
  on:click={click}>
  {#if item.children}
    <div class="indicator" class:expanded={item.expanded}><ChevronRight /></div>
  {:else}
    <div class="status" data-status={item.status[0]}>{item.status[0]}</div>
  {/if}
  <div class="name">{item.name}</div>
</div>
{#if item.children && item.expanded}
  {#each item.children as child (child.id)}
    <svelte:self {selected} item={child} depth={depth + 1} on:select />
  {/each}
{/if}

<style lang="scss">
  .row {
    display: flex;
    align-items: center;
    height: 22px;
    line-height: 22px;
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

    .indicator {
      width: 16px;
      height: 16px;
      padding-right: 6px;

      &.expanded {
        transform: rotate(90deg);
        transform-box: fill-box;
        transform-origin: center;
      }
    }

    .status {
      width: 13px;
      height: 13px;
      line-height: 13px;
      font-size: 13px;
      padding-right: 9px;

      &[data-status='A'] {
        color: var(--vscode-gitDecoration-addedResourceForeground);
      }
      &[data-status='M'] {
        color: var(--vscode-gitDecoration-modifiedResourceForeground);
      }
      &[data-status='D'] {
        color: var(--vscode-gitDecoration-deletedResourceForeground);
      }
      &[data-status='R'] {
        color: var(--vscode-gitDecoration-renamedResourceForeground);
      }
    }

    .name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
