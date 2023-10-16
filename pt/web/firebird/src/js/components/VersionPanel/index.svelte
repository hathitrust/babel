<script>
  import { onMount, getContext } from 'svelte';

  const context = getContext('context');
  const manifest = getContext('manifest');

  const currentSeq = manifest.currentSeq;

  let button;
  let popover;
  let popoverContent = `This is the date when this item was last updated. 
  Version dates are updated when improvements such as 
  higher quality scans or more complete scans have been made.`;

  $: ownerid = manifest.ownerid($currentSeq);

  onMount(() => {
    popover = new bootstrap.Popover(button);
    return () => {
      popover.dispose();
    }
  })
  
</script>

{#if manifest.versionLabel}
<div class="alert alert-light mt-4" role="alert">
  <h2 class="fs-7">Version</h2>
  <p class="fs-8">
    <span>{manifest.versionLabel}</span>
    {#if ownerid}
      <br />
      <span>OwnerID: {ownerid} / 
      <span class="text-nowrap">Seq: {manifest.physicalSeq($currentSeq)}</span></span>
    {/if}
    <br />
    <button 
      tabindex="0"
      bind:this={button}
      type="button" 
      class="btn btn-sm btn-outline-dark mt-2" 
      data-bs-toggle="popover" 
      data-bs-trigger="focus"
      data-bs-title="About the version" 
      data-bs-content="{popoverContent}">About the version</button>
  </p>
</div>
{/if}

<style>
  .fs-8 {
    font-size: 0.75rem;
  }
</style>