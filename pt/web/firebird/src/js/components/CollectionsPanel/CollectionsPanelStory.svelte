<script>
  import { getContext } from 'svelte';
  import CollectionsPanel from './index.svelte';

  let { loggedIn = false } = $props();

  const HT = getContext('HT');
  HT.loginStatus.logged_in = loggedIn;
  HT.login_status.logged_in = loggedIn;
</script>

<!-- CollectionsPanel's onMount scrapes <select data-use="..."> options out of #root;
     production has the Perl backend inject them, Storybook just gives it an empty node
     so it doesn't crash and shows the "no collections yet" state. -->
<div id="root" style="display: none">
  <select data-use="collections"></select>
  <select data-use="featured-collections"></select>
  <select data-use="in-collections"></select>
</div>
<div class="accordion" id="controls">
  <CollectionsPanel />
</div>
