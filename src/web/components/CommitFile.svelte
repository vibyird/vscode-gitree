<script lang="ts">
  import ChevronRight from '@web/icons/ChevronRight.svelte'
  import { keydown } from '@web/utils/event'
  import { createEventDispatcher } from 'svelte'

  interface File {
    id: number
    name: string
    status?: string
    children?: File[]
    expanded?: boolean
  }

  export let file: File
  export let selected: File
  export let depth: number = 0

  const dispatch = createEventDispatcher<{
    select: File
  }>()

  function click() {
    file.expanded = !file.expanded
    dispatch('select', file)
  }
</script>

<div
  class="row"
  class:selected={selected && file.id === selected.id}
  style:padding-left="{depth * 8}px"
  role="row"
  tabindex="0"
  on:keydown={(e) => keydown(e, click)}
  on:click={click}>
  {#if file.children}
    <div class="indicator" class:expanded={file.expanded}><ChevronRight width={16} height={16} /></div>
  {:else}
    <div class="status" data-status={file.status[0]}>{file.status[0]}</div>
  {/if}
  <div class="name">{file.name}</div>
</div>
{#if file.children && file.expanded}
  {#each file.children as child (child.id)}
    <svelte:self {selected} file={child} depth={depth + 1} on:select />
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
      display: flex;
      align-items: center;
      padding: 0 3px;

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
