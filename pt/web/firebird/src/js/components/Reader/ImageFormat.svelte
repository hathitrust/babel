<svelte:options accessors={true}></svelte:options>
<script>
	import View from './View.svelte';
	export let view;
  </script>
  
  <!-- <View format='image' {container} {startSeq} {findTarget} {currentLocation} bind:this={view}></View> -->
  <View format='image' {...$$props} bind:this={view}></View>
