<script lang="ts">
  import type { GitCommit } from '@/types/data'
  import { scroll } from '@/web/attachments/actions.svelte'
  import store from '@/web/stores/graph.svelte'
  import { formatDate } from '@/web/utils/util'
  import * as l10n from '@vscode/l10n'
  import CommitFile from './CommitFile.svelte'

  const { locale } = config

  const { data, view, setState } = store

  const commit: GitCommit | null = $derived(data.commit)
  const scrollTop: number = $derived(view.aside.scrollTop)

  function changeScrollTop(scrollTop: number) {
    setState({ view: { aside: { scrollTop } } })
  }
</script>

<div class="container">
  {#if commit}
    <div class="head">{l10n.t('Commit Detail')}</div>
    <div {@attach scroll({ value: scrollTop, onChange: changeScrollTop })} class="data">
      <div class="meta">
        <span class="label">{l10n.t('Author')}:</span>
        <span>{commit.authorName} &lt;{commit.authorEmail}&gt;</span>
        <span class="label">{l10n.t('Commit Date')}:</span>
        <span>{formatDate(commit.commitDate, locale)}</span>
        <span class="label">{l10n.t('Hash')}:</span>
        <span>{commit.hash}</span>
        <pre class="message">{commit.message}</pre>
      </div>
      {#if commit.files && commit.files.length}
        <CommitFile files={commit.files} />
      {/if}
    </div>
  {/if}
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
  }
</style>
