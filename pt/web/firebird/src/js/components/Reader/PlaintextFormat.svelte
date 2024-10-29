<svelte:options accessors={true}></svelte:options>
<script>
	import View from './View.svelte';
	export let view;
</script>

<View format='plaintext' {...$$props} bind:this={view}></View>