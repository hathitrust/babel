<script>
  import { onMount, getContext } from 'svelte';
  import screenfull from 'screenfull';

  import { tooltippy } from '../../lib/tippy';

  import ViewMenu from './ViewMenu.svelte';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');

  const currentSeq = manifest.currentSeq;
  $: seq = $currentSeq;

  const interfaceMode = manifest.interfaceMode;
  const isFullscreen = manifest.isFullscreen;

  let enableZoomIn = true;
  let enableZoomOut = true;

  const enableZoomOptions = function (args) {
    enableZoomIn = args.in;
    enableZoomOut = args.out;
  };

  const goto = function (args) {
    emitter.emit('page.goto', args);
    emitter.emit('log.action', args);
  };

  const zoom = function (delta) {
    emitter.emit('zoom.update', delta);
    emitter.emit('log.action', { action: 'zoom', value: delta });
  };

  emitter.on('zoom.enable', enableZoomOptions);

  let controlsText = 'Hide Controls';
  const toggleInterface = function (event, mode) {
    if (mode) {
      $interfaceMode = mode;
    } else {
      $interfaceMode = $interfaceMode == 'default' ? 'minimal' : 'default';
      // console.log("-- toggleInterface", $interfaceMode);
    }
    document.body.dataset.interface = $interfaceMode;
    emitter.emit('toggle.interface', $interfaceMode);
    if ($interfaceMode == 'minimal') {
      controlsText = 'Show Controls';
    } else {
      controlsText = 'Hide Controls';
    }
  };

  let fullscreenButtonContent;
  const toggleFullscreen = function (event) {
    toggleInterface(event, screenfull.isFullscreen ? 'default' : 'minimal');
    screenfull.toggle(document.querySelector('#root')).then(() => {
      // console.log("-- toggleFullScreen", screenfull.isFullscreen);
      $isFullscreen = screenfull.isFullscreen;
      emitter.emit('log.action', { action: 'toggle.fullscreen', value: $isFullscreen });
      $isFullscreen ? fullscreenButtonContent = 'Exit Full Screen' : fullscreenButtonContent = 'Enter Full Screen'
    });
  };

  // checking for a change in fullscreen mode
  // if it's not fullscreen and the interface is still in 'minimal' mode,
  // change the interface back to default
  // regardless, the tooltip text should change
  addEventListener("fullscreenchange", () => {
    if (screenfull.isEnabled) {
        if (!screenfull.isFullscreen) {
          if ($interfaceMode == 'minimal') {
            toggleInterface()
          }
          fullscreenButtonContent = 'Enter Full Screen'
        }
    }
  });

  const handleValue = function (event) {
    let value = event.target.value;
    if (value.substr(0, 1) == '+' || value.substr(0, 1) == '-') {
      let delta = value.substr(0, 1) == '+' ? +1 : -1;
      value = parseInt(value.substr(1), 10);
      emitter.emit('page.goto', { delta: delta * value });
      return;
    }

    if (value.match(/^\d+$/)) {
      value = `#${value}`;
    }

    let targetSeq = manifest.guess(value);
    if (targetSeq) {
      emitter.emit('page.goto', { seq: targetSeq });
    } else {
      seq = $currentSeq;
    }
  };

  const handleKeydown = function (event) {
    let delta = 0;
    if (event.code == 'ArrowDown') {
      delta = -1;
      emitter.emit('page.goto', { action: 'goto.keydown.arrow', delta: delta });
    } else if (event.code == 'ArrowUp') {
      delta = 1;
      emitter.emit('page.goto', { action: 'goto.keydown.arrow', delta: delta });
    } else if (event.code == 'Enter' || event.code == 'Return') {
      event.preventDefault();
      handleValue(event);
    }
  };

  let isFullscreenEnabled = false;
  let isRTL = manifest.direction() == 'rtl';

  // $: console.log("-- view.toolbar interfaceMode", $interfaceMode);

  onMount(() => {
    isFullscreenEnabled = screenfull.isEnabled;
    isFullscreen ? fullscreenButtonContent = 'Enter Full Screen' : fullscreenButtonContent = 'Exit Full Screen'
    window.screenfull = screenfull;
    return () => {
      // emitter.off('location.updated', updateSeq);
      emitter.off('zoom.enable', enableZoomOptions);
    };
  });
</script>

