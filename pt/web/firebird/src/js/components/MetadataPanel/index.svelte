<script>
  import { getContext } from 'svelte';
  import AccessStatusPanel from '../AccessStatusPanel/index.svelte';

  import Panel from '../Panel/index.svelte';
  import BibData from './BibData.svelte';

  const manifest = getContext('manifest');
  const currentSeq = manifest.currentSeq;
  const HT = getContext('HT');

  let externalLinks = manifest.externalLinks;

  let title = manifest.metadata.title;
  if (manifest.metadata.enumChron) {
    title += ' ' + manifest.metadata.enumChron;
  }

  let referrer = document.referrer;
  let referrerLabel;
  if (referrer.match(HT.catalog_domain)) {
    if (referrer.match('/Search/')) {
      referrerLabel = 'Back to Search Results';
    } else if (referrer.match('/Record/')) {
      referrerLabel = 'Back to Catalog Record';
    }
  } else if (referrer.match(HT.service_domain)) {
    if (referrer.match('/cgi/ls')) {
      referrerLabel = 'Back to Search Results';
    } else if (referrer.match('/cgi/mb')) {
      referrerLabel = 'Back to Collection';
    } else if (referrer.match('/cgi/pt/search')) {
      referrerLabel = 'Search in this Text Results';
    }
  }
</script>

{#if referrerLabel}
  <a href={referrer} referrerpolicy="unsafe-url" class="back-to">
    <i class="fa-solid fa-arrow-left-long" aria-hidden="true"></i>
    <span>{referrerLabel}</span>
  </a>
{/if}
<h1 class="mb-0 pb-3 pt-2" style="font-size: 1.2rem">
  <span
    about="[_:{manifest.id}]"
    property="dc:title"
    rel="dc:type"
    href="http://purl.org/dc/dcmitype/Text"
    content={title}>{title}</span
  >
</h1>
<div class="accordion mb-3">
  <AccessStatusPanel />
</div>
<Panel parent="#controls" expanded={true} metadata={true} class="border-top rounded-top-2">
  <i class="fa-solid fa-book" slot="icon"></i>
  <slot:fragment slot="title">About This Item</slot:fragment>
  <slot:fragment slot="body">
    <BibData {title} />
    <ul class="list-unstyled mb-0">
      <li>{manifest.totalSeq} page scans</li>
      <li><a href="//{HT.catalog_domain}/Record/{manifest.metadata.catalogRecordNo}">Catalog Record</a></li>
      {#if manifest.hasOcr}
        <li><a href="/cgi/ssd?id={manifest.id}&seq={$currentSeq}">Text-Only View</a></li>
      {/if}
      <li>
        <h3 class="fs-7 mb-1 mt-2">Rights</h3>
        <p class="fs-7">
          <a href={manifest.rights.useLink}>{manifest.rights.head}.</a>
          {#if manifest.metadata.format == 'BK' && manifest.rights.useAuxLink}
            <a class="visually-hidden" href={manifest.rights.useAuxLink} rel="license">License URL</a>
          {/if}
          {#if manifest.rights.useIcon || manifest.rights.useAuxLink || manifest.rights.useAuxIcon}
            <br /><br />
          {/if}
          {#if manifest.rights.useIcon}
            <a target="_blank" href={manifest.rights.useLink} aria-hidden="true">
              <img alt="" src={manifest.rights.useIcon} />
            </a>
          {/if}
          {#if manifest.rights.useAuxIcon}
            <a target="_blank" href={manifest.rights.useAuxLink} aria-hidden="true">
              <img alt="" src={manifest.rights.useAuxIcon} />
            </a>
          {/if}
        </p>
      </li>
    </ul>

    <!-- revisit this when we have enumchrom -->
    <!-- <div class="mt-3 btn-group" role="group">
      <a class="btn btn-outline-dark btn-sm" href="//{HT.catalog_domain}/Record/{manifest.metadata.catalogRecordNo}/Cite"><i class="fa-solid fa-bookmark" aria-hidden="true"></i> Cite this</a>
      <a class="btn btn-outline-dark btn-sm" download href="//{HT.catalog_domain}/Search/SearchExport?handpicked={manifest.metadata.catalogRecordNo}&method=ris"><i class="fa-solid fa-file-export" aria-hidden="true"></i> Export citation file</a>
    </div> -->
  </slot:fragment>
</Panel>

<style lang="scss">
  a.back-to {
    display: inline-flex;
    gap: 0.75rem;
    padding-block: 0.5rem;
    color: var(--color-neutral-900);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.125rem;
    letter-spacing: -0.00875rem;

    span {
      text-decoration: none;
    }
    &:hover span {
      text-decoration: underline;
    }
  }
</style>
