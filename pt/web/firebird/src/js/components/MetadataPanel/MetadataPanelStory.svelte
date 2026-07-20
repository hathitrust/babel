<script>
  import { getContext } from 'svelte';
  import MetadataPanel from './index.svelte';

  let { title = 'Storybook Test Item', author = 'Test Author', publisher = 'Test Publisher', date = '1910' } = $props();

  const manifest = getContext('manifest');
  manifest.metadata = { ...manifest.metadata, title, author, publisher, date };
</script>

<div class="accordion" id="controls">
  <MetadataPanel />
</div>
