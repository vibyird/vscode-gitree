<script lang="ts">
  import type { Commit } from '@/types/data'
  import { DataTable } from 'carbon-components-svelte'
  import type { DataTableHeader } from 'carbon-components-svelte/src/DataTable/DataTable.svelte'
  import { createEventDispatcher } from 'svelte'

  interface Row {
    id: string
    message: string
    authorDate: string
  }

  const dispatch = createEventDispatcher<{
    'click:commit': Commit
  }>()

  const headers: DataTableHeader<Row>[] = [
    { key: 'message', value: l10n.t('Commit Message') },
    { key: 'authorDate', value: l10n.t('Commit Date') },
  ]

  export let commits: Commit[]

  let rows: Row[]

  function clickRow({ detail: row }: CustomEvent<Row>) {
    dispatch(
      'click:commit',
      commits.find((commit) => commit.hash === row.id),
    )
  }

  $: {
    rows = commits.map((item) => {
      return {
        id: item.hash,
        message: item.message,
        authorDate: item.authorDate,
      }
    })
  }
</script>

<DataTable {headers} {rows} on:click:row={clickRow}></DataTable>
