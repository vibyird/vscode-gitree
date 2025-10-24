<script lang="ts">
  import type { GitCommit } from '@/types/data'
  import CommitFile from '@web/components/CommitFile.svelte'
  import ChevronRight from '@web/icons/ChevronRight.svelte'
  import { keydown } from '@web/utils/event'
  import runtime from '@web/utils/runtime'
  import { formatDate } from '@web/utils/util'

  const config = runtime.config

  export let commit: GitCommit

  let lastCommit: GitCommit
  let filesExpanded = true

  function switchFilesExpand() {
    filesExpanded = !filesExpanded
  }

  interface File {
    id: number
    name: string
    status?: string
    children?: File[]
    expanded?: boolean
  }

  let files: File[] = []
  let selectedFile: File = null

  function selectFile(file: File) {
    selectedFile = file
  }

  function mergeFile(file: File): File {
    if (file.children && file.children.length === 1) {
      const [child] = file.children
      if (child.children) {
        child.name = `${file.name}/${child.name}`
        return child
      }
    }
    return file
  }

  function sortFile(a: File, b: File): number {
    if (!!a.children !== !!b.children) {
      return b.children ? 1 : -1
    }
    return a.name.localeCompare(b.name)
  }

  function optimizeFiles(files: File[]): File[] {
    return files
      .map((file: File) => {
        if (file.children) {
          file.children = optimizeFiles(file.children)
        }
        return file
      })
      .map(mergeFile)
      .sort(sortFile)
  }

  let element: HTMLDivElement

  $: {
    if (!lastCommit || (commit && lastCommit.hash !== commit.hash)) {
      let id = 1
      files = []
      for (const { path, status } of commit.files) {
        const names = path.split('/').filter(Boolean)
        for (let i = 0, children = files; i < names.length; i++) {
          const name = names[i]
          let child = children.find((child) => child.name === name)
          if (!child) {
            child = { id: id++, name }
            children.push(child)
          }
          if (i < names.length - 1) {
            if (!child.children) {
              child.expanded = true
              child.children = []
            }
            children = child.children
          } else {
            child.status = status
          }
        }
      }
      files = optimizeFiles(files)
      filesExpanded = true
      if (element) {
        element.scrollTop = 0
      }
      lastCommit = commit
    }
  }
</script>

<div class="container">
  <div class="head">{window.l10n.t('Commit Detail')}</div>
  <div class="data" bind:this={element}>
    <div class="meta">
      <span class="label">{window.l10n.t('Author')}:</span>
      <span>{commit.authorName} &lt;{commit.authorEmail}&gt;</span>
      <span class="label">{window.l10n.t('Commit Date')}:</span>
      <span>{formatDate(commit.commitDate, config.language)}</span>
      <span class="label">{window.l10n.t('Hash')}:</span>
      <span>{commit.hash}</span>
      <pre class="message">{commit.message}</pre>
    </div>
    {#if files.length}
      <div class="files">
        <div
          class="head"
          role="row"
          tabindex="0"
          on:keydown={(e) => keydown(e, switchFilesExpand)}
          on:click={switchFilesExpand}>
          <div class="indicator" class:expanded={filesExpanded}><ChevronRight width={16} height={16} /></div>
          <div class="title">File change</div>
        </div>
        {#if filesExpanded}
          {#each files as file (file.id)}
            <CommitFile {file} selected={selectedFile} depth={1} on:select={(e) => selectFile(e.detail)} />
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    > .head {
      box-sizing: border-box;
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

    > .data {
      overflow-y: auto;
      scrollbar-width: thin;
      flex: 1;
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

      pre {
        white-space: pre-wrap;
      }

      .label {
        font-weight: bold;
      }

      .message {
        grid-column: 1 / -1;
      }
    }

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
    }
  }
</style>
