<script>
  import { getContext } from 'svelte';
  import AccessStatusPanel from './index.svelte';

  let { accessType } = $props();

  const manifest = getContext('manifest');
  manifest.accessType = accessType;
</script>

<div class="accordion" id="controls">
  <AccessStatusPanel />
</div>
