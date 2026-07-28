<script>
  import { getContext } from 'svelte';
  import DownloadPanel from './index.svelte';

  let { allowFullDownload = false, allowSinglePageDownload = false } = $props();

  const manifest = getContext('manifest');
  manifest.allowFullDownload = allowFullDownload;
  manifest.allowSinglePageDownload = allowSinglePageDownload;
</script>

<div class="accordion" id="controls">
  <DownloadPanel />
</div>