<div class="view--toolbar rounded">
  <span>
    <button
      type="button"
      class="btn btn-outline-dark"
      class:active={$interfaceMode == 'minimal'}
      aria-label={controlsText}
      use:tooltippy={{ content: controlsText }}
      on:click={toggleInterface}
    >
      <i
        class:fa-solid={$interfaceMode == 'default'}
        class:fa-eye={$interfaceMode == 'default'}
        class:fa-regular={$interfaceMode == 'minimal'}
        class:fa-eye-slash={$interfaceMode == 'minimal'}
     ></i>
    </button>
  </span>

  <!-- <button type="button" class="btn btn-outline-dark d-none d-sm-block">
    <i class="fa-regular fa-circle-question"></i>
  </button> -->

  {#if $interfaceMode == 'default'}
    <!-- navigation form -->
    <form class="d-none d-sm-block" on:submit={(event) => event.preventDefault()}>
      <div class="d-flex align-items-center gap-1 bg-dark text-light p-1 px-2 rounded">
        <label for="toolbar-seq">
          <span>#</span>
          <span class="visually-hidden">Page Sequence</span>
        </label>
        <input
          id="toolbar-seq"
          name="seq"
          bind:value={seq}
          type="text"
          class="form-control text-center"
          on:change|preventDefault={handleValue}
          on:blur|preventDefault={handleValue}
          on:keydown={handleKeydown}
        />
        <span>/</span>
        <span>{manifest.totalSeq}</span>
      </div>
    </form>

    <ViewMenu />

    <div class="btn-group" role="group" aria-label="Zoom">
      <button
        type="button"
        class="btn btn-outline-dark"
        aria-label="Zoom In"
        disabled={!enableZoomIn}
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Zoom']")}}
        on:click={() => zoom(1)}
      >
        <i class="fa-solid fa-plus"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-dark"
        aria-label="Zoom Out"
        disabled={!enableZoomOut}
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Zoom']")}}
        on:click={() => zoom(-1)}
      >
        <i class="fa-solid fa-minus"></i>
      </button>
    </div>
  {/if}

  <!-- this is shameless and obvious -->
  {#if isRTL}
    <div class="btn-group" role="group" aria-label="Pagination">
      <button
        type="button"
        class="btn btn-outline-dark d-none d-md-block"
        aria-label="Last Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.last', seq: manifest.totalSeq })}
      >
        <!-- <i class="fa-solid fa-chevron-left border-start border-3 border-dark"></i> -->
        <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-dark"
        aria-label="Next Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.next', delta: 1 })}
      >
        <!-- <i class="fa-solid fa-chevron-left"></i> -->
        <i class="fa-solid fa-angle-left" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-dark"
        aria-label="Previous Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.prev', delta: -1 })}
      >
        <!-- <i class="fa-solid fa-chevron-right"></i> -->
        <i class="fa-solid fa-angle-right" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-dark d-none d-md-block"
        aria-label="First Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.first', seq: 1 })}
      >
        <!-- <i class="fa-solid fa-chevron-right border-end border-3 border-dark"></i> -->
        <i class="fa-solid fa-angles-right" aria-hidden="true"></i>
      </button>
    </div>
  {:else}
    <div class="btn-group" role="group" aria-label="Pagination">
      <button
        type="button"
        class="btn btn-outline-dark d-none d-md-block"
        aria-label="First Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.first', seq: 1 })}
      >
        <!-- <i class="fa-solid fa-chevron-left border-start border-3 border-dark"></i> -->
        <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-dark"
        aria-label="Previous Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.prev', delta: -1 })}
      >
        <!-- <i class="fa-solid fa-chevron-left"></i> -->
        <i class="fa-solid fa-angle-left" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-dark"
        aria-label="Next Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.next', delta: 1 })}
      >
        <!-- <i class="fa-solid fa-chevron-right"></i> -->
        <i class="fa-solid fa-angle-right" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-dark d-none d-md-block"
        aria-label="Last Page"
        use:tooltippy={{appendTo: document.querySelector("[aria-label='Pagination']")}}
        on:click={() => goto({ action: 'goto.last', seq: manifest.totalSeq })}
      >
        <!-- <i class="fa-solid fa-chevron-right border-end border-3 border-dark"></i> -->
        <i class="fa-solid fa-angles-right" aria-hidden="true"></i>
      </button>
    </div>
  {/if}

  {#if isFullscreenEnabled}
    <button
      type="button"
      class="btn btn-outline-dark"
      aria-label={`${fullscreenButtonContent}`}
      use:tooltippy={{content: `${fullscreenButtonContent}`}}
      on:click={toggleFullscreen}
    >
      <i class="fa-solid fa-maximize"></i>
    </button>
  {/if}
</div>

<!-- <svelte:window on:keydown={escFullscreen} /> -->

<style lang="scss">
  .view--toolbar {
    position: absolute;
    bottom: 1rem;
    /* left: 0.5rem; */
    right: 0.5rem;
    display: flex;
    align-items: center;
    padding: 0.25rem;
    background: #fff;
    justify-content: flex-end;
    z-index: 100;
    gap: 0.5rem;
    box-shadow: var(--shadow-elevation-medium);
  }

  :global(.stage::backdrop) {
    background-color: #fff;
  }

  :global(.apps[data-options-toggled='true'] .view--toolbar) {
    display: none;
  }

  input[name='seq'] {
    max-width: 6ch;
  }
</style>
