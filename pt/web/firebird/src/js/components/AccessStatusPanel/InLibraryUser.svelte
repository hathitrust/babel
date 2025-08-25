<script>
  import { onMount, getContext } from 'svelte';
  import Panel from '../Panel/index.svelte';
  import { time2message, ExpirationMonitor } from './utils';

  let { accessType, onToggle, expanded } = $props();

  const HT = getContext('HT');
  const manifest = getContext('manifest');

  let isExpired = $state(false);
  let lastSeconds = -1;
  let expirationInterval;
  let expiresDisplay = $state(time2message(accessType.expires));

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
  {#snippet icon()}
    <i class="fa-solid fa-unlock" ></i>
  {/snippet}
  {#snippet title()}
      Checked out until <span class="expires-display">{expiresDisplay}</span>
  {/snippet}
  {#snippet body()}
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
  {/snippet}
</Panel>

<style>
  .expires-display {
    font-weight: bold;
  }
</style>
