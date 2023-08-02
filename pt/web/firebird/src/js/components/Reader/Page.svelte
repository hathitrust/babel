<svelte:options accessors={true} />
<script>

  import { onMount, getContext, tick } from 'svelte';
  import { afterUpdate } from 'svelte';
  import { get } from 'svelte/store';

  import { tooltip } from '../../lib/tooltip';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');
  const HT = getContext('HT');

  const q1 = manifest.q1;
  const selected = manifest.selected;

  import SearchHighlights from '../SearchHighlights/index.svelte';
  import PageMenu from './PageMenu';
  import PageMessage from './PageMessage';

  import { extractHighlights } from '../../lib/highlights';

  const LOAD_DELAY_TIMEOUT = 500;
  const EXAGGERATED_DEBUG_DELAY_TIMEOUT = 5000;

  export let observer;
  export let handleIntersecting;
  export let handleUnintersecting;
  export let format;
  export let view;

  export let seq;
  export let canvas;
  export let zoom;
  export let style = null;
  export let side = null;
  
  export let innerHeight
  export let innerWidth;

  export let debugChoke = false;
  export let debugLoad = false;

  let includePageText = ( view != 'thumb' );

  let focused = false;
  let invoked = false;
  let pageDiv;

  let pageNum = manifest.pageNum(seq);

  let lastZoom = zoom;
  let pageZoom = 1;

  let scan;
  let image;
  let rotatedImage;
  let imageSrc;
  let matches;
  let page_coords;
  let pageText;
  let figCaption;
  let pageTextIsLoaded = false;
  let objectUrl;
  let isLoaded = false;
  let isLoading = false;
  let hasPageText = false;

  let isRTL = manifest.direction() == 'rtl';

  let timeout;

  let requestStatus = 200;
  
  // capture the x-choke-xyz headers
  let xChokeAllowed = 1;
  let xChokeCredit;
  let xChokeDebt;
  let xChokeDelta;
  let xChokeUntil;

  let defaultThumbnailSrc = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`;

  export const offsetTop = function() {
    return pageDiv.parentElement.offsetTop + pageDiv.offsetTop;
  }

  export const focus = function(invoke=false) {
    focused = true;
    invoked = invoke;
  }

  export const unfocus = function() {
    focused = false;
    if ( pageDiv == document.activeElement ) { pageDiv.blur(); }
  }

  export const visible = function(viewport) {
    // because we have spreads
    let top = pageDiv.parentElement.offsetTop + pageDiv.offsetTop;
    let height = pageDiv.clientHeight;
    let bottom = top + height;

    let rootMargin = 0;

    let pageIsVisible = ( top >= ( viewport.top - rootMargin ) && bottom <= ( viewport.bottom + rootMargin ));
    let bottomIsVisible = ( top < ( viewport.top - rootMargin ) && viewport.top < ( bottom + rootMargin ) )
    let topIsVisible = ( top < ( viewport.bottom + rootMargin ) && viewport.bottom < ( bottom + rootMargin ));

    let percentage = 0; let test;
    if ( topIsVisible || bottomIsVisible || pageIsVisible ) {
      // now we're visible
      if ( pageIsVisible ) {
        percentage = 1.0;
        test = 'topIsVisible && bottomIsVisible';
      } else if ( topIsVisible ) {
        // only the top is visible
        let heightVisible = viewport.bottom - top;
        percentage = heightVisible / height;
        test = 'topIsVisible';
      } else if ( bottomIsVisible ) {
        let heightVisible = bottom - viewport.top;
        percentage = heightVisible / height;
        test = 'bottomIsVisible';
      }
    }

    // console.log("-- visible", seq, percentage, { top, bottom }, viewport );

    return percentage;
  }

  export async function toggle(visible) {
    isVisible = visible;
    if (visible) {
      // let isVisible update the DOM
      await tick();
      if ( format == 'image' ) {
        loadImage();
      } else {
        loadPageText();
      }
    } else {
      if ( format == 'image' ) {
        unloadImage();
      }
      unloadPageText();
      clearTimeout(timeout);
      isLoaded = false;
    }
  }

  const updateMatches = function(coords, values) {
    matches = [ ...values ];
    page_coords = [ ...coords ];
  }

  let loadImageTimeout;
  let loadPageTextTimeout;
  const buildRequest = function(action, params) {
    const req = new URL(`${location.protocol}//${HT.service_domain}/cgi/imgsrv/${action}`);
    Object.keys(params).forEach((param) => {
      if ( params[param] ) {
        req.searchParams.set(param, params[param]);
      }
    })
    if ( manifest.debug ) {
      req.searchParams.set('debug', manifest.debug);
    }
    return req.toString();
  }

  export const loadImage = function(reload=false) {
    // console.log("-- page.loadImage", seq, isVisible, isLoaded);
    if ( debugLoad ) {
      clearTimeout(loadImageTimeout);
      loadImageTimeout = setTimeout(() => {
        loadImageActual(reload);
      }, EXAGGERATED_DEBUG_DELAY_TIMEOUT);
      return;
    }
    loadImageActual(reload);
  }

  export const loadImageActual = function(reload=false) {
    timeout = null;

    if ( isLoading ) {
      if ( debugChoke || debugLoad ) {
        console.log("-- page.loadImage already loading", seq);
      }
      return;
    }

    isLoading = true;

    // if ( image && image.src != defaultThumbnailSrc || reload ) { console.log(":: not loading DUPE", image.src); return ; }
    if ( ! image ) { console.log("-- page.loadImage - no image", seq); return ; }
    if ( image && image.src != defaultThumbnailSrc ) {
      if ( ! reload ) { 
        console.log("-- page.loadImage - not loading DUPE", seq, image.src)
        return ; 
      }
    }
    let height = ( view == 'thumb' ) ? 250 : Math.ceil(manifest.fit(scanHeight) * window.devicePixelRatio);
    let action = ( view == 'thumb' ) ? 'thumbnail' : 'image';
    imageSrc = buildRequest(action, {
      id: canvas.id,
      seq: seq,
      height: height
    });

    let isRestricted = false;
    fetch(imageSrc)
      .then((response) => {

        xChokeAllowed = response.headers.get('x-choke-allowed');
        xChokeDebt = response.headers.get('x-choke-debt');
        xChokeCredit = response.headers.get('x-choke-credit');
        xChokeUntil = response.headers.get('x-choke-until');
        xChokeDelta = response.headers.get('x-choke-delta');

        if (!response.ok) {
          requestStatus = response.status;
          return;
        }

        if ( response.headers.get('x-hathitrust-access') == 'deny' ) {
          isRestricted = true;
        }

        if ( response.headers.get('x-hathitrust-renew') ) {
          emitter.emit('auth.renew', response.headers.get('x-hathitrust-renew'));
        }

        let update = {};
        let size = response.headers.get('x-image-size');
        if ( size ) {
          let parts = size.split('x');
          let naturalHeight = parseInt(parts[1], 10);
          let naturalWidth = parseInt(parts[0], 10) ;
          let ratio = canvas.height / naturalHeight;
          let width = Math.ceil(naturalWidth * ratio);

          canvas.width = width;
          canvas.useWidth = Math.ceil(canvas.useHeight * ( canvas.width / canvas.height ));
          canvas = canvas;
          update = Object.assign(update, {
            height: canvas.height,
            width: width,
            size: {
              width: naturalWidth,
              height: naturalHeight
            }
          });
        }

        let resolution = response.headers.get('x-image-resolution');
        if ( resolution ) {
          update.resolution = resolution.replace("/1", "").replace(/\.0+ /, ' ');
          const r = 300 / parseInt(update.resolution, 10);
          update.screenResolution = `${Math.ceil(update.size.width * r)}x${Math.ceil(update.size.height * r)}`
        }

        if ( size || resolution) {
          manifest.update(seq, update);
          canvas.ratio = manifest.meta(seq).ratio;
        }

        return response.blob();
      })
      .then(blob => {
        if ( requestStatus == 429 ) { return ; }

        if ( objectUrl ) {
          URL.revokeObjectURL(objectUrl);
        }

        if ( false && isRestricted && blob.text ) {
          blob.text().then((text) => {
            let nextBlob = new Blob([text], { type: 'image/svg+xml' });
            objectUrl = URL.createObjectURL(nextBlob);
          })
        } else {
          objectUrl = URL.createObjectURL(blob);
        }

        if ( image ) {
          image.src = objectUrl;
          isLoaded = true; isLoading = false;
          if ( ! isRestricted ) {
            loadPageText();
            emitter.on('page.update.highlights', updatePageText);
          }
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })    
  }

  export const unloadImage = function() {
    URL.revokeObjectURL(objectUrl);
    if ( image ) {
      image.src = defaultThumbnailSrc;
    }
    // console.log("-- !! page.loadImage - unload", seq, image, orient);
  }

  const unloadPageText = function() {
    if ( figCaption ) { figCaption.innerHTML = ''; }
    emitter.off('page.update.highlights', updatePageText);
  }

  const updatePageText = function() {
    loadPageText(true);
  }

  let numPageTextLoaded = 0;
  export const loadPageText = function(reload=false) {
    // console.log("-- page.loadImage", seq, isVisible, isLoaded);
    // return;
    if ( debugLoad ) {
      clearTimeout(loadPageTextTimeout);
      loadPageTextTimeout = setTimeout(() => {
        loadPageTextActual(reload);
      }, EXAGGERATED_DEBUG_DELAY_TIMEOUT);
      return;
    }
    loadPageTextActual(reload);
  }

  export const loadPageTextActual = function(reload=false) {
    // return;

    if ( ! isVisible ) { return ; }
    if ( ! figCaption ) { return ; }

    if ( ! includePageText ) { return ; }

    if ( figCaption && figCaption.dataset.loaded == 'true' && ! reload ) {
      return;
    }

    function parseCoords(value) {
      if ( ! value ) { return null; }
      var values = value.split(' ')
      return values.map((v) => parseInt(v, 10));
    }

    // if ( pageText && pageText.querySelector('.ocr_page') ) { return ; }
    let text_src = buildRequest('html', {
      id: canvas.id,
      seq: seq,
      q1: $q1
    })
    fetch(text_src)
      .then((response) => {
        return response.text();
      })
      .then(text => {

        numPageTextLoaded =+ 1;

        if ( ! figCaption ) { return ; }

        text = text.replace(/<span class="ocr_line"/g, '<span class="ocr_line" role="text"');
        const parser = new DOMParser();
        const ocr_div = parser.parseFromString(text, 'text/html').body.childNodes[0];

        if ( ocr_div.textContent.trim() == "" || ! ocr_div.textContent.trim().match(/\w+/) ) {
          ocr_div.innerHTML = `
            <div class="w-100 m-auto mt-3">
              <div class="alert alert-block alert-secondary fs-1 fw-bold text-center text-uppercase">
                No text on page
              </div>
              <p>This page does not contain any text recoverable by the OCR engine.</p>
            </div>`;
        }

        // we have text so watch for updates
        figCaption.innerHTML = '';
        figCaption.dataset.loaded = true;
        figCaption.append(ocr_div);

        // if no words match, there's no highlighting
        let words = JSON.parse(ocr_div.dataset.words || '[]');
        if ( ! words || ! words.length ) { page_coords = null; return ; }

        page_coords = parseCoords(ocr_div.dataset.coords);

        matches = extractHighlights(words, ocr_div);
      })

      if ( format == 'plaintext' && figCaption.dataset.configured != 'true' ) {
        emitter.on('page.update.highlights', updatePageText);
        figCaption.dataset.configured = true;
        isLoaded = true;
      }
  }

  const rotateScan = async function() {
    orient = ( orient + 90 ) % 360;
    if ( orient == 0 ) { return ; }

    if ( ! rotatedImage ) {
      await tick();
    }
    // console.log("-- page.rotateScan", seq, rotatedImage);
    drawRotatedImage();
  }

  const drawRotatedImage = async function() {
    await tick();
    const context = rotatedImage.getContext('2d');
    rotatedImage.height = rotatedImage.width = 0;
    let imgWidth, imgHeight;
    if ( orient == 90 || orient == 270 ) {
      imgWidth = image.naturalWidth;
      imgHeight = image.naturalHeight;
    } else {
      imgWidth = image.naturalHeight;
      imgHeight = image.naturalWidth;
    }
    // console.log("-- page.drawRotatedImage", seq, image.naturalWidth, image.naturalHeight);
    rotatedImage.width = imgHeight;
    rotatedImage.height = imgWidth;
    context.save();
    context.translate(imgHeight / 2, imgWidth / 2);
    context.rotate((orient * Math.PI) / 180);
    if (orient == 90 || orient == 270) {
      context.drawImage(image, -(imgWidth / 2), -(imgHeight / 2));
    } else {
      context.drawImage(image, -(imgHeight / 2), -(imgWidth / 2));
    }
    context.restore();
    rotatedImage.dataset.ready = true;
  }

  const updateZoom = function(delta) {
    if ( zoom != 1 && pageZoom == 1 ) { pageZoom = zoom; }
    pageZoom += delta;
    loadImage(true);
  };

  function calculateRatio(innerHeight, canvas) {
    if ( canvas.height > canvas.width ) {
      return innerHeight / canvas.height;
    }
    let width = innerWidth * 0.6;
    let ratio = width / canvas.width;
    // console.log("calculateRatio", seq, innerWidth, width, canvas.height, canvas.width);
    return ratio;
  }

  function calculate(innerHeight, canvas, key, zoom, orient) {
    // console.log("calculate", seq, value, scanRatio, zoom, innerHeight);
    let altkey = ( key == 'height' ) ? 'width' : 'height';
    let value = ( orient % 180 == 0 ) ? canvas[key] : canvas[altkey];
    // console.log("-- page.calculate", key, value, orient, orient % 180);
    return Math.ceil(value * scanRatio * zoom);
  }

  function calculateZoom(zoom, pageZoom) {
    if ( pageZoom > 1 && pageZoom > zoom  ) { return pageZoom; }
    return zoom;
  }

  function calculatePage(innerHeight, value, zoom) {
    if ( zoom == 1 ) { return null; }
    // console.log("calculatePage", seq, value, scanRatio, zoom);
    return `${Math.ceil(value * scanRatio * zoom)}px`;
  }

  function checkForFoldout() {
    if ( view == 'thumb' || format != 'image' ) { return false; }
    let meta = manifest.meta(seq);
    if ( orient != 0 ) { console.log("-- page.checkForFoldout", seq, meta.width, meta.height); }
    if ( meta.width < meta.height ) { return false; }
    // console.log("-- checkForFoldout", manifest.checkFeatures(seq, "FOLDOUT"));
    return (
      manifest.checkFeatures(seq, "FOLDOUT") && 
      ! manifest.checkFeatures(seq, "BLANK")
    ) || (
      ( meta.width / meta.height ) > ( 4 / 3 )
    );
  }

  function openLightbox(event) {
    emitter.emit('lightbox.open', { src: imageSrc, alt: `Page scan #${seq}` });
  }

  function shouldLoadImage(image) {
    let retval = ! isLoaded;
    if ( ! image ) { retval = false; }
    if ( image && image.src != defaultThumbnailSrc ) { retval = false; }
    // console.log("-- page.loadImage - shouldLoadimage", seq, retval, isLoaded, isLoading);
    return retval;
  }

  $: isVisible = false;
  $: scanZoom = calculateZoom(zoom, pageZoom);
  $: scanRatio = calculateRatio(innerHeight, canvas);
  $: scanHeight = calculate(innerHeight, canvas, 'height', scanZoom, orient);
  $: scanWidth = calculate(innerHeight, canvas, 'width', scanZoom, orient);
  $: scanUseRatio = manifest.meta(canvas.seq).ratio;
  $: scanAdjusted = false;
  $: orient = 0;
  $: isUnusual = checkForFoldout(canvas);
  $: defaultPageHeight = null; // ( view == '2up' || view == '1up' ) ? null : `${scanHeight}px`;
  $: pageHeight = ( view == 'thumb' || zoom > 1 ) ? `${innerHeight * zoom}px` : null;
  $: pageWidth = ( view == 'thumb' || zoom > 1 ) ? `${innerWidth * zoom}px` : null;

  $: if ( invoked && pageDiv ) { pageDiv.focus(); }
  $: if ( isVisible && format == 'image' && shouldLoadImage(image) ) { loadImage(); }
  $: if ( zoom != lastZoom ) { loadImage(true); lastZoom = zoom; }
  $: if ( isVisible && format == 'image' && image && image.src == defaultThumbnailSrc ) { loadImage(true); }
  $: if ( isVisible && format == 'plaintext' && ( ! figCaption || figCaption.dataset.loaded == 'false' ) ) { loadPageText(); }

  const reloadPage = function(options) {
    if ( options.seq == seq ) {
      if ( options.visible === false ) {
        toggle(false);
        return;
      }
      if ( options.orient != null ) {
        orient = options.orient;
      }
      if ( image ) {
        loadImage(true);
      } else {
        toggle(true);
      }
    }
  }
  emitter.on('page.reload', reloadPage);

  onMount(() => {

    return () => { 
      // console.log("-- page.unmount", seq);
      if(timeout) {
        clearTimeout(timeout);
        // console.log("-- app.unmount", seq);
      }
      emitter.off('update.highights', loadPageText);
      emitter.off('page.reload', reloadPage);
    }
  })
</script>

<!--   inert={!focused ? true : null} ??? -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div 
  class="page {format}" 
  {style} 
  data-seq={seq} 
  data-xorient={orient}
  data-loaded={isLoaded}
  style:--zoom={zoom}
  style:--scanZoom={scanZoom}
  style:--ratio={scanUseRatio}
  style:--scanHeight={scanZoom != 1 ? `${scanHeight}px` : null}
  style:--scanWidth={scanZoom != 1 ? `${scanWidth}px` : null}
  class:view-2up={view == '2up'}
  class:view-1up={view == '1up'}
  class:view-thumb={view == 'thumb'}
  class:verso={side == 'verso'}
  class:recto={side == 'recto'}
  class:direction-rtl={isRTL}
  class:zoomed={pageZoom > 1 && pageZoom != zoom}
  id="p{seq}" 
  aria-hidden={!focused}
  aria-label="Page scan {seq}"
  role="group"
  tabindex={focused ? 0 : -1}
  use:observer 
  on:intersecting={handleIntersecting} 
  on:unintersecting={handleUnintersecting}
  bind:this={pageDiv}>

  {#if manifest.messageList[seq]}
  <PageMessage {view} seq={seq} code={manifest.messageList[seq]}></PageMessage>
  {/if}

  <PageMenu
    {seq}
    {pageNum}
    {focused}
    {isUnusual}
    {side}
    {view}
    {format}
    {pageZoom}
    {rotateScan}
    {updateZoom}
    {openLightbox}
    sticky={view == '1up' || view == '2up'}
    allowRotate={view == '1up'}
    allowPageZoom={view != 'thumb'}
    allowFullDownload={manifest.allowFullDownload}
    selected={$selected.has(seq)}
    togglePageSelection={(event) => manifest.select(seq, event)}
    />

    {#if debugChoke}
    <pre 
      class="bg-dark text-white fs-7 m-0 p-0 me-3" 
      style="grid-row: 1/3; grid-column: 2/3;">
Choked: {xChokeAllowed == 1 ? 'NO' : 'YES'}
Debt: {xChokeDebt}
Credit: {xChokeCredit}
Delta: {xChokeDelta}{#if xChokeAllowed == 0}
Until: {xChokeUntil}{/if}
    </pre>
    {/if}

  <figure class="frame format-{format}" 
    class:pending={!isLoaded}
    class:adjusted={canvas.width > canvas.height}
    class:zoomed={pageZoom > 1 && pageZoom != zoom}
    class:landscape={scanUseRatio > 1 && zoom == 1}
    tabindex={focused ? 0 : -1}
    data-xorient={orient}
    >
    {#if format == 'image'}
      <div class="image">
        {#if !isLoaded && requestStatus == 200}
          <div class="page-loader">
            <i 
              class="fa-solid fa-stroopwafel fa-2xl opacity-75"
              class:fa-spin={isVisible}
              aria-hidden="true"></i>
          </div>
        {/if}
        {#if isVisible && requestStatus == 429}
          <div class="error-429">
            <div class="w-100 h-100 m-auto mt-3 d-flex flex-column justify-content-between">
              <div class="alert alert-block alert-secondary fs-1 fw-bold text-center text-uppercase">
                Image Temporarily Unavailable
              </div>
              <p class="fs-7 text-muted text-center">
                Error code: 429
              </p>
            </div>
          </div>
        {/if}
        {#if isVisible}
        <img 
          bind:this={image} 
          class:d-none={orient != 0}
          src={defaultThumbnailSrc} 
          data-loaded={isLoaded}
          alt="" 
          class:zoomed={pageZoom > 1}
          on:load={() => { if ( orient != 0 ) { drawRotatedImage(); }}}
          />
          {#if orient != 0}
            <canvas data-ready="false" bind:this={rotatedImage} />
          {/if}
          {#if side != 'thumb' && page_coords}
          <SearchHighlights {canvas} {seq} {orient} image={image} page_coords={page_coords} matches={matches} format="image"></SearchHighlights>
          {/if}
        {/if}
      </div>
      {#if side != 'thumb'}
      <figcaption class="visually-hidden" data-loaded="false" bind:this={figCaption}>
      </figcaption>
      {/if}
    {:else if format == 'plaintext'}
      {#if !isLoaded}
        <div class="page-loader">
          <i 
            class="fa-solid fa-stroopwafel fa-2xl opacity-75"
            class:fa-spin={isVisible}
            aria-hidden="true"></i>
        </div>
      {/if}
      {#if isVisible}
      <SearchHighlights page_coords={page_coords} matches={matches} format="plaintext"></SearchHighlights>
      <figcaption data-loaded="false" class="plaintext" bind:this={figCaption}></figcaption>
      {/if}
    {/if}
  </figure>
</div>

<style lang="scss">
  .page {
    --vh: 100dvh;
    @supports not (height: 100dvh) {
      --vh: 98vh; // Fallback for browsers not supporting dvh
    }
    --defaultPageHeight: calc(var(--vh) - ( ( var(--stage-header-height) + var(--paddingBottom, 0) ) * 1px) );
    --actualPageHeight: var(--scanHeight, var(--defaultPageHeight));
    --actualZoom: var(--zoom, 1);
    height: calc(clamp(var(--clampHeight), var(--defaultPageHeight), var(--defaultPageHeight)) * var(--actualZoom, 1));
    width: 100%;
    max-width: 100%;

    margin: auto;

    display: grid;
    grid-template-rows: min-content 1fr;
    grid-template-columns: minmax(0, 1fr) min-content;
    align-items: center;
    justify-content: center;

    position: relative;

    // overflow: hidden;

    // // -- debug border
    // border: 4px solid darkkhaki;

    &.view-2up {
      margin-bottom: calc(var(--paddingBottom) * 1px);
      height: calc(clamp(var(--clampHeight), var(--defaultPageHeight), var(--defaultPageHeight)) * var(--zoom, 1));

      &.zoomed {
        overflow: auto;
      }

      .format-image {
        height: 100%;
      }

      .format-plaintext.frame {
        padding-top: 3rem;
        padding-bottom: 5rem;
        width: 100%;
        height: 100%;
      }

      .format-image .frame {
        &.zoomed {
          max-width: none;
        }
      }
    }

    &.view-2up.verso {
      grid-area: verso;
      z-index: 1;

      &.direction-rtl {
        .frame {
          margin-right: auto;
          margin-left: 0;

          .loader {
            transform: translateX(0) translateY(-50%);
            left: auto;
            right: 0;
          }
        }
      }

      .frame {
        margin-right: 0;

        .loader {
          transform: translateX(0) translateY(-50%);
          left: auto;
          right: 0;
        }

        .image {
          margin-right: 0;
        }
      }
    }

    &.view-2up.recto {
      grid-area: recto;

      &.direction-rtl {
        .frame {
          margin-right: 0;
          margin-left: auto;
        }
      }

      .frame {
        margin-left: 0;
        .loader {
          left: 0;
          transform: translateX(0) translateY(-50%);
        }
        .image {
          margin-left: 0;
        }
      }
    }

    &.view-thumb {
      --defaultPageHeight: 250px;

      height: auto;
      min-height: calc(var(--defaultPageHeight) * var(--actualZoom));
      max-width: var(--defaultPageHeight);

      margin: 0;
      margin-bottom: 1rem;

      figure {
        --frameHeight: calc(250px * var(--actualZoom)); 
      }
    }

    &.view-1up {
      --actualZoom: var(--scanZoom, 1);
      margin-bottom: 2rem;

      &.plaintext {
        min-height: var(--defaultPageHeight);
        height: auto;
      }
    }

    &:focus-visible {
      outline: 0;

      .frame {
        --bs-btn-focus-shadow-rgb: 66,70,73;
        outline: 0;
        box-shadow: 0 0 0 0.25rem rgba(var(--bs-btn-focus-shadow-rgb), .5);
      }
    }
  }

  .frame {
    --defaultframeHeight: calc(var(--vh) * 0.99 - ( ( var(--stage-header-height) + var(--paddingBottom) ) * 1px) );
    --frameHeight: calc(clamp(var(--clampHeight), var(--defaultframeHeight), var(--defaultframeHeight)) * var(--scanZoom, 1) / max(var(--ratio), 1));
    min-height: 0;
    height: 100%;
    width: 100%;

    display: flex;

    margin: auto;
    overflow: auto;

    position: relative;

    // // --- debug background
    // background: darkkhaki;

    grid-row: 1/3;
    grid-column: 1/3;
    justify-self: center;

    // // --- possibly do something with the landscape
    // // --- images, especially on narrow viewports
    // &.landscape {
    //   .image {
    //     max-width: 100%;
    //   }
    // }

    &.pending {

      .page-loader {
        font-size: 3rem;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
        color: #9C92AC;
      }

      .image {

        position: relative;

        background-color: rgb(223, 219, 229, 0.125);

        // 4 point stars
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%239C92AC' fill-opacity='0.25'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E");        
        img {
          opacity: 0;
        }
      }

      &.format-plaintext {

        background-color: rgb(223, 219, 229, 0.25);
        // 4 point stars
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%239C92AC' fill-opacity='0.25'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E");        
      }
    }

    &.format-image {

      .image {
        height: var(--frameHeight);
        width: auto;
        aspect-ratio: var(--ratio);
        @supports not (aspect-ratio: 16 / 9) {
          width: calc(var(--frameHeight) * var(--ratio));
        }

        margin: auto;

        max-height: 100%;

        position: relative;

        flex-shrink: 0;
        flex-grow: 0;

        transition: opacity 0.125s linear;
      }
    }

    &.format-plaintext {
      align-items: flex-start;
      min-height: 100%;
      height: auto;
      width: 80%;
      max-width: 80rem;
      padding: 2rem 1rem;

      background: #fff;
      box-shadow: 0px 10px 13px -7px #000000, 0px 6px 15px 5px rgba(0, 0, 0, 0);
      border: 1px solid #ddd;    

      transition: height 100ms;

      .loader {
        width: 100% !important;
      }
    }

  }

  figure img, figure canvas {
    display: block;
    margin: auto;

    max-height: 100%;
    max-width: 100%;
    width: auto;
    height: auto;

    background: #f9f8f5;
    box-shadow: 0px 10px 13px -7px #000000, 0px 6px 15px 5px rgba(0, 0, 0, 0);
    border: 1px solid #ddd;    
  }

  figure canvas[data-ready="false"] {
    visibility: hidden;
  }

  figure.adjusted {
    margin: auto;
  }

  figure.zoomed {
    overflow: auto !important;
    align-items: start;

    .image {
      max-height: none !important;
    }
  }

  figure.adjusted img {
    height: auto;
    width: 100%;
    max-height: 100%;
  }

  .page:is([data-xorient="90"]),
  .page:is([data-xorient="270"]) {
    max-width: 100%;
    height: auto;
  }

  .frame:is([data-xorient="90"]),
  .frame:is([data-xorient="270"]) {
    height: auto;
    width: 100%;
    max-width: 100%;
    max-height: 100%;

    padding: 2rem 6rem 2rem 1rem;

    & .image, & .loader {
      height: min-content;
      width: calc(clamp(var(--clampHeight), var(--defaultPageHeight), var(--defaultPageHeight)) * var(--actualZoom, 1)) !important;
      aspect-ratio: calc(1 / var(--ratio));
      margin: auto;
    }
  }

  figcaption.plaintext {
    --font-size: var(--page-text-font-size, 1.125rem);
    font-size: calc(var(--font-size) * var(--scanZoom));
    line-height: 1.25;
    width: 100%;
    padding: 0 1rem;
    max-width: 65ch;
  }

  img.zoomed {
    align-self: flex-start;
  }

  .message {
    align-self: start;
    margin: 0 auto;
  }

  .error-429 {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    border: 2px solid var(--color-primary-500);
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

</style>
