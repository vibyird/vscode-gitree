<script lang="ts">
  import type { Commit } from '@/types/data'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{
    'click:commit': Commit
  }>()

  const headers: {
    key: string
    value: string
  }[] = [
    { key: 'message', value: l10n.t('Commit Message') },
    { key: 'authorDate', value: l10n.t('Commit Date') },
  ]

  export let commits: Commit[]

  function clickRow(commit: Commit) {
    dispatch('click:commit', commit)
  }
</script>

<table>
  <th>
    {#each headers as header (header.key)}
      <td>{header.value}</td>
    {/each}
  </th>
  {#each commits as commit (commit.hash)}
    <tr on:click={() => clickRow(commit)}>
      <td>{commit.message}</td>
      <td>{commit.authorDate}</td>
    </tr>
  {/each}
</table>
