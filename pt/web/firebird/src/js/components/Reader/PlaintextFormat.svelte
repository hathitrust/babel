<script>
  import View from './View.svelte';
  let { view, ...rest } = $props();
</script>

<View format="plaintext" {...rest} bind:this={view}></View>
