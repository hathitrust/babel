<script>
  let { link } = $props();
</script>

<h2 class="visually-hidden">No Access</h2>

<div class="alert alert-warning">
  <p class="mb-0">
    This item is <strong>not available online</strong>
    &mdash; <strong><i class="fa-solid fa-lock" aria-hidden="true"></i> Limited - search only</strong> &mdash; due to
    copyright restrictions.
    <a href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2386591860">Learn More</a>
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
