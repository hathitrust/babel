<svelte:options accessors={true} />
<script>
  import { onMount, afterUpdate, onDestroy, getContext } from 'svelte';
  import { get } from 'svelte/store';
	import { createObserver } from '../../lib/observer';
  import PQueue from "p-queue";
  import { debounce } from '../../lib/debounce';

  import Page from './Page';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');
  const currentView = manifest.currentView;
  const currentSeq = manifest.currentSeq;
  const currentFormat = manifest.currentFormat;
  
  export let format = $currentFormat;
  export let container;
  export let startSeq = 1;
  export let zoomScales = [ 0.5, 0.75, 1, 1.5, 1.75, 2, 2.5 ];

  export let innerHeight = container.clientHeight;
  export let innerWidth = container.clientWidth;

  export let maxHeight = -1;

  export let currentLocation = function() { };
  export let handleClick = function() { };
  export let handleKeydown = function() { }

  export function item(seq) {
    return itemMap[seq];
  }

  export function spread(idx) {
    return {
      el: container.querySelector(`#spread${idx}`),
      items: spreadData[idx]
    }
  }

  const spreadData = [];
  const itemData = [];
  const itemMap = {};
  const currentInView = new Set;

  let zoom = 1; // on startup
  let zoomIndex = zoomScales.indexOf(zoom);

  let lastFormat = format;

  let seqTimeout;
  let viewport = {};
  let currentFocusItems = [];

  let resizeTimeout; 
  let resizeSeq;

  let inner;

  const queue = new PQueue({
    concurrency: 5,
    interval: 500,
  });

  const unloadQueue = new PQueue({
    concurrency: 1,
    interval: 5000,
  })

  const { observer, io } = createObserver({
    root: container,
    threshold: [ 0, 0.25, 0.5, 0.75, 1.0 ],
    // rootMargin: '0px'
    rootMargin: `200% 0% 200% 0%`
  });
  observer.observedIdx = 0;
  observer.totalIdx = manifest.totalSeq;

  const unloadPage = async function(pageDatum) {
    let percentage = itemMap[pageDatum.seq].page.visible(viewport);    
    // console.log("!! unloading", pageDatum.seq, percentage, isInitialized, "->", pageDatum);
    if ( pageDatum.intersectionRatio > 0 ) { return ; }
    itemMap[pageDatum.seq].page.toggle(false);
    currentInView.delete(pageDatum.seq);
    pageDatum.loaded = pageDatum.inView = false;
    itemMap[pageDatum.seq].timeout = null;
  }

  const loadPage = async function(pageDatum, delta) {
    if (! pageDatum.loaded) {
      // console.log(":: loading", pageDatum.seq, queue.size, "->", pageDatum);
      pageDatum.loaded = true;
      pageDatum.page.toggle(true);
    } else {
      // console.log("$$ ignoring", pageDatum.seq, queue.size, "->", pageDatum);
    }
    pageDatum.enqueued = false;
    return pageDatum;
  }

  const queuePage = async function(pageDatum) {
    pageDatum.enqueued = true;
    let delta = Math.floor(Math.random() * 1000);
    return loadPage(pageDatum, delta);
  }

  const loadPages = function(targetSeq) {
    if (itemMap[targetSeq].timeout) {
      clearTimeout(itemMap[targetSeq].timeout);
      itemMap[targetSeq].timeout = null;
    }

    let previouslyInView = [];
    itemData.forEach((item) => {
      if ( item.inView ) {
        previouslyInView.push(item.seq);
      }
    })
    let newInView = [ targetSeq ];
    for (let seq = targetSeq - 1; seq >= targetSeq - 5; seq--) {
      if (seq > 0) {
        newInView.push(seq);
      }
    }
    for (let seq = targetSeq + 1; seq <= targetSeq + 5; seq++) {
      if (seq < manifest.totalSeq) {
        newInView.push(seq);
      }
    }

    let currentDiff = previouslyInView.filter(x => !newInView.includes(x));
    let newDiff = newInView.filter(x => !previouslyInView.includes(x));

    newDiff.forEach((seq) => {
      itemMap[seq].inView = true;
      queue.add(() => {
        return queuePage(itemMap[seq])
      }, 
      { 
        priority: seq == $currentSeq ? Infinity : 0 
      })
    });
  }

  const handleIntersecting = (({detail}) => {
    let seq = parseInt(detail.target.dataset.seq);
    let pageDatum = itemMap[seq];
    if ( detail.isIntersecting ) {
      pageDatum.intersectionRatio = detail.intersectionRatio;
      if ( pageDatum.loaded ) {
        // console.log("# scroll.intersecting", seq, detail.isIntersecting, detail.intersectionRatio, isInitialized);
      } else {
        // console.log("+ scroll.intersecting", seq, detail.isIntersecting, detail.intersectionRatio, isInitialized, observer.observedIdx);
        if ( pageDatum.timeout ) { clearTimeout(pageDatum.timeout); }
        pageDatum.timeout = setTimeout(() => {
          loadPages(seq);
        }, 1000);
      }
      currentInView.add(seq);
      // console.log("? scroll.intersecting", seq, Array.from(currentInView));
    } else {
      // console.log("? intersecting", seq, detail.isIntersecting, detail.intersectionRatio, pageDatum.isVisible);
    }
    // console.log("!! currentInView", Array.from(currentInView));
    if ( seqTimeout ) {
      clearTimeout(seqTimeout);
    }
    seqTimeout = setTimeout(setCurrentSeq, 100);
  })

  const handleUnintersecting = (({detail}) => {
    if ( observer.observedIdx < manifest.totalSeq ) { return ; }
    if ( detail.target.dataset.loaded != 'true' ) { return ; }
    let seq = parseInt(detail.target.dataset.seq);
    // console.log("- un/intersecting", seq);
    itemMap[seq].intersectionRatio = undefined;
    if (itemMap[seq].timeout) {
      clearTimeout(itemMap[seq].timeout);
      itemMap[seq].timeout = null;
    }

    unloadQueue.add(() => {
      return unloadPage(itemMap[seq])
    });
  })

  const updateViewport = function() {
    viewport.height = container.offsetHeight;
    viewport.top = container.scrollTop;
    viewport.bottom = viewport.top + viewport.height;
  }
  updateViewport();

  const setCurrentSeq = function() {
    if ( ! isInitialized ) { return ; }

    let max = { seq: -1, percentage: 0 };
    let possibles = Array.from(currentInView).sort((a,b) => a-b);
    possibles.forEach((seq) => {
      let percentage = itemMap[seq].page.visible(viewport);
      // console.log("-- view.setCurrentSeq", seq, percentage);
      if ( percentage > max.percentage ) {
        max.seq = seq;
        max.percentage = percentage;
      }
    })
    let tmpLocation = get(manifest.currentLocation);
    // console.log("-- view.setCurrentSeq", max.seq, $currentSeq, possibles, Array.from(currentInView), tmpLocation);
    if ( max.seq > 0 && max.seq != $currentSeq ) {
      $currentSeq = max.seq;
    } else if ( Object.keys(tmpLocation).length > 0 ) {
      // currentLocation still needs to be set
      return;
    }
    focus($currentSeq);
    manifest.currentLocation.set(currentLocation());
    emitter.emit('view.relocated');
  }

  export let findFocusItems = function(seq) {
    return [ itemMap[seq] ];
  }

  const focus = function(seq) {
    // console.log("view.focus", isInitialized, seq);
    const currentFocusSeq = currentFocusItems.map((item) => item && item.seq);
    // console.log("-- focus", seq, currentFocusSeq, currentFocusItems);
    if ( currentFocusSeq.indexOf(seq) > -1 ) { return ; }
    currentFocusItems.forEach((item) => {
      if ( item === false ) { return ; }
      // console.log("view.focus - unfocus", item);
      item.page.unfocus();
    })
    currentFocusItems = findFocusItems(seq);
    currentFocusItems.forEach((item) => {
      if ( item === false ) { return ; }
      // console.log('-- view.focus', item.seq);
      item.page.focus();
    })
  };

  export let findTarget = function(options) {
    let targetSeq;
    if ( options.delta ) {
      targetSeq = $currentSeq + options.delta;
    } else if ( options.seq && ! isNaN(options.seq) ) {
      targetSeq = options.seq;
    } else {
      // invalid option;
      return;
    }
    if ( targetSeq == $currentSeq && ! options.force ) { return ; }
    targetSeq = Math.max(1, Math.min(targetSeq, manifest.totalSeq));
    return itemMap[targetSeq].page;
  }

  const gotoPage = function(options) {
    let target = findTarget(options);
    if ( ! target ) { return ; }

    setTimeout(() => {
      let offsetTop = 
        typeof(target.offsetTop) == 'function' ?
        target.offsetTop() : 
        target.offsetTop;
      container.scroll(0, offsetTop);
      // container.scrollTop = offsetTop;
      if ( resizeSeq ) { resizeSeq = null; }
    })
  }

  function handleResize(entry) {
    let minHeight = innerHeight;
    if ( minHeight < 600 ) {
      minHeight = 600;
    }
    if ( $currentView == '2up' ) { minHeight -= ( 5.5 * 16 ); }
    if ( $currentView == '2up' ) {
      let minWidth = minHeight * manifest.defaultImage.ratio * 2 + ( 2 * 16 );
      container.style.setProperty('--min-reader-width', Math.ceil(minWidth));
    }

    if ( ! isInitialized ) { return ; }

    if ( innerWidth != entry.contentRect.width || innerHeight != entry.contentRect.height ) {
      if ( true || maxHeight > 0 ) {
        innerWidth = entry.contentRect.width;
        innerHeight = entry.contentRect.height;
      }

      // console.log("-- view.resizeObserver", maxHeight, innerWidth, innerHeight);

      container.parentElement.scrollTop = 0; // force this

      setTimeout(() => { 
        // console.log("-- scroll.resize", isInitialized, resizeSeq);
        gotoPage({ seq: resizeSeq, force: true }) 
      });

    }
    resizeTimeout = null;
  }

  function calculateColumnWidth(spread, zoom) {
    if ( zoom == 1 ) { return null; }
    let widths = [];
    spread.forEach((canvas) => {
      if ( canvas ) {
        let ratio = manifest.meta(canvas.seq).ratio;
        widths.push(innerHeight * zoom * ratio);
      }
    })
    return Math.max(...widths);
  }

  // bind events
  emitter.on('page.goto', gotoPage);

  emitter.on('zoom.update', delta => {
    console.log('<< zoom.update', zoomIndex, delta, zoom, isInitialized);

    startSeq = $currentSeq;
    isInitialized = false;

    zoomIndex += delta;
    if ( zoomIndex < 0 ) { zoomIndex = 0; }
    else if ( zoomIndex >= zoomScales.length ) {
      zoomIndex = zoomScales.length - 1;
    }
    zoom = zoomScales[zoomIndex];

    emitter.emit('zoom.enable', {
      out: zoomIndex > 0,
      in: zoomIndex < ( zoomScales.length - 1 )
    });
  })

  // build item map
  let baseHeight = Math.ceil(innerHeight * 0.90) * zoom;
  for(let seq = 1; seq <= manifest.totalSeq; seq++) {
    let item = {};
    item.id = manifest.id;
    item.seq = seq;
    item.originalHeight = item.height = manifest.meta(seq).height;
    item.originalWidth = item.width = manifest.meta(seq).width;

    item.useHeight = baseHeight;
    item.useWidth = Math.ceil(baseHeight * ( item.width / item.height ));

    item.inView = false;
    item.loaded = false;
    item.page = null;
    item.index = seq - 1;


    itemData.push(item);
    itemMap[item.seq] = item;
  }

  let seq = 1;
  while(seq <= manifest.totalSeq) {
    let spread = [false, false];
    let spreadIndex = spreadData.length;

    if ( seq == 1 && manifest.hasFrontCover() ) {
      spread[1] = itemMap[seq];
      itemMap[seq].side = 'recto';
      itemMap[seq].spreadIndex = spreadIndex;
      seq += 1;
    } else {
      spread[0] = itemMap[seq];
      itemMap[seq].side = 'verso';
      itemMap[seq].spreadIndex = spreadIndex;
      if ( seq + 1 <= manifest.totalSeq ) {
        spread[1] = itemMap[seq + 1];
        itemMap[seq + 1].side = 'recto';
        itemMap[seq + 1].spreadIndex = spreadIndex;
      }
      seq += 2;
    }

    spreadData.push(spread);
  }

  const toggleView = function(visible) {
    itemData.forEach((item) => {
      item.page.toggle(visible);
    })
  }
  emitter.on('view.toggle', toggleView);

  $: columnWidth = ( zoom > 1 ) ? innerWidth / 2 * zoom : null;
  $: if ( format != lastFormat ) { zoom = 1; lastFormat = format; }

  let isInitialized = false;
  afterUpdate(() => {
    if ( itemMap[manifest.totalSeq].page ) {
      // console.log("-- view.afterUpdate", $currentView, isInitialized, observer.observedIdx, manifest.totalSeq );
      if ( ! isInitialized && observer.observedIdx == manifest.totalSeq ) {
        if ( startSeq > 1 ) {
          setTimeout(() => {
            let target = findTarget({ seq: startSeq, force: true });
            let offsetTop = 
              typeof(target.offsetTop) == 'function' ?
              target.offsetTop() : 
              target.offsetTop;
            container.scroll(0, offsetTop);

            isInitialized = true;

            $currentSeq = startSeq;

            emitter.emit('zoom.enable', {
              out: zoomIndex > 0,
              in: zoomIndex < zoomScales.length - 1
            });

            emitter.emit('view.ready');
          })
        } else {
          isInitialized = true;

          emitter.emit('zoom.enable', {
            out: zoomIndex > 0,
            in: zoomIndex < zoomScales.length - 1
          });

          emitter.emit('view.ready');
        }
      }
    }
  })

  onMount(() => {
    // console.log("-- scrollView itemCount", manifest.totalSeq, isInitialized, startSeq, $currentSeq);

    const handleScroll = debounce((ev) => {
      updateViewport();
      setCurrentSeq();
    }, 100);

    container.dataset.view = $currentView;
    container.addEventListener('scroll', handleScroll);

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries.at(0);
      if ( resizeTimeout ) { clearTimeout(resizeTimeout); }
      if ( resizeSeq == null ) { 
        // console.log("-- scroll.resizeObserver", $currentSeq, isInitialized);
        resizeSeq = $currentSeq; 
      }
      resizeTimeout = setTimeout(() => handleResize(entry), 100);
    })

    resizeObserver.observe(container);

    return () => {
      let t0 = (new Date).getTime();
      emitter.off('page.goto', gotoPage);
      emitter.off('view.toggle', toggleView);
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      // console.log("-- scroll.demount", (new Date).getTime() - t0);
    }
  })

  onDestroy(() => {
    isInitialized = false;
    if ( io ) {
      io.disconnect();
    }
  })

