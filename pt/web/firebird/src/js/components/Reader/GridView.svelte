<script>
  import { getContext } from 'svelte';
  import ImageFormat from './ImageFormat.svelte';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');

  /**
   * @typedef {Object} Props
   * @property {any} container
   * @property {number} [startSeq]
   */

  /** @type {Props} */
  let { container, startSeq = 1 } = $props();

  const currentSeq = manifest.currentSeq;

  let view = $state();
  //view.item() passed up from View.svelte through the format wrappers

  export const currentLocation = function () {
    return { page: view.item($currentSeq) };
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
<ImageFormat
  {container}
  {startSeq}
  {currentLocation}
  {handleKeydown}
  format="image"
  maxHeight={250}
  zoomScales={[0.5, 0.75, 1.0]}
  {handleClick}
  bind:this={view}
></ImageFormat>

<style>
</style>
