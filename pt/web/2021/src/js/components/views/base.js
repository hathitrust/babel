import { createNanoEvents } from 'nanoevents';

export var setfn = {
  eqSet: function(as, bs) {
    return as.size === bs.size && this.all(this.isIn(bs), as);    
  },

  all: function(pred, as) {
    for (var a of as) if (!pred(a)) return false;
    return true;
  },

  isIn: function(as) {
    return function (a) {
        return as.has(a);
    };    
  }
};

function rgbToYIQ({r, g, b}) {
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

function hexToRgb(hex) {
  if (!hex || hex === undefined || hex === '') {
    return undefined;
  }

  const result =
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : undefined;
}

function contrast(colorHex, threshold = 128) {
  if (colorHex === undefined) {
    return '#000';
  }

  const rgb = hexToRgb(colorHex);

  if (rgb === undefined) {
    return '#000';
  }

  return rgbToYIQ(rgb) >= threshold ? '#000' : '#fff';
}

function simpleSvgPlaceholder({
  width = 300,
  height = 150,
  text = `${width}×${height}`,
  fontFamily = 'sans-serif',
  fontWeight = 'bold',
  fontSize = Math.floor(Math.min(width, height) * 0.2),
  dy = fontSize * 0.35,
  bgColor = '#ddd',
  textColor = 'rgba(0,0,0,0.5)',
  dataUri = true,
  charset = 'UTF-8'
} = {}) {
  const str = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="${bgColor}" width="${width}" height="${height}"/>
    <text fill="${textColor}" font-family="${fontFamily}" font-size="${fontSize}" dy="${dy}" font-weight="${fontWeight}" x="50%" y="50%" text-anchor="middle">${text}</text>
  </svg>`;

  // Thanks to: filamentgroup/directory-encoder
  const cleaned = str
    .replace(/[\t\n\r]/gim, '') // Strip newlines and tabs
    .replace(/\s\s+/g, ' ') // Condense multiple spaces
    .replace(/'/gim, '\\i'); // Normalize quotes

  if (dataUri) {
    const encoded = encodeURIComponent(cleaned)
      .replace(/\(/g, '%28') // Encode brackets
      .replace(/\)/g, '%29');

    return `data:image/svg+xml;charset=${charset},${encoded}`;
  }

  return cleaned;
}

const rotateButton = `<button class="btn action-rotate-page" data-action="rotate-page" aria-label="Rotate page" data-tippy-role="tooltip" data-tippy-placement="auto" tabindex="-1">
<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
</svg>
</button>`

export var Base = class {
  constructor(options={}) {
    this.service = options.service;
    this.reader = options.reader;
    this.scale = options.scale || 1.0;
    this.mode = 'scroll';
    this.emitter = createNanoEvents();
    this._handlers = {};
    this.id = (new Date()).getTime();
    this.pages = [];
    this.pagesIndex = {};
    this.trackResize = true;

    this.rootMargin = options.rootMargin || 1024; // ( 8 * 16 );
    this.unloadNearestThreshold = 5;

    this.sets = {};
    this.sets.visible = new Set();
    this.sets.unloaded = new Set();
    this.sets.loaded = new Set();

    this._tracker = { images: {}, thumbnails: {}, plaintext: {} };
    this._intervals = {};

    this._initialSeq = options.seq;
    this._initialized = false;

    this.format = options.format || 'image';
    this.testRE = new RegExp('<div class="ocr_page"[^>]+>\\s+</div>', 'm');
  }

  attachTo(element, cb) {
    this.container = element;
    this.bindEvents();
    this.render(cb);
  }

  render(cb) {
    var minWidth = this.minWidth();
    var maxHeight = this.maxHeight();

    var manifest = this.service.manifest;

    var scale = this.scale;

    var t0 = performance.now();
    var fragment = document.createDocumentFragment();

    if ( maxHeight ) {
      // this.container.style.setProperty('--max-page-height', `${maxHeight * scale}px`);
      document.documentElement.style.setProperty('--max-page-height', `${maxHeight * scale}px`);
    }

    var slice_index = 1;

    this._hasFrontCover = ( this.service.manifest.checkFeatures(1, "FRONT_COVER") || ( this.service.manifest.checkFeatures(1, "COVER") && this.service.manifest.checkFeatures(1, "RIGHT") ) || this.service.manifest.checkFeatures(1, "COVER") || ! this.service.manifest.checkFeatures(1) );
    this._hasBackCover =  ( this.service.manifest.checkFeatures(endSeq, "BACK_COVER") || ( this.service.manifest.checkFeatures(endSeq, "COVER") && this.service.manifest.checkFeatures(endSeq, "LEFT") ) );

    // // --- DEBUGGING
    // this._hasFrontCover = this._hasBackCover = false;

    if ( this._hasFrontCover ) {
        // first page is a cover, so add a dummy page
        var page = document.createElement('div');
        page.setAttribute('tabindex', '-1');
        page.classList.add('page', 'placeholder', 'verso');
        page.dataset.slice = slice_index;
        page.dataset.placeholder = true;
        fragment.appendChild(page);
    }

    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');
      page.setAttribute('aria-hidden', true);

      page.classList.add('page');
      page.dataset.seq = seq;

      var klass = this._assignSide(seq);
      page.classList.add(klass);

      slice_index = this._slicify(seq);

      page.dataset.slice = slice_index;
      page.dataset.loaded = false;

      page.dataset.visible = false;
      page.dataset.scale = scale;

      var meta = this.service.manifest.meta(seq);

      var sizing = this._calculatePageSize(meta, page, minWidth, maxHeight);
      var w = sizing.width;
      var h = sizing.height;

      page.dataset.height = h;
      page.dataset.width = w;

      page.dataset.bestFit = ( scale <= 1 ) ? 'true' : 'false';
      if ( scale <= 1 ) {
        page.classList.add('page--best-fit');
      }

      var bgColor = '#F8F8F8';
      var textColor = '#F0F0F0';

      var placeholder = simpleSvgPlaceholder({
        bgColor: bgColor,
        textColor: textColor,
        text: `#${seq}`,
        fontFamily: `monospace`,
        width: w,
        height: h,
      });

      // var placeholder = '/imgsrv/graphics/1x1b.png';

      function titleCase(str) {
        return str.toLowerCase().split('_').map(function(word) {
          return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
      }

      var altText = `Page Scan #${seq}`;

      var features = [];
      if ( manifest.featureMap[seq] && manifest.featureMap[seq].features ) {
        features = manifest.featureMap[seq].features;
      }
      var priorityFeatures = [
        'BLANK',
        'FOLDOUT',
        'FRONT_COVER',
        'TITLE',
        'FIRST_CONTENT_CHAPTER_START',
        'CHAPTER_START',
        'CONTENTS',
        'TABLE_OF_CONTENTS',
        'COPYRIGHT',
        'BACK_COVER',
        'IMAGE_ON_PAGE'
      ];

      var priorityFeature = priorityFeatures.find((feature) => { features.indexOf(feature) > -1 });
      if ( priorityFeature ){
        altText += ' - ' + titleCase(priorityFeature);
      }

      // this is the image format
      if ( this.format == 'image' ) {
        var rotateButtonAction = rotateButton;
        if ( this.config().rotate === false ) { rotateButtonAction = ''; }
        var thumbnailSrc = this.service.thumbnail({ seq: seq });
        var pageNum = this.service.manifest.pageNum(seq) || '';
        if ( pageNum ) {
          pageNum = ` (${pageNum})`;
        }
        page.innerHTML = `<div class="page--toolbar"><div class="tag">${rotateButtonAction}<span>#${seq}${pageNum}</span></div></div><div class="page-text"></div><div class="image" style="height: ${sizing.frameHeight}px; width: ${sizing.frameWidth}px"><img alt="${altText}" style="height: ${sizing.height}px; width: ${sizing.width}px" height="${sizing.height}" width="${sizing.width}" src="${placeholder}" data-placeholder-src="${placeholder}" data-thumbnail-src="${thumbnailSrc}" /></div>`;
      } else {
        page.innerHTML = `<div class="page--toolbar"><div class="tag"><span>#${seq}</span></div></div><div data-placeholder="" class="page-text"></div>`;
        if ( this.name == 'thumb' ) {
          page.querySelector('.page-text').style.height = `${sizing.frameHeight}px`;
          page.querySelector('.page-text').style.width = `${sizing.frameWidth}px`;
        } else {
          // const height = ( this.container.offsetWidth * 0.85 ) * sizing.ratio;
          // page.querySelector('.page-text').style.minHeight = `${height}px`;
        }
      }

      this._renderr(page);

      fragment.appendChild(page);
      this.pages.push(page);
      this.pagesIndex[seq] = page;
    }

    var endSeq = this.service.manifest.totalSeq;
    if ( this._hasBackCover ) {
      // there's a back cover
      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');
      page.classList.add('page', 'placeholder', 'recto');
      page.dataset.slice = slice_index;
      page.dataset.placeholder = true;
      fragment.appendChild(page);
    }

    this.container.appendChild(fragment);

    var pages = this.container.querySelectorAll('.page');

    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
    }

    if ( this._initialSeq ) {
      this.display(this._initialSeq);
    }

    if ( cb ) {
      setTimeout(cb, 100);
      this._initialized = true;
      // cb();
    }

    this._lastContainerWidth = this.container.parentElement.offsetWidth; // this.container.offsetWidth * this.scale;
    this._lastScale = this.scale;
    // is this really necessary
    this._adjustContainer();

  }

  _adjustContainerWidth() {
    if ( this.format == 'plaintext' ) { return '100%'; }
    return `${( this.scale > 1 ? this.scale : 1 ) * 100}%`;
  }

  _adjustContainer() {
    var width = this._adjustContainerWidth();

    this.container.style.width = width;
    requestAnimationFrame(() => {
      this.container.parentNode.scrollLeft = 
        ( this.container.offsetWidth - this.container.parentNode.offsetWidth ) / 2;
    })
  }
  
  _renderr(page) {
    /* NOP */
  }

  _slicify(seq) {
    var n; var delta;
    if ( this._hasFrontCover ) { n = ( seq % 2 == 0 ) ? seq : seq - 1; delta = 1; }
    else { n = ( seq % 2 == 1 ) ? seq : seq - 1; delta = 0; }
    return ( Math.ceil(n / 2) || 0 ) + delta;
  }

  _assignSide(seq) {
    var klass;
    if ( this._hasFrontCover ) { klass = seq % 2 == 0 ? 'verso' : 'recto'; }
    else { klass = seq % 2 == 0 ? 'recto' : 'verso' };
    return klass;
  }

  redrawPage(page) {
    HT.log("-- base.redrawPage", page);
    page.dataset.loaded = page.dataset.reframed = false;
    // var page_text = page.querySelector('.page-text');
    // if ( page_text ) {
    //   page_text.innerHTML = '';      
    // }
    // this._removeHighlights(page);
    this.loadImage(page, { lazy: false, reuseText: true });
  }

  loadImage(page, options={}) {
    var self = this;

    var _process = function(seq, loadImage) {
      var page = self.pagesIndex[seq] ? self.pagesIndex[seq] : null;
      if ( page && page.dataset.loaded == 'false' ) {

        var img = page.querySelector('img');

        // img.src.indexOf(img.dataset.thumbnailSrc) < 0 
        // img.src == img.dataset.placeHolderSrc
        if ( page.dataset.reframed != 'true' && self.format == 'image' ) {
          self._tracker.thumbnails[seq] = self._tracker.thumbnails[seq] ? self._tracker.thumbnails[seq] + 1 : 1;
          self.service.loaders.thumbnails.queue({ src: img.dataset.thumbnailSrc, page: page });          
        }

        if ( loadImage && page.dataset.loaded == 'false' ) {
          page.classList.add('loading');
          if ( self.format == 'image' ) {
            self.service.loaders.images.queue({ src: self.imageUrl(page), page: page });
          }
          if ( self.format == 'plaintext' || ( options.reuseText !== true && self.embedHtml ) ) {
            var html_url = self.service.html({ seq: seq });
            if ( html_url ) {
              // self._tracker.plaintext[html_url] = self._tracker.plaintext[html_url] || 0;
              // self._tracker.plaintext[html_url] += 1;
              // console.log("-- ??", globalSeq, seq, self.service.loaders.images.getIndex(html_url), self._tracker.plaintext[html_url], page.dataset.loaded);
              self.service.loaders.images.queue({ src: html_url, page: page, mimetype: 'text/html' });
            }
          }
        }
      }

    }

    var pages = Array.isArray(page) ? page : [ page ];
    var page = pages[0];

    var seq = parseInt(page.dataset.seq, 10);
    if ( Math.abs(seq - self.currentSeq ) > 5 ) {
      self.service.loaders.thumbnails.stop(true);
      self.service.loaders.images.stop(true);
    }

    let globalSeq = seq;

    // first queue the immediate pages
    for(var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var seq = parseInt(page.dataset.seq, 10);
      _process(seq, true);
    }

    // now queue thumbnails
    if ( options.lazy !== false ) {
      var page = pages[0];
      var seq = parseInt(page.dataset.seq, 10);

      for(var ii = seq - 2; ii < seq; ii++) {
        _process(ii, true);
      }
      for(var ii = seq - 10; ii < ( seq + 2 ); ii++) {
        _process(ii, false);
      }
    }

    if ( options.lazy !== false ) {
      var page = pages[pages.length - 1];
      var seq = parseInt(page.dataset.seq, 10);
      for(var ii = seq + 2; ii > seq; ii--) {
        _process(ii, true);
      }
      for(var ii = seq + 10; ii > ( seq + 2 ); ii--) {
        _process(ii, false);
      }
    }

    self.service.loaders.images.start();
    self.service.loaders.thumbnails.start();
  }

  postImage(image, datum) {
    var page = datum.page;
    page.classList.remove('loading');
    
    // this._tracker[datum.src] = 0;

    if ( datum.mimetype == 'text/html' ) {
      return this.postText(image, datum);
    }
    if ( page.dataset.loaded != 'true' ) {
      var img = page.querySelector('img');
      img.src = image.src;
      this.service.manifest.update(page.dataset.seq, { width: image.width, height: image.height });
      this._reframePage(image, page);
      page.dataset.loaded = true;
      URL.revokeObjectURL(img.src); 
    }
  }

  postText(text, datum) {
    var page = datum.page;

    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = text;

    // adjust the text
    if ( page_text.textContent.trim() == "" || ! page_text.textContent.trim().match(/\w+/) ) {
      page_text.innerHTML = `<div class="alert alert-block alert-info alert-headline"><p>NO TEXT ON PAGE</p></div><p>This page does not contain any text recoverable by the OCR engine.</p>`;
    }

    page_text.innerHTML += '<p class="offscreen">End of page</p>';
  
    if ( this.format == 'plaintext' ) {
      datum.page.dataset.loaded = true;
    } else {
      if ( datum.redraw ) {
        page.querySelectorAll('.highlight').forEach((span) => {
          span.parentNode.removeChild(span);
        })
      }
    }
    this._drawHighlights(page);
  }

  postThumbnail(image, datum) {
    var page = datum.page;
    if ( page.dataset.loaded != 'true' ) {
      var img = page.querySelector('img');
      this._reframePage(image, page);
      img.src = image.src;
    }
  }

  _reframePage(image, page) {
    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.image');
      var img = frame.querySelector('img');

      var r = image.height / image.width;
      var frameWidth = parseFloat(frame.style.width);
      frame.style.height = `${frameWidth * r}px`;

      img.dataset.width = frameWidth;
      img.dataset.height = frameWidth * r;

      img.style.height = `${img.dataset.width}px`;
      img.style.height = `${img.dataset.height}px`;

      if ( this._checkForFoldouts(image, page) ) {
        var altText = img.getAttribute('alt');
        if ( altText.indexOf('Foldout') < 0 ) {
          altText += '; Foldout';
          img.setAttribute('alt', altText);
        }
      }
      page.dataset.reframed = 'true';
    }

  }

  _isUnusualPage(image, page) {
    var seq = page.dataset.seq;
    var manifest = this.service.manifest;

    if ( image && image.width < image.height ) { return false ; }

    var is_unusual = ( 
      ( manifest.checkFeatures(seq, "FOLDOUT") && ! manifest.checkFeatures(seq, "BLANK") )
        || 
      ( image && ( image.width / image.height ) > ( 4 / 3 ) )
    );

    return is_unusual;

  }

  _checkForFoldouts(image, page) {

    var seq = page.dataset.seq;
    var manifest = this.service.manifest;

    if ( image.width < image.height ) { return false ; }

    var is_unusual = ( 
      ( manifest.checkFeatures(seq, "FOLDOUT") && ! manifest.checkFeatures(seq, "BLANK") )
        || 
      ( ( image.width / image.height ) > ( 4 / 3 ) )
    );

    if ( is_unusual ) {
      // probably a fold out? maybe not a fold out?

      // manifest.manifest[seq].is_unusual = true;

      page.classList.add('page--foldout');
      this._reframeUnusualImage(page);
      this._addFoldoutPopout(page);
    }

    return is_unusual;
  }

  _reframeUnusualImage(page) {
    var frame = page.querySelector(".image");
    var frameWidth = parseFloat(frame.style.width);
    var margin = ( ( frameWidth * 1.1 ) - frameWidth ) / 2;
    frame.style.marginTop = `${margin}px`;
    page.style.marginBottom = `${margin}px`;
  }

  _addFoldoutPopout(page) {
    var toolbar = page.querySelector('.page--toolbar .tag');
    var check = toolbar.querySelector("button[data-action='popout']");
    if ( check ) { return ; }

    var icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-left" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M7.364 3.5a.5.5 0 0 1 .5-.5H14.5A1.5 1.5 0 0 1 16 4.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 14.5V7.864a.5.5 0 1 1 1 0V14.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H7.864a.5.5 0 0 1-.5-.5z"/>
        <path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 0 1H1.707l8.147 8.146a.5.5 0 0 1-.708.708L1 1.707V5.5a.5.5 0 0 1-1 0v-5z"/>
      </svg>`;
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-left-square" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
  <path fill-rule="evenodd" d="M10.828 10.828a.5.5 0 0 1-.707 0L6.025 6.732V9.5a.5.5 0 0 1-1 0V5.525a.5.5 0 0 1 .5-.5H9.5a.5.5 0 0 1 0 1H6.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
</svg>`;
    var button = document.createElement('button');
    button.dataset.seq = page.dataset.seq;
    button.dataset.action = 'popout';
    button.setAttribute('aria-label', `Open foldout for page scan #${page.dataset.seq}`);
    button.setAttribute('data-role', 'tooltip');
    button.setAttribute('data-microtip-position', 'left');
    button.setAttribute('data-microtip-size', 'small');
    button.setAttribute('tabindex', '-1');
    button.innerHTML = `${icon}`;
    toolbar.insertBefore(button, toolbar.childNodes[0]);
  }

  redrawPageImages() {
    var possibles = this.container.querySelectorAll('.page[data-loaded="true"],.page[data-visible="true"]');
    for(var i = 0; i < possibles.length; i++) {
      var page = possibles[i];
      this.redrawPage(page);
    }
    this._redrawPageImagesTimer = null;
  }

  unloadImage(page) {

    page.dataset.loaded = 'false';
    page.dataset.isLeaving = false;

    var img = page.querySelector('img');
    if ( img ) {
      console.log("<< unloading", page.dataset.seq);
      img.src = img.dataset.thumbnailSrc || img.dataset.placeholderSrc;
    }

    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = ''; // page_text.dataset.placeholder;

    this._removeHighlights(page);
  }

  preloadImages(page) {

  }

  imageUrl(params, buster) {
    var oprams =  params;
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth || 680;
    }
    // if ( this.reader.pagedetails.rotate[params.seq] ) {
    //   params.rotation = this.reader.pagedetails.rotate[params.seq];
    // }

    if ( ! params.width && ! params.height ) {
      console.log("AHOY IMAGEURL PROBLEM", params, oprams);
    }

    if ( buster ) { params.expiration = buster; }

    return this.service.image(params);
  }

  minPageWidth() {
    return this.minWidth();
  }

  minWidth() {
    var minWidth = this.container.parentNode.offsetWidth * 0.80;
    if ( minWidth < 680 && window.innerWidth >= 680 ) { minWidth = 680; }
    else if ( window.innerWidth < 680 ) { minWidth = window.innerWidth * 0.95; }
    return minWidth;
  }

  maxHeight() {
    return null;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  first() {
    this.display(1);
  }

  last() {
    this.display(this.service.manifest.totalSeq);
  }

  currentPage() {
    if ( this._currentPage ) {
      return this._currentPage;
    }
    return null;
  }

  getPage(seq) {
    return this.pagesIndex[seq];
  }

  bindEvents() {
    this._lastContainerWidth = this.container.offsetWidth;
    this._handlers.focus = this.focusHandler.bind(this);

    this._handlers.clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._handlers.clickHandler);

    if ( this.trackResize ) {

      this.reader.on('redraw', (params) => {
        if ( params.scale && params.scale != this.scale ) {
          this.scale = params.scale;
          this.reader.emit('resize');
        }
      });

      this._handlers.resize = this.reader.on('resize', () => {
        if ( ! this._initialized ) { return ; }

        if ( this._lastContainerWidth == this.container.parentElement.offsetWidth && this._lastScale == this.scale  ) { return ; }
        if ( this._lastContainerWidth != this.container.parentElement.offsetWidth ) {
          this._lastContainerWidth = this.container.parentElement.offsetWidth;
        }
        if ( this._lastScale != this.scale ) {
          this._lastScale = this.scale;
        }

        this._resizePages();
      })
    }

    this._intervals.unloader = setInterval(this.unloadPages.bind(this), 30 * 1000);
  }

  unloadPages() {

    var pages = this.container.querySelectorAll('.page[data-loaded="true"]');
    var possibles = new Set();
    pages.forEach((page) => possibles.add(page.dataset.seq));
    if ( setfn.eqSet(this.sets.unloaded, possibles )) { return ; }
    this.sets.unloaded = possibles;

    var nearest = this.unloadNearestThreshold;
    var visible = this.sets.visible;

    var now = Date.now();
    var tmp = [...visible].sort((a,b) => { return a - b});
    var seq1 = parseInt(tmp[0], 10);
    var seq2 = parseInt(tmp[1], 10);

    pages.forEach((page) => {
      var seq = parseInt(page.dataset.seq, 10);
      if ( ! this.isVisible(page) ) {
        if ( ! ( ( Math.abs(seq - seq1) <= nearest ) || ( Math.abs(seq - seq2) <= nearest ) ) ) {
          this.unloadImage(page);
        }
      }
    })
  }

  // default isVisible
  isVisible(page) {
    return page.dataset.visible == 'true';
  }

  visible(pages) {
    this.sets.visible = new Set();
    if ( pages instanceof HTMLElement ) {
      pages = [ pages ];
    } else {
      pages.forEach((page) => {
        if ( page.dataset.seq ) {
          this.sets.visible.add(parseInt(page.dataset.seq, 10));
        }
      })
    }
  }

  bindPageEvents(page) {
  }

  clickHandler(event) {
    var element = event.target.closest('button');
    if ( element && element.dataset.action == 'popout' ) {
      event.preventDefault();
      event.stopPropagation();

      var page = element.closest('.page');
      var img = page.querySelector('img');

      var seq = page.dataset.seq;
      var meta = this.service.manifest.meta(page.dataset.seq);

      var zoom_w = Math.floor(window.innerWidth * 0.90);
      var zoom_h = zoom_w * meta.ratio;

      var max_zoom_h = Math.floor(window.innerHeight * 0.85);
      if ( zoom_h > max_zoom_h ) {
        var r = max_zoom_h / zoom_h;
        zoom_h = max_zoom_h;
        zoom_w = zoom_w * r;
      }

      var zoom_img_src = this.imageUrl({ seq: seq, width: zoom_w });

      var new_img = `<div class="loading foldout"><img style="visibility: hidden; max-height: 100%;" height="${zoom_h}" width="${zoom_w}" /></div>`;
      var dialog = bootbox.dialog(new_img,
        [{ label: 'Close', class: 'btn-dismiss' }],
        {
          lightbox: true,
          header: `View page scan ${page.dataset.seq} foldout`,
          width: zoom_w - 16, // zoom_w,
          height: zoom_h - 16
        }
      );

      var $zoom_img = dialog.find("img");
      $zoom_img.on('load', function() {
        $zoom_img.css({ visibility: 'visible' });
        $zoom_img.parent().removeClass('loading');
      })
      $zoom_img.attr('src', zoom_img_src);
      return;
    }

    if ( element && element.dataset.action == 'rotate-page' ) {
      event.preventDefault();
      event.stopPropagation();

      const delta = 90;

      var page = element.closest('.page');
      var image_frame = page.querySelector('.image');

      var rotated = parseInt(page.dataset.rotated || 360, 10);
      rotated += delta;
      rotated = rotated % 360;

      if ( rotated % 90 == 0 ) {
        // set margins!
        var margin = image_frame.clientWidth * 0.8;
        page.style.setProperty('--margin-rotated', ( margin / 2 - margin / 8 ) * -1);
      } else {
        page.style.setProperty('--margin-rotated', null);
      }

      page.dataset.rotated = rotated;
    }
  }

  focusHandler(event) {
    var target = event.target;
    if ( target.tagName.toLowerCase() == 'div' && target.classList.contains('page') ) {
      this._enableControlTabIndex(target);
    }
  }

  focus(page, invoke=false) {
    // page.setAttribute('accesskey', "9");
    if ( page === true || page === false ) {
      invoke = page;
      page = null;
    }
    if ( ! page ) {
      page = this.currentPage();
    }
    page.setAttribute('tabindex', '0');
    page.setAttribute('aria-hidden', false);

    // this._enableControlTabIndex(page);

    var page_controls = page.querySelectorAll('[tabindex="-1"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '0');
    }

    if ( invoke ){
      page.focus();
    }
  }

  unfocus(page) {
    page.setAttribute('tabindex', '-1');
    page.setAttribute('aria-hidden', true);
    if ( page == document.activeElement ) { page.blur(); }
    var page_controls = page.querySelectorAll('[tabindex="0"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '-1');
      // if ( page_controls[i] == document.activeElement ) { page_controls[i].blur(); }
    }
  }

  config() {
    // the empty set supports everything
    return {};
  }

  destroy() {
    this.emitter.events = {};

    if ( this._handlers.focus ) {
      this.container.removeEventListener('focusin', this._handlers.focus);
    }
    if ( this._handlers.resize ) {
      this._handlers.resize();
    }
    if ( this._handlers.rotate ) {
      this._handlers.rotate();
    }
    if ( this._handlers.clickHandler ) {
      this.container.removeEventListener('click', this._handlers.clickHandler);
    }

    clearInterval(this._intervals.unloader);
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this._destroy_page(pages[i]);
      this.container.removeChild(pages[i]);
    }
  }

  _destroy_page(page) {
    /* NOP */
  }

  _enableControlTabIndex(page) {
    var page_controls = page.querySelectorAll('[tabindex="-1"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '0');
    }
  }

  _resizePages() {
    this._scrollPause = true;
    var minWidth = this.minWidth();
    var maxHeight = this.maxHeight();

    var scale = this.scale;
    var currentSeq;
    if ( this._currentPage ) {
      currentSeq = this._currentPage.dataset.seq; // this.currentLocation();
    } else {
      currentSeq = this.currentLocation();
    }

    if ( maxHeight ) {
      // this.container.style.setProperty('--max-page-height', `${maxHeight * scale}px`);
      document.documentElement.style.setProperty('--max-page-height', `${maxHeight * scale}px`);
    }

    HT.log("__RESIZE__ start", currentSeq);

    var dirty = false;
    this.pages.forEach((page) => {

      var seq = parseInt(page.dataset.seq, 10);
      var meta = this.service.manifest.meta(seq);
      // var ratio = meta.height / meta.width;

      var h; var w;

      var img = page.querySelector('img');
      if ( ! img ) { return ; }

      var frame = page.querySelector('.image');

      var sizing = this._calculatePageSize(meta, page, minWidth, maxHeight);

      h = sizing.height;
      w = sizing.width;

      dirty = dirty || ( img.offsetHeight != h );

      requestAnimationFrame(() => {
        page.dataset.width = w;
        page.dataset.height = h;

        frame.style.width = `${sizing.frameWidth}px`;
        frame.style.height = `${sizing.frameHeight}px`;

        img.style.width = `${w}px`;
        img.style.height = `${h}px`;        
      })

      page.dataset.bestFit = ( scale <= 1 ) ? 'true' : 'false';
      if ( scale <= 1 ) {
        page.classList.add('page--best-fit');
      }

      // this._resizePageByPages(page);
    })

    if ( dirty ) {
      if ( this._redrawPageImagesTimer ) { clearTimeout(this._redrawPageImagesTimer); }
      this._redrawPageImagesTimer = setTimeout(() => {
        this.redrawPageImages();
        this.display(currentSeq);
        this._scrollPause = false;
        HT.log("__RESIZE__ end/dirty", currentSeq);
        this._adjustContainer();
      }, 100);
      return;
    }

    HT.log("__RESIZE__ end", currentSeq);

    this.display(currentSeq);
    this._scrollPause = false;
    this._adjustContainer();
  }

  _calculatePageSize(meta, page, minWidth, maxHeight) {
    var ratio = meta.ratio;
    var scale = this.scale;

    var h = Math.ceil(minWidth * ratio * scale);
    var w = Math.ceil(minWidth * scale);

    return { height: h, width: w, frameHeight: h, frameWidth: w, ratio: ratio };
  }

  _drawHighlights(page) {
    var self = this;

    // OK --- does this have a highlight?
    var img = page.querySelector('img');
    var image_frame = page.querySelector('.image');
    var page_text = page.querySelector('.page-text');

    var timestamp = (new Date).getTime();

    function parseCoords(value) {
      var values = value.split(' ')
      return values.map((v) => parseInt(v, 10));
    }

    var page_div = page_text.children[0];
    if ( ! page_div ) { return ; }

    var words = page_div.dataset.words;

    if ( words !== undefined ) { words = JSON.parse(words); }
    if ( HT.debug_words ) { words = HT.debug_words; }
    if ( ! words || ! words.length ) { return }

    var page_coords = parseCoords(page_div.dataset.coords);
    var word_regexes = {};
    words.forEach((word) => {
      var pattern;
      try {
        pattern = new RegExp(`(?<=^|\\P{L})(${word})(?=\\P{L}|$)`, 'ig');
      } catch (error) {
        pattern = new RegExp(`(?:^|\\s)${word}(?:$|\\s)`, 'ig');
      }
      word_regexes[word] = pattern;
    })

    if ( ! this._highlightIndexMap ) {
      this._highlightIndexMap = {};
      this._highlightIndex = 0;
    }

    var scaling = {};
    if ( this.format == 'image' ) {
      if ( img.hasAttribute('width') ) {
        scaling.width = parseInt(img.getAttribute('width'), 10); 
        scaling.height = parseInt(img.getAttribute('height'), 10);
      } else {
        scaling.width = img.width;
        scaling.height = img.height;
      }

      scaling.width = img.offsetWidth;
      scaling.height = img.offsetHeight;

      scaling.ratio = scaling.width / page_coords[2];
      scaling.ratioY = scaling.height / page_coords[3];
      scaling.padding = 0; // parseInt(window.getComputedStyle(page).marginTop) / 2;
      scaling.ratioZ = 1.0;
      scaling.ratio *= scaling.ratioZ;
    }

    function textNodesUnder(el){
      var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
      while(n=walk.nextNode()) a.push(n);
      return a;
    }

    var textNodes = textNodesUnder(page_div);
    textNodes.forEach(function(text) {
      var innerHTML = text.nodeValue.trim();
      if ( ! innerHTML ) { return; }

      var matched = false; var matchedWord = null;
      words.forEach(function(word) {
        // var pattern = new RegExp(`\\b(${word})\\b`, 'gi');
        // var pattern = new RegExp(`(?:^|\\s)${words[0]}(?:$|\\s)`, 'ig')
        // var pattern = new RegExp(`(?<=^|\\P{L})(${word})(?=\\P{L}|$)`, 'ig');
        var pattern = word_regexes[word];
        if ( innerHTML.match(pattern) ) {
          matched = true;
          matchedWord = word.toLowerCase();
        }
      })
      if ( ! matched ) { return ; }
      var span = text.parentNode;

      var highlight_idx = self._highlightIndexMap[matchedWord];
      if ( ! highlight_idx ) {
        self._highlightIndex += 1;
        if ( self._highlightIndex > 6 ) { self._highlightIndex = 1; }
        self._highlightIndexMap[matchedWord] = self._highlightIndex;
        highlight_idx = self._highlightIndexMap[matchedWord];
      }

      if ( self.format == 'image' ) {
        var coords = parseCoords(span.dataset.coords);
        coords[0] *= scaling.ratio;
        coords[2] *= scaling.ratio;
        coords[1] *= scaling.ratio;
        coords[3] *= scaling.ratio;

        var highlight_w0 = ( coords[2] - coords[0] );
        var highlight_h0 = ( coords[3] - coords[1] );
        var highlight_w = highlight_w0 * 1.25;
        var highlight_h = highlight_h0 * 1.25;

        var highlight = document.createElement('mark');
        highlight.classList.add('highlight');
        highlight.classList.add(`highlight_${highlight_idx}`);
        highlight.dataset.word = innerHTML;
        highlight.dataset.timestamp = timestamp;

        highlight.dataset.top = coords[1];
        highlight.dataset.padding = scaling.padding;

        highlight.style.width = `${highlight_w / scaling.width * 100.0}%`;
        highlight.style.height = `${highlight_h / scaling.height * 100.0}%`;
        highlight.style.top = `${( coords[1] - ( ( highlight_h - highlight_h0 ) / 2 ) ) / scaling.height * 100.0}%`;
        highlight.style.left = `${( coords[0] - ( ( highlight_w - highlight_w0 ) / 2 ) ) / scaling.width * 100.0}%`;
        image_frame.appendChild(highlight);

      } else {
        // span.classList.add('highlight--plaintext', `highlight_${highlight_idx}`);
        const mark = document.createElement('mark');
        mark.innerText = span.innerText;
        mark.setAttribute('class', span.getAttribute('class'));
        mark.dataset.class = mark.getAttribute('class');
        mark.classList.add('highlight--plaintext', `highlight_${highlight_idx}`);
        mark.dataset.coords = span.dataset.coords;
        span.parentElement.replaceChild(mark, span);
      }
    })
  }

  _removeHighlights(page) {
    if ( this.format == 'image' ) {
      var image_frame = page.querySelector('.image');
      var highlights = page.querySelectorAll('.highlight');
      var n = highlights.length;
      for(var i = 0; i < n; i++) {
        image_frame.removeChild(highlights[i]);
      }
      return n;
    } else {
      var highlights = page.querySelectorAll('.highlight--plaintext');
      // highlights.forEach((span) => {
      //   [ ...span.classList ].filter((cls) => cls.indexOf('highlight') > -1).forEach((cls) => {
      //     span.classList.remove(cls);
      //   })
      // })
      highlights.forEach((mark) => {
        const span = document.createElement('span');
        span.innerText = mark.innerText;
        span.setAttribute('class', mark.dataset.class);
        span.dataset.coords = mark.dataset.coords;
        mark.parentElement.replaceChild(span, mark);
      })
    }
  }

  resetHighlightIndex() {
    this._highlightIndexMap = {};
    this._highlightIndex = 0;
  }

  _resizePageByPages() {
    /* NOP */
  }

  _operating(options={}) {
    var possible = [...this.sets.visible].sort((a,b) => { return a - b});

    var options = Object.assign({ rootMargin: 0, percentage: 0.0 }, options);

    var visible = possible.filter((seq) => { return this.isVisible(this.getPage(seq), options)})
    return { possible: possible, visible: visible };
  }

  visibility(page, options={}) {
    return page.dataset.visible == 'true' ? 100 : 0;
  }

  isVisible(page, options={}) {

    options.percentage = options.percentage || 0;
    var percentage = this.visibility(page, options);

    return ( percentage >= options.percentage );
  }

  svg() {
    return simpleSvgPlaceholder.apply(null, arguments);
  }

  test(numPages) {
    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }

    var totalSeq = this.service.manifest.totalSeq;
    for(var i = 0; i < numPages; i++) {
      setTimeout(() => {
        var timeout = 100 + getRandomInt(100);
        var seq = getRandomInt(totalSeq);
        setTimeout(() => {
          console.log(seq, timeout);
          this.display(seq);
        }, timeout);
      }, 0);
    }
  }

}

