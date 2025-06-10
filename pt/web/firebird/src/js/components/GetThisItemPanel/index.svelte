<script>
  import { getContext } from 'svelte';

  import Panel from '../Panel';

  const manifest = getContext('manifest');

  let externalLinks = manifest.externalLinks;
</script>

{#if externalLinks.length}
  <Panel parent="#controls">
    <i class="fa-solid fa-book" slot="icon" />
    <slot:fragment slot="title">Get This Item</slot:fragment>
    <slot:fragment slot="body">
      <ul class="list-unstyled">
        {#each externalLinks.filter((link) => link.type == 'oclc') as link}
          <li>
            <a href={link.href}>Find in a library</a>
          </li>
        {/each}
        {#each externalLinks.filter((link) => link.type == 'service') as link}
          <li>
            <a href={link.href}>{link.title}</a>
          </li>
        {/each}
        {#each externalLinks.filter((link) => link.type == 'external') as link}
          <li>
            <a href={link.href}>Download at {link.title}</a>
          </li>
        {/each}
      </ul>
    </slot:fragment>
  </Panel>
{/if}
