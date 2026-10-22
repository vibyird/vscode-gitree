<script lang="ts">
  const {
    width = 40,
    height = 40,
    color = '#0e70c0',
  }: {
    width?: number
    height?: number
    color?: string
  } = $props()
</script>

<svg {width} {height} viewBox="0 0 16 16" class="loading" part="loading">
  <circle class="background" part="background" cx="8px" cy="8px" r="7px"></circle>
  <circle class="indicator" part="indicator" cx="8px" cy="8px" r="7px" style:stroke={color}></circle>
</svg>

<style lang="scss">
  .loading {
    display: block;
    flex: none;

    .background {
      fill: none;
      stroke: transparent;
      stroke-width: 2px;
    }

    .indicator {
      fill: none;
      stroke-width: 2px;
      stroke-linecap: square;
      transform-origin: 50% 50%;
      transform: rotate(-90deg);
      transition: all 0.2s ease-in-out;
      animation: spin-infinite 2s linear infinite;
    }
  }

  @keyframes spin-infinite {
    0% {
      stroke-dasharray: 0.01px 43.97px;
      transform: rotate(0deg);
    }
    50% {
      stroke-dasharray: 21.99px 21.99px;
      transform: rotate(450deg);
    }
    100% {
      stroke-dasharray: 0.01px 43.97px;
      transform: rotate(1080deg);
    }
  }
</style>
