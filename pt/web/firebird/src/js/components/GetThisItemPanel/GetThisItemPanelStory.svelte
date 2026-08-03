<script>
  import { getContext } from 'svelte';
  import GetThisItemPanel from './index.svelte';

  let { externalLinks = [] } = $props();

  const manifest = getContext('manifest');
  manifest.externalLinks = externalLinks;
</script>

<div class="accordion" id="controls">
  <GetThisItemPanel />
</div>
