<script>
  import { onMount, beforeUpdate, tick, getContext } from 'svelte';

  import SearchForm from '../SearchForm';

  import NoAccessItem from './NoAccessItem.svelte';
  import TombstoneItem from './TombstoneItem.svelte';
  import PrivateItem from './PrivateItem.svelte';
  import EmergencyAccessAffiliate from './EmergencyAccessAffiliate.svelte';
  import BrittleHeldItem from './BrittleHeldItem.svelte';

  const manifest = getContext('manifest');
  const subviews = {};

  subviews['no-access-item'] = NoAccessItem;
  subviews['tombstone-item'] = TombstoneItem;
  subviews['private-item'] = PrivateItem;
  subviews['brittle-held-item'] = BrittleHeldItem;
  subviews['emergency-access-affiliate'] = EmergencyAccessAffiliate;
  // subviews['orphan-candidate-item'] = OrphanCandidateItem;

  let externalLinks = manifest.externalLinks;
  let links = externalLinks.filter((link) => link.type == 'oclc');

  let searchAvailable = true;
  let rightsAttribute = manifest.accessRestriction.rightsAttribute;
  let message = manifest.accessRestriction.message;
  if (rightsAttribute == 8) {
    searchAvailable = false;
  } else if (message == 'orphan-candidate-item') {
    searchAvailable = false;
  }

  let onClick = function (event) {
    location.assign(event.target.href);
  };
</script>

<div class="p-3 m-3 overflow-auto">
  <svelte:component this={subviews[message]} link={links[0]} />

  {#if searchAvailable}
    <SearchForm inPanel={false} {onClick} />
  {/if}
</div>

<style>
</style>
