<script>
  import { getContext } from 'svelte';
  import ImageFormat from './ImageFormat.svelte';
	import PlaintextFormat from './PlaintextFormat.svelte'

  const manifest = getContext('manifest');
  let view;

  export let container;
	export let startSeq = 1;

  const formats = {};
	formats['image'] = ImageFormat;
	formats['plaintext'] = PlaintextFormat;

  const currentSeq = manifest.currentSeq;
  const currentFormat = manifest.currentFormat;

  export const currentLocation = function () {
    return { page: view.item($currentSeq) };
  };
</script>

 <svelte:component this={formats[$currentFormat]} {startSeq} {container} bind:this={view}></svelte:component>

