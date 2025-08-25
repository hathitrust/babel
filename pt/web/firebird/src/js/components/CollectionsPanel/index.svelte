<script>
  import { run } from 'svelte/legacy';

  import { onMount, getContext, tick } from 'svelte';

  import Panel from '../Panel/index.svelte';
  import CollectionEditModal from '~firebird-common/src/js/components/CollectionEditModal';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');
  const HT = getContext('HT');

  let inCollectionsList = $state([]);
  let featuredCollectionsList = $state([]);
  let collectionsList = $state([]);

  let action = 'addits';
  let modal = $state();
  let c = $state();
  let cn = $state();
  let desc = $state();
  let contributorName = $state();
  let shared = $state();
  let status = $state({ result: null });
  let statusEl = $state();

  function parseResponse(line) {
    var kv;
    var tmp = line.trim().split('|');
    let message = [];
    for (var i = 0; i < tmp.length; i++) {
      kv = tmp[i].split('=');
      status[kv[0]] = kv[1];
    }
    if (status.result == 'ADD_ITEM_FAILURE') {
      status.class = 'alert-danger';
      message.push('Sorry; there was a problem adding this item to your collection.');
    } else if (status.result == 'ADD_ITEM_SUCCESS') {
      status.class = 'alert-success';
      let collection_link = `<a href="mb?a=listis;c=${status.coll_id};skin=firebird">${status.coll_name}</a>`;
      if (status.NumFailed > 0) {
        message.push(`${numFailed} item${numFailed > 1 ? 's' : ''} could not be added to your collection`);
      }
      if (status.NumAddedToCollection > 0) {
        message.push(
          `${status.NumAddedToCollection} item${status.NumAddedToCollection > 1 ? 's' : ''} ${
            status.NumAddedToCollection > 1 ? 'were' : 'was'
          } added to ${collection_link}.`
        );
      }
      if (status.NumAlreadyInCollection > 0) {
        message.push(
          `${status.NumAlreadyInCollection} item${status.NumAlreadyInCollection > 1 ? 's' : ''} ${
            status.NumAlreadyInCollection > 1 ? 'were' : 'was'
          } already in ${collection_link}.`
        );
      }
    }
    status.message = message.join(' ');
    status = status;
  }

  async function submitAction(params) {
    // status.class = null; status = status;
    params.set('a', action);
    params.set('page', 'ajax');
    params.set('id', manifest.id);

    let url = new URL(`${location.protocol}//${HT.service_domain}/cgi/mb?${params.toString()}`);
    let response = await fetch(url, { method: 'GET' });
    if (response.ok) {
      parseResponse(await response.text());
      inCollectionsList.push({
        value: status.coll_id,
        label: status.coll_name,
      });
      inCollectionsList = inCollectionsList;
      console.log('-- bleh', action);
      if (action == 'addits') {
        let c2 = params.get('c2');
        let idx = collectionsList.findIndex((o) => o.value == c2);
        collectionsList.splice(idx, 1);
        collectionsList = collectionsList;
        c = '__NEW__';
      }
    }
  }

  function openModal() {
    action = 'additsnc';
    cn = desc = contributorName = '';
    shared = 0;
    modal.show();
  }

  function addItem() {
    if (c == '__NEW__') {
      openModal();
      return;
    }
    action = 'addits';
    let params = new URLSearchParams();
    params.set('c2', c);
    // console.log(`ADDING TO ${c}`);
    submitAction(params);
  }

  async function announceStatus() {
    await tick();
    HT.live.announce(statusEl.innerText);
  }

  $effect(() => {
    if (status.class) {
      announceStatus();
    }
  });
  // let loginStatus = $derived(HT.loginStatus);
  let loggedIn = $derived(HT.loginStatus.logged_in);
  let userIsAnonymous = $derived(loggedIn === false);

  onMount(() => {
    let rootEl = document.querySelector('#root');
    rootEl.querySelectorAll('select[data-use="collections"] option').forEach((optionEl) => {
      collectionsList.push({
        value: optionEl.value,
        label: optionEl.innerText,
      });
    });
    collectionsList = collectionsList;

    rootEl.querySelectorAll('select[data-use="featured-collections"] option').forEach((optionEl) => {
      featuredCollectionsList.push({
        value: optionEl.value,
        label: optionEl.innerText,
      });
    });
    featuredCollectionsList = featuredCollectionsList;

    rootEl.querySelectorAll('select[data-use="in-collections"] option').forEach((optionEl) => {
      inCollectionsList.push({
        value: optionEl.value,
        label: optionEl.innerText,
      });
    });
    inCollectionsList = inCollectionsList;
  });
</script>

<Panel parent="#controls">
  {#snippet icon()}
    <i class="fa-solid fa-bookmark" ></i>
  {/snippet}
  {#snippet title()}
    Collections
  {/snippet}
  {#snippet body()}
      {#if userIsAnonymous}
        <div class="alert alert-warning">Log in to make your personal collections permanent.</div>
      {/if}
      {#if featuredCollectionsList.length}
        <div class="mb-3">
          <p>In these featured collections:</p>
          <ul>
            {#each featuredCollectionsList as item}
              <li><a href={item.value}>{item.label}</a></li>
            {/each}
          </ul>
        </div>
      {/if}
      <div class="mb-3">
        <label for="select-collid" class="form-label">Add this item to a collection:</label>
        <div class="d-flex gap-2 align-items-center">
          <select class="form-select" id="select-collid" bind:value={c}>
            <option value="__NEW__">New collection...</option>
            {#each collectionsList as item}
              <option value={item.value}>{item.label}</option>
            {/each}
          </select>
          <button type="button" class="btn btn-outline-dark" onclick={addItem}>Add</button>
        </div>
      </div>
      {#if status.class}
        <div class="alert mt-1 {status.class} d-flex align-items-center gap-3" bind:this={statusEl}>
          {#if status.class == 'alert-danger'}
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          {:else}
            <i class="fa-regular fa-circle-check" aria-hidden="true"></i>
          {/if}
          <span>{@html status.message}</span>
        </div>
      {/if}
      {#if inCollectionsList.length}
        <div class="mb-3">
          <p>In your collections:</p>
          <ul>
            {#each inCollectionsList as item}
              <li><a href={item.value}>{item.label}</a></li>
            {/each}
          </ul>
        </div>
      {/if}
      <div class="mb-3">
        <ul class="list-unstyled">
          {#if collectionsList.length > 0 || inCollectionsList.length > 0}
            <li><a href="//{HT.service_domain}/cgi/mb?a=listcs&colltype=my-collections">My Collections</a></li>
          {/if}
          <li><a href="//{HT.service_domain}/cgi/mb?a=listcs&colltype=all">Shared Collections</a></li>
        </ul>
      </div>
  {/snippet}
</Panel>
<CollectionEditModal bind:this={modal} {userIsAnonymous} {c} {cn} {desc} {contributorName} {shared} {submitAction} />
