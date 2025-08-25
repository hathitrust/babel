<script>
  import { getContext } from 'svelte';
  import Panel from '../Panel/index.svelte';

  const HT = getContext('HT');

  let { accessType, onToggle, expanded } = $props();

</script>

<Panel {expanded} class="dark" {onToggle}>
  {#snippet icon()}
  <i class="fa-solid fa-unlock" slot="icon"></i>
  {/snippet}
  {#snippet title()}
  In-Copyright Access
  {/snippet}
  {#snippet body()}
    <p class="fs-7">
      This work may be in copyright. You have full view access to this item based on your account privileges.
      Information about use can be found in the <a
        href="//{HT.www_domain}/the-collection/search-access/access-use-policy/">HathiTrust Access and Use Policy</a
      >
    </p>
  {/snippet}
</Panel>
