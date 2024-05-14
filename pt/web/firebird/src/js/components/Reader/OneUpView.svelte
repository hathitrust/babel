<script>
  import { onMount, afterUpdate, onDestroy, getContext } from 'svelte';
  import View from './View.svelte';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');

  export let container;
  export let startSeq = 1;

  const currentSeq = manifest.currentSeq;
  const currentFormat = manifest.currentFormat;

  let view;

  export const currentLocation = function () {
    return { page: view.item($currentSeq) };
  };
</script>

<View {container} {startSeq} {currentLocation} format={$currentFormat} bind:this={view} />

<style>
</style>
