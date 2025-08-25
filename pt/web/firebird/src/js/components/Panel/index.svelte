<script>
  import { getContext, onMount } from 'svelte';
  const manifest = getContext('manifest');
  /**
   * @typedef {Object} Props
   * @property {any} [parent]
   * @property {boolean} [expanded]
   * @property {any} [class]
   * @property {any} [onToggle]
   * @property {any} [id]
   * @property {import('svelte').Snippet} [icon]
   * @property {import('svelte').Snippet} [title]
   * @property {import('svelte').Snippet} [body]
   */

  /** @type {Props} */
  let {
    parent = null,
    expanded = false,
    class: className = null,
    onToggle = null,
    id = `${new Date().getTime()}-${Math.ceil(Math.random() * 1000)}`,
    icon,
    title,
    body
  } = $props();

  let bsParent = manifest.ui == 'crms' ? null : parent;
  let accordionEl = $state();

  onMount(() => {
    if (onToggle) {
      accordionEl.addEventListener('hide.bs.collapse', (event) => onToggle(event, false));
      accordionEl.addEventListener('show.bs.collapse', (event) => onToggle(event, true));
    }
  });
</script>

<div class="accordion-item {className} panel" bind:this={accordionEl}>
  <h2 class="accordion-header" id="h{id}">
    <button
      class="accordion-button"
      class:collapsed={!expanded}
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#c{id}"
      aria-expanded={expanded}
      aria-controls="c{id}"
    >
      <div class="d-flex gap-2 align-items-center me-1">
        {@render icon?.()}
        {@render title?.()}
      </div>
    </button>
  </h2>
  <div
    id="c{id}"
    class="accordion-collapse collapse"
    class:show={expanded}
    aria-labelledby="h{id}"
    data-bs-parent={bsParent}
  >
    <div class="accordion-body">
      {@render body?.()}
    </div>
  </div>
</div>

<style lang="scss">
  .accordion-button {
    font-weight: bold;
  }

  .accordion-item.dark {
    background-color: var(--color-neutral-200);
    color: var(--color-neutral-900);
  }
</style>
