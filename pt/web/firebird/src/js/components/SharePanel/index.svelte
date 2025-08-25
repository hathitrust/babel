<script>
  import { getContext } from 'svelte';
  import { tooltippy } from '../../lib/tippy';

  import Panel from '../Panel/index.svelte';
  import Modal from '~firebird-common/src/js/components/Modal';

  const emitter = getContext('emitter');
  const manifest = getContext('manifest');
  const HT = getContext('HT');

  let shareHandle = $state();
  let btnShareHandle = $state();
  let shareHandleLink = $state();
  let btnShareHandleLink = $state();
  let btnCodeBlock = $state();
  let modal = $state();
  let modalBody = $state();

  // initial seq
  let currentSeq = manifest.currentSeq;

  let codeBlock = $state();
  let view = $state('1up');
  let codeBlockText = $state({});
  codeBlockText[
    '1up'
  ] = `<iframe width="450" height="700" src="https://hdl.handle.net/2027/${manifest.id}?urlappend=%3Bui=embed"></iframe>`;
  codeBlockText[
    '2up'
  ] = `<iframe width="700" height="450" src="https://hdl.handle.net/2027/${manifest.id}?urlappend=%3Bui=embed"></iframe>`;

  function getLabel(el) {
    return this.getAttribute('aria-label');
  }

  function selectInnerText(event) {
    const target = event.target;
    if (event.type == 'blur') {
      target.dataset.clicked = 'false';
      return;
    }

    if (target.dataset.clicked == 'true') {
      // do nothing
    } else {
      // on:click={() => codeBlock.select()}
      target.select();
      target.dataset.clicked = 'true';
    }
  }

  function copySelection(trigger, el) {
    el.select();
    document.execCommand('copy');
    let tooltip = bootstrap.Tooltip.getInstance(trigger);
    tooltip.setContent({ '.tooltip-inner': 'Copied' });
    HT.live.announce('Copied');
  }

  $effect(() => {
    [btnShareHandle, btnShareHandleLink, btnCodeBlock].forEach((el) => {
      if (!el) {
        return;
      }
      if (el._listening) {
        return;
      }
      el._listening = true;
      el.addEventListener('hidden.bs.tooltip', () => {
        let tooltip = bootstrap.Tooltip.getInstance(el);
        tooltip.setContent({ '.tooltip-inner': el.getAttribute('aria-label') });
      });
    });
  });

  let ownerid = $derived(manifest.ownerid($currentSeq));
  let pageUrl = $derived(`https://hdl.handle.net/2027/${manifest.id}?urlappend=%3Bseq=${$currentSeq}${
    ownerid ? '%3Bownerid=' + ownerid : ''
  }`);
</script>

<Panel parent="#controls">
  {#snippet icon()}
    <i class="fa-solid fa-share-nodes" ></i>
  {/snippet}
  {#snippet title()}
    Share
  {/snippet}
  {#snippet body()}
      <div class="mb-3">
        <label for="share-handle" class="form-label">Permanent link to this item</label>
        <div class="d-flex align-items-center gap-1">
          <input
            id="share-handle"
            type="text"
            class="form-control"
            readonly
            value="https://hdl.handle.net/2027/{manifest.id}"
            bind:this={shareHandle}
            onblur={selectInnerText}
            onclick={selectInnerText}
          />
          <button
            class="btn btn-outline-dark"
            aria-label="Copy permanent link"
            data-bs-placement="right"
            use:tooltippy={{placement: 'right'}}
            bind:this={btnShareHandle}
            onclick={() => copySelection(btnShareHandle, shareHandle)}
          >
            <i class="fa-solid fa-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="mb-3">
        <label for="share-handle-seq" class="form-label">Link to this page scan</label>
        <div class="d-flex align-items-center gap-1">
          <input
            id="share-handle-seq"
            type="text"
            class="form-control"
            readonly
            value={pageUrl}
            bind:this={shareHandleLink}
            onblur={selectInnerText}
            onclick={selectInnerText}
          />
          <button
            class="btn btn-outline-dark"
            aria-label="Copy link to this page scan"
            data-bs-placement="right"
            use:tooltippy={{placement: 'right'}}
            bind:this={btnShareHandleLink}
            onclick={() => copySelection(btnShareHandleLink, shareHandleLink)}
          >
            <i class="fa-solid fa-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div>
        <button type="button" class="btn btn-outline-dark" onclick={() => modal.show()}>Embed this item</button>
      </div>
  {/snippet}
</Panel>
<Modal bind:this={modal}>
  {#snippet title()}
    Embed this item
  {/snippet}
  {#snippet body()}
        <div class="mb-3 share-modal-body" bind:this={modalBody}>
        <p id="embed-help-info">Copy the code below and paste it into the HTML of any website or blog.</p>
        <label for="embed-codeblock" class="visually-hidden">Code Block</label>
        <div class="d-flex align-items-start gap-2">
          <textarea
            class="form-control"
            id="embed-codeblock"
            aria-describedby="embed-help-info"
            rows="3"
            bind:this={codeBlock}
            bind:value={codeBlockText[view]}
            onblur={selectInnerText}
            onclick={selectInnerText}
         ></textarea>
          <button
            class="btn btn-outline-dark"
            aria-label="Copy iframe code"
            data-bs-container=".share-modal-body"
            use:tooltippy={{ appendTo: 'parent' }}
            bind:this={btnCodeBlock}
            onclick={() => copySelection(codeBlock)}
          >
            <i class="fa-solid fa-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="mb-3">
        <div class="form-check form-check-inline">
          <input id="embed-view-1up" class="form-check-input" type="radio" value="1up" bind:group={view} />
          <label class="form-check-label" for="embed-view-1up">
            <i class="fa-solid fa-up-down" aria-hidden="true"></i>
            Scroll View
          </label>
        </div>
        <div class="form-check form-check-inline">
          <input id="embed-view-2up" class="form-check-input" type="radio" value="2up" bind:group={view} />
          <label class="form-check-label" for="embed-view-2up">
            <i class="fa-solid fa-book-open" aria-hidden="true"></i>
            Flip View
          </label>
        </div>
      </div>
      <p>
        <a href="//{HT.www_domain}/member-libraries/resources-for-librarians/improve-discovery/embed-hathitrust-books/"
          >More information</a
        >
      </p>
  {/snippet}
</Modal>