<script>
  import { getContext } from 'svelte';

  export let title;
  
  const manifest = getContext('manifest');
  const metadata = manifest.metadata;

</script>

{#if manifest.ui == 'crms'}
<dl>
  {#if metadata.author}
  <div>
    <dt>Creator</dt>
    <dd>{metadata.author}</dd>
  </div>
  {/if}
  {#if metadata.publisher}
  <div>
    <dt>Publisher</dt>
    <dd>{metadata.publisher}</dd>
  </div>
  {/if}
  {#if metadata.description}
    <dt>Description</dt>
    <dd>{metadata.description}</dd>
  {/if}
</dl>
{:else}
  <!-- RDFa wrappers -->
  <p class="visually-hidden">
    {#if metadata.format == 'BK' && metadata.author}
      <span 
        property="cc:attributionName" 
        rel="cc:attributionURL"
        href="https://hdl.handle.net/2027/{manifest.id}">{metadata.author}</span>
    {:else if metadata.format == 'SE' && metadata.publisher}
      <span 
        property="cc:attributionName" 
        rel="cc:attributionURL"
        href="https://hdl.handle.net/2027/{manifest.id}">{metadata.publisher}</span>
    {/if}
    {#if metadata.author}
      <span property="dc:creator" content="{metadata.author}" />
    {/if}
    {#if metadata.publisher}
      <span property="dc:publisher" content="{metadata.publisher}" />
    {/if}
    {#if metadata.description}
      <span property="dc:description" content="{metadata.description}" />
    {/if}
  </p>
{/if}
<div itemscope="" itemtype="http://schema.org/Book" class="d-none">
  <meta itemprop="accessibilityFeature" content="alternativeText">
  <meta itemprop="accessibilityFeature" content="bookmarks">
  <meta itemprop="accessibilityFeature" content="index">
  <meta itemprop="accessibilityFeature" content="longDescription">
  <meta itemprop="accessibilityFeature" content="readingOrder">
  <meta itemprop="accessibilityAPI" content="ARIA">
  <meta itemprop="accessibilityControl" content="fullKeyboardControl">
  <meta itemprop="accessibilityControl" content="fullMouseControl">
  <span itemprop="name">{title}</span>
  {#if manifest.metadata.author}
    <span itemprop="author">{manifest.metadata.author}</span>
  {/if}
  <span itemprop="url">https://hdl.handle.net/2027/{manifest.id}</span>
</div>

<style>

</style>