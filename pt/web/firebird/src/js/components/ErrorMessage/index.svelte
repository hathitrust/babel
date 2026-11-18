<script>
  let { status, rayID } = $props();
</script>

<div class="message-container">
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
      <ul class="d-flex flex-column gap-smaller">
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
</div>

<style lang="scss">
  .message-container {
    container-name: error;
    container-type: inline-size;
  }
  .error-message {
    --size-00: -0.011rem;
    --size-0: 0.015rem;
    --size-1: 0.42381rem;
    --size-2: 0.5rem;
    --size-3: 0.84763rem;
    --size-4: 1rem;
    --size-5: 1.1125rem;
    --size-6: 1.25rem;
    --size-7: 1.3125rem;
    --size-8: 1.5rem;
    --size-9: 1.6875rem;
    --size-10: 1.875rem;
    --size-11: 2rem;
    --size-12: 2.11906rem;
    --size-13: 2.25rem;
    --size-14: 2.5rem;

    max-width: 32.8125rem;
    min-height: 43rem;
    margin: auto;
    margin-top: var(--size-12);
    padding: var(--size-6) var(--size-4);

    border-radius: 0.5rem;

    // dashed border
    --dash: 14px;
    --gap: 10px;
    --w: 2.5px;
    --c: #cfd0d1;

    background:
      repeating-linear-gradient(90deg, var(--c) 0 var(--dash), transparent 0 calc(var(--dash) + var(--gap))) top / 100%
        var(--w) no-repeat,
      repeating-linear-gradient(90deg, var(--c) 0 var(--dash), transparent 0 calc(var(--dash) + var(--gap))) bottom /
        100% var(--w) no-repeat,
      repeating-linear-gradient(0deg, var(--c) 0 var(--dash), transparent 0 calc(var(--dash) + var(--gap))) left /
        var(--w) 100% no-repeat,
      repeating-linear-gradient(0deg, var(--c) 0 var(--dash), transparent 0 calc(var(--dash) + var(--gap))) right /
        var(--w) 100% no-repeat;
  }
  .error-message * {
    margin: 0;
  }
  h2 {
    font-size: var(--size-9);
    font-weight: 700;
    line-height: var(--size-10);
  }
  .status-code {
    color: var(--color-neutral-600);
    font-family: 'Roboto Mono';
    font-size: var(--size-3);
    font-weight: 400;
    line-height: var(--size-5);
    margin-bottom: 0;
  }
  .subtitle {
    font-size: var(--size-6);
    font-weight: 500;
    line-height: var(--size-10);
  }
  .details p {
    font-size: var(--size-5);
    font-weight: 700;
    line-height: var(--size-9);
  }
  .details ul {
    font-size: var(--size-4);
    padding-inline-start: var(--size-8);
    letter-spacing: var(--size-00);
    li {
      line-height: var(--size-8);
    }
  }
  .gap-smaller {
    gap: var(--size-1);
  }
  .gap-default {
    gap: var(--size-3);
  }
  .gap-larger {
    gap: var(--size-12);
  }
  @container error (23.75rem <= width <= 32.8125rem) {
    .error-message {
      padding: var(--size-11);
    }
    h2 {
      font-size: var(--size-8);
      line-height: var(--size-13);
      letter-spacing: var(--size-0);
    }
  }
  @container error (width > 32.8125rem) {
    .error-message {
      min-height: 39.375rem;
      padding: var(--size-11) var(--size-14);
    }
    h2 {
      font-size: var(--size-11);
      line-height: var(--size-14);
    }
    .status-code {
      font-size: var(--size-4);
      line-height: var(--size-7);
    }
    .subtitle {
      font-size: var(--size-8);
      line-height: var(--size-10);
    }

    .gap-smaller {
      gap: var(--size-2);
    }
    .gap-default {
      gap: var(--size-4);
    }
    .gap-larger {
      gap: var(--size-14);
    }
  }
</style>
