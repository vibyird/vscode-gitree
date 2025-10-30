<script lang="ts">
  import type { Config, GitCommit, GitRef, GitRemote } from '@/types/data'
  import CommitDetail from '@web/components/CommitDetail.svelte'
  import CommitList from '@web/components/CommitList.svelte'
  import { drag } from '@web/utils/event'
  import { runtime } from '@web/utils/util'
  import { onMount } from 'svelte'

  export let config: Config

  runtime.init(config)

  let scrollTop: number = 0
  let sectionWidth: {
    main: string
    aside: string
  } = { main: '80%', aside: '20%' }
  let HEAD: string = ''
  let branches: GitRef[] = []
  let tags: GitRef[] = []
  let remotes: GitRemote[] = []
  let commits: GitCommit[] = []
  let commit: GitCommit = null

  function initState(): void {
    const state = runtime.state.graph
    if (state) {
      scrollTop = state.scrollTop || 0
      sectionWidth = state.sectionWidth || { main: '80%', aside: '20%' }
      HEAD = state.HEAD || ''
      branches = state.branches || []
      tags = state.tags || []
      remotes = state.remotes || []
      commits = state.commits || []
      commit = state.commit || null
    } else {
      runtime.sendMessage({
        type: 'init',
      })
    }
  }

  function setState(callback: () => void): void {
    callback()
    runtime.state.graph = {
      scrollTop,
      sectionWidth,
      HEAD,
      branches,
      tags,
      remotes,
      commits,
      commit,
    }
  }

  runtime.onMessage((message) => {
    switch (message.type) {
      case 'init': {
        setState(() => {
          const data = message.data
          HEAD = data.HEAD
          branches = data.branches
          tags = data.tags
          remotes = data.remotes
          commits = data.commits
        })
        break
      }
      case 'refresh': {
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

  function setScrollTop(value: number): void {
    setState(() => {
      scrollTop = value
    })
  }

  const view: { left: number; width: number } = {
    left: 0,
    width: 0,
  }

  function setAsideWidth(e: MouseEvent) {
    const { clientX } = e
    const { left, width } = view
    let percent = Math.round(((left + width - clientX) / width) * 10000) / 100
    if (percent < 20) {
      percent = 20
    } else if (percent > 50) {
      percent = 50
    }
    setState(() => {
      sectionWidth = {
        main: `${100 - percent}%`,
        aside: `${percent}%`,
      }
    })
  }

  function selectCommit(hash: string) {
    if (!hash) {
      setState(() => {
        commit = null
      })
      return
    }
    runtime.sendMessage({
      type: 'get_commit',
      params: {
        hash,
      },
    })
  }

  initState()

  let element: HTMLElement

  onMount(() => {
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { left, width } = entry.contentRect
        view.left = left
        view.width = width
      }
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  })
</script>

<div
  bind:this={element}
  class="container"
  data-vscode-context={JSON.stringify({ preventDefaultContextMenuItems: true })}>
  <main style:width={commit ? sectionWidth.main : '100%'}>
    <CommitList
      {HEAD}
      {branches}
      {tags}
      {remotes}
      {commits}
      {scrollTop}
      selected={commit?.hash ?? ''}
      on:scroll={(e) => setScrollTop(e.detail)}
      on:select={(e) => selectCommit(e.detail)} />
  </main>
  {#if commit}
    <aside style:width={sectionWidth.aside}>
      <div role="button" tabindex={0} class="splitter" on:mousedown={() => drag(setAsideWidth)} />
      <div class="data"><CommitDetail {commit} /></div>
    </aside>
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
