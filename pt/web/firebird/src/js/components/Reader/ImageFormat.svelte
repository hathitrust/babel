<script>
  console.log('hi from imageformat!');
  import View from './View.svelte';
  let { view, ...rest } = $props();
  export function item() {
    view.item();
  }
</script>

<!-- <View format='image' {container} {startSeq} {findTarget} {currentLocation} bind:this={view}></View> -->
<View format="image" {...rest} bind:this={view}></View>
