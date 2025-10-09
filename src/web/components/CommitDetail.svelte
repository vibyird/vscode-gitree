<script lang="ts">
  import type { Commit } from '@/types/data'
  import FileTree from './FileTree.svelte'

  export let commit: Commit
</script>

<FileTree files={commit.files} />

<style lang="scss">
</style>
