<script>
  import { getContext } from 'svelte';
  import JumpToSectionPanel from './index.svelte';

  let { sectionList = [] } = $props();

  const manifest = getContext('manifest');
  manifest.sectionList = sectionList;
</script>

<div class="accordion" id="controls">
  <JumpToSectionPanel />
</div>
