<script>
	import { getContext } from 'svelte';
	import View from './View.svelte';

	const manifest = getContext('manifest');
	const currentSeq = manifest.currentSeq;

	export let container;
	export let startSeq = 1;
	export let view;

	export const currentLocation = function () {
	  return { page: view.item($currentSeq) };
	};
</script>

<View format='plaintext' {container} {startSeq} {currentLocation} bind:this={view}></View>