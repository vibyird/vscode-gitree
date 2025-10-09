<script lang="ts">
  import FileItem from './FileItem.svelte'

  interface File {
    path: string
    status: string
  }

  export let files: File[]

  interface Item {
    id: number
    name: string
    children?: Item[]
    expanded?: boolean
  }

  let items: Item[] = []
  let selected: Item = null

  function clickSeleted({ detail: item }: CustomEvent<Item>) {
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
    for (const { path } of files) {
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
        }
      }
    }

    return optimizeItems(items)
  }

  $: {
    items = buildItems(files)
  }
</script>

<div class="tree">
  {#each items as item (item.id)}
    <FileItem {item} {selected} on:click:selected={clickSeleted} />
  {/each}
</div>

<style lang="scss">
  .tree {
    padding: 8px 0;
  }
</style>
