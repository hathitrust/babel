<script>
  import { onMount, afterUpdate, onDestroy, getContext } from 'svelte';
  import ImageFormat from './ImageFormat.svelte';
	import PlaintextFormat from './PlaintextFormat.svelte'

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');

  export let container;
  export let startSeq = 1;
  export let format;

  const currentSeq = manifest.currentSeq;
  const currentFormat = manifest.currentFormat;

  const formats = {};
	formats['image'] = ImageFormat;
	formats['plaintext'] = PlaintextFormat;

  let view;
  let isInitialized = true;

  export const currentLocation = function () {
    let location = {};
    if (view.item($currentSeq)) {
      let item = view.item($currentSeq);
      location[item.side] = item;

      if (view.item($currentSeq).side == 'verso') {
        let item = view.item($currentSeq + 1);
        if (item) {
          location[item.side] = item;
        }
      }
    }
    return location;
  };

  const findTarget = function (options) {
    let targetIdx;
    let item = view.item($currentSeq);
    let currentSpread = item.spreadIndex;
    if (options.delta !== undefined) {
      targetIdx = currentSpread + options.delta;
    } else if (options.seq && !isNaN(options.seq)) {
      targetIdx = view.item(options.seq).spreadIndex;
    } else {
      // invalid option;
      return;
    }
    // console.log("-- 2up.findTarget", currentSpread, targetIdx);
    return view.spread(targetIdx).el;
  };

  const findFocusItems = function (seq) {
    let pages = [];
    let item = view.item($currentSeq);
    const spread = view.spread(item.spreadIndex);
    pages = Array.from(spread.items);
    return pages;
  };

  const handleClick = function (event) {
    if ($currentFormat == 'plaintext') {
      return;
    }
    if (event.target.closest('details')) {
      return;
    }
    if (event.target.closest('button')) {
      return;
    }
    let pageDiv = event.target.closest('div.page');
    if (!pageDiv) {
      return;
    }
    let options = { delta: 1 };
    if (pageDiv.classList.contains('verso')) {
      options.delta = -1;
    }
    emitter.emit('page.goto', options);
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
      let options = { delta: 1 };
      if (pageDiv.classList.contains('verso')) {
        options.delta = -1;
      }
      emitter.emit('page.goto', options);
    }
  };
</script>


<!-- <View
  {container}
  {startSeq}
  {currentLocation}
  {findTarget}
  {findFocusItems}
  {handleClick}
  {handleKeydown}
  format={$currentFormat}
  bind:this={view}
/> -->

<svelte:component this={formats[$currentFormat]} {container} {startSeq} {currentLocation} {findTarget} {findFocusItems} {handleClick} {handleKeydown} bind:this={view}></svelte:component>

<style>
</style>
