<script lang="ts">
  import { GRAPH_COLORS, GRAPH_ITEM_HEIGHT } from '@/states/constants'
  import type { GitCommit, GitCommits } from '@/types/data'
  import { resize, scroll } from '@/web/attachments/actions.svelte'
  import Vm from '@/web/icons/Vm.svelte'
  import VmActive from '@/web/icons/VmActive.svelte'
  import store from '@/web/stores/graph.svelte'
  import { keydown } from '@/web/utils/event'
  import { formatDate } from '@/web/utils/util'
  import * as l10n from '@vscode/l10n'
  import { untrack } from 'svelte'
  import CommitTree from './CommitTree.svelte'

  const { locale } = config

  const { data, view, setState, getCommit, getCommits } = store

  const HEAD: string = $derived(data.HEAD)
  const commits: GitCommits = $derived(data.commits)
  const selectedHash: string = $derived(data.commit?.hash ?? '')
  const scrollTop: number = $derived(view.main.scrollTop)

  const render: { y: number; height: number } = $state({
    y: 0,
    height: 0,
  })

  function changeScrollTop(scrollTop: number) {
    const { y, height } = render
    if (scrollTop < y - height) {
      render.y = Math.min(scrollTop, y - height)
    } else if (scrollTop > y + height) {
      render.y = Math.max(scrollTop, y + height)
    }

    setState({ view: { main: { scrollTop } } })
  }

  function changeRect({ height }: DOMRectReadOnly): void {
    if (height > render.height) {
      render.height = (Math.ceil(height / GRAPH_ITEM_HEIGHT) + 5) * GRAPH_ITEM_HEIGHT
    }
  }

  function selectCommit(commit: GitCommit): void {
    if (selectedHash !== commit.hash) {
      getCommit(commit.hash)
    }
  }

  function cancelSelectCommit(commit: GitCommit): void {
    if (selectedHash && selectedHash === commit.hash) {
      setState({ data: { commit: null }, view: { aside: null } })
    }
  }

  $effect(() => {
    const { y, height } = render

    const { top, bottom, length } = untrack(() => ({
      top: commits.head,
      bottom: commits.head + commits.body.length,
      length: commits.head + commits.body.length + commits.tail,
    }))

    const start = Math.max(Math.floor((y - height) / GRAPH_ITEM_HEIGHT), 0)
    const end = Math.min(Math.ceil((y + 2 * height) / GRAPH_ITEM_HEIGHT), length)

    if (height === 0 || (start >= top && end <= bottom)) {
      // 渲染高度还没有初始化或者当前区间已经包含了新请求的区间，不再拉取新的数据
      return
    }

    getCommits({
      start,
      end,
    })
  })
</script>

