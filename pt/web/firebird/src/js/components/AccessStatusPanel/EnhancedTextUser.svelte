<!-- svelte-ignore unused-export-let -->
<script>
  import { getContext } from 'svelte';
  import Panel from '../Panel/index.svelte';

  const HT = getContext('HT');

  export let accessType;
  export let onToggle;
  export let expanded;
</script>

<Panel {expanded} {onToggle} class="access-panel">
  <i class="fa-solid fa-unlock" slot="icon"></i>
  <slot:fragment slot="title"> In-Copyright Access </slot:fragment>
  <slot:fragment slot="body">
    <p class="fs-7">
      This work may be in copyright. You have full view access to this item based on your account privileges.
      Information about use can be found in the <a
        href="//{HT.www_domain}/the-collection/search-access/access-use-policy/">HathiTrust Access and Use Policy</a
      >
    </p>
  </slot:fragment>
</Panel>
