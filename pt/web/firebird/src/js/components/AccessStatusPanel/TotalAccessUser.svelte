<script>
  import { getContext } from 'svelte';
  import Panel from '../Panel/index.svelte';

  const HT = getContext('HT');

  export let accessType;
  export let onToggle;
  export let expanded;
</script>

<Panel {expanded} {onToggle} class="access-panel">
  <i class="fa-solid fa-unlock" slot="icon" />
  <slot:fragment slot="title">
    {#if accessType.role == 'ht_staff_user' || accessType.role == 'ht_total_user'}
      Collection Administration Access
    {:else if accessType.role == 'ssd_proxy_user'}
      Accessible Text Request Service
    {:else}
      {accessType.role};
    {/if}
  </slot:fragment>
  <slot:fragment slot="body">
    <p class="fs-7">
      <span
        >This work may be in copyright. You have full view access to this item based on your account privileges.
        Information about use can be found in the
      </span>
      {#if accessType.role == 'ssd_proxy_user'}
        <a style="display: inline" href="//{HT.www_domain}/member-libraries/services-programs/atrs/request-atrs-title/"
          >Accessible Text Request Service Terms of Use.</a
        >
      {:else}
        <a style="display: inline" href="//{HT.www_domain}/collection-administration-access"
          >Collection Administration Access Terms of Use.</a
        >
      {/if}
    </p>
  </slot:fragment>
</Panel>
