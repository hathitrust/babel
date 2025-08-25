<script>
  import View from './View.svelte';
  let { view, ...rest } = $props();
  export function item() {
    view.item();
  }
</script>

<View format="plaintext" {...rest} bind:this={view}></View>
