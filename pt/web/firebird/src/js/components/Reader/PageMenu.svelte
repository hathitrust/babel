<script>
  import { getContext } from 'svelte';
  import { tooltippy } from '../../lib/tippy';

  const emitter = getContext('emitter');

  export let sticky = false;
  export let isOpen = false;
  export let selected = false;
  export let focused = true;
  export let seq;
  export let pageNum;
  export let allowFullDownload = false;
  export let isUnusual = false;
  export let side = null;
  export let view = '1up';
  export let format = 'image';
  export let pageZoom = 1;
  export let allowPageZoom = false;
  export let allowRotate = false;

  // let isOpen = true; // selected || null;
  let isDisabled = view == 'thumb' && !allowFullDownload;

  export let rotateScan = function () {};
  export let updateZoom = function () {};
  export let togglePageSelection = function () {};
  export let openLightbox = function () {};
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<details
  class="page-menu {side} view-{view}"
  class:sticky-top={sticky}
  data-seq={seq}
  open={isOpen}
  aria-hidden={!focused}
  tabindex={focused && !isDisabled ? 0 : -1}
  disabled={isDisabled ? true : null}
>
  <summary class="btn-dark shadow" aria-hidden={!focused} tabindex={focused ? 0 : -1}>
    <div class="d-flex align-items-center justify-content-between px-2 py-1 gap-2 rounded">
      <span class="seq">
        #{seq}
        {#if pageNum}
          ({pageNum})
        {/if}
      </span>
      <span class="arrow">
        <i class="fa-solid fa-chevron-down" aria-hidden="true" />
      </span>
    </div>
  </summary>
  <div class="d-flex flex-column gap-1 align-items-center width-min-content menu-items">
    {#if allowFullDownload}
      <button
        type="button"
        class="btn btn-light border border-dark"
        use:tooltippy
        data-tippy-placement="left"
        on:click|stopPropagation={togglePageSelection}
        aria-label={selected ? `Page scan #${seq} is selected` : `Select page scan #${seq}`}
        aria-pressed={selected}
        aria-hidden={!focused}
        tabindex={focused ? 0 : -1}
        ><i class="fa-regular" class:fa-square={!selected} class:fa-square-check={selected} />
      </button>
    {/if}
    {#if isUnusual}
      <button
        type="button"
        class="btn btn-light border border-dark"
        use:tooltippy
        data-tippy-placement="left"
        on:click|stopPropagation={openLightbox}
        data-bs-placement={side == 'verso' ? 'right' : 'left'}
        aria-label="Open foldout for page scan #{seq}"
        aria-hidden={!focused}
        tabindex={focused ? 0 : -1}
        ><i aria-hidden="true" class="fa-solid fa-up-right-from-square fa-flip-horizontal" />
      </button>
    {/if}
    <!-- if we disable the button then we have to disable pageZoom if rotated and bleh-->
    <!-- disabled={pageZoom > 1 ? true : null} -->
    {#if allowRotate && format == 'image'}
      <button
        type="button"
        class="btn btn-light border border-dark"
        use:tooltippy
        data-tippy-placement="left"
        aria-label="Rotate page"
        aria-hidden={!focused}
        tabindex={focused ? 0 : -1}
        on:click|stopPropagation={rotateScan}><i class="fa-solid fa-rotate-right" /></button
      >
    {/if}
    {#if allowPageZoom}
      <div class="btn-group-vertical bg-white" role="group">
        <button
          type="button"
          class="btn btn-light border border-dark"
          disabled={pageZoom == 2.5}
          use:tooltippy
          data-tippy-placement="left"
          aria-label="Zoom in #{seq}"
          aria-hidden={!focused}
          tabindex={focused ? 0 : -1}
          on:click|stopPropagation={() => updateZoom(0.5)}
        >
          <i class="fa-solid fa-plus" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="btn btn-light border border-dark"
          disabled={pageZoom == 1}
          use:tooltippy
          data-tippy-placement="left"
          aria-label="Zoom out #{seq}"
          aria-hidden={!focused}
          tabindex={focused ? 0 : -1}
          on:click|stopPropagation={() => updateZoom(-0.5)}
        >
          <i class="fa-solid fa-minus" aria-hidden="true" />
        </button>
      </div>
    {/if}
  </div>
</details>

<style lang="scss">
  :global(body[data-interface='minimal'] .page-menu) {
    display: none !important;
  }

  .page-menu {
    order: 2;
    text-align: right;
    padding: 0;
    margin: 0;
    z-index: 50;
    align-self: flex-start;

    grid-row: 1/3;
    grid-column: 2/3;
    align-self: start;
    justify-self: end;

    z-index: 10;

    // .menu-items {
    //   position: absolute;
    //   right: 0.5rem;
    // }
  }

  .page-menu.view-1up {
    // margin-right: 1.5rem;
    margin-top: 0.5rem;

    .menu-items {
      position: static;
    }
  }

  .page-menu.view-thumb {
    margin-top: -1rem;
  }

  .page-menu.view-2up.verso {
    grid-column: 1/2;
    justify-self: start;
    left: 0;
    .menu-items {
      margin-left: 1rem;
      margin-right: auto;
    }
  }

  .page-menu.view-2up.recto {
    // margin-right: 1.5rem;
    right: 0;
    left: auto;
    justify-self: end;
  }

  .page-menu .arrow {
    border-left: 1px solid #707070;
    padding-left: 0.5rem;
  }

  .page-menu[open] .arrow i::before {
    content: '\F077';
  }

  .page-menu[disabled] {
    pointer-events: none;
  }
  .page-menu[disabled] .arrow {
    display: none !important;
  }

  .page-menu summary {
    --bs-btn-focus-box-shadow: 0 0 0 0.25rem rgba(var(--bs-btn-focus-shadow-rgb), 0.5);
    white-space: nowrap;
    list-style: none;

    font-size: 0.875rem;

    color: var(--bs-btn-color);
    background-color: var(--bs-btn-bg);
    margin: 0.25rem;

    border: 2px solid var(--bs-btn-border-color);

    border-radius: 4px;

    font-family: 'Roboto Mono', monospace;

    &:hover {
      background-color: var(--bs-btn-hover-bg);
      border-color: var(--bs-btn-hover-border-color);
      color: var(--bs-btn-hover-color);
    }

    &:focus-visible {
      color: var(--bs-btn-hover-color);
      background-color: var(--bs-btn-hover-bg);
      border-color: var(--bs-btn-hover-border-color);
      outline: 0;
      box-shadow: var(--bs-btn-focus-box-shadow);
    }
  }

  .page-menu > div {
    margin-top: 0.5rem;
    margin-left: auto;
    margin-right: 1rem;
    // margin: 0.5rem auto;
    font-size: 1.25rem;
    --bs-btn-font-size: 1.25rem !important;
  }

  .page-menu .btn {
    --bs-btn-font-size: 1.25rem;
    --bs-btn-disabled-opacity: 0.4;
  }

  .page-menu summary {
    list-style: none;
  }
  .page-menu summary::-webkit-details-marker {
    display: none;
  }

  .width-min-content {
    width: min-content;
  }
</style>
