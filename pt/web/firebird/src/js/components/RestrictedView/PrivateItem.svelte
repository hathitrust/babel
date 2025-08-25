<script>
  import { getContext } from 'svelte';

  const HT = getContext('HT');

  let { link } = $props();
</script>

<h2 class="visually-hidden">Private Item</h2>

<div class="alert alert-warning">
  <p class="mb-0">
    We have determined this work to be in the public domain, but access is limited due to privacy concerns. See
    HathiTrust's <a href="//{HT.www_domain}/the-collection/search-access/access-use-policy/#pd-pvt">Privacy Policy</a> for
    more information.
  </p>
</div>

<p class="mt-3">
  You can
  {#if link}
    try to <a href={link.href}>find this item in a Library</a> or
  {/if}
  <strong>search in this text</strong>
  to find the frequency and page numbers of specific words or phrases. This can be especially useful to help you decide if
  the book is worth buying, checking out from a library, etc.
</p>
