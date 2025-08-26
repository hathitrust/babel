<script>
  import { onMount, onDestroy, getContext, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { createObserver } from '../../lib/observer';
  import PQueue from 'p-queue';
  import { debounce } from '../../lib/debounce';
  import { setfn } from '../../lib/sets';

  import { DetailsStateManager } from './utils';

  import Page from './Page.svelte';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');
  const currentView = manifest.currentView;
  const currentSeq = manifest.currentSeq;
  const currentFormat = manifest.currentFormat;

  const LOAD_PAGE_WINDOW = 2;
  const LOAD_PAGE_DELAY_TIMEOUT = 150;
  const UNLOAD_PAGE_INTERVAL = 30 * 1000;
  const LOAD_PAGE_PEEK_PERCENT = '25%';

  let {
    format = $currentFormat,
    container,
    startSeq = 1,
    zoomScales = [0.5, 0.75, 1, 1.5, 1.75, 2, 2.5, 3.0, 3.5, 4.0],
    innerHeight = container.clientHeight,
    innerWidth = container.clientWidth,
    maxHeight = -1,
    currentLocation = function () {},
    handleClick = function () {},
    handleKeydown = function () {},
  } = $props();

  export function item(seq) {
    // console.log(itemMap[seq])
    return itemMap[seq];
  }

  export function spread(idx) {
    return {
      el: container.querySelector(`#spread${idx}`),
      items: spreadData[idx],
    };
  }

  const spreadData = [];
  const itemData = [];
  const itemMap = {};
  const currentInView = new Set();
  let unloadFromView = new Set();

  let zoom = $state(1); // on startup
  let zoomIndex = $derived(zoomScales.indexOf(zoom));

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

  const detailsManager = new DetailsStateManager({
    root: container,
    openState: manifest.initialDetailsOpenState,
  });

  const { observer, io } = createObserver({
    root: container,
    threshold: [0, 0.25, 0.5, 0.75, 1.0],
    // rootMargin: '0px'
    rootMargin: `${LOAD_PAGE_PEEK_PERCENT} 0% ${LOAD_PAGE_PEEK_PERCENT} 0%`,
  });
  observer.observedIdx = 0;
  observer.totalIdx = manifest.totalSeq;

  const unloadPage = async function (pageDatum) {
    pageDatum.page.toggle(false);
    currentInView.delete(pageDatum.seq);
    pageDatum.loaded = pageDatum.inView = false;
    pageDatum.timeout = null;
    pageDatum.unloadTimeout = null;
  };

  const loadPage = async function (pageDatum, delta) {
    if (!pageDatum.loaded) {
      // console.log(":: loading", pageDatum.seq, queue.size, "->", pageDatum);
      pageDatum.loaded = true;
      pageDatum.page.toggle(true);
    } else {
      // console.log("$$ ignoring", pageDatum.seq, queue.size, "->", pageDatum);
    }
    pageDatum.enqueued = false;
    return pageDatum;
  };

  const queuePage = async function (pageDatum) {
    pageDatum.enqueued = true;
    let delta = Math.floor(Math.random() * 1000);
    return loadPage(pageDatum, delta);
  };

  const loadPages = function (targetSeq) {
    if (itemMap[targetSeq].timeout) {
      clearTimeout(itemMap[targetSeq].timeout);
      itemMap[targetSeq].timeout = null;
    }

    let previouslyInView = [];
    itemData.forEach((item) => {
      if (item.inView) {
        previouslyInView.push(item.seq);
      }
    });
    let newInView = [targetSeq];
    for (let seq = targetSeq - 1; seq >= targetSeq - LOAD_PAGE_WINDOW; seq--) {
      if (seq > 0) {
        newInView.push(seq);
      }
    }
    for (let seq = targetSeq + 1; seq <= targetSeq + LOAD_PAGE_WINDOW; seq++) {
      if (seq < manifest.totalSeq) {
        newInView.push(seq);
      }
    }

    let currentDiff = previouslyInView.filter((x) => !newInView.includes(x));
    let newDiff = newInView.filter((x) => !previouslyInView.includes(x));

    newDiff.forEach((seq) => {
      if (itemMap[seq].loaded) {
        return;
      }
      itemMap[seq].inView = true;
      queue.add(
        () => {
          return queuePage(itemMap[seq]);
        },
        {
          priority: seq == $currentSeq ? Infinity : 0,
        }
      );
    });
  };

  const handleIntersecting = ({ detail }) => {
    let seq = parseInt(detail.target.dataset.seq);
    let pageDatum = itemMap[seq];
    if (detail.isIntersecting) {
      pageDatum.intersectionRatio = detail.intersectionRatio;

      if (pageDatum.timeout) {
        clearTimeout(pageDatum.timeout);
      }
      pageDatum.timeout = setTimeout(() => {
        loadPages(seq);
      }, LOAD_PAGE_DELAY_TIMEOUT);

      currentInView.add(seq);
      // console.log("? scroll.intersecting", seq, Array.from(currentInView));
    } else {
      // console.log("? intersecting", seq, detail.isIntersecting, detail.intersectionRatio, pageDatum.isVisible);
    }
    // console.log("!! currentInView", Array.from(currentInView));
    if (seqTimeout) {
      clearTimeout(seqTimeout);
    }
    seqTimeout = setTimeout(setCurrentSeq, 100);
  };

  const handleUnintersecting = ({ detail }) => {
    if (observer.observedIdx < manifest.totalSeq) {
      return;
    }
    let seq = parseInt(detail.target.dataset.seq);
    // console.log("- un/intersecting", seq);
    itemMap[seq].intersectionRatio = undefined;
    if (itemMap[seq].timeout) {
      clearTimeout(itemMap[seq].timeout);
      itemMap[seq].timeout = null;
    }

    currentInView.delete(seq);
  };

  const updateViewport = function () {
    viewport.height = container.offsetHeight;
    viewport.top = container.scrollTop;
    viewport.bottom = viewport.top + viewport.height;
  };
  updateViewport();

  const setCurrentSeq = function () {
    if (!isInitialized) {
      return;
    }
    let max = { seq: -1, percentage: 0 };
    let possibles = Array.from(currentInView).sort((a, b) => a - b);

    possibles.forEach((seq) => {
      let percentage = itemMap[seq].page.visible(viewport);
      // console.log("-- view.setCurrentSeq", seq, percentage);
      if (percentage > max.percentage) {
        max.seq = seq;
        max.percentage = percentage;
      }
    });
    let tmpLocation = get(manifest.currentLocation);
    // console.log("-- view.setCurrentSeq", max.seq, $currentSeq, possibles, Array.from(currentInView), tmpLocation);
    if (max.seq > 0 && max.seq != $currentSeq) {
      $currentSeq = max.seq;
    } else if (Object.keys(tmpLocation).length > 0) {
      // currentLocation still needs to be set
      return;
    }
    focus($currentSeq);
    manifest.currentLocation.set(currentLocation());
    emitter.emit('view.relocated');
  };

  export function findFocusItems(seq) {
    return [itemMap[seq]];
  }

  const focus = function (seq) {
    // console.log("view.focus", isInitialized, seq);
    const currentFocusSeq = currentFocusItems.map((item) => item && item.seq);
    // console.log("-- focus", seq, currentFocusSeq, currentFocusItems);
    if (currentFocusSeq.indexOf(seq) > -1) {
      return;
    }
    currentFocusItems.forEach((item) => {
      if (item === false) {
        return;
      }
      // console.log("view.focus - unfocus", item);
      item.page.unfocus();
    });
    currentFocusItems = findFocusItems(seq);
    currentFocusItems.forEach((item) => {
      if (item === false) {
        return;
      }
      // console.log('-- view.focus', item.seq);
      item.page.focus();
    });
  };

  export function findTarget(options) {
    let targetSeq;
    if (options.delta) {
      targetSeq = $currentSeq + options.delta;
    } else if (options.seq && !isNaN(options.seq)) {
      targetSeq = options.seq;
    } else {
      // invalid option;
      return;
    }
    if (targetSeq == $currentSeq && !options.force) {
      return;
    }
    targetSeq = Math.max(1, Math.min(targetSeq, manifest.totalSeq));
    return itemMap[targetSeq].page;
  }

  const gotoPage = function (options) {
    let target = findTarget(options);
    if (!target) {
      return;
    }

    setTimeout(() => {
      let offsetTop = typeof target.offsetTop == 'function' ? target.offsetTop() : target.offsetTop;
      container.scroll(0, offsetTop);
      // container.scrollTop = offsetTop;
      if (resizeSeq) {
        resizeSeq = null;
      }
    });
  };

  function handleResize(entry) {
    let minHeight = innerHeight;
    if (minHeight < 600) {
      minHeight = 600;
    }
    if ($currentView == '2up') {
      minHeight -= 5.5 * 16;
    }
    if ($currentView == '2up') {
      let minWidth = minHeight * manifest.defaultImage.ratio * 2 + 2 * 16;
      container.style.setProperty('--min-reader-width', Math.ceil(minWidth));
    }

    if (!isInitialized) {
      return;
    }

    if (innerWidth != entry.contentRect.width || innerHeight != entry.contentRect.height) {
      if (true || maxHeight > 0) {
        innerWidth = entry.contentRect.width;
        innerHeight = entry.contentRect.height;
      }

      // console.log("-- view.resizeObserver", maxHeight, innerWidth, innerHeight);

      container.parentElement.scrollTop = 0; // force this

      setTimeout(() => {
        // console.log("-- scroll.resize", isInitialized, resizeSeq);
        gotoPage({ seq: resizeSeq, force: true });
      });
    }
    resizeTimeout = null;
  }

  function calculateColumnWidth(spread, zoom) {
    if (zoom == 1) {
      return null;
    }
    let widths = [];
    spread.forEach((canvas) => {
      if (canvas) {
        let ratio = manifest.meta(canvas.seq).ratio;
        widths.push(innerHeight * zoom * ratio);
      }
    });
    return Math.max(...widths);
  }

  // bind events
  const unsubscribers = {};
  unsubscribers.gotoPage = emitter.on('page.goto', gotoPage);

  unsubscribers.zoomUpdate = emitter.on('zoom.update', (delta) => {
    console.log('<< zoom.update', zoomIndex, delta, zoom, isInitialized);

    startSeq = $currentSeq;
    isInitialized = false;

    zoomIndex += delta;
    if (zoomIndex < 0) {
      zoomIndex = 0;
    } else if (zoomIndex >= zoomScales.length) {
      zoomIndex = zoomScales.length - 1;
    }
    zoom = zoomScales[zoomIndex];

    emitter.emit('zoom.enable', {
      out: zoomIndex > 0,
      in: zoomIndex < zoomScales.length - 1,
    });
  });

  let debugChoke = $state(false);
  let debugLoad = false;
  unsubscribers.debugChoke = emitter.on('debug.choke', (value) => {
    debugChoke = value;
  });
  unsubscribers.debugLoad = emitter.on('debug.load', (value) => {
    debugLoad = value;
  });

  const unloadInterval = setInterval(() => {
    const possibles = new Set(itemData.filter((pageDatum) => pageDatum.loaded == true));
    if (setfn.eqSet(unloadFromView, possibles)) {
      return;
    }
    unloadFromView = possibles;

    const nearest = LOAD_PAGE_WINDOW * 2;
    const tmp = [...currentInView].sort((a, b) => {
      return a - b;
    });
    console.log("-- view.unload seq", tmp, currentInView);
    const seq1 = itemData[tmp[0]].seq;
    const seq2 = itemData[tmp.at(-1)].seq;

    possibles.forEach((pageDatum) => {
      if (!pageDatum.page.visible(viewport)) {
        const seq = pageDatum.seq;
        if (!(Math.abs(seq - seq1) <= nearest || Math.abs(seq - seq2) <= nearest)) {
          // console.log("-- view.unload", pageDatum.seq);
          unloadPage(pageDatum);
        }
      }
    });
  }, UNLOAD_PAGE_INTERVAL);

  const handleDetailsClick = function (event) {
    let targetEl = event.target.closest('details');
    if (!targetEl) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    detailsManager.updateDetailsState(targetEl);
  };

  // build item map
  let baseHeight = Math.ceil(innerHeight * 0.9) * zoom;
  for (let seq = 1; seq <= manifest.totalSeq; seq++) {
    let item = {};
    item.id = manifest.id;
    item.seq = seq;
    item.originalHeight = item.height = manifest.meta(seq).height;
    item.originalWidth = item.width = manifest.meta(seq).width;

    item.useHeight = baseHeight;
    item.useWidth = Math.ceil(baseHeight * (item.width / item.height));

    item.inView = false;
    item.loaded = false;
    item.page = null;
    item.index = seq - 1;

    itemData.push(item);
    itemMap[item.seq] = item;
  }

  let seq = 1;
  while (seq <= manifest.totalSeq) {
    let spread = [false, false];
    let spreadIndex = spreadData.length;

    if (seq == 1 && manifest.hasFrontCover()) {
      spread[1] = itemMap[seq];
      itemMap[seq].side = 'recto';
      itemMap[seq].spreadIndex = spreadIndex;
      seq += 1;
    } else {
      spread[0] = itemMap[seq];
      itemMap[seq].side = 'verso';
      itemMap[seq].spreadIndex = spreadIndex;
      if (seq + 1 <= manifest.totalSeq) {
        spread[1] = itemMap[seq + 1];
        itemMap[seq + 1].side = 'recto';
        itemMap[seq + 1].spreadIndex = spreadIndex;
      }
      seq += 2;
    }

    spreadData.push(spread);
  }

  const toggleView = function (visible) {
    itemData.forEach((item) => {
      item.page.toggle(visible);
    });
  };
  unsubscribers.viewToggle = emitter.on('view.toggle', toggleView);

  let columnWidth = $derived(zoom > 1 ? (innerWidth / 2) * zoom : null);
  $effect(() => {
    if (format != lastFormat) {
      zoom = 1;
      lastFormat = format;
    }
  });
  let isInitialized = false;
  $effect.pre(() => {
    // console.log('the component is about to update');
    tick().then(() => {
      // console.log('the component just updated');
      if (itemMap[manifest.totalSeq].page) {
        // console.log("-- view.afterUpdate", $currentView, isInitialized, observer.observedIdx, manifest.totalSeq );
        if (!isInitialized && observer.observedIdx == manifest.totalSeq) {
          if (startSeq > 1) {
            setTimeout(() => {
              let target = findTarget({ seq: startSeq, force: true });
              if (!target) {
                return;
              }
              let offsetTop = typeof target.offsetTop == 'function' ? target.offsetTop() : target.offsetTop;
              container.scroll(0, offsetTop);

              isInitialized = true;

              $currentSeq = startSeq;

              emitter.emit('zoom.enable', {
                out: zoomIndex > 0,
                in: zoomIndex < zoomScales.length - 1,
              });

              emitter.emit('view.ready');
            });
          } else {
            isInitialized = true;

            emitter.emit('zoom.enable', {
              out: zoomIndex > 0,
              in: zoomIndex < zoomScales.length - 1,
            });

            emitter.emit('view.ready');
          }
        }
      }
    });
  });

  onMount(() => {
    // console.log("-- scrollView itemCount", manifest.totalSeq, isInitialized, startSeq, $currentSeq);

    const handleScroll = debounce((ev) => {
      updateViewport();
      setCurrentSeq();
    }, 100);

    container.dataset.view = $currentView;
    container.addEventListener('scroll', handleScroll);
    container.addEventListener('click', handleDetailsClick);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries.at(0);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (resizeSeq == null) {
        // console.log("-- scroll.resizeObserver", $currentSeq, isInitialized);
        resizeSeq = $currentSeq;
      }
      resizeTimeout = setTimeout(() => handleResize(entry), 100);
    });

    resizeObserver.observe(container);

    return () => {
      Object.keys(unsubscribers).forEach((key) => unsubscribers[key]());
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('click', handleDetailsClick);
      clearInterval(unloadInterval);
      resizeObserver.disconnect();
    };
  });

  onDestroy(() => {
    isInitialized = false;
    if (io) {
      io.disconnect();
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="inner"
  class:view-2up={$currentView == '2up'}
  class:view-1up={$currentView == '1up'}
  class:view-thumb={$currentView == 'thumb'}
  style:--paddingBottom={$currentView == '2up' ? 2.5 * 16 : 0}
  style:--fa-animation-duration="10s"
  bind:this={inner}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  {#each spreadData as spread, spreadIdx}
    <div
      id="spread{spreadIdx}"
      class="spread"
      class:zoomed={zoom > 1}
      class:direction-rtl={manifest.direction() == 'rtl'}
      data-inner-height={innerHeight}
      style:--columnWidth={calculateColumnWidth(spread, zoom)}
    >
      {#each spread as canvas, canvasIdx}
        {#if canvas}
          <Page
            bind:this={canvas.page}
            {observer}
            {canvas}
            {handleIntersecting}
            {handleUnintersecting}
            {debugChoke}
            innerHeight={$currentView == 'thumb' ? 250 : innerHeight}
            innerWidth={$currentView == 'thumb' ? 250 : innerWidth}
            view={$currentView}
            {format}
            seq={canvas.seq}
            side={canvas.side}
            bind:zoom
          />
        {:else}
          <div
            class="blank"
            class:verso={canvasIdx == 0}
            class:recto={canvasIdx == 1}
            style:--width={innerWidth * 0.125}
          >
            <i class="text-black-50 fa-solid fa-diamond fa-2xl opacity-25" aria-hidden="true"></i>
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
    --spreadHeight: calc(100dvh - ((var(--stage-header-height) + var(--paddingBottom, 0)) * 1px));
    height: clamp(var(--clampHeight, 0), var(--spreadHeight), var(--spreadHeight));
    width: var(--width, 100%);

    display: grid;
    grid-template-areas: 'verso recto';
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
