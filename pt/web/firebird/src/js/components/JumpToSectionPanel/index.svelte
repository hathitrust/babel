<script>
  import { stopPropagation, preventDefault } from 'svelte/legacy';

  import { getContext } from 'svelte';

  import Panel from '../Panel/index.svelte';
  import Modal from '~firebird-common/src/js/components/Modal/index.svelte';

  const manifest = getContext('manifest');
  const emitter = getContext('emitter');

  let sectionList = manifest.sectionList;
  let pageNumRange = manifest.pageNumRange();
  let hasPageNum = pageNumRange != null;

  let modal = $state();
  let value = $state();
  let showError = $state(false);

  // calculate pagenumrange

  function showModal(event) {
    event.stopPropagation();
    modal.show();
  }

  function handleValue() {
    let seq;
    let retval = true;
    console.log('AHOY jump.handleValue', value);
    if (value.substr(0, 1) == '+' || value.substr(0, 1) == '-') {
      let delta = value.substr(0, 1) == '+' ? +1 : -1;
      value = parseInt(value.substr(1), 10);
      emitter.emit('page.goto', { delta: delta * value });
      return true;
    }

    seq = manifest.guess(value);
    if (seq) {
      emitter.emit('page.goto', { seq: seq });
      return true;
    }

    return false;
  }

  function handleKeydown(event) {
    if (event.code == 'Enter' || event.code == 'Return') {
      event.stopPropagation();
      event.preventDefault();
      showError = !handleValue();
      if (!showError) {
        modal.hide();
        value = '';
        return;
      }
    }
  }

  function goto(seq, event) {
    event.stopPropagation();
    event.preventDefault();
    emitter.emit('page.goto', { seq: seq });
  }

  function jump() {
    showError = !handleValue();
    if (!showError) {
      // do something
      modal.hide();
      value = '';
    }
  }

  function getValue() {
    return value;
  }
</script>

<Panel parent="#controls">
  {#snippet icon()}
    <i class="fa-solid fa-bars" aria-hidden="true" ></i>
  {/snippet}
  {#snippet title()}
    Jump to Section
  {/snippet}
  {#snippet body()}
    <div class="mb-3">
      <button type="button" class="btn btn-outline-dark" onclick={showModal}
        >Jump to page...</button
      >
    </div>
    <ul class="list-unstyled">
      {#each sectionList as section}
        <li>
          <a href={section.url} onclick={goto(section.seq)}
            >{section.label}&nbsp;({#if section.page}p. {section.page},&nbsp;{/if}{#if section.seq}scan #{section.seq}{/if})</a
          >
        </li>
      {/each}
    </ul>
  {/snippet}
</Panel>
<Modal bind:this={modal}>
  {#snippet title()}
    Jump to page scan
  {/snippet}
  {#snippet body()}
  
      <div class="mb-3">
        <p class="fs-7 mb-2">
          Jump to a page scan by
          {#if hasPageNum}
            <strong>page number</strong> or
          {/if}
          <strong>page scan sequence</strong>.
        </p>
        <div class="alert alert-warning alert-block" role="alert" aria-atomic="true">
          {#if showError}
            <p class="m-0">
              Could not find a page scan that matched {getValue()}; enter
              {#if hasPageNum}
                a page number between {pageNumRange} or
              {/if}
              a sequence between #1-#{manifest.totalSeq}.
            </p>
          {/if}
        </div>
        <label for="jump-input" class="visually-hidden">
          {#if hasPageNum}
            Page number or sequence
          {:else}
            Page sequence
          {/if}
        </label>
        <input
          id="jump-input"
          type="text"
          class="form-control"
          aria-describedby="jump-hint-info"
          onkeydown={handleKeydown}
          bind:value
        />
        <p class="visually-hidden" id="jump-hint-info">Hints follow.</p>
      </div>
      <h2 class="h3">Hints</h2>
      <ul class="bullets">
        {#if hasPageNum}
          <li>Page numbers are entered as <tt><em>number</em></tt>, e.g. <strong><tt>10</tt></strong></li>
        {/if}
        <li>
          Page scan sequences are entered as
          <tt><em><span aria-hidden="true">#</span>number</em></tt>, e.g. <strong><tt>#10</tt></strong>
        </li>
        <li>Use a page scan sequence between #1-#{manifest.totalSeq}</li>
        {#if hasPageNum}
          <li>Use a page number between {pageNumRange}</li>
        {/if}
        <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
        <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
      </ul>
    
  {/snippet}
  {#snippet footer()}
  
      <div class="d-flex gap-1 align-items-center justify-content-end">
        <button type="button" class="btn btn-secondary" onclick={modal.hide()}>Cancel</button>
        <button type="button" class="btn btn-primary" onclick={jump}>Jump</button>
      </div>
    
  {/snippet}
</Modal>

<style>
  .alert:empty {
    display: none;
  }
</style>
