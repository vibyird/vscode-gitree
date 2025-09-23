<script lang="ts">
  import { DataTable } from 'carbon-components-svelte'
  import type { DataTableHeader } from 'carbon-components-svelte/src/DataTable/DataTable.svelte'

  interface Row {
    id: string
    message: string
    authorDate: Date
  }
  const headers: DataTableHeader<Row>[] = [
    { key: 'message', value: l10n.t('Commit Message') },
    { key: 'authorDate', value: l10n.t('Commit Date') },
  ]
  let rows: Row[]

  runtime.onMessage((message) => {
    switch (message.type) {
      case 'commits': {
        const data = message.data
        rows = data.map((item) => {
          return {
            id: item.hash,
            message: item.message,
            authorDate: item.authorDate,
          }
        })
        break
      }
    }
  })

  runtime.sendMessage({
    type: 'init',
  })
</script>

<DataTable {headers} {rows}></DataTable>
