<script>
  import { onMount, getContext } from 'svelte';
  import {SvelteURL, SvelteURLSearchParams} from 'svelte/reactivity'
  import { tick } from 'svelte';
  import { tooltippy } from '../../lib/tippy';

  import Panel from '../Panel/index.svelte';
  import Modal from '~firebird-common/src/js/components/Modal/index.svelte';

  const manifest = getContext('manifest');
  const emitter = getContext('emitter');
  const HT = getContext('HT');

  const formatTitle = $state({});
  formatTitle['pdf'] = 'PDF';
  formatTitle['epub'] = 'EPUB';
  formatTitle['plaintext'] = 'Text (.txt)';
  formatTitle['plaintext-zip'] = 'Text (.zip)';
  formatTitle['image-jpeg'] = 'Image (JPEG)';
  formatTitle['image-tiff'] = 'Image (TIFF)';

  let currentView = manifest.currentView;
  let currentSeq = manifest.currentSeq;
  let currentLocation = manifest.currentLocation;
  let totalSeq = manifest.totalSeq;
  let meta = $derived(manifest.meta($currentSeq));
  let allowDownload = manifest.allowSinglePageDownload || manifest.allowFullDownload;
  let selected = manifest.selected;
  
  let format = $state('pdf');
  let range = $state(manifest.allowFullDownload ? 'volume' : 'current-page');
  let selection = $state({ pages: [] });
  let action = $derived(buildAction());
  let targetPPI = $state('300');

  let modal = $state();
  let downloadAttempt = 1;
  let request = new SvelteURL(`${location.protocol}//${HT.service_domain}`)
  let downloadInProgress = $state(false);
  let cancellingDownload = $state(false);
  let trackerInterval;
  let progressUrl, downloadUrl = $state(), totalPages;
  let lastPercent;
  let status = $state({ done: false, percent: -1 });
  let numAttempts = 0;
  let numProcessed = 0;
  let simpleDownload = $derived(isSimpleDownload());
  let sizeValue = '';
  let sizeAttr;
  let flattenedSelection = $state([]);
  let clearSelectionLabel = $state('Clear selection');

  let emptySelection = $derived(range == 'selected-pages' && selection.pages.length == 0);
  let emptySelectionTIFF = $derived(emptySelection && format == 'image-tiff');
  let tooManyTiffs = $derived(range == 'selected-pages' && format == 'image-tiff' && selection.pages.length > 10);
  let buttonDisabled = $derived(emptySelection || emptySelectionTIFF || tooManyTiffs );
  let errorMessage = $derived(
    emptySelectionTIFF ? `<p>No pages selected.
        Use the toolbar to select up to <span class="fw-bold">10 pages</span> to continue your TIFF download.</p>` :
    emptySelection ? `<p>No pages selected.
        Use the toolbar to select pages.</p>` :
    tooManyTiffs ? `<p>Your selection exceeds the TIFF download limit. Select 10 pages or fewer to continue.</p>` :
    null
  );
  let errorCount = 0;
  let downloadError = $state(false);
  let downloadErrorMessage = $state('');

  const _mtm = (window._mtm = window._mtm || []);

  let simpleUrl = $derived.by(() => {
    let newAction = buildAction();
		let params = new SvelteURLSearchParams()

    params.set('id', manifest.id);
    params.set('attachment', '1');
    params.set('tracker', `D${downloadAttempt}`);
		
		if (format == 'image-tiff' || format == 'image-jpeg') {
      params.set('format', `image/${format.split('-')[1]}`);
      params.set(sizeAttr, sizeValue);
    }
	
    selection.pages.forEach((seq) => {
      params.append('seq', seq);
    });
		
		return `${request}${newAction}?${params.toString()}`
	})

  function callback(argv) {
    console.log('-- callback', downloadInProgress, argv);
    if (downloadInProgress) {
      [progressUrl, downloadUrl, totalPages] = argv;
      if (trackerInterval) {
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
      document.getElementById('submit-download').focus();
    }
  }

  function checkStatusInterval() {
    fetch(progressUrl, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) {
          _mtm.push({'event': 'pt-large-download-error', 'download fetch failed': `${progressUrl.toString()}`});
          throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        numProcessed += 1;
        updateProgress(data);
        if (status.done) {
          clearInterval(trackerInterval);
          trackerInterval = null;
        }
      })
      .catch((error) => {
      console.error('Progress check error:', error);
      numAttempts += 1;
      
      // Stop polling after too many failures
      if (numAttempts > 3) {
        clearInterval(trackerInterval);
        trackerInterval = null;
        downloadInProgress = false;
        downloadError = true;
        downloadErrorMessage = 'Download failed. Please try again.';
        status.error = true;
        _mtm.push({'event': 'pt-large-download-error', 'downloadStatusUrl': `${progressUrl.toString()}`});
      }
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
    console.log('-- updateStatus', $state.snapshot(status));
    status = status;
  }

  function closeDownload() {
    downloadInProgress = false;
    if (trackerInterval) {
      clearInterval(trackerInterval);
      trackerInterval = null;
    }
    document.getElementById('submit-download').focus();
    // but we are not exiting!!
  }

  function cancelDownload() {
    if (!downloadInProgress) {
      console.log('-- download.cancelDownload EXITING');
      return;
    }

    cancellingDownload = true;

    let cancelUrl = new URL(`${location.protocol}//${HT.service_domain}/${action}`);
    let params = new URLSearchParams();
    params.set('id', manifest.id);
    params.set('callback', 'tunnelCallback');
    params.set('stop', '1');
    params.set('_', new Date().getTime().toString());
    cancelUrl.search = params.toString();

    let scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.src = cancelUrl.toString();

    downloadInProgress = false;
    document.body.appendChild(scriptEl);

    scriptEl.onload = () => {
      document.body.removeChild(scriptEl);
    };

    console.log('-- download.cancelDownload');
    setTimeout(() => {
      cancellingDownload = false;
    }, 1000);
  }

  function isSimpleDownload() {
		let partialUpperLimit = format == 'image-tiff' ? 1 : 10;
		if((range !== 'volume') && (selection.pages.length <= partialUpperLimit)) {		
			return true;
		} else {
			return false;
		}
	}

  function buildAction() {
    $inspect.trace()
    let action = 'cgi/imgsrv/';
    if (format.startsWith('image-') && (range == 'current-page' || range == 'current-page-verso' || range == 'current-page-recto')) {
      action += 'image';
      sizeAttr = 'size';
      sizeValue = targetPPI == '0' ? 'full' : `ppi:${targetPPI}`;
    } else {
      action += 'download/' + format.split('-')[0];
      sizeAttr = 'target_ppi';
      sizeValue = targetPPI;
    }
    return action;
  }

  function buildCallbackDownloadUrl() {
    let scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';

      let requestUrl = new URL(`${location.protocol}//${HT.service_domain}/${action}`);
      let params = new URLSearchParams();
      params.set('id', manifest.id);

      if (selection.pages) {
        selection.pages.forEach((seq) => {
          params.append('seq', seq);
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
      params.set('_', new Date().getTime().toString());

      requestUrl.search = params.toString();
      scriptEl.src = requestUrl.toString();

      downloadInProgress = true;
    
      // inject script
      document.body.appendChild(scriptEl);
      
      // remove script after it loads
      scriptEl.onload = () => {
        document.body.removeChild(scriptEl);
      };
      //handle error if something goes wrong
      scriptEl.onerror = () => {
        document.body.removeChild(scriptEl);
        errorMessage = 'Failed to start download. Please try again.';
        HT.live.announce(errorMessage.replace(/<\/?[^>]+(>|$)/g, ""));
        downloadInProgress = false;
        _mtm.push({'event': 'pt-large-download-error', 'downloadUrl': `${requestUrl.toString()}`});
      };
    }

  function calculateSelection() {
    $inspect.trace()
    if (range == 'selected-pages') {
      selection.pages = Array.from($selected)
    } else if (range == 'volume') {
      selection.pages = []
    } else {
      let page;
      //occassionally this switch causes a minor error in the console
      //because of the verso/recto situation
      //e.g. the range is set to 'current-page-verso'
      //but the user has scrolled to a 2-up that doesn't have a verso page in the data
      //the range update can't just swap to recto because it doesn't know it needs to 
      //(i tried SO MANY WAYS to make it do it)
      //but $currentLocation.verso.seq is undefined so this errors
      //if the user makes a different selection or scrolls, this function fires again without issue
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
      selection.pages = [page]
    }
  }

  function submitDownload(e) {
    e.preventDefault();
    console.log('-- download.fetchDownload')
    
    downloadError = false;
    numAttempts = 0;
    numProcessed = 0;

    if (isSimpleDownload()) {
      downloadInProgress = true;

      const onReturn = () => {
        downloadInProgress = false;
        window.removeEventListener('focus', onReturn);
        document.removeEventListener('visibilitychange', onReturn);
        document.getElementById('submit-download').focus();
      };

      window.addEventListener('focus', onReturn);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) onReturn();
      });
      modal.show();
      downloadAttempt++;
    } else {
      buildCallbackDownloadUrl(); 
    }
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

  $effect(() => {
    if ((format == 'plaintext-zip' || format == 'epub') && range != 'volume') {
      range = 'volume';
    }
  });
  $effect(() => {
    if (flattenSelection($selected)) {
      clearSelectionLabel = `Clear selected scans: ${flattenedSelection.join(', ')}`;
      range = 'selected-pages';
    }
  });
  
  $effect(() => {
    if (totalSeq > 10 && format == 'image-tiff' && range == 'volume') {
      if ($currentView == '1up') {
        range = 'current-page'
      } else if ($currentView == '2up') {
       if ($currentLocation.verso) {
          range = 'current-page-verso' 
        } else if ($currentLocation.recto) {
          range = 'current-page-recto'
        }
      } else if ($currentView == 'thumb') {
        range = 'selected-pages'
      }
    }
  })
  $effect(() => {
    if($currentView == '1up') {
      if(range !== 'volume' && range !== 'selected-pages' && range !== 'current-page') {
        range = 'current-page'
      }
    } else if($currentView == '2up') {
      //this is not great
      //but if the user had previously selected 'current-page' during 1-up view and switches to 2-up view
      //the range is still set to 'current-page' and needs to be magicked to either recto or verso
      //frustratingly, at the beginning/end of volumes, sometimes verso or recto don't exist
      //so we just pick one that's available
     if (range !== 'volume' && range !== 'selected-pages' && range !== 'current-page-recto' && range !== 'current-page-verso') {
        if ($currentLocation.verso) {
          range = 'current-page-verso' 
        } else if ($currentLocation.recto) {
          range = 'current-page-recto'
        }
      }
    } else if ($currentView == 'thumb') {
      range = 'selected-pages'
    }
  })
  $effect(() => {
      calculateSelection()
	})
  
  $effect(() => {
    if (errorMessage) {
      errorCount++;
      // this is a hacky workaround for aria-live announcements
      // chrome does not re-announce the last message it announced, even if it left the DOM and re-entered the DOM
      // this adds a space to the end of the message before sending it to our announcement library
      HT.live.announce(`${errorMessage.replace(/<\/?[^>]+(>|$)/g, "")}${' '.repeat(errorCount)}`);
    }
  });

  onMount(() => {
    if (!allowDownload) {
      return;
    }
    // assign global callback
     window.tunnelCallback = function () {
      callback(arguments);
    };

  });
</script>

<Panel parent="#controls">
  {#snippet icon()}
    <i class="fa-solid fa-download"  aria-hidden="true"></i>
  {/snippet}
  {#snippet title()}
    Download
  {/snippet}
  {#snippet body()}
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

          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <fieldset class="mb-3" id="download-range">
            <legend class="fs-5">Range</legend>
            {#if $currentView == '1up'}
              <div class="form-check">
                <input
                  name="range"
                  class="form-check-input"
                  type="radio"
                  value='current-page'
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
                    value='current-page-verso'
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
                    value='current-page-recto'
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
                  disabled={totalSeq > 10 && format == 'image-tiff'}
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
                      <button type="button" class="btn btn-link py-0" onclick={() => gotoSelection(sel)}>{sel}</button>
                    </li>
                  {/each}
                </ul>
                <button
                  class="btn btn-outline-dark align-self-start"
                  type="button"
                  aria-label={clearSelectionLabel}
                  use:tooltippy={{ content: 'Clear selection' }}
                  onclick={() => manifest.clearSelection()}
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
              disabled={downloadInProgress||buttonDisabled}
              onclick={submitDownload}
              id="submit-download"
            >
              Download
              {#if downloadInProgress}
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span class="visually-hidden">Loading...</span>
              {/if}
            </button>
          </p>
          {#if errorMessage}
            <div class="alert inline-alert alert-warning fs-7 d-flex gap-2">
              <div class="icon-wrapper d-flex">
                <i class="alert-icon fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              </div>
              {@html errorMessage}
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
      {:else}
        <p>This item cannot be downloaded.</p>
      {/if}
    
  {/snippet}
</Panel>
<Modal bind:this={modal} onClose={closeDownload} focusDownloadOnClose>
  {#snippet title()}
    {#if simpleDownload}
      Download your {formatTitle[format]}
    {:else}
      Building your {formatTitle[format]}
      {#if range == 'selected-pages' && $selected.size > 0}
        ({$selected.size} page{$selected.size > 1 ? 's' : ''})
      {/if}
    {/if}
  {/snippet}
  {#snippet body()}
    <div xxstyle="width: 30rem">
      <div>
        {#if simpleDownload}
          <p>Your download is ready.</p>
        {:else}
          {#if status.percent < 100 && !downloadError}
            <p>Please wait while we build your {formatTitle[format]}.</p>
            <div
              class="progress"
              role="progressbar"
              aria-label="Download Progress"
              aria-valuenow={status.percent}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="progress-bar progress-bar-striped progress-bar-animated"
                style:width={`${status.percent}%`}
              ></div>
            </div>
            <p class="fs-7 text-body-secondary">
              <a target="_blank" href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2387345411"
                >What affects the download speed?</a
              >
            </p>
          {/if}
        {/if}
      </div>
      {#if !simpleDownload && downloadError} 
        <p>{downloadErrorMessage}</p>
      {/if}
      {#if !simpleDownload && status.done}
        <p>All done! Your {formatTitle[format]} is ready for download.</p>
      {/if}
    </div>
  {/snippet}
  {#snippet footer()}
  {#if !downloadError}
    <div role="status">
      <div class="d-flex gap-1 align-items-center justify-content-end">
        {#if !simpleDownload}
        <button
          type="button"
          class="btn btn-secondary"
          onclick={cancelDownload}
          disabled={status.done}
          class:disabled={status.done}>Cancel</button
        >
        {/if}
        {#if !simpleDownload && downloadInProgress} 
          <span class="btn btn-primary disabled"> Download </span>
        {:else}
          <a
            target="_blank"
            class="btn btn-primary"
            onclick={(() => {modal.hide(); () => document.getElementById('submit-download').focus();})}
            href={simpleDownload ? simpleUrl : downloadUrl}>Download</a
          >
        {/if}
      </div>
      {#if !simpleDownload && cancellingDownload}
        <span class="visually-hidden">Download cancelled</span>
      {/if}
    </div>
    {/if}
  {/snippet}
</Modal>

<style lang="scss">
  .alert-warning {
    --alert-warning-color: #664D03;
    --alert-warning-base: #FFF3CD;
    --alert-warning-border-color: #FFECB5;
    --bs-alert-color: var(--alert-warning-color);
    --bs-alert-bg: var(--alert-warning-base);
    --bs-alert-border-color: var(--alert-warning-border-color);
  }
  .alert.inline-alert {
    border: 1px solid var(--bs-alert-border-color);
    padding-block: 0.75rem;
    padding-inline: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    box-shadow: 0px 4px 8px 0px rgba(25, 11, 1, 0.04);
    line-height: 1.3125rem;
    letter-spacing: -0.00875rem;
    color: var(--bs-alert-color);
    .icon-wrapper {
      width: 1.5rem;
      height: 1.5rem;
      justify-content: center;
      align-items: center;
      gap: 0.625rem;
    }
    i.alert-icon {
      font-size: 1rem;
      display: flex;
      width: 1.5rem;
      flex-direction: column;
      align-items: center;
      opacity: 0.8;
    }
  }
</style>
