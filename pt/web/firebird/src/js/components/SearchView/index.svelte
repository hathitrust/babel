<script>
  import { onMount, beforeUpdate, tick, getContext } from 'svelte';

  import SearchForm from '../SearchForm';

  const manifest = getContext('manifest');

  let onClick = function (event) {
    location.assign(event.target.href);
  };
</script>

<div class="p-3 m-3 overflow-auto">
  <h2 class="visually-hidden">Search Results</h2>
  <SearchForm inPanel={false} {onClick} />
</div>

<style>
</style>
