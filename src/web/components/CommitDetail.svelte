<script lang="ts">
  import type { Commit } from '@/types/data'
  import FileTree from '@web/components/FileTree.svelte'

  export let commit: Commit

  let lastCommit: Commit
  let fileTreeExpanded = true

  function selectFileTree() {
    fileTreeExpanded = !fileTreeExpanded
  }
  $: {
    if (commit && (!lastCommit || lastCommit.hash !== commit.hash)) {
      fileTreeExpanded = true
    }
    lastCommit = commit
  }
</script>

<div class="title">{window.l10n.t('Commit Detail')}</div>
<div class="meta">
  <span class="label">Author:</span>
  <span>{commit.authorName} &lt;{commit.authorEmail}&gt;</span>
  <span class="label">Date:</span>
  <span>{commit.commitDate}</span>
</div>
<pre>
    {commit.message}
</pre>
<div class="border" />
<FileTree title="File change" files={commit.files} expanded={fileTreeExpanded} on:select={selectFileTree} />

<style lang="scss">
  .title {
    height: 28px;
    line-height: 28px;
    position: sticky;
    top: 0;
    z-index: 1;
    padding-left: 8px;
    font-weight: bold;
    background-color: var(--vscode-panel-background);
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .meta {
    display: grid;
    grid-template-columns: 4.5em 1fr;
    gap: 0 0.5em;
    padding-left: 8px;

    span {
      height: 22px;
      line-height: 22px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label {
      font-weight: bold;
    }
  }

  .border {
    border-bottom: 1px solid var(--vscode-panel-border);
  }
</style>