</script>

<div 
  class="inner" 
  class:view-2up={$currentView =='2up'}
  class:view-1up={$currentView == '1up'}
  class:view-thumb={$currentView == 'thumb'}
  style:--paddingBottom={$currentView == '2up' ? 2.5 * 16 : 0}
  bind:this={inner}
  on:click={handleClick}
  on:keydown={handleKeydown}
  >
  {#each spreadData as spread, spreadIdx}
  <div 
    id="spread{spreadIdx}"
    class="spread"
    class:zoomed={zoom > 1}
    class:direction-rtl={manifest.direction() == 'rtl'}
    data-inner-height={innerHeight}
    style:--columnWidth={calculateColumnWidth(spread, zoom)}>

    {#each spread as canvas, canvasIdx}
      {#if canvas}
        <Page 
          bind:this={canvas.page}
          {observer} 
          {canvas} 
          {handleIntersecting}
          {handleUnintersecting}
          innerHeight={$currentView == 'thumb' ? 250 : innerHeight}
          innerWidth={$currentView == 'thumb' ? 250 : innerWidth}
          view={$currentView}
          format={format}
          seq={canvas.seq} 
          side={canvas.side}
          bind:zoom={zoom}
          ></Page>
      {:else}
        <div 
          class="blank"
          class:verso={canvasIdx == 0}
          class:recto={canvasIdx == 1}
          style:--width={innerWidth * 0.125}
          ><i class="text-black-50 fa-solid fa-diamond fa-2xl opacity-25" aria-hidden="true"></i>
        </div>
      {/if}
    {/each}
  </div>
  {/each}
</div>

<style lang="scss">

  .blank {
    display: none;
  }

  .spread {
    display: contents;
  }

  .inner.view-1up {
    display: flex;
    flex-direction: column;
  }

  .inner.view-thumb {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;

    scroll-behavior: auto;
    padding: 2rem 1rem;
    width: 100%;
    height: auto;
  }

  .inner.view-2up .spread {
    // // -- debug border
    // border: 2px solid black;
    --gridColumn: calc(var(--columnWidth) * 1px);
    --spreadHeight: calc(100dvh - ( ( var(--stage-header-height) + var(--paddingBottom, 0) ) * 1px) );
    height: clamp(var(--clampHeight, 0), var(--spreadHeight), var(--spreadHeight));
    width: var(--width, 100%);

    display: grid;
    grid-template-areas: "verso recto";
    grid-template-columns: var(--gridColumn, 50%) var(--gridColumn, 50%);
    grid-template-rows: minmax(0, 1fr);
    position: relative;
    overflow: hidden;
   
    // bottom padding keeps the spread from overlapping with
    // the view toolbar
    padding: 1rem;
    margin-bottom: 5.5rem;

    // // --- debug border
    // border: 8px solid yellow;

    scroll-snap-align: start;

    &.direction-rtl {
      direction: rtl;
      // and more spread madness
    }
    
    &.zoomed {
      overflow: auto;
    }

    .blank {
      height: calc(var(--width, 50%) * 1px);
      width: calc(var(--width, 50%) * 1px);
      align-self: center;
      justify-self: center;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 2rem;

      &.verso {
        grid-area: verso;
      }

      &.recto {
        grid-area: recto;
      }
    }
  }
</style>