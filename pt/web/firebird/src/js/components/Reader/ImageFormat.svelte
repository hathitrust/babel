<script>
  import View from './View.svelte';
  let props = $props();
  // export let view;
</script>

<!-- <View format='image' {container} {startSeq} {findTarget} {currentLocation} bind:this={view}></View> -->
<View format="image" bind:this={view}></View>
