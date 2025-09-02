<script>
  import { onMount, getContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { tooltippy } from '../../lib/tippy';

  import Panel from '../Panel';
  import Modal from '~firebird-common/src/js/components/Modal';

  const manifest = getContext('manifest');
  const emitter = getContext('emitter');
  const HT = getContext('HT');

  const formatTitle = {};
  formatTitle['pdf'] = 'PDF';
  formatTitle['epub'] = 'EPUB';
  formatTitle['plaintext'] = 'Text (.txt)';
  formatTitle['plaintext-zip'] = 'Text (.zip)';
  formatTitle['image-jpeg'] = 'Image (JPEG)';
  formatTitle['image-tiff'] = 'Image (TIFF)';

  let currentView = manifest.currentView;
  let currentSeq = manifest.currentSeq;
  let currentLocation = manifest.currentLocation;
  let selected = manifest.selected;
  let format = 'pdf';
  let range = manifest.allowFullDownload ? 'volume' : 'current-page';
  let totalSeq = manifest.totalSeq;

  let modal;
  let tunnelFrame;
  let tunnelWindow;
  let tunnelForm;
  let tunnelFormTracker;
  let tunnelFormAttempt = 0;
  let downloadInProgress = false;
  let trackerInterval;
  let progressUrl, downloadUrl, totalPages;
  let lastPercent;
  let status = { done: false, percent: -1 };
  let numAttempts = 0;
  let numProcessed = 0;
  let selection = { pages: [], seq: [] };

  let targetPPI = '300';
  let sizeValue = '';
  let sizeAttr;

  let errorMessage;

  let allowDownload = manifest.allowSinglePageDownload || manifest.allowFullDownload;

  function callback(argv) {
    console.log('-- callback', downloadInProgress, argv);
    if (downloadInProgress) {
      [progressUrl, downloadUrl, totalPages] = argv;
      if (trackerInterval) {
        console.log('download: already polling');
        return;
      }

      trackerInterval = setInterval(checkStatusInterval, 2500);
      checkStatusInterval();
      modal.show();
    } else {
      console.log('-- download.callback cancel download');
      clearInterval(trackerInterval);
      trackerInterval = null;
      modal.hide();
    }
  }

  function checkStatusInterval() {
    fetch(progressUrl, { include: 'credentials' })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        numProcessed += 1;
        updateProgress(data);
        if (status.done) {
          clearInterval(trackerInterval);
          trackerInterval = null;
        }
        // error handling
      });
  }

  function updateProgress(data) {
    let percent;
    let current = data.status;
    if (current == 'EOT' || current == 'DONE') {
      status.done = true;
      percent = 100;
      downloadInProgress = false;
      HT.live.announce(`All done! Your ${formatTitle[format]} is ready for download.`);
    } else {
      status.done = false;
      current = data.current_page;
      percent = 100 * (current / totalPages);
      console.log('totalPages', totalPages);
    }

    if (lastPercent != percent) {
      lastPercent = percent;
      numAttempts = 0;
    } else {
      numAttempts += 1;
    }

    if (numAttempts > 100) {
      status.error = true;
    }

    status.percent = percent;
    console.log('-- updateStatus', status);
    status = status;
  }

  function trackInterval() {
    let tracker = `D${tunnelFormAttempt}`;
    let value = HT.cookieJar.getItem('tracker');
    if (value && value.indexOf(tracker) > -1) {
      HT.cookieJar.removeItem('tracker', { path: '/' });
      downloadInProgress = false;
      clearInterval(trackerInterval);
      trackerInterval = null;
    }
  }

  function finalizeDownload() {
    location.href = downloadUrl;
    setTimeout(() => {
      modal.hide();
    }, 1500);
  }

  function closeDownload() {
    downloadInProgress = false;
    if (trackerInterval) {
      clearInterval(trackerInterval);
      trackerInterval = null;
    }
    // but we are not exiting!!
  }

  function cancelDownload() {
    if (!downloadInProgress) {
      console.log('-- download.cancelDownload EXITING');
      return;
    }

    let cancelUrl = new URL(`${location.protocol}//${HT.service_domain}${action}`);
    let params = new URLSearchParams();
    params.set('id', manifest.id);
    params.set('callback', 'tunnelCallback');
    params.set('stop', '1');
    params.set('_', new Date().getTime());
    cancelUrl.search = params.toString();

    let scriptEl = tunnelWindow.document.createElement('script');
    scriptEl.type = 'module';
    scriptEl.src = cancelUrl.toString();
    downloadInProgress = false;
    tunnelWindow.document.body.appendChild(scriptEl);

    console.log('-- download.cancelDownload');
  }

  function submitDownload() {
    console.log('-- download.submitDownload');
    // blah blah is this a short form or not
    errorMessage = '';
    numAttempts = 0;
    numProcessed = 0;

    selection.pages.length = 0;
    if (range == 'selected-pages') {
      selection.pages = Array.from($selected);
      selection.isSelection = true;
      console.log('-- selection', selection);
      if (selection.pages.length == 0) {
        errorMessage = `You haven't selected any pages to download.
        To select pages, use the selection checkbox in the page toolbar.`;
        HT.live.announce(errorMessage);
        return;
      } else if (format == 'image-tiff' && selection.pages.length > 10) {
        errorMessage = `You have selected ${
          Array.from($selected).length
        } page scans. Please update range to 10 page scans or fewer to proceed with a TIFF download.`;
        HT.live.announce(errorMessage);
        return;
      }
    } else if (format == 'image-tiff' && range == 'volume' && totalSeq > 10) {
      errorMessage = `This volume has more than 10 pages. Please choose 10 page scans or fewer to proceed with a TIFF download.`;
      HT.live.announce(errorMessage);
      return;
    } else if (range.startsWith('current-page')) {
      let page;
      switch (range) {
        case 'current-page':
          page = $currentSeq;
          break;
        case 'current-page-verso':
          page = $currentLocation.verso.seq;
          break;
        case 'current-page-recto':
          page = $currentLocation.recto.seq;
          break;
      }
      if (!page) {
        // possibly impossible
      }
      selection.pages = [page];
    }

    if (selection.pages.length > 0) {
      selection.seq = selection.pages;
    }
    selection = selection;
    console.log('-- download selection', selection);

    let partialUpperLimit = format == 'image-tiff' ? 1 : 10;
    if (isPartialDownload() && selection.pages.length <= partialUpperLimit) {
      // use the tunnel
      tunnelFormAttempt = tunnelFormAttempt + 1;
      downloadInProgress = true;

      tunnelFormTracker.value = `D${tunnelFormAttempt}`;

      tunnelForm.querySelectorAll('input[name="seq"]').forEach((inputEl) => {
        inputEl.remove();
      });

      selection.seq.forEach((seq) => {
        let inputEl = document.createElement('input');
        inputEl.type = 'hidden';
        inputEl.name = 'seq';
        inputEl.value = seq;
        tunnelForm.appendChild(inputEl);
      });

      trackerInterval = setInterval(trackInterval, 100);
      tunnelForm.submit();
    } else {
      // start the download in the iframe
      let scriptEl = tunnelWindow.document.createElement('script');
      scriptEl.type = 'module';

      let requestUrl = new URL(`${location.protocol}//${HT.service_domain}${action}`);
      let params = new URLSearchParams();
      params.set('id', manifest.id);

      if (selection.seq) {
        selection.seq.forEach((_seq) => {
          params.append('seq', _seq);
        });
      }
      switch (format) {
        case 'image-jpeg':
        case 'image-tiff':
          params.set('format', format == 'image-tiff' ? 'image/tiff' : 'image/jpeg');
          params.set('target_ppi', targetPPI);
          params.set('bundle_format', 'zip');
          break;
        case 'plaintext-zip':
          params.set('bundle_format', 'zip');
          break;
        case 'plaintext':
          params.set('bundle_format', 'text');
          break;
      }
      params.set('callback', 'tunnelCallback');
      params.set('_', new Date().getTime());

      requestUrl.search = params.toString();
      scriptEl.src = requestUrl.toString();

      downloadInProgress = true;
      tunnelWindow.document.body.appendChild(scriptEl);
    }
  }

  function buildAction(format) {
    let action = '/cgi/imgsrv/';
    if (format.startsWith('image-') && range.startsWith('current-page')) {
      action += 'image';
      sizeAttr = 'size';
      sizeValue = targetPPI == '0' ? 'full' : `ppi:${targetPPI}`;
    } else {
      sizeAttr = 'target_ppi';
      sizeValue = targetPPI;
      action += 'download/' + format.split('-')[0];
    }
    return action;
  }

  function isPartialDownload() {
    return range == 'selected-pages' || range.startsWith('current-page');
  }

  function flattenSelection(selected) {
    const list = [];
    Array.from(selected)
      .sort(function (a, b) {
        return a - b;
      })
      .forEach(function (val) {
        if (list.length == 0) {
          list.push([val, -1]);
        } else {
          const last = list[list.length - 1];
          if (last[1] < 0 && val - last[0] == 1) {
            last[1] = val;
          } else if (val - last[1] == 1) {
            last[1] = val;
          } else {
            list.push([val, -1]);
          }
        }
      });

    for (var i = 0; i < list.length; i++) {
      const tmp = list[i];
      if (tmp[1] < 0) {
        list[i] = tmp[0];
      } else {
        list[i] = tmp[0] + '-' + tmp[1];
      }
    }
    // return list;
    if (JSON.stringify(list) != JSON.stringify(flattenedSelection)) {
      flattenedSelection = list;
      return true;
    }
    return false;
  }

  function gotoSelection(sel) {
    let tmp = new String(sel).split('-');
    emitter.emit('page.goto', { seq: tmp[0] });
  }

  let flattenedSelection = [];

  $: action = buildAction(format, range);
  $: iframeName = `download-module-xxx`; // ${tunnelFormAttempt}`;
  $: if ((format == 'plaintext-zip' || format == 'epub') && range != 'volume') {
    range = 'volume';
  }
  $: if (flattenSelection($selected)) {
    range = 'selected-pages';
  }
  $: meta = manifest.meta($currentSeq);

  onMount(() => {
    if (!allowDownload) {
      return;
    }

    if (!tunnelFrame) {
      return;
    }

    // this will be the log tracking
    tunnelWindow = tunnelFrame.contentWindow;

    // assign global callback
    tunnelWindow.tunnelCallback = function () {
      callback(arguments);
    };

    // return () => {
    //   emitter.off('location.updated', updateSeq);
    // }
  });
