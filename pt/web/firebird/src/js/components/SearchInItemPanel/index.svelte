<script>
  import { onMount, getContext, tick } from 'svelte';

  import Panel from '../Panel';
  import SearchForm from '../SearchForm';

  const emitter = getContext('emitter');

  let start = 1;
  let sort = 'seq';
  let showHightlights = true;
  let expanded = false;

  function onClick(event) {
    let seq = event.target.dataset.seq;
    emitter.emit('page.goto', { seq: seq });
  }

  emitter.on('search-form.focus', async () => {
    expanded = true;
    await tick();
    emitter.emit('search-form.focus.input');
  });
</script>

<Panel parent="#controls" {expanded}>
  <i class="fa-solid fa-magnifying-glass" aria-hidden="true" slot="icon"></i>
  <svelte:fragment slot="title">Search in This Text</svelte:fragment>
  <svelte:fragment slot="body">
    <SearchForm inPanel={true} {onClick} />
  </svelte:fragment>
</Panel>

<style>
</style>
