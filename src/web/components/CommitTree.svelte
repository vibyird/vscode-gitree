<script lang="ts">
  interface Ref {
    index: number
    color: string
    inited: boolean
    continued: boolean
    branched: boolean
    merged: boolean
    stash: boolean
  }

  export let refs: Ref[]
  export let index: number

  export let width: number = 24
  export let height: number = 24
  export let radius: number = 12

  const r = radius > 8 ? radius : 8
  const w = width > r * 2 ? width : r * 2
  const h = height > r * 2 ? height : r * 2
  const x1 = (0.5 + index) * w

  $: {
    refs.sort((a: Ref, b: Ref) => Math.abs(b.index - index) - Math.abs(a.index - index))
  }
</script>

<svg width="100%" {height} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
  {#each refs as ref (ref.index)}
    {@const x2 = (0.5 + ref.index) * w}
    {@const dasharray = ref.stash ? 2 : 0}
    <g
      fill="none"
      shape-rendering="auto"
      stroke-linejoin="round"
      stroke-dasharray={dasharray}
      stroke-width="2"
      stroke={ref.color}>
      <!-- Draw lines to show ref and commit relationship. -->
      {#if ref.branched}
        {#if ref.index > index}
          <path d="M {x1} {h / 2} H {x2 - r} A {r} {r} 0 0 0 {x2} {h / 2 - r} V {0}" />
        {:else}
          <path d="M {x1} {h / 2} H {x2 + r} A {r} {r} 0 0 1 {x2} {h / 2 - r} V {0}" />
        {/if}
      {/if}
      {#if ref.merged}
        {#if ref.index > index}
          <path d="M {x1} {h / 2} H {x2 - r} A {r} {r} 0 0 1 {x2} {h / 2 + r} V {h}" />
        {:else}
          <path d="M {x1} {h / 2} H {x2 + r} A {r} {r} 0 0 0 {x2} {h / 2 + r} V {h}" />
        {/if}
      {/if}
      <!-- Draw ref lines. -->
      {#if ref.continued}
        {#if !ref.inited || ref.index === index}
          <path d="M {x2} {h / 2} V {0}" />
        {/if}
      {/if}
      {#if !ref.inited}
        {#if ref.continued || ref.index === index}
          <path d="M {x2} {h / 2} V {h}" />
        {/if}
      {/if}
    </g>
    {#if ref.index === index}
      <!-- Draw commit node. -->
      <circle cx={x2} cy={h / 2} r="6" fill={ref.color} />
    {/if}
  {/each}
</svg>
