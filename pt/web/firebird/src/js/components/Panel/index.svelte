<script>
  import { getContext, onMount } from 'svelte';
  const manifest = getContext('manifest');

  export let parent = null;
  export let expanded = false;
  let className = null;

  export { className as class };

  export let onToggle = null;

  let bsParent = manifest.ui == 'crms' ? null : parent;
  let accordionEl;

  export let id = `${new Date().getTime()}-${Math.ceil(Math.random() * 1000)}`;

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
        <slot name="icon" />
        <slot name="title" />
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
      <slot name="body" />
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

    // .accordion-button {
    //   background-color: inherit;
    //   color: white;
    // }
  }
</style>
