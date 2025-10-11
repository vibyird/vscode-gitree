<script lang="ts">
  import FileItem from '@web/components/FileItem.svelte'
  import ChevronRight from '@web/icons/ChevronRight.svelte'
  import { createEventDispatcher } from 'svelte'

  interface File {
    path: string
    status: string
  }

  export let title: string
  export let expanded: boolean = true
  export let files: File[]

  const dispatch = createEventDispatcher<{
    select: void
  }>()

  interface Item {
    id: number
    name: string
    status?: string
    children?: Item[]
    expanded?: boolean
  }

  let items: Item[] = []
  let selected: Item = null

  function keydown(e: KeyboardEvent, callback: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
      callback()
    }
  }

  function click() {
    dispatch('select')
  }

  function selectItem(item: Item) {
    selected = item
  }

  function mergeItem(item: Item): Item {
    if (!item.children || item.children.length > 1) {
      return item
    }

    const [child] = item.children
    if (
      !child.children ||
      child.children.some((child) => {
        return child.children
      })
    ) {
      return item
    }

    child.name = `${item.name}/${child.name}`
    return child
  }

  function sortItem(a: Item, b: Item): number {
    if (!!a.children !== !!b.children) {
      return b.children ? 1 : -1
    }
    return a.name.localeCompare(b.name)
  }

  function optimizeItems(items: Item[]): Item[] {
    return items
      .map((item: Item) => {
        if (item.children) {
          item.children = optimizeItems(item.children)
        }
        return item
      })
      .map(mergeItem)
      .sort(sortItem)
  }

  function buildItems(files: File[]): Item[] {
    let id = 1
    const items: Item[] = []
    for (const { path, status } of files) {
      const names = path.split('/').filter(Boolean)
      for (let i = 0, children = items; i < names.length; i++) {
        const name = names[i]
        let item = children.find((child) => child.name === name)
        if (!item) {
          item = { id: id++, name }
          children.push(item)
        }
        if (i < names.length - 1) {
          if (!item.children) {
            item.expanded = true
            item.children = []
          }
          children = item.children
        } else {
          item.status = status
        }
      }
    }

    return optimizeItems(items)
  }

  $: {
    items = buildItems(files)
  }
</script>

<div class="header" role="row" tabindex="0" on:keydown={(e) => keydown(e, click)} on:click={click}>
  <div class="indicator" class:expanded><ChevronRight width={16} height={16} /></div>
  <div class="title">{title}</div>
</div>
{#if expanded}
  {#each items as item (item.id)}
    <FileItem {item} {selected} depth={1} on:select={(e) => selectItem(e.detail)} />
  {/each}
{/if}

<style lang="scss">
  .header {
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

    .indicator {
      display: flex;
      align-items: center;
      padding-right: 6px;

      &.expanded {
        transform: rotate(90deg);
        transform-box: fill-box;
        transform-origin: center;
      }
    }

    .title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
