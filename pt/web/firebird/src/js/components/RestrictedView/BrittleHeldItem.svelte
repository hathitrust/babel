<script>
  import { getContext } from 'svelte';

  const manifest = getContext('manifest');
  const HT = getContext('HT');
  
  let accessType = manifest.accessType;
  export let link;
</script>

<h2 class="visually-hidden">Brittle Item</h2>

{#if accessType.available}
<div class="alert alert-warning">
  <div class="d-flex flex-row align-items-start gap-3">
    <div class="flex-grow">
      <p>This work may be in copyright.</p>
      <p>
        Access to this work is provided based on your affiliation or account privileges.
        Information about use can be found in the 
        <a href="//{HT.www_domain}/the-collection/search-access/access-use-policy/#ic" class="alert-link">HathiTrust Access and Use Policy</a>.
      </p>
    </div>
    <a href={accessType.action} class="btn btn-primary btn-lg text-nowrap">Check Out</a>
  </div>
</div>
{:else}
<div class="alert alert-warning">
  <p>
    <strong>This work is in copyright.</strong> 
    Full view access is available for this item based on your 
    affiliation or account privileges. 
    Items made available under these special circumstances 
    can only be accessed by one user at a time.
  </p>
  <p class="mb-0">
    All available copies are currently in use. Try again later.
  </p>
</div>
{/if}

<p class="mt-3">
  {#if accessType.available}
  You can 
  {:else}
  In the meantime, you can 
  {/if}
  <strong>search in this text</strong> 
  to see if it contains what you are looking for.
</p>
