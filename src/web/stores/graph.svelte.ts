import type { ExtensionMessage, GitCommit, GitCommits, GitRef, GitRemote } from '@/types/data'
import { Runtime } from '@/web/utils/util'

interface DataState {
  repository?: string
  HEAD?: string
  branches?: GitRef[]
  tags?: GitRef[]
  remotes?: GitRemote[]
  commits?: GitCommits
  commit?: GitCommit | null
}

interface MainSectionState {
  scrollTop?: number
}

interface AsideSectionState {
  scrollTop?: number
  expanded?: [number, boolean][]
  selected?: number
}

interface ViewState {
  width?: {
    main: string
    aside: string
  }
  main?: MainSectionState | null
  aside?: AsideSectionState | null
}

interface State {
  data?: DataState | null
  view?: ViewState | null
}

function createDataStore() {
  let repository: string = $state.raw('')
  let HEAD: string = $state.raw('')
  let branches: GitRef[] = $state.raw([])
  let tags: GitRef[] = $state.raw([])
  let remotes: GitRemote[] = $state.raw([])
  let commits: GitCommits = $state.raw({ head: 0, body: [], tail: 0 })
  let commit: GitCommit | null = $state.raw(null)

  function setState(newState: DataState): void {
    if (newState.repository !== undefined) repository = newState.repository
    if (newState.HEAD !== undefined) HEAD = newState.HEAD
    if (newState.branches !== undefined) branches = newState.branches
    if (newState.tags !== undefined) tags = newState.tags
    if (newState.remotes !== undefined) remotes = newState.remotes
    if (newState.commits !== undefined) commits = newState.commits
    if (newState.commit !== undefined) commit = newState.commit
  }

  function clearState(): void {
    repository = ''
    HEAD = ''
    branches = []
    tags = []
    remotes = []
    commits = { head: 0, body: [], tail: 0 }
    commit = null
  }

  return {
    get repository() {
      return repository
    },
    get HEAD() {
      return HEAD
    },
    get branches() {
      return branches
    },
    get tags() {
      return tags
    },
    get remotes() {
      return remotes
    },
    get commits() {
      return commits
    },
    get commit() {
      return commit
    },
    setState,
    clearState,
  }
}

function createMainSectionStore() {
  let scrollTop: number = $state.raw(0)

  function setState(newState: MainSectionState): void {
    if (newState.scrollTop !== undefined) scrollTop = newState.scrollTop
  }
  function clearState(): void {
    scrollTop = 0
  }

  return {
    get scrollTop() {
      return scrollTop
    },
    setState,
    clearState,
  }
}

function createAsideSectionStore() {
  let scrollTop: number = $state.raw(0)
  let expanded: [number, boolean][] = $state.raw([])
  let selected: number = $state.raw(0)

  function setState(newState: AsideSectionState): void {
    if (newState.scrollTop !== undefined) scrollTop = newState.scrollTop
    if (newState.expanded !== undefined) expanded = newState.expanded
    if (newState.selected !== undefined) selected = newState.selected
  }

  function clearState(): void {
    scrollTop = 0
    expanded = []
    selected = 0
  }

  return {
    get scrollTop() {
      return scrollTop
    },
    get expanded() {
      return expanded
    },
    get selected() {
      return selected
    },
    setState,
    clearState,
  }
}

function createViewStore() {
  let width: { main: string; aside: string } = $state.raw({ main: '80%', aside: '20%' })

  const main = createMainSectionStore()
  const aside = createAsideSectionStore()

  function setState(newState: ViewState): void {
    if (newState.width !== undefined) width = newState.width
    if (newState.main !== undefined) {
      if (newState.main) {
        main.setState(newState.main)
      } else {
        main.clearState()
      }
    }
    if (newState.aside !== undefined) {
      if (newState.aside) {
        aside.setState(newState.aside)
      } else {
        aside.clearState()
      }
    }
  }

  function clearState(): void {
    width = { main: '80%', aside: '20%' }
    main.clearState()
    aside.clearState()
  }

  return {
    get width() {
      return width
    },
    get main() {
      return main
    },
    get aside() {
      return aside
    },
    setState,
    clearState,
  }
}

function createStore() {
  const runtime = new Runtime<State>()
  const data = createDataStore()
  const view = createViewStore()
  let inited = false
  let sequenceId = 0 // 确保commits请求不乱序

  function setState(newState: State): void {
    if (newState.data !== undefined) {
      if (newState.data) {
        data.setState(newState.data)
      } else {
        data.clearState()
      }
    }
    if (newState.view !== undefined) {
      if (newState.view) {
        view.setState(newState.view)
      } else {
        view.clearState()
      }
    }
  }

  function onMessage(message: ExtensionMessage) {
    switch (message.type) {
      case 'inited': {
        const { data } = message
        setState({ data })
        break
      }
      case 'change-repository': {
        const {
          data: { repository },
        } = message
        if (data.repository && repository && data.repository === repository) {
          break
        }
        runtime.sendMessage({
          type: 'init',
        })
        setState({ data: null, view: { main: null, aside: null } })
        break
      }
      case 'refresh': {
        runtime.sendMessage({
          type: 'init',
        })
        setState({ data: null, view: { main: null, aside: null } })
        break
      }
      case 'commits': {
        const { data } = message
        if (data.sequenceId < sequenceId) {
          break
        }
        setState({ data })
        break
      }
      case 'commit': {
        const { data } = message
        setState({ data, view: { aside: null } })
        break
      }
    }
  }

  function persistState() {
    const { repository, HEAD, branches, tags, remotes, commits, commit } = data
    const {
      width,
      main: { scrollTop: mainScrollTop },
      aside: { scrollTop: asideScrollTop, expanded: asideExpanded, selected: asideSelected },
    } = view

    runtime.setState({
      data: {
        repository,
        HEAD,
        branches,
        tags,
        remotes,
        commits,
        commit,
      },
      view: {
        width,
        main: {
          scrollTop: mainScrollTop,
        },
        aside: {
          scrollTop: asideScrollTop,
          expanded: Array.from(asideExpanded),
          selected: asideSelected,
        },
      },
    })
  }

  function init() {
    if (inited) {
      return
    }
    inited = true

    runtime.onMessage(onMessage)

    const state = runtime.getState()
    if (state) {
      setState(state)
    } else {
      runtime.sendMessage({
        type: 'init',
      })
    }

    $effect(() => {
      persistState()
    })
  }

  function getCommit(hash: string): void {
    runtime.sendMessage({
      type: 'get_commit',
      params: {
        hash,
      },
    })
  }

  function getCommits({ start, end }: { start: number; end: number }): void {
    sequenceId++
    runtime.sendMessage({
      type: 'get_commits',
      params: {
        sequenceId,
        start,
        end,
      },
    })
  }

  return {
    get data() {
      return data
    },
    get view() {
      return view
    },
    init,
    setState,
    getCommit,
    getCommits,
  }
}

export default createStore()
