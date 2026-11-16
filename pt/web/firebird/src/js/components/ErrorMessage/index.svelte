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
    --size-0000: -0.01238rem;
    --size-000: -0.011rem;
    --size-00: -0.0105rem;
    --size-0: -0.00931rem;
    --size-1: 0.42381rem;
    --size-2: 0.5rem;
    --size-3: 0.84763rem;
    --size-4: 0.95356rem;
    --size-5: 1rem;
    --size-6: 1.1125rem;
    --size-7: 1.27144rem;
    --size-8: 1.43048rem;
    --size-9: 1.58931rem;
    --size-10: 1.6875rem;
    --size-11: 1.69525rem;
    --size-12: 1.875rem;
    --size-13: 2rem;
    --size-14: 2.11906rem;
    --size-15: 2.5rem;
    --size-px-1: 2.5px;

    max-width: 32.8125rem;
    margin: auto;
    margin-top: var(--size-14);
    padding: var(--size-11) var(--size-14);

    border-radius: 0.5rem;

    // dashed border
    --dash: 14px;
    --gap: 10px;
    --w: var(--size-px-1);
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
    font-size: var(--size-11);
    font-weight: 700;
    line-height: var(--size-14);
  }
  .status-code {
    color: var(--color-neutral-600);
    font-family: 'Roboto Mono';
    font-size: var(--size-3);
    font-weight: 400;
    line-height: var(--size-6);
    margin-bottom: 0;
  }
  .subtitle {
    font-size: 1.27144rem;
    font-weight: 500;
    line-height: 1.58931rem;
  }
  .details p {
    font-size: var(--size-4);
    font-weight: 700;
    line-height: 1.43048rem;
    letter-spacing: -0.0105rem;
  }
  .details ul {
    font-size: var(--size-3);
    letter-spacing: -0.00931rem;
    padding-inline-start: var(--size-5);
    li {
      line-height: 1.27144rem;
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
  @container error (width > 24rem) {
    .error-message {
      padding: var(--size-13) var(--size-15);
    }
    h2 {
      font-size: var(--size-13);
      line-height: 2.5rem;
    }
    .status-code {
      font-size: var(--size-5);
      line-height: 1.3125rem;
    }
    .subtitle {
      font-size: 1.5rem;
      line-height: 1.875rem;
    }
    .details p {
      font-size: 1.125rem;
      line-height: 1.6875rem;
    }
    .details ul {
      font-size: 1rem;
      padding-inline-start: var(--size-8);
      li {
        line-height: 1.5rem;
      }
    }

    .gap-smaller {
      gap: 0.5rem;
    }
    .gap-default {
      gap: 1rem;
    }
    .gap-larger {
      gap: 2.5rem;
    }
  }
</style>
