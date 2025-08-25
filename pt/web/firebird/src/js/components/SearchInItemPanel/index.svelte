<script>
  import { getContext, tick } from 'svelte';

  import Panel from '../Panel/index.svelte';
  import SearchForm from '../SearchForm/index.svelte';

  const emitter = getContext('emitter');

  let start = 1;
  let sort = 'seq';
  let showHightlights = true;
  let expanded = $state(false);

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
  {#snippet icon()}
    <i class="fa-solid fa-magnifying-glass" aria-hidden="true" ></i>
  {/snippet}
  {#snippet title()}
    Search in This Text
  {/snippet}
  {#snippet body()}
      <!-- <SearchForm inPanel={true} {onClick} /> -->
      <SearchForm inPanel={true} />
  {/snippet}
</Panel>