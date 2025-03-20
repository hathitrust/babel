<!-- svelte-ignore unused-export-let -->
<script>
  import { getContext } from 'svelte';

  const manifest = getContext('manifest');
  const HT = getContext('HT');

  let accessType = manifest.accessType;
  export let link;
</script>

<h2 class="visually-hidden">Emegency Temporary Access</h2>

{#if accessType.available}
  <div class="alert alert-info">
    <div class="d-flex flex-row align-items-start justify-content-between">
      <div class="flex-grow">
        <p class="m-0">
          Access to this work is provided through the
          <a href="//{HT.www_domain}/member-libraries/services-programs/etas/">Emergency Temporary Access Service</a>.
        </p>
      </div>
      <a href={accessType.action} class="btn btn-primary btn-lg text-nowrap">Check Out</a>
    </div>
  </div>
{:else}
  <div class="alert alert-warning">
    <p class="mb-0">
      All available copies are currently in use. Try again later. Access to this work is provided through the
      <a href="//{HT.www_domain}/member-libraries/services-programs/etas/">Emergency Temporary Access Service</a>.
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

<p>
  Information about use can be found in the <a href="//{HT.www_domain}/the-collection/access-use-policy/#ic"
    >HathiTrust Access and Use Policy</a
  >.
</p>
