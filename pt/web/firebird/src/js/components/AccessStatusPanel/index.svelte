<script>
  import { getContext, onMount } from 'svelte';

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


  const subviews = {};
  subviews['total_access'] = TotalAccessUser;
  subviews['in_library_user'] = InLibraryUser;
  subviews['emergency_access_affiliate'] = EmergencyAccessAffiliate;
  subviews['ssd_session_user'] = EnhancedTextUser;
  subviews['enhanced_text_user'] = EnhancedTextUser;

  window.xzzz = subviews['total_access'];

  function isExpanded(accessType) {
    return prefs.pt.alerts[accessType.name] != 'closed';
  }

  function onToggle(event, open) {
    let key = this.name;
    prefs.pt.alerts[key] = open ? 'open' : 'closed';
    HT.prefs.set(prefs);
    console.log("-- access.panel.toggle", key, open);
  }
</script>

{#if manifest.accessType && manifest.accessType.granted}
  <svelte:component 
    this={subviews[accessTypeName]}
    accessType={accessType}
    onToggle={onToggle.bind(accessType)}
    expanded={isExpanded(accessType)}
    ></svelte:component>
{/if}