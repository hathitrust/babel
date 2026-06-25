<script>
  import Panel from './index.svelte';
  let { expanded = false } = $props();
</script>

<Panel {expanded}>
  <span slot="title">Example Panel</span>
  <div slot="body"><p>Panel body content.</p></div>
</Panel>
