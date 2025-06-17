<script>
  import { getContext } from 'svelte';
  import ImageFormat from './ImageFormat.svelte';
  import PlaintextFormat from './PlaintextFormat.svelte';

  const manifest = getContext('manifest');
  let view = $state();

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
    return { page: view.view.item($currentSeq) };
  };

  const Format = $derived(formats[$currentFormat]);
</script>

<Format {startSeq} {currentLocation} {container} bind:this={view}></Format>
