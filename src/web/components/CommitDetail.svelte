<script lang="ts">
  import type { Commit } from '@/types/data'
  import { TreeView } from 'carbon-components-svelte'

  export let commit: Commit

  interface Node {
    id: number
    text: string
    nodes?: Node[]
    expanded?: boolean
  }

  let nodes: Node[] = []

  $: {
    let id = 0
    nodes = []
    for (const { path } of commit.files) {
      const names = path.split('/').filter(Boolean)
      for (let i = 0, chidren = nodes; i < names.length; i++) {
        const name = names[i]
        let child = chidren.find((child) => child.text === name)
        if (!child) {
          child = { id: id++, text: name }
          chidren.push(child)
        }
        if (i < names.length - 1) {
          if (!child.nodes) {
            child.expanded = true
            child.nodes = []
          }
          chidren = child.nodes
        }
      }
    }
  }
</script>

<TreeView labelText="Changes" {nodes} size="compact"></TreeView>
