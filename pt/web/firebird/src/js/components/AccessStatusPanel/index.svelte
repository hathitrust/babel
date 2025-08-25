<script>
  import { getContext, onMount } from 'svelte';
  import { consent } from '~firebird-common/src/js/lib/store.svelte.js';

  const manifest = getContext('manifest');
  const HT = getContext('HT');

  const accessType = manifest.accessType;
  const accessTypeName = accessType && accessType.name;

  import TotalAccessUser from './TotalAccessUser.svelte';
  import EnhancedTextUser from './EnhancedTextUser.svelte';
  import EmergencyAccessAffiliate from './EmergencyAccessAffiliate.svelte';
  import InLibraryUser from './InLibraryUser.svelte';

  const prefs = HT.prefs.get();
  prefs.pt = prefs.pt || {};
  prefs.pt.alerts = prefs.pt.alerts || {};

  const subviews = $state({});
  subviews['total_access'] = TotalAccessUser;
  subviews['in_library_user'] = InLibraryUser;
  subviews['emergency_access_affiliate'] = EmergencyAccessAffiliate;
  subviews['ssd_session_user'] = EnhancedTextUser;

  window.xzzz = subviews['total_access'];

  function isExpanded(accessType) {
    return prefs.pt.alerts[accessType.name] != 'closed';
  }

  function onToggle(event, open) {
    let key = this.name;
    prefs.pt.alerts[key] = open ? 'open' : 'closed';
    if (consent.preferencesConsent === 'true') {
      HT.prefs.set(prefs);
    }
    console.log('-- access.panel.toggle', key, open);
  }
  console.log('hi from access status panel')
</script>

<!-- {#if manifest.accessType && manifest.accessType.granted} -->
{#if manifest.accessType}
  {@const SvelteComponent = subviews[accessTypeName]}
  <SvelteComponent
    accessType = 'resource_sharing_user' 
    onToggle={onToggle.bind(accessType)}
    expanded={isExpanded(accessType)}
  />
{/if}