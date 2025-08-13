<script>
  import Panel from '../Panel/index.svelte';

  export let onToggle;
  export let expanded;
</script>

<Panel {expanded} {onToggle} class="access-panel">
  <i class="fa-solid fa-lock-open" slot="icon" />
  <slot:fragment slot="title"> Registered Access </slot:fragment>
  <slot:fragment slot="subtitle">via Resource Sharing</slot:fragment>
  <slot:fragment slot="body">
    <p>This work may be in copyright. You have full view access to this item based on your account privileges.</p>
    <p>
      Information about permitted and prohibited uses can be found in the
      <!-- this link will be updated to a HT page for service launch -->
      <a href="https://docs.google.com/document/d/1gdkU14w-0x3mhy2n0wJCZ6EZTft0mo9bTpVGPYKQJf4/edit?usp=drive_link/"
        >Resource Sharing Terms of Service.</a
      >
    </p>
  </slot:fragment>
</Panel>
