<script>
  import { getContext } from 'svelte';
  import SearchInItemPanel from './index.svelte';

  let { payload = null, q1 = '' } = $props();

  const manifest = getContext('manifest');
  manifest.payload = payload;
  manifest.q1.set(q1);
</script>

<div class="accordion" id="controls">
  <SearchInItemPanel />
</div>
