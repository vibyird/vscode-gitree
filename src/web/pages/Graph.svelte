<script lang="ts">
  import { drag, resize } from '@/web/attachments/actions.svelte'
  import CommitDetail from '@/web/components/graph/CommitDetail.svelte'
  import CommitList from '@/web/components/graph/CommitList.svelte'
  import store from '@/web/stores/graph.svelte'
  import Loading from '../components/Loading.svelte'

  const { data, view, init, setState } = store

  const ready: boolean = $derived(data.repository ? true : false)
  const showCommit: boolean = $derived(data.commit ? true : false)
  const width: { main: string; aside: string } = $derived(view.width)

  const rect: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }

  function changeRect({ x, y, width, height }: DOMRectReadOnly): void {
    rect.x = x
    rect.y = y
    rect.width = width
    rect.height = height
  }

  function changePercent({ clientX }: MouseEvent) {
    const { x, width } = rect
    let percent = Math.round(((x + width - clientX) / width) * 10000) / 100
    if (percent < 20) {
      percent = 20
    } else if (percent > 50) {
      percent = 50
    }
    setState({ view: { width: { main: `${100 - percent}%`, aside: `${percent}%` } } })
  }

  init()
</script>

<div
  {@attach resize({ onChange: changeRect })}
  class="container"
  data-vscode-context={JSON.stringify({ preventDefaultContextMenuItems: true })}>
  {#if ready}
    <main style:width={showCommit ? width.main : '100%'}>
      <CommitList />
    </main>
    {#if showCommit}
      <aside style:width={width.aside}>
        <div {@attach drag({ onChange: changePercent })} role="button" tabindex={0} class="splitter"></div>
        <div class="data"><CommitDetail /></div>
      </aside>
    {/if}
  {:else}
    <div class="loading">
      <Loading />
    </div>
  {/if}
</div>

<style lang="scss">
  :global(body) {
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
  }

  .container {
    display: flex;
    height: 100%;
    width: 100%;

    > * {
      display: inline-flex;
      height: 100%;
    }

    .loading {
      align-items: center;
      flex: 1;
      justify-content: center;
    }

    aside {
      .splitter {
        position: relative;
        cursor: ew-resize;
        user-select: none;
        width: 0;
        height: 100%;

        &::after {
          content: '';
          position: absolute;
          width: 4px;
          height: 100%;
          z-index: 1;
        }
      }

      .data {
        width: 100%;
      }
    }
  }
</style>
