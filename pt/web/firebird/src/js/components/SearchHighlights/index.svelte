<script>
  /**
   * @typedef {Object} Props
   * @property {any} [page_coords]
   * @property {any} [matches]
   * @property {any} [image]
   * @property {any} format
   * @property {number} [orient]
   * @property {number} seq
   * @property {any} canvas
   */

  /** @type {Props} */
  let {
    page_coords = [],
    matches = [],
    image = null,
    format,
    orient = 0,
    seq = 0,
    canvas = null
  } = $props();

  let highlights = $state([]);

  const buildHighlights = function () {
    function parseCoords(value) {
      var values = value.split(' ');
      return values.map((v) => parseInt(v, 10));
    }

    highlights.length = 0;
    var timestamp = new Date().getTime();

    var scaling = {};

    if (image) {
      // if ( image.hasAttribute('width') ) {
      //   scaling.width = parseInt(image.getAttribute('width'), 10);
      //   scaling.height = parseInt(image.getAttribute('height'), 10);
      // } else {
      //   scaling.width = image.width;
      //   scaling.height = image.height;
      // }

      scaling.width = canvas.width; // image.offsetWidth;
      scaling.height = canvas.height; // image.offsetHeight;

      //these console logs are sending the console into an infinte loop, maybe use inspect/snapshot?
      //console.log('-- search.highlights scaling', scaling.width, scaling.height, canvas);

      if (orient == 90 || orient == 270) {
        scaling.width = canvas.height; // image.offsetHeight;
        scaling.height = canvas.width; // image.offsetWidth;
      }

      scaling.ratio = scaling.width / page_coords[2];
      scaling.ratioY = scaling.height / page_coords[3];

      if (orient == 90 || orient == 270) {
        scaling.ratio = scaling.width / page_coords[3];
      }

      scaling.padding = 0; // parseInt(window.getComputedStyle(page).marginTop) / 2;
      scaling.ratioZ = 1.0;
      scaling.ratio *= scaling.ratioZ;
    }

    function textNodesUnder(el) {
      var n,
        a = [],
        walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      while ((n = walk.nextNode())) a.push(n);
      return a;
    }

    for (let i = 0; i < matches.length; i++) {
      // var span = text.parentNode;
      var span = matches[i];

      if (format == 'image') {
        var coords = parseCoords(span.dataset.coords);
        coords[0] *= scaling.ratio;
        coords[2] *= scaling.ratio;
        coords[1] *= scaling.ratio;
        coords[3] *= scaling.ratio;

        if (orient == 90 || orient == 270) {
          let newCoords = [];
          newCoords[0] = coords[1];
          newCoords[2] = coords[3];
          newCoords[1] = coords[0];
          newCoords[3] = coords[2];

          console.log(
            '-- search.highlights',
            orient,
            span.dataset.coords,
            coords,
            newCoords,
            image.offsetWidth,
            image.offsetHeight,
            scaling.width,
            scaling.height
          );
          coords = [...newCoords];
        }

        var highlight_w0 = Math.abs(coords[2] - coords[0]);
        var highlight_h0 = Math.abs(coords[3] - coords[1]);
        var highlight_w = highlight_w0 * 1.25;
        var highlight_h = highlight_h0 * 1.25;

        var highlight = {};
        highlight.word = span.dataset.innerHTML;
        highlight.timestamp = timestamp;
        // highlight.top = coords[1];
        highlight.padding = scaling.padding;
        highlight.width = `${(highlight_w / scaling.width) * 100.0}%`;
        highlight.height = `${(highlight_h / scaling.height) * 100.0}%`;
        highlight.top = `${((coords[1] - (highlight_h - highlight_h0) / 2) / scaling.height) * 100.0}%`;
        highlight.left = `${((coords[0] - (highlight_w - highlight_w0) / 2) / scaling.width) * 100.0}%`;

        if (orient == 90) {
          highlight.top = `${((coords[1] - (highlight_h - highlight_h0) / 2) / scaling.height) * 100.0}%`;
          highlight.left = `${
            ((scaling.width - coords[0] - (highlight_w - highlight_w0) / 0.25) / scaling.width) * 100.0
          }%`;
        } else if (orient == 180) {
          highlight.top = `${
            ((scaling.height - coords[1] - (highlight_h - highlight_h0) / 0.25) / scaling.height) * 100.0
          }%`;
          highlight.left = `${
            ((scaling.width - coords[0] - (highlight_w - highlight_w0) / 0.25) / scaling.width) * 100.0
          }%`;
        } else if (orient == 270) {
          highlight.top = `${
            ((scaling.height - coords[1] - (highlight_h - highlight_h0) / 0.25) / scaling.height) * 100.0
          }%`;
          highlight.left = `${((coords[0] - (highlight_w - highlight_w0) / 2) / scaling.width) * 100.0}%`;
        }

        if (orient == 90 || seq == 7) {
          console.log(
            '-- search.highlights top',
            coords[1],
            (highlight_h - highlight_h0) / 2,
            scaling.height,
            scaling.ratio
          );
          console.log(
            '-- search.highlights left',
            coords[0],
            (highlight_w - highlight_w0) / 2,
            scaling.width,
            scaling.ratio
          );
        }

        // var highlight = document.createElement('mark');
        // highlight.classList.add('highlight');
        // // highlight.classList.add(`highlight_${highlight_idx}`);
        // highlight.dataset.word = innerHTML;
        // highlight.dataset.timestamp = timestamp;

        // highlight.dataset.top = coords[1];
        // highlight.dataset.padding = scaling.padding;

        // highlight.style.width = `${highlight_w / scaling.width * 100.0}%`;
        // highlight.style.height = `${highlight_h / scaling.height * 100.0}%`;
        // highlight.style.top = `${( coords[1] - ( ( highlight_h - highlight_h0 ) / 2 ) ) / scaling.height * 100.0}%`;
        // highlight.style.left = `${( coords[0] - ( ( highlight_w - highlight_w0 ) / 2 ) ) / scaling.width * 100.0}%`;

        // if ( self.name == '2up' ) {
        //   var prefix = page.classList.contains('recto') ? -1 : 1;
        //   highlight.style.left = `${( coords[0] - ( ( highlight_w - highlight_w0 ) / 2 ) ) / image_frame.offsetWidth * 100.0}%`;
        // }

        // scan.appendChild(highlight);
        highlights.push(highlight);
      } else {
        // span.classList.add('highlight--plaintext', `highlight_${highlight_idx}`);
        const mark = document.createElement('mark');
        mark.innerText = span.innerText;
        mark.setAttribute('class', span.getAttribute('class'));
        mark.dataset.class = mark.getAttribute('class');
        mark.classList.add('highlight--plaintext', 'highlight'); // `highlight_${highlight_idx}`);
        mark.dataset.coords = span.dataset.coords;
        // console.log("-- mark", mark, span, span.parentElement);
        if (span.parentElement) {
          span.parentElement.replaceChild(mark, span);
        }
      }
    }

    highlights = highlights;
  };

  $effect(() => {
    if (format == 'image' && image && matches && matches.length && orient >= 0) {
      buildHighlights();
    }
  });
  $effect(() => {
    if (format == 'plaintext' && matches && matches.length) {
      buildHighlights();
    }
  });
</script>

{#if format == 'image'}
  {#each highlights as highlight}
    <mark
      class="image highlight"
      data-word={highlight.word}
      style:width={highlight.width}
      style:height={highlight.height}
      style:top={highlight.top}
      style:left={highlight.left}
   ></mark>
  {/each}
{/if}

<style>
  :global(mark.image.highlight) {
    position: absolute;
    opacity: 0.4;
  }

  :global(mark.highlight) {
    background: #ffff00;
  }

  :global(html[data-show-highlights='false'] mark.image.highlight) {
    display: none !important;
  }

  :global(html[data-show-highlights='false'] mark.highlight),
  :global(html[data-show-highlights='false'] p.kwic mark) {
    background: transparent;
  }
</style>
