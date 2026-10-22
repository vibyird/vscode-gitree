<script lang="ts">
  import type { GitFile } from '@/types/data'
  import ChevronRight from '@/web/icons/ChevronRight.svelte'
  import store from '@/web/stores/graph.svelte'
  import { keydown } from '@/web/utils/event'
  import * as l10n from '@vscode/l10n'

  const { view, setState } = store

  interface Node {
    id: number
    name: string
    status?: string
    children?: Node[]
  }

  const { files }: { files: GitFile[] } = $props()

  const expanded = $derived(new Map<number, boolean>(view.aside.expanded))
  const selected = $derived(view.aside.selected)

  function mergeNode(node: Node): Node {
    if (node.children && node.children.length === 1) {
      const [child] = node.children
      if (child.children) {
        child.name = `${node.name}/${child.name}`
        return child
      }
    }
    return node
  }

  function sortNode(a: Node, b: Node): number {
    if (!!a.children !== !!b.children) {
      return b.children ? 1 : -1
    }
    return a.name.localeCompare(b.name)
  }

  function optimizeNodes(nodes: Node[]): Node[] {
    return nodes
      .map((node: Node) => {
        if (node.children) {
          node.children = optimizeNodes(node.children)
        }
        return node
      })
      .map(mergeNode)
      .sort(sortNode)
  }

  const nodes = $derived.by(() => {
    let id = 1
    const nodes: Node[] = []
    for (const { path, status } of files) {
      const names = path.split('/').filter(Boolean)
      for (let i = 0, children = nodes; i < names.length; i++) {
        const name = names[i]
        let child = children.find((child) => child.name === name)
        if (!child) {
          child = { id: id++, name }
          children.push(child)
        }
        if (i < names.length - 1) {
          if (!child.children) {
            child.children = []
          }
          children = child.children
        } else {
          child.status = status
        }
      }
    }
    return optimizeNodes(nodes)
  })

  function switchExpand() {
    const map = $state.snapshot(expanded)
    map.set(0, !(map.get(0) ?? true))
    setState({
      view: {
        aside: {
          expanded: Array.from(map),
        },
      },
    })
  }

  function selectNode(node: Node) {
    const map = $state.snapshot(expanded)
    if (node.children) {
      map.set(node.id, !(map.get(node.id) ?? true))
      setState({
        view: {
          aside: {
            expanded: Array.from(map),
          },
        },
      })
    } else {
      setState({
        view: {
          aside: {
            selected: node.id,
          },
        },
      })
    }
  }
</script>

{#snippet NodeAndChildren(node: Node, depth: number)}
  <div
    class="row"
    class:selected={node.id === selected}
    style:padding-left="{depth * 8}px"
    role="row"
    tabindex="0"
    onkeydown={(e) => keydown(e, () => selectNode(node))}
    onclick={() => selectNode(node)}>
    {#if node.children}
      <div class="indicator" class:expanded={expanded.get(node.id) ?? true}>
        <ChevronRight width={16} height={16} />
      </div>
    {:else}
      <div class="status" data-status={node.status}>{node.status}</div>
    {/if}
    <div class="name">{node.name}</div>
  </div>
  {#if node.children && (expanded.get(node.id) ?? true)}
    {#each node.children as child (child.id)}
      {@render NodeAndChildren(child, depth + 1)}
    {/each}
  {/if}
{/snippet}

<div class="files">
  <div class="head" role="row" tabindex="0" onkeydown={(e) => keydown(e, switchExpand)} onclick={switchExpand}>
    <div class="indicator" class:expanded={expanded.get(0) ?? true}><ChevronRight width={16} height={16} /></div>
    <div class="title">{l10n.t('File change')}</div>
  </div>
  {#if expanded.get(0) ?? true}
    {#each nodes as node (node.id)}
      {@render NodeAndChildren(node, 1)}
    {/each}
  {/if}
</div>

<style lang="scss">
  .files {
    border-top: 1px solid var(--vscode-panel-border);

    > .head {
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
        padding: 0 3px;

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
  }
</style>
