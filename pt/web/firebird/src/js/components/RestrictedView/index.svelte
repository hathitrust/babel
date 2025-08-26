<script>
  import { getContext } from 'svelte';

  import SearchForm from '../SearchForm/index.svelte';

  import NoAccessItem from './NoAccessItem.svelte';
  import TombstoneItem from './TombstoneItem.svelte';
  import PrivateItem from './PrivateItem.svelte';
  import EmergencyAccessAffiliate from './EmergencyAccessAffiliate.svelte';
  import BrittleHeldItem from './BrittleHeldItem.svelte';

  const manifest = getContext('manifest');
  const subviews = $state({});

  subviews['no-access-item'] = NoAccessItem;
  subviews['tombstone-item'] = TombstoneItem;
  subviews['private-item'] = PrivateItem;
  subviews['brittle-held-item'] = BrittleHeldItem;
  subviews['emergency-access-affiliate'] = EmergencyAccessAffiliate;

  let externalLinks = manifest.externalLinks;
  let links = externalLinks.filter((link) => link.type == 'oclc');

  let searchAvailable = $state(true);
  let rightsAttribute = manifest.accessRestriction.rightsAttribute;
  let message = manifest.accessRestriction.message;
  if (rightsAttribute == 8) {
    searchAvailable = false;
  }

  let onClick = function (event) {
    event.preventDefault();
    location.assign(event.target.href);
  };

  const SvelteComponent = $derived(subviews[message]);
</script>

<div class="p-3 m-3 overflow-auto">
  <SvelteComponent link={links[0]} />

  {#if searchAvailable}
    <SearchForm inPanel={false} {onClick} />
  {/if}
</div>

<style>
</style>
