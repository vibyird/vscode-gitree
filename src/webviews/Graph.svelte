<script lang="ts">
  import type { CommitRow, PanelState } from '@/types/data'
  import { acquireRuntime } from '@/utils/webview'
  import { DataTable } from 'carbon-components-svelte'
  import type { DataTableHeader } from 'carbon-components-svelte/src/DataTable/DataTable.svelte'
  import { tick } from 'svelte'

  let scrollY: number = 0
  const headers: DataTableHeader<CommitRow>[] = [
    { key: 'message', value: l10n.t('Commit Message') },
    { key: 'authorDate', value: l10n.t('Commit Date') },
  ]
  let commitRows: CommitRow[] = []

  const runtime = acquireRuntime<PanelState>()

  function setState(callback: () => void): void {
    callback()
    runtime.setState({
      scrollY,
      commitRows,
    })
  }

  runtime.onMessage((message) => {
    switch (message.type) {
      case 'commits': {
        setState(() => {
          commitRows = message.data.map((item) => {
            return {
              id: item.hash,
              message: item.message,
              authorDate: item.authorDate,
            }
          })
        })
        break
      }
      case 'refresh': {
        window.scrollTo(0, 0)
        runtime.sendMessage({
          type: 'init',
        })
      }
    }
  })

  window.addEventListener('scroll', () =>
    setState(() => {
      scrollY = window.scrollY
    }),
  )

  const state = runtime.getState()
  if (state) {
    scrollY = state.scrollY
    commitRows = state.commitRows
    tick().then(() => {
      window.scrollTo(0, scrollY)
    })
  } else {
    runtime.sendMessage({
      type: 'init',
    })
  }
</script>

<DataTable {headers} rows={commitRows}></DataTable>