<div class="container" role="table">
  <div class="head">
    <div class="group head-section" role="row">
      <div class="cell" role="columnheader">
        <span>{l10n.t('Branch / Tag')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{l10n.t('Tree')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{l10n.t('Message')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{l10n.t('Author')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{l10n.t('Commit Date')}</span>
      </div>
      <div class="cell" role="columnheader">
        <span>{l10n.t('Hash')}</span>
      </div>
    </div>
  </div>
  <div
    {@attach scroll({ value: scrollTop, onChange: changeScrollTop })}
    {@attach resize({ onChange: changeRect })}
    class="data"
    style:grid-auto-rows="{GRAPH_ITEM_HEIGHT}px">
    {#if commits.head}
      {@const start = 0}
      {@const end = start + commits.head}
      <div style:grid-area="{start + 1} / 1 / {end + 1} / -1"></div>
    {/if}
    {#each commits.body as item (item.index)}
      {@const commit = item.commit}
      {@const color = GRAPH_COLORS[item.tree.index % GRAPH_COLORS.length]}
      {@const tree = item.tree}
      <div class="group ref-section">
        <div class="cell refs" role="cell">
          {#if item.branches.length}
            <div class="ref">
              <div
                class="layer-0"
                role="row"
                tabindex="0"
                data-vscode-context={JSON.stringify({ webviewSection: 'commit', ref: item.branches[0].name })}
                onkeydown={(e) => keydown(e, () => selectCommit(commit))}
                onclick={() => selectCommit(commit)}
                ondblclick={() => cancelSelectCommit(commit)}>
                <div class="icon">
                  {#if commit.hash === HEAD}
                    <VmActive width={16} height={16} />
                  {:else}
                    <Vm width={16} height={16} />
                  {/if}
                </div>
                <span>{item.branches.length ? item.branches[0].name : ''}</span>
              </div>
              <div class="layer-1" style:opacity={selectedHash && commit.hash === selectedHash ? 0.1 : 0.5}></div>
              <div class="layer-2" style:background-color={color}></div>
            </div>
            <div
              style:flex="1 1 auto"
              style:height="{commit.hash === HEAD ? 2 : 1}px"
              style:background-color={color}
              style:opacity={commit.hash === HEAD ? 1 : 0.25}>
            </div>
          {/if}
        </div>
        <div class="cell tree" role="cell">
          <div class="layer-0">
            <div style:flex="0 1 {(tree.index + 0.5) * 24}px"></div>
            <div
              role="row"
              tabindex="0"
              style:flex="1 1 auto"
              style:height="100%"
              style:border-right="2px solid {color}"
              onkeydown={(e) => keydown(e, () => selectCommit(commit))}
              onclick={() => selectCommit(commit)}
              ondblclick={() => cancelSelectCommit(commit)}>
            </div>
          </div>
          <div class="layer-1">
            <CommitTree refs={tree.refs} index={tree.index} height={GRAPH_ITEM_HEIGHT} width={24} />
          </div>
          <div class="layer-2">
            <div
              style:width="{(tree.index + 0.5) * 24}px"
              style:height="{item.branches.length ? (commit.hash === HEAD ? 2 : 1) : 0}px"
              style:background-color={color}
              style:opacity={commit.hash === HEAD ? 1 : 0.25}>
            </div>
            <div
              style:flex="1 1 auto"
              style:height="100%"
              style:background-color={color}
              style:opacity={selectedHash && commit.hash === selectedHash ? 0.5 : 0.1}>
            </div>
          </div>
        </div>
      </div>
      <div
        class="group commit-section"
        class:selected={selectedHash && commit.hash === selectedHash}
        role="row"
        tabindex="0"
        data-vscode-context={JSON.stringify({ webviewSection: 'commit', ref: commit.hash })}
        onkeydown={(e) => keydown(e, () => selectCommit(commit))}
        onclick={() => selectCommit(commit)}
        ondblclick={() => cancelSelectCommit(commit)}>
        <div class="cell" role="cell">
          <span>{commit.message}</span>
        </div>
        <div class="cell" role="cell">
          <span>{commit.authorName}</span>
        </div>
        <div class="cell" role="cell">
          <span>{formatDate(commit.commitDate, locale)}</span>
        </div>
        <div class="cell" role="cell">
          <span>{commit.hash.slice(0, 7)}</span>
        </div>
      </div>
    {/each}
    {#if commits.tail}
      {@const start = commits.head + commits.body.length}
      {@const end = start + commits.tail}
      <div style:grid-area="{start + 1} / 1 / {end + 1} / -1"></div>
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    display: grid;
    grid-template-columns: 16% 16% 32% 10% 16% 10%;
    grid-template-rows: 28px 1fr;
    height: 100%;
    width: 100%;

    .group {
      display: contents;

      .cell {
        display: inline-flex;
        position: relative;
        align-items: center;
        width: 100%;
        height: 22px;
        line-height: 22px;

        > {
          div {
            display: inline-flex;
            align-items: center;
          }
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .head-section {
      .cell {
        > span {
          padding-left: 3px;
        }
      }
    }

    .ref-section {
      .refs {
        padding-left: 3px;
        width: calc(100% - 3px);

        .ref {
          position: relative;
          max-width: 100%;
          cursor: pointer;
          user-select: none;

          .layer-0 {
            box-sizing: border-box;
            width: 100%;
            padding: 0 5px;
            display: inline-flex;
            align-items: center;
            border-radius: 2px;

            .icon {
              display: inline-flex;
              align-items: center;
              margin-right: 3px;
            }
          }

          .layer-1 {
            position: absolute;
            z-index: -1;
            width: 100%;
            height: 100%;
            background-color: black;
            border-radius: 2px;
          }

          .layer-2 {
            position: absolute;
            z-index: -2;
            width: 100%;
            height: 100%;
            border-radius: 2px;
          }
        }
      }

      .tree {
        .layer-0 {
          width: 100%;
          height: 100%;

          > * {
            box-sizing: border-box;
            cursor: pointer;
            user-select: none;
          }
        }

        .layer-1 {
          position: absolute;
          z-index: -1;
          width: 100%;
          height: 100%;
        }

        .layer-2 {
          position: absolute;
          z-index: -2;
          width: 100%;
          height: 100%;
        }
      }
    }

    .commit-section {
      .cell {
        cursor: pointer;

        > span {
          padding-left: 3px;
        }
      }

      &:hover {
        .cell {
          color: var(--vscode-list-hoverForeground);
          background-color: var(--vscode-list-hoverBackground);
        }
      }

      &.selected {
        .cell {
          color: var(--vscode-list-activeSelectionForeground);
          background-color: var(--vscode-list-activeSelectionBackground);
        }
      }
    }

    > {
      * {
        grid-column: 1 / -1;
        display: grid;
        width: 100%;
        grid-template-columns: subgrid;
        align-items: center;
      }

      .head {
        position: sticky;
        y: 0;
        z-index: 1;
        font-weight: bold;
        background-color: var(--vscode-panel-background);
        border-bottom: 1px solid var(--vscode-panel-border);
      }

      .data {
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: thin;
      }
    }
  }
</style>
