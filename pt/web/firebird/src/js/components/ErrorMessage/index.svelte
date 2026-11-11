<script>
  let { status, rayID } = $props();
</script>

<div class="error-message d-flex flex-column gap-larger">
  <div class="title d-flex flex-column gap-default">
    <div class="d-flex flex-column gap-smaller">
      <p class="status-code">ERROR: {status}</p>
      <h2>Temporarily unavailable</h2>
    </div>
    <p class="subtitle">We’re unable to display this image as our security system has temporarily limited access.</p>
  </div>
  <div class="details d-flex flex-column gap-smaller">
    <p>Here's what you can try</p>
    <ul>
      <li><span class="fw-bold">Refresh the page</span> to try loading the image again</li>
      <li><span class="fw-bold">Try again later</span> if the image continues to be unavailable</li>
      <li>
        <span class="fw-bold">Switch to a different browser</span> or device, or turn off your VPN or proxy server
      </li>
      <li>
        <span class="fw-bold">Contact support</span> if the issue persists at support@hathitrust.org and include this
        Ray ID: {rayID}
      </li>
    </ul>
  </div>
</div>

<style>
  .error-message * {
    margin: 0;
  }
  .error-message {
    max-width: 32.8125rem;
    margin: auto;
    margin-top: 2.11906rem;
    padding: 1.69525rem 2.11906rem;

    border-radius: 0.42381rem;
    border: 2.119px dashed var(--color-neutral-300);
  }
  h2 {
    font-size: 1.69525rem;
    font-weight: 700;
    line-height: 2.11906rem;
  }
  .status-code {
    color: var(--color-neutral-600);
    font-family: 'Roboto Mono';
    font-size: 0.84763rem;
    font-weight: 400;
    line-height: 1.1125rem;
    margin-bottom: 0;
  }
  .subtitle {
    font-size: 1.27144rem;
    font-weight: 500;
    line-height: 1.58931rem;
  }
  .details p {
    font-size: 0.95356rem;
    font-weight: 700;
    line-height: 1.43048rem;
    letter-spacing: -0.0105rem;
  }
  .details ul {
    font-size: 0.84763rem;
    line-height: 1.27144rem;
    letter-spacing: -0.00931rem;
    padding-inline-start: 1rem;
    li {
      margin-block-end: 0.25rem;
    }
  }
  .gap-smaller {
    gap: 0.42381rem;
  }
  .gap-default {
    gap: 0.84763rem;
  }
  .gap-larger {
    gap: 2.11906rem;
  }
</style>