</script>

<Panel parent="#controls">
  <i class="fa-solid fa-download" slot="icon" aria-hidden="true"></i>
  <svelte:fragment slot="title">Download</svelte:fragment>
  <svelte:fragment slot="body">
    {#if allowDownload && !manifest.allowFullDownload && $currentView == 'thumb'}
      <div class="alert alert-secondary">Please choose another view to download individual pages.</div>
    {:else if allowDownload}
      <form aria-label="Download options">
        <fieldset class="mb-3">
          <legend class="fs-5">Format</legend>
          <div class="form-check">
            <input
              name="format"
              class="form-check-input"
              type="radio"
              value="pdf"
              id="format-pdf"
              bind:group={format}
            />
            <label class="form-check-label" for="format-pdf"> Ebook (PDF) </label>
          </div>
          {#if manifest.allowFullDownload}
            <div class="form-check">
              <input
                name="format"
                class="form-check-input"
                type="radio"
                value="epub"
                id="format-epub"
                bind:group={format}
              />
              <label class="form-check-label" for="format-epub"> Ebook (EPUB) </label>
            </div>
          {/if}
          <div class="form-check">
            <input
              name="format"
              class="form-check-input"
              type="radio"
              value="plaintext"
              id="format-plaintext"
              bind:group={format}
            />
            <label class="form-check-label" for="format-plaintext"> Text (.txt) </label>
          </div>
          {#if manifest.allowFullDownload}
            <div class="form-check">
              <input
                name="format"
                class="form-check-input"
                type="radio"
                value="plaintext-zip"
                id="format-archive"
                bind:group={format}
              />
              <label class="form-check-label" for="format-archive"> Text (.zip) </label>
            </div>
          {/if}
          <div class="form-check">
            <input
              name="format"
              class="form-check-input"
              type="radio"
              value="image-jpeg"
              id="format-image-jpeg"
              bind:group={format}
            />
            <label class="form-check-label" for="format-image-jpeg"> Image (JPEG) </label>
          </div>
          <div class="form-check">
            <input
              name="format"
              class="form-check-input"
              type="radio"
              value="image-tiff"
              id="format-image-tiff"
              bind:group={format}
            />
            <label class="form-check-label" for="format-image-tiff"> Image (TIFF) </label>
          </div>
        </fieldset>

        {#if format.startsWith('image-')}
          <fieldset class="mb-3">
            <legend class="fs-5">Image Resolution</legend>
            <div class="form-check">
              <input
                name="target-ppi"
                class="form-check-input"
                type="radio"
                value="300"
                id="image-target-ppi-300"
                bind:group={targetPPI}
              />
              <label class="form-check-label" for="image-target-ppi-300">
                High / 300 dpi
                {#if meta.resolution}
                  ({meta.screenResolution})
                {/if}
              </label>
            </div>
            <div class="form-check">
              <input
                name="target-ppi"
                class="form-check-input"
                type="radio"
                value="0"
                id="image-target-ppi-full"
                bind:group={targetPPI}
              />
              <label class="form-check-label" for="image-target-ppi-full">
                Full / 600 dpi
                {#if meta.resolution}
                  ({meta.size.width}x{meta.size.height})
                {/if}
              </label>
            </div>
          </fieldset>
        {/if}

        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <fieldset class="mb-3" id="download-range">
          <legend class="fs-5">Range</legend>
          <div aria-live="polite" aria-atomic="true">
            {#if format == 'image-tiff' && (range == 'selected-pages' || range == 'volume')}
              <p class="fs-7 mb-3 mt-2 text-cyan-700" tabindex="0" id="tiff-note">
                Note: TIFF downloads are limited to <span class="fw-bold">10 page scans</span> at a time, as it is resource-intensive.
              </p>
            {/if}
          </div>

          {#if $currentView == '1up'}
            <div class="form-check">
              <input
                name="range"
                class="form-check-input"
                type="radio"
                value="current-page"
                id="range-current-page"
                disabled={format == 'epub' || format == 'plaintext-zip'}
                bind:group={range}
              />
              <label class="form-check-label" for="range-current-page">
                Current page scan (#{$currentSeq})
              </label>
            </div>
          {:else if $currentView == '2up'}
            {#if $currentLocation.verso}
              <div class="form-check">
                <input
                  name="range"
                  class="form-check-input"
                  type="radio"
                  value="current-page-verso"
                  id="range-current-verso-page"
                  disabled={format == 'epub' || format == 'plaintext-zip'}
                  bind:group={range}
                />
                <label class="form-check-label" for="range-current-verso-page">
                  Current verso page scan (#{$currentLocation.verso.seq})
                </label>
              </div>
            {/if}
            {#if $currentLocation.recto}
              <div class="form-check">
                <input
                  name="range"
                  class="form-check-input"
                  type="radio"
                  value="current-page-recto"
                  id="range-current-recto-page"
                  disabled={format == 'epub' || format == 'plaintext-zip'}
                  bind:group={range}
                />
                <label class="form-check-label" for="range-current-recto-page">
                  Current right page scan (#{$currentLocation.recto.seq})
                </label>
              </div>
            {/if}
          {/if}
          {#if manifest.allowFullDownload}
            <div class="form-check">
              <input
                name="range"
                class="form-check-input"
                type="radio"
                value="volume"
                id="range-download-volume"
                bind:group={range}
              />
              <label class="form-check-label" for="range-download-volume"> Whole item </label>
            </div>
            <div class="form-check">
              <input
                name="range"
                class="form-check-input"
                type="radio"
                value="selected-pages"
                id="range-selected-pages"
                disabled={format == 'epub' || format == 'plaintext-zip'}
                bind:group={range}
              />
              <label class="form-check-label" for="range-selected-pages"> Selected page scans </label>
            </div>

            <div class="d-flex justify-content-between" class:d-none={flattenedSelection.length == 0}>
              <ul class="list-unstyled mx-4 mb-1">
                {#each flattenedSelection as sel}
                  <li>
                    <button type="button" class="btn btn-link py-0" on:click={() => gotoSelection(sel)}>{sel}</button>
                  </li>
                {/each}
              </ul>
              <button
                class="btn btn-outline-dark align-self-start"
                type="button"
                aria-label="Clear selection"
                use:tooltippy
                on:click={() => manifest.clearSelection()}
              >
                <i class="fa-regular fa-circle-xmark" aria-hidden="true"></i>
              </button>
            </div>
          {/if}
        </fieldset>

        <p class="mb-3">
          <button
            type="button"
            class="btn btn-outline-dark"
            disabled={downloadInProgress}
            on:click|preventDefault={submitDownload}
          >
            Download
            {#if downloadInProgress}
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span class="visually-hidden">Loading...</span>
            {/if}
          </button>
        </p>
        {#if errorMessage}
          <div class="alert alert-warning fs-7 d-flex justify-content-between gap-2 pe-2">
            <i class="alert-icon fa-solid fa-triangle-exclamation"></i>
            <p class="py-3">{errorMessage}</p>
          </div>
        {/if}

        <p class="fs-7 mb-1">
          <a
            class="fs-7"
            target="_blank"
            href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2387247137">Download Help</a
          >
        </p>
        {#if !manifest.allowFullDownload && !HT.login_status.logged_in}
          <p class="fs-7 mt-1 mb-1">
            <strong><a href="/cgi/wayf?target={encodeURIComponent(location.href)}">Log in</a></strong> to your library to
            download this item.
          </p>
          <p class="fs-7 mt-1 fst-italic">
            If you are not affiliated with a <a
              target="_blank"
              href="https://www.hathitrust.org/member-libraries/member-list/">member institution</a
            >, whole book download is not available. (<a
              target="_blank"
              href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2387247137">Why not?</a
            >)
          </p>
        {/if}
      </form>
      <form class="d-none" bind:this={tunnelForm} method="GET" {action} target="download-module-xxx">
        <input type="hidden" name="id" value={manifest.id} />
        <input type="hidden" name="attachment" value="1" />
        <input type="hidden" name="tracker" value="" bind:this={tunnelFormTracker} />
        <!-- {#each selection.seq as seq}
      <input type="hidden" name="seq" value={seq} />
      {/each} -->
        {#if format == 'image-tiff' || format == 'image-jpeg'}
          <input type="hidden" name="format" value="image/{format.split('-')[1]}" />
          <input type="hidden" name={sizeAttr} value={sizeValue} />
        {:else if format == 'plaintext-zip'}
          <!-- do something else -->
        {/if}
      </form>
      <iframe
        bind:this={tunnelFrame}
        class="visually-hidden"
        style:opacity={0}
        aria-hidden="true"
        title="Tunnel Download Tracker"
        name="download-module-xxx"
        tabindex="-1"
     ></iframe>
    {:else}
      <p>This item cannot be downloaded.</p>
    {/if}
  </svelte:fragment>
</Panel>
<Modal bind:this={modal} onClose={closeDownload}>
  {#snippet title()}
    Building your {formatTitle[format]}
    {#if $selected.size > 0}
      ({$selected.size} page{$selected.size > 1 ? 's' : ''})
    {/if}
  {/snippet}
  {#snippet body()}
    <div xxstyle="width: 30rem">
      <div>
        {#if status.percent < 100}
          <p>Please wait while we build your {formatTitle[format]}.</p>
          <div
            class="progress"
            role="progressbar"
            aria-label="Download Progress"
            aria-valuenow={status.percent}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div class="progress-bar progress-bar-striped progress-bar-animated" style:width={`${status.percent}%`}></div>
          </div>
          <p class="fs-7 text-body-secondary">
            <a target="_blank" href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2387345411"
              >What affects the download speed?</a
            >
          </p>
        {/if}
      </div>
      {#if status.done}
        <p>All done! Your {formatTitle[format]} is ready for download.</p>
      {/if}
    </div>
  {/snippet}
  {#snippet footer()}
    <div class="d-flex gap-1 align-items-center justify-content-end">
      <button
        type="button"
        class="btn btn-secondary"
        on:click={cancelDownload}
        aria-disabled={status.done}
        class:disabled={status.done}>Cancel</button
      >
      <!-- <button 
        type="button" 
        class="btn btn-primary"
        disabled={downloadInProgress}
        on:click={finalizeDownload}>Download</button> -->
      {#if downloadInProgress}
      <span class="btn btn-primary disabled">
        Download
      </span>
      {:else}
      <a
        class="btn btn-primary"
        on:click={() => modal.hide()}
        href={downloadUrl}>Download</a
      >
      {/if}
    </div>
    {/snippet}
</Modal>

<style lang="scss">
  .alert-warning {
    --bs-alert-color: var(--color-neutral-800);
    --bs-alert-border-color: #997404;
  }
  .alert {
    border: none;
    border-inline-start: 0.25rem solid var(--bs-alert-border-color);
    padding: 0;
    border-radius: 0.25rem;
    box-shadow: 0px 4px 8px 0px rgba(25, 11, 1, 0.04);
    i.alert-icon {
      color: var(--bs-alert-border-color);
      display: flex;
      width: 1.5rem;
      padding-block-start: 1rem;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      align-self: stretch;
      margin-inline-start: 0.5rem;
      line-height: 1.3125rem;
    }
    p {
      line-height: 1.3125rem;
      letter-spacing: -0.01rem;
      margin-block-end: 0;
    }
  }
</style>
