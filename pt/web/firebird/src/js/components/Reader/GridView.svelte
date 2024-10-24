<script>
  import { onMount, afterUpdate, onDestroy, getContext } from 'svelte';
  import ImageFormat from './ImageFormat.svelte'

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');

  export let container;
  export let startSeq = 1;

  const currentSeq = manifest.currentSeq;

  let view;

  export const currentLocation = function () {
    return { page: view.view.item($currentSeq) };
  };

  const handleClick = function (event) {
    if (event.target.closest('details')) {
      return;
    }
    if (event.target.closest('button')) {
      return;
    }
    event.stopPropagation();
    let pageDiv = event.target.closest('div.page');
    if (!pageDiv) {
      return;
    }
    emitter.emit('view.switch', { seq: Number(pageDiv.dataset.seq) });
  };

  const handleKeydown = function (event) {
    if (event.target.closest('details')) {
      return;
    }
    let pageDiv = event.target.closest('div.page');
    if (!pageDiv) {
      return;
    }
    if (event.code == 'Enter') {
      emitter.emit('view.switch', { seq: Number(pageDiv.dataset.seq) });
    } else if (event.code == 'Tab') {
      // should grid view be different about
      // handling which pages are focus-able?
    }
  };
</script>

<!-- <View
  {container}
  {startSeq}
  {currentLocation}
  format="image"
  maxHeight={250}
  zoomScales={[0.5, 0.75, 1.0]}
  {handleClick}
  bind:this={view}
/> -->
<ImageFormat {container} {startSeq} {currentLocation} {handleKeydown} format="image" maxHeight={250} zoomScales={[0.5, 0.75, 1.0]} {handleClick} bind:this={view}></ImageFormat>

<style>
</style>
