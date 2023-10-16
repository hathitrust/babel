<script>
  import { getContext } from 'svelte';

  import Modal from '~firebird-common/src/js/components/Modal';
  import { messages } from '../../lib/messages';

  const manifest = getContext('manifest');

  export let code;
  export let seq;
  export let view;

  let show = manifest.messageList[seq] !== undefined;
  let modal;

  const showDetail = function(e) {
    modal.show(); 
  }

  const onClose = function() {
    delete manifest.messageList[seq];
    // show = false;
  }

  $: message = messages[code];
  $: guid = `div${seq}${code}`;

</script>

{#if show}
<div class="message view-{view}">
  <div class="alert alert-warning d-flex align-items-center flex-nowrap justify-content-between gap-3 p-1 px-2 mx-2 fs-7 shadow">
    {#if view == 'thumb'}
    <button 
      class="btn btn-outline-dark btn-sm text-nowrap" 
      type="button"
      aria-label={message.alert}
      on:click|stopPropagation={showDetail}
      ><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i></button>
    {:else}
    <span>{@html message.alert}</span>
    <button 
      class="btn btn-outline-dark btn-sm text-nowrap" 
      type="button"
      on:click|stopPropagation={showDetail}>
      {#if view == '2up'}
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
      {/if}
      <span class:visually-hidden={view == '2up'}>More Information</span>
    </button>
    {/if}
  </div>
  {#if message.detail}
  <Modal bind:this={modal} {onClose}>
    <!-- <svelte:fragment slot="title">{message.title}</svelte:fragment> -->
    <svelte:fragment slot="body">
      {@html message.detail}
    </svelte:fragment>
  </Modal>
  {/if}
</div>
{/if}

<style>
  .message {
    grid-row: 1/2;
    grid-column: 1/2;
    justify-self: start;
    margin-right: 1rem;
    margin-top: 0.5rem;
    z-index: 10;
  }

  .message.view-thumb {
    margin-top: -1rem;
  }
</style>