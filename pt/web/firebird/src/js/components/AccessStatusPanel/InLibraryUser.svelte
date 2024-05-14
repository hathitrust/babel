<script>
  import { onMount, getContext } from 'svelte';
  import Panel from '../Panel';
  import { time2message, ExpirationMonitor } from './utils';

  export let accessType;
  export let onToggle;
  export let expanded;

  const HT = getContext('HT');
  const manifest = getContext('manifest');

  let isExpired = false;
  let lastSeconds = -1;
  let expirationInterval;
  let expiresDisplay = time2message(accessType.expires);

  let monitor;

  onMount(() => {
    lastSeconds = accessType.expires;

    monitor = new ExpirationMonitor(manifest.id, HT.cookieJar, function (message) {
      console.log('-- panel.monitor', message);
      if (message === false) {
        monitor.stop();
        isExpired = true;
      } else {
        expiresDisplay = message;
      }
    });

    monitor.run();

    return () => {
      monitor.stop();
    };
  });
</script>

<Panel {expanded} class="dark" {onToggle}>
  <i class="fa-solid fa-unlock" slot="icon" />
  <slot:fragment slot="title">
    Checked out until <span class="expires-display">{expiresDisplay}</span>
  </slot:fragment>
  <slot:fragment slot="body">
    {#if isExpired}
      <p class="fs-7">Your access has expired and cannot be renewed. Reload the page or try again later.</p>
      <div>
        <a class="btn btn-primary text-nowrap" href={location.href}>Reload</a>
      </div>
    {:else}
      <p class="fs-7">
        This work is checked out to you until
        <span class="expires-display">{expiresDisplay}</span>. You may be able to renew the book. This work may be in
        copyright. You have full view access to this item based on your affiliation or account privileges. Information
        about use can be found in the
        <a href="//{HT.www_domain}/the-collection/access-use-policy/">HathiTrust Access and Use Policy</a>.
      </p>
      <div>
        <a class="btn btn-primary text-nowrap" href={accessType.action}>Return Early</a>
      </div>
    {/if}
  </slot:fragment>
</Panel>

<style>
  .expires-display {
    font-weight: bold;
  }
</style>
