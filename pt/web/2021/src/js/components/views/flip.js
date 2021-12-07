import { createNanoEvents } from 'nanoevents';
import {Base} from './base';

import debounce from 'lodash/debounce';

export var Flip = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.name = '2up';
    this.displayLabel = 'flip page scans'; // 'two-page side-by-side';
    this.embedHtml = true;
    this.is_active = false;
    this.isRTL = this.service.manifest.options.readingOrder  == 'right-to-left';
    // this._checkForFoldouts = this.checkForFoldouts.bind(this);
    this._edges = {};
    this._layout = {};
    this.trackResize = true;
    this.isAnimating = false;
    this._queue = [];
  }

  _pageRatio(seq) {
    var ratio;
    var meta = this.service.manifest.meta(seq);
    if ( meta.width > meta.height ) {
      ratio = meta.height / meta.width;
    } else {
      ratio = meta.width / meta.height;
    }
    return ratio;
  }

  imageUrl(params) {
    var oprams = params;
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.height = element.offsetHeight;
    }

    if ( ! params.width && ! params.height ) {
      console.log("AHOY IMAGEURL PROBLEM", params, oprams);
    }

    return this.service.image(params);
  }

  _calculatePageSize(meta, page, minWidth, maxHeight) {

    var seq = page.dataset.seq;
    var manifest = this.service.manifest;

    if ( meta == null ) {
      meta = this.service.manifest.meta(seq);
    }
    if ( minWidth == null ) {
      minWidth = this.minWidth();
      maxHeight = this.maxHeight();
    }

    var ratio = meta.ratio;
    var scale = this.scale;

    var is_unusual = 
      ( ( meta.ratio < 1.0 ) && 
      ( 
        ( manifest.checkFeatures(seq, "FOLDOUT") && ! manifest.checkFeatures(seq, "BLANK") )
          || 
        ( ( meta.width / meta.height ) > ( 4 / 3 ) )
      ) );

    // calculate the image dimensions
    var h; var w; var frameHeight;
    if ( is_unusual ) {
      w = minWidth * scale;
      h = w * ratio;
      frameHeight = maxHeight * scale;

    } else {
      h = maxHeight * scale;
      w = h / ratio;
      frameHeight = h;
    }

    var sliceMax = this._sliceMax = this._slicify(this.service.manifest.totalSeq);
    var maxEdgeWidth = sliceMax * 0.25;

    var sliceFraction;
    var sliceIndex = parseInt(page.dataset.slice, 10);
    var frameWidth = w + maxEdgeWidth;

    if ( page.classList.contains('verso') ) {
      sliceFraction = sliceIndex / sliceMax;
    } else {
      sliceFraction = ( sliceMax - sliceIndex ) / sliceMax;
    }

    var frameWidth = w + ( maxEdgeWidth * sliceFraction );

    // console.log("--", seq, sliceIndex, sliceFraction, w + (sliceMax - sliceIndex) / sliceMax, w + ( sliceIndex / sliceMax ) );

    return { height: h, width: w, frameHeight: frameHeight, frameWidth: frameWidth };
  }

  render(cb) {
    if ( this.isRTL ) {
      this.container.classList.add('reading-order--rtl');
    }
    super.render(cb);
  }

  display(seq) {
    var self = this;

    seq = parseInt(seq, 10);

    if ( seq == this.currentSeq ) { return ; }
    if ( this.getPage(seq) && this.getPage(seq).dataset.visible == 'true' ) { return ; }

    var currentPages; var targetPages;
    if ( this.currentSeq ) {
      var currentSlice = this._slicify(this.currentSeq);
      // currentPages = this.container.querySelectorAll(`.page[data-slice="${currentSlice}"]`);
      currentPages = this.pages.filter((page) => page.dataset.slice == currentSlice);
    }

    // var targetPages = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    var targetSlice = this._slicify(seq);
    targetPages = this.pages.filter((page) => page.dataset.slice == targetSlice);
    if ( ! targetPages.length ) { return; }

    this.loadImage(Array.prototype.slice.call(targetPages));

    var delta = this.currentSeq < seq;
    this._queue.push([ this._slicify(seq), currentPages, targetPages, delta ]);

    this.currentSeq = seq;
    this.currentSlice = this._slicify(seq);

    this._processQueue();
  }

  _processQueue() {
    var self = this;

    if ( ! this._queue.length ) { return; }

    if ( this.isAnimating ) {
      HT.log("-- _processQueue: postponing", this._queue[0][0]);
      setTimeout(() => { this._processQueue() }, 100);
      return;
    }

    this.isAnimating = true;
    HT.log("-- _processQueue: processing", this._queue[0][0]);

    var tuple = this._queue.shift();
    var seq = tuple[0];
    var currentPages = tuple[1];
    var targetPages = tuple[2];

    var delta = tuple[3];

    // get the most up to date currentPages
    currentPages = this.pages.filter((page) => page.dataset.visible == 'true');
    targetPages.forEach((page) => { page.dataset.visible = true; })

    if ( ! currentPages || ! currentPages.length || ! this._initialized ) { 
      targetPages.forEach((page) => { self.focus(page); })
      self.reader.emit('relocated', { seq: self.currentSeq });
      self.isAnimating = false;
      return ; 
    }

    var inClass = delta > 0 ? 'page--flipToLeft' : 'page--flipToRight';
    var outClass = inClass;

    var endCurrentPage = false;
    var endTargetPage = false;

    var onEndAnimation = function(currentPages, targetPages) {
      endTargetPage = false;
      endCurrentPage = false;
      currentPages.forEach((page) => { 
        page.classList.remove(outClass); 
        if ( page.dataset.slice == self.currentSlice ) { return ; }
        page.dataset.visible = false; 
        self.unfocus(page);
      })      
      targetPages.forEach((page) => { page.dataset.visible = true; page.classList.remove(inClass); self.focus(page); })

      self.container.classList.remove('animating');
      self.isAnimating = false;

      self.reader.emit('relocated', { seq: self.currentSeq });
    }

    var outAnimationHandler = function(event) {
      currentPages.forEach((page) => { page.removeEventListener('animationend', outAnimationHandler); });
      endCurrentPage = true;
      if ( endTargetPage ) { onEndAnimation(currentPages, targetPages); }
    }
    var inAnimationHandler = function(event) {
      targetPages.forEach((page) => { page.removeEventListener('animationend', inAnimationHandler); });
      endTargetPage = true;
      if ( endCurrentPage ) { onEndAnimation(currentPages, targetPages); }      
    }

    if ( window.matchMedia('(prefers-reduced-motion)').matches ) {
      onEndAnimation(currentPages, targetPages);
    } else {
      this.container.classList.add('animating');
      currentPages.forEach((page) => { page.addEventListener('animationend', outAnimationHandler); });
      targetPages.forEach((page) => { page.addEventListener('animationend', inAnimationHandler); });

      if ( delta > 0 ) {
        if ( currentPages[1] ) { currentPages[1].classList.add(outClass); }
        else { endCurrentPage = true; }
        targetPages[0].classList.add(inClass);
      } else {
        currentPages[0].classList.add(outClass);
        if (targetPages[1]) { targetPages[1].classList.add(inClass); } 
        else { endTargetPage = true; }
      }      
    }

    this.visible(targetPages);
  }

  _maxSliceWidth() {
    var maxWidth = 0;
    for(var sliceIdx = 1; sliceIdx <= this._sliceMax; sliceIdx++) {
      // var pages = this.container.querySelectorAll(`.page[data-slice="${sliceIdx}"]`);
      var pages = this.pages.filter((page) => page.dataset.slice == sliceIdx);
      var width = pages[0].offsetWidth;
      if ( pages[1] ) { width += pages[1].offsetWidth; }
      if ( width > maxWidth ) {
        maxWidth = width;
      }
    }
    return maxWidth;
  }

  _adjustContainerWidth() {
    // return this.scale * 100;
    if ( this.format == 'plaintext' ) { return '100%'; }
    var maxWidth = this.container.parentNode.offsetWidth;
    var width = this._maxSliceWidth();
    if ( width * 1.25 > maxWidth ) { maxWidth = width * 1.25; }
    return `${maxWidth}px`;
  }

  _resizePages() {
    // if ( this.isAnimating ) {
    //   console.log("-- something something", this.currentSeq);

    // }
    super._resizePages();
  }

  _reframePage(image, page) {

    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.image');
      var img = frame.querySelector('img');

      var r = image.width / image.height;

      if ( this._checkForFoldouts(image, page) ) {
        // foldouts
        var w = img.offsetWidth; // frame.offsetWidth;
        var h = w / r;
        img.style.width = `${w}px`;
        img.style.height = `${h}px`;

        var altText = img.getAttribute('alt');
        if ( altText.indexOf('Foldout') < 0 ) {
          altText += '; Foldout';
          img.setAttribute('alt', altText);
        }

        if ( frame.querySelector('.page--backdrop') ) {

        } else {
          var backdrop = document.createElement('div');
          backdrop.classList.add('page--backdrop');
          backdrop.setAttribute('aria-hidden', 'true');
          backdrop.style.width = `${Math.ceil((w / frame.offsetWidth) * 100)}%`;
          // backdrop.style.backgroundColor = 'chartreuse';
          // backdrop.style.height = `${frame.offsetHeight}px`;
          frame.insertBefore(backdrop, img);
        }

      } else {
        // normal
        var newImageWidth = img.offsetHeight * r;
        var currentImageWidth = parseInt(img.style.width, 10);
        img.style.width = `${newImageWidth}px`;
        img.style.backgroundColor = 'chartreuse';

        var r2 = newImageWidth / currentImageWidth;
        frame.style.width = `${frame.offsetWidth * r2}px`;
      }

      page.dataset.reframed = 'true';
    }

  }


  currentLocation(side='DEFAULT') {
    // var slice = this.container.querySelector('.page[data-visible="true"]');
    var expr;
    switch(side) {
      case 'DEFAULT':
        expr = '.page[data-visible="true"][data-seq]'; // first match
        break;
      case 'VERSO':
        expr = '.page[data-visible="true"].verso';
        break;
      case 'RECTO':
        expr = '.page[data-visible="true"].recto';
    }
    var page = this.container.querySelector(expr);
    return page ? page.dataset.seq : null;
  }

  currentPage() {
    return this.getPage(this.currentSeq);
  }

  _calculateSeq(direction) {
    if ( this.isRTL ) { direction = -direction; }
    var delta;
    if ( direction > 0 ) {
      delta = ( this._hasFrontCover && this.currentSeq ) == 1 ? 1 : 2;
    } else {
      delta = -2;
    }
    var seq = this.currentSeq + delta;
    if ( seq <= 0 ) { seq = 1; }
    if ( seq > this.service.manifest.totalSeq ) { seq = this.service.manifest.totalSeq; }
    return seq;
  }

  next() {
    this.display(this._calculateSeq(1));
  }

  prev() {
    this.display(this._calculateSeq(-1));
  }

  first() {
    this.display(this.isRTL ? this.service.manifest.totalSeq : 1);
  }

  last() {
    this.display(this.isRTL ? 1 : this.service.manifest.totalSeq);
  }

  minWidth() {
    var minWidth = this.container.parentNode.offsetWidth;
    return this.minWidthNew();
  }

  maxHeight() {
    var h = this.container.parentNode.offsetHeight * 0.81;
    if ( h <= 360 ) { h = 360; }
    return h;
  }

  minWidthNew2() {
    var minWidth = this.container.parentNode.offsetWidth;
    var h = this.container.parentNode.offsetHeight;

  }

  minWidthNew() {
    var minWidth = this.container.parentNode.offsetWidth;
    // if ( minWidth < 680 && window.innerWidth >= 680 ) { minWidth = 680; }
    // else if ( window.innerWidth < 680 ) { minWidth = window.innerWidth * 0.95; }

    minWidth /= 2;
    minWidth *= 0.9;

    return minWidth;
  }

  _reframeUnusualImage(page) {
    // NOP
  }

  bindEvents() {
    var self = this;

    super.bindEvents();

    this.reader.on('redraw', (params) => {
      if ( params.scale ) {
        this.scale = params.scale;
      }
      this.reader.emit('resize');
    });
  }

  bindPageEvents(page) {
    page.parentElement.dataset.visible = false;
  }

  clickHandler(event) {

    super.clickHandler(event);

    var element = event.target;

    if ( element.closest('button') ) { return ; }

    if ( element.closest('img') || element.closest('.page--backdrop') ) {
      // click directly on the <img>
      element = element.closest('.page');
      return this._clickHandlerPage(element, event);
    }

    if ( element.closest('.image') ) {
      // clicked not on the <img> but the edge
      return this._clickHandlerEdge(element.closest('.image'), event) ;
    }
  }

  _clickHandlerPage(page, event) {
    if ( page.classList.contains('verso') ) {
      // navigating back
      this.isRTL ? this.next() : this.prev();
    } else {
      // navigating next
      this.isRTL ? this.prev() : this.next();
    }
  }

  _clickHandlerEdge(frame, event) {
    var offsetX = event.offsetX;
    var img = frame.querySelector('img');
    var page = frame.closest('.page');
    var edgeWidth = ( frame.offsetWidth - img.offsetWidth );

    var seq = parseInt(page.dataset.seq, 10);
    var totalSeq = this.service.manifest.totalSeq;
    var targetSeq;

    var pageSide;
    var offsetDelta;
    var offsetPercentage;

    if ( page.classList.contains('recto') ) {
      pageSide = 'recto';
      offsetDelta = this.isRTL ? 0 : img.offsetWidth;
      offsetPercentage = (offsetX - offsetDelta) / edgeWidth;
      if ( this.isRTL ) { offsetPercentage = 1.0 - offsetPercentage; }
      targetSeq = Math.ceil(( totalSeq - seq ) * offsetPercentage) + seq;
    } else {
      pageSide = 'verso';
      offsetDelta = this.isRTL ? img.offsetWidth : 0;
      offsetPercentage = (offsetX - offsetDelta) / edgeWidth;
      if (this.isRTL) { offsetPercentage = 1.0 - offsetPercentage; }
      targetSeq = Math.ceil(seq * offsetPercentage  );
    }
    // console.log("-- clickHandlerEdge", pageSide, offsetX, offsetDelta, offsetPercentage, `${(totalSeq - seq)} / ${seq}`, targetSeq);

    if ( targetSeq < 1 ) { targetSeq = 1; }
    else if ( targetSeq > totalSeq ) { targetSeq = totalSeq; }
    this.display(targetSeq);
  }

  // destroy() {
  //   super.destroy();
  //   this.container.removeEventListener('click', this._clickHandler);
  // }

  config() {
    var retval = super.config();
    retval.rotate = false;
    return retval;
  }

};
