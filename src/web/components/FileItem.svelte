<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  interface Item {
    id: number
    name: string
    children?: Item[]
    expanded?: boolean
  }

  export let item: Item
  export let selected: Item
  export let depth: number = 0

  const dispatch = createEventDispatcher<{
    'click:selected': Item
  }>()

  function click() {
    item.expanded = !item.expanded
    dispatch('click:selected', item)
  }
</script>

<button class="row" on:click={click} class:selected={selected && item.id === selected.id}>
  <div class="item" style:padding-left="{depth * 8}px">
    {#if item.children}
      <svg
        class="indicator"
        class:expanded={item.expanded}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z" />
      </svg>
    {/if}
    <div class="name">{item.name}</div>
  </div>
</button>
{#if item.children && item.expanded}
  {#each item.children as child (child.id)}
    <svelte:self {selected} item={child} depth={depth + 1} on:click:selected />
  {/each}
{/if}

<style lang="scss">
  .row {
    background: transparent;
    border: none;
    margin: 0;
    padding: 0;
    text-align: inherit;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
    word-spacing: inherit;
    text-transform: inherit;
    text-indent: inherit;
    text-shadow: inherit;
    cursor: pointer;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;
    width: 100%;
    cursor: pointer;
    user-select: none;
    position: relative;
    transition: all 0.2s ease;
    padding: 4px 8px;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &.selected {
      background: rgba(255, 255, 255, 0.1);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(to bottom, #007acc, #005a9e);
        border-radius: 0 3px 3px 0;
      }
    }

    .item {
      display: flex;
      align-items: center;
      .indicator {
        width: 16px;
        height: auto;
        &.expanded {
          transform: rotate(90deg);
          transform-box: fill-box;
          transform-origin: center;
        }
      }

      .name {
        flex: 1;
        // line-height: 22px;
        // font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
</style>
