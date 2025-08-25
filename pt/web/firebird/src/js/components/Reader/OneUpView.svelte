<script>
  console.log('hi from oneupview!');
  import { getContext } from 'svelte';
  import ImageFormat from './ImageFormat.svelte';
  import PlaintextFormat from './PlaintextFormat.svelte';

  const manifest = getContext('manifest');
  let view = $state();
  //view.item() passed up from View.svelte through the format wrappers

  /**
   * @typedef {Object} Props
   * @property {any} container
   * @property {number} [startSeq]
   */

  /** @type {Props} */
  let { container, startSeq = 1 } = $props();

  const formats = $state({});
  formats['image'] = ImageFormat;
  formats['plaintext'] = PlaintextFormat;

  const currentSeq = manifest.currentSeq;
  const currentFormat = manifest.currentFormat;

  export const currentLocation = function () {
    return { page: view.item($currentSeq) };
  };

  const Format = $derived(formats[$currentFormat]);
  $inspect(view)
  
</script>

<Format {startSeq} {currentLocation} {container} bind:this={view}></Format>
