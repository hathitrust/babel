<!-- svelte-ignore unused-export-let -->
<script>
  import { getContext } from 'svelte';

  const HT = getContext('HT');
  export let link;
</script>

<div class="alert alert-warning">
  <p>
    This item is <strong>no longer available</strong> in HathiTrust due to one of the following conditions:
  </p>
  <ul class="mb-0">
    <li>It was deleted at the request of the rights holder or has been marked for deletion.</li>
    <li>It was either wholly unusable or a superior copy is available.</li>
  </ul>
</div>

<p class="mt-3">
  Try a <strong><a href="//{HT.www_domain}/">new search</a></strong>
  for your item to see if there are other copies or editions of this work available.
</p>
