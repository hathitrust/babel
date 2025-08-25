<script>
  import { getContext } from 'svelte';

  const context = getContext('context');
  const manifest = getContext('manifest');

  const currentSeq = manifest.currentSeq;


  let ownerid = $derived(manifest.ownerid($currentSeq));

</script>

{#if manifest.versionLabel}
  <div class="alert alert-light mt-4" role="alert">
    <h2 class="fs-7">Version</h2>
    <p class="fs-8">
      <span>{manifest.versionLabel}</span>
      {#if ownerid}
        <br />
        <span
          >OwnerID: {ownerid} /
          <span class="text-nowrap">Seq: {manifest.physicalSeq($currentSeq)}</span></span
        >
      {/if}
    </p>
  </div>
{/if}

<style>
  .fs-8 {
    font-size: 0.75rem;
  }
</style>
