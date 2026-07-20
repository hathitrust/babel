<script>
  import { getContext, onMount } from 'svelte';
  import ViewerToolbar from './index.svelte';

  let { zoomIn = true, zoomOut = true } = $props();

  const emitter = getContext('emitter');

  onMount(() => {
    emitter.emit('zoom.enable', { in: zoomIn, out: zoomOut });
  });
</script>

<ViewerToolbar />
