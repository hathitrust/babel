<script>
  import { getContext } from 'svelte';
  const emitter = getContext('emitter');
  const manifest = getContext('manifest');

  let view = manifest.currentView;
  let format = manifest.currentFormat;

  function switchView(event) {
    let target = this;
    let value = target.dataset.value;
    if (value != $view) {
      emitter.emit('view.switch', { view: value });
      // $view = value;
    }
  }

  function switchFormat(event) {
    let target = this;
    let value = target.dataset.value;
    if (value != $format) {
      // $format = value;
      emitter.emit('view.switch.format', { format: value });
    }
  }
</script>

<div class="btn-group dropup">
  <button
    type="button"
    class="btn btn-outline-dark dropdown-toggle text-uppercase"
    data-bs-toggle="dropdown"
    aria-expanded="false"
  >
    <i
      class="fa-solid"
      class:fa-up-down={$view == '1up'}
      class:fa-book-open={$view == '2up'}
      class:fa-table-cells={$view == 'thumb'}
      aria-hidden="true"
    />
    <span class="d-none d-md-inline">View</span>
  </button>
  <ul class="dropdown-menu">
    <li>
      <span class="dropdown-header">
        <span id="page-format">Page Format</span>
      </span>
    </li>
    <ul class="menu-list-section" role="group" aria-labelledby="page-format">
      <li>
        <button
          type="button"
          class="dropdown-item"
          class:active={$format == 'plaintext'}
          aria-pressed={$format == 'plaintext'}
          data-role="format"
          data-value="plaintext"
          disabled={!manifest.hasOcr}
          on:click={switchFormat}
        >
          <i class="fa-regular fa-file-lines" aria-hidden="true" />
          <span>Plain Text</span>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="dropdown-item"
          class:active={$format == 'image'}
          aria-pressed={$format == 'image'}
          data-role="format"
          data-value="image"
          on:click={switchFormat}
        >
          <i class="fa-regular fa-file-image" aria-hidden="true" />
          <span>Image</span>
        </button>
      </li>
    </ul>
    <li aria-hidden="true"><hr class="dropdown-divider" /></li>
    <li>
      <span class="dropdown-header">
        <span id="view-mode">View Mode</span>
      </span>
    </li>
    <ul class="menu-list-section" role="group" aria-labelledby="view-mode">
      <li>
        <button
          type="button"
          class="dropdown-item"
          class:active={$view == '1up'}
          aria-pressed={$view == '1up'}
          data-role="view"
          data-value="1up"
          on:click={switchView}
        >
          <i class="fa-solid fa-up-down" aria-hidden="true" />
          <span>Scroll</span>
        </button>
      </li>
      <li>
        <button
          type="button"
          class="dropdown-item"
          class:active={$view == '2up'}
          aria-pressed={$view == '2up'}
          data-role="view"
          data-value="2up"
          disabled={manifest.totalSeq == 1}
          on:click={switchView}
        >
          <i class="fa-solid fa-book-open" aria-hidden="true" />
          <span>Flip</span>
        </button>
      </li>
    </ul>
    <li aria-hidden="true"><hr class="dropdown-divider" /></li>
    <li>
      <button
        type="button"
        class="dropdown-item"
        class:active={$view == 'thumb'}
        aria-pressed={$view == 'thumb'}
        data-role="view"
        data-value="thumb"
        on:click={switchView}
      >
        <i class="fa-solid fa-table-cells" aria-hidden="true" />
        <span>Thumbnails</span>
      </button>
    </li>
  </ul>
</div>

<style lang="scss">
  // try to align the icons + text in the menu
  button.dropdown-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    i[aria-hidden='true'] {
      width: 1.125rem;
      text-align: center;
    }
  }
  ul.menu-list-section {
    list-style: none;
    padding-left: 0;
  }
</style>
