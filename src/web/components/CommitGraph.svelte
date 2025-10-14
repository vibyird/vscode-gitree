<script lang="ts">
  const colors: string[] = [
    'rgba(21, 160, 191, 1)',
    'rgba(6, 105, 247, 1)',
    'rgba(142, 0, 194, 1)',
    'rgba(197, 23, 182, 1)',
  ]

  interface Ref {
    index: number
    inited: boolean
    continued: boolean
    branched: boolean
    merged: boolean
  }

  export let width: number = 22
  export let height: number = 28
  export let radius: number = 8

  export let refs: Ref[]
  export let index: number

  const w = width
  const h = height
  const r = radius
  const x1 = (0.5 + index) * w
</script>

<svg width="100%" {height} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
  {#each refs as ref (ref.index)}
    {@const color = colors[ref.index % colors.length]}
    {@const x2 = (0.5 + ref.index) * w}
    <g fill="none" shape-rendering="auto" stroke-linejoin="round" stroke-width="2" stroke={color}>
      {#if ref.index === index}
        {#if ref.continued}
          <path d="M {x1} 0 V {h / 2}" />
        {/if}
        {#if !ref.inited}
          <path d="M {x1} {h / 2} V {h}" />
        {/if}
      {:else if ref.branched}
        {#if ref.index > index}
          <path d="M {x2} 0 V {h / 2 - r} A {r} {r} 0 0 1 {x2 - r} {h / 2} H {x1}" />
        {:else}
          <path d="M {x2} 0 V {h / 2 - r} A {r} {r} 0 0 0 {x2 + r} {h / 2} H {x1}" />
        {/if}
      {:else}
        {#if ref.merged}
          {#if ref.index > index}
            <path d="M {x1} {h / 2} H {x2 - r} A {r} {r} 0 0 1 {x2} {h / 2 + r} V {h}" />
          {:else}
            <path d="M {x1} {h / 2} H {x2 + r} A {r} {r} 0 0 0 {x2} {h / 2 + r} V {h}" />
          {/if}
        {/if}
        {#if ref.continued}
          <path d="M {x2} 0 V {h}" />
        {/if}
      {/if}
    </g>
  {/each}
</svg>
