<script lang="ts">
  import type { Commit, PanelState } from '@/types/data'
  import CommitDetail from '@web/components/CommitDetail.svelte'
  import CommitList from '@web/components/CommitList.svelte'
  import { drag } from '@web/utils/drag'
  import { Runtime } from '@web/utils/runtime'
  import { tick } from 'svelte'

  export let runtime: Runtime<PanelState>

  let percent: {
    aside: number
  } = { aside: 20 }
  let scrollTop: {
    main: number
    aside: number
  } = { main: 0, aside: 0 }

  let commits: Commit[] = []
  let commit: Commit = null

  function setState(callback: () => void): void {
    callback()
    runtime.setState({
      percent,
      scrollTop,
      commits,
      commit,
    })
  }

  runtime.onMessage((message) => {
    switch (message.type) {
      case 'commits': {
        setState(() => {
          commits = message.data
        })
        break
      }
      case 'refresh': {
        window.scrollTo(0, 0)
        commits = []
        commit = null
        runtime.sendMessage({
          type: 'init',
        })
        break
      }
      case 'commit': {
        setState(() => {
          commit = message.data
        })
        break
      }
    }
  })

  let containerElement: HTMLElement
  let mainElement: HTMLElement
  let asideElemnt: HTMLElement

  function scroll(e: Event) {
    const element = e.currentTarget as HTMLElement
    if (element === mainElement) {
      setState(() => {
        scrollTop.main = element.scrollTop
      })
    } else if (element === asideElemnt) {
      setState(() => {
        scrollTop.aside = element.scrollTop
      })
    }
  }

  const dragSplitter = drag((e: MouseEvent) => {
    const { clientX } = e
    const { left, width } = containerElement.getBoundingClientRect()
    let asidePercent = parseInt((((left + width - clientX) / width) * 100).toFixed())
    if (asidePercent < 20) {
      asidePercent = 20
    } else if (asidePercent > 50) {
      asidePercent = 50
    }
    setState(() => {
      percent.aside = asidePercent
    })
  })

  function clickCommit({ detail: commit }: CustomEvent<Commit>) {
    runtime.sendMessage({
      type: 'get_commit',
      params: {
        hash: commit.hash,
      },
    })
  }

  const state = runtime.getState()
  if (state) {
    percent = state.percent || { aside: 20 }
    scrollTop = state.scrollTop || { main: 0, aside: 0 }
    commits = state.commits || []
    commit = state.commit || null
    tick().then(() => {
      const { main, aside } = scrollTop
      mainElement.scrollTop = main
      if (commit) {
        asideElemnt.scrollTop = aside
      }
    })
  } else {
    runtime.sendMessage({
      type: 'init',
    })
  }
</script>

<div bind:this={containerElement} class="container">
  <main bind:this={mainElement} on:scroll={scroll}>
    <CommitList {commits} on:click:commit={clickCommit}></CommitList>
  </main>
  {#if commit}
    <div role="button" tabindex={0} class="splitter" on:mousedown={dragSplitter} />
    <aside bind:this={asideElemnt} on:scroll={scroll} style="flex: 0 0 {percent.aside}%">
      <CommitDetail {commit}></CommitDetail>
    </aside>
  {/if}
</div>

<style lang="scss">
  .container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    main {
      flex: 1 1 auto;
      height: 100%;
      overflow-y: auto;
    }
    aside {
      flex: 0 0 20%;
      height: 100%;
      overflow-y: auto;
    }

    .splitter {
      position: relative;
      flex: 0 0 1px;
      background: #c0c0c0;
      cursor: col-resize;
      user-select: none;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: -4px;
        right: -4px;
        z-index: 1;
      }

      &:hover::before {
        background: rgba(0, 0, 0, 0.05);
      }
    }
  }
</style>
