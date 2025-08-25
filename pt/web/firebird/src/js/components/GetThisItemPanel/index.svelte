<script>
  import { getContext } from 'svelte';

  import Panel from '../Panel/index.svelte';

  const manifest = getContext('manifest');

  let externalLinks = manifest.externalLinks;
</script>

{#if externalLinks.length}
  <Panel parent="#controls">
    {#snippet icon()}
        <i class="fa-solid fa-book" ></i>
      {/snippet}
    {#snippet title()}
        Get This Item
      {/snippet}
    {#snippet body()}
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
      {/snippet}
  </Panel>
{/if}
