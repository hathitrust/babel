import NanoEvents from 'nanoevents';
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

    var sliceMax = this._slicify(this.service.manifest.totalSeq);
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

    return { height: h, width: w, frameHeight: frameHeight, frameWidth: frameWidth };
  }

  _calculatePageSizeXX(meta, page, minWidth, maxHeight) {

    var seq = page.dataset.seq;

    if ( meta == null ) {
      meta = this.service.manifest.meta(seq);
    }
    if ( minWidth == null ) {
      minWidth = this.minWidth();
      maxHeight = this.maxHeight();
    }

    var ratio = meta.ratio;
    var scale = this.scale;

    var h = Math.ceil(Math.min(minWidth * ratio * scale, maxHeight * scale));
    var w = h / ratio;

    var containerWidth = this.container.offsetWidth / 2;
    var slice_index = parseInt(page.dataset.slice, 10);
    var slice_max = this._slicify(this.service.manifest.totalSeq);
    var slice_fraction;
    if ( page.classList.contains('verso') ) {
      slice_fraction = slice_index / slice_max;
    } else {
      slice_fraction = ( slice_max - slice_index ) / slice_max;
    }
    var edgeWidth = ( containerWidth - w ) * slice_fraction;

    var frameWidth = ( w + Math.max(edgeWidth, 0) );

    return { height: h, width: w, frameHeight: h, frameWidth: frameWidth };
  }

  _hide(seq) {
    this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`).forEach(function(page) {
      page.dataset.visible = false;
    });
  }

  _queue(seq) {
    var nodes = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    var possibles = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    this.loadImage(Array.prototype.slice.call(possibles));
    nodes.forEach(function(page) {
      page.dataset.visible = 'pending';
    });  
    return nodes;
  }

  render(cb) {
    if ( this.isRTL ) {
      this.container.classList.add('reading-order--rtl');
    }
    super.render(cb);
  }

  display(seq) {
    var self = this;

    if ( self.isAnimating ) { return ; }

    seq = parseInt(seq, 10);
    if ( seq == this.currentSeq ) { return ; }

    var currentPages = this.container.querySelectorAll('.page[data-visible="true"]');
    
    var slice_index = this._slicify(seq);
    var targetPages = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    if ( ! targetPages.length ) { return; }

    this.loadImage(Array.prototype.slice.call(targetPages));

    // really?
    var delta = this.currentSeq < seq;
    targetPages.forEach((page) => { page.dataset.visible = true; })
    this.currentSeq = seq;

    if ( ! currentPages.length ) { 
      targetPages.forEach((page) => { self.focus(page); })
      self.reader.emit('relocated', { seq: self.currentSeq });
      return ; 
    }

    // var inClass = delta > 0 ? 'page--flipFromRight' : 'page--flipFromLeft';
    // var outClass = delta > 0 ? 'page--flipToLeft' : 'page--flipToRight';
    var inClass = delta > 0 ? 'page--flipToLeft' : 'page--flipToRight';
    var otherClass = delta > 0 ? 'page--flippingToLeft' : 'page--flippingToRight';
    var outClass = inClass;

    // outClass = 'page--fade';

    var endCurrentPage = false;
    var endTargetPage = false;

    var onEndAnimation = function(currentPages, targetPages) {
      // console.log("-- onEndAnimation", currentPages, targetPages);
      endTargetPage = false;
      endCurrentPage = false;
      currentPages.forEach((page) => { page.dataset.visible = false; page.classList.remove(outClass, otherClass); self.unfocus(page) })      
      targetPages.forEach((page) => { page.classList.remove(inClass, otherClass); self.focus(page); })
      self.container.classList.remove('animating');
      self.isAnimating = false;



      self.reader.emit('relocated', { seq: self.currentSeq });
    }

    var outAnimationHandler = function(event) {
      currentPages.forEach((page) => { page.removeEventListener('animationend', outAnimationHandler); });
      endCurrentPage = true;
      // console.log("-- outAnimationHandler", endCurrentPage, endTargetPage);
      if ( endTargetPage ) { onEndAnimation(currentPages, targetPages); }
    }
    var inAnimationHandler = function(event) {
      targetPages.forEach((page) => { page.removeEventListener('animationend', inAnimationHandler); });
      endTargetPage = true;
      // console.log("-- inAnimationHandler", endCurrentPage, endTargetPage);
      if ( endCurrentPage ) { onEndAnimation(currentPages, targetPages); }      
    }

    this.container.classList.add('animating');
    currentPages.forEach((page) => { page.addEventListener('animationend', outAnimationHandler); });
    targetPages.forEach((page) => { page.addEventListener('animationend', inAnimationHandler); });

    // current.addEventListener('animationend', (event) => { console.log('-- current animationend') });
    // target.addEventListener('animationend', (event) => { console.log('-- target animationend') });

    // console.log("flip.display", seq, currentPages, targetPages);
    if ( delta > 0 ) {
      currentPages[1].classList.add(outClass);
      targetPages[0].classList.add(inClass);
    } else {
      currentPages[0].classList.add(outClass);
      targetPages[1].classList.add(inClass);
    }

    this.visible(targetPages);
  }

  _resizePages() {
    if ( this.isAnimating ) {
      console.log("-- something something", this.currentSeq);

    }
    super._resizePages();
  }

  displayNOANIMATION(seq) {
    var currentPages = this.container.querySelectorAll('.page[data-visible="true"]');
    if ( currentPages ) {
      currentPages.forEach((page) => {
        page.dataset.visible = false;
      })
    }

    // this._queue(seq);
    // this.container.dataset.animating = true;
    // this.container.dataset.transition = ( this.currentSeq < seq ) ? 'next' : 'previous';

    this.currentSeq = parseInt(seq, 10);

    var slice_index = this._slicify(seq);
    var possibles = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    console.log("--", seq, slice_index, possibles);
    this.loadImage(Array.prototype.slice.call(possibles));
    possibles.forEach(function(page) {
      page.dataset.visible = true;
    });

    this.visible(possibles);
    this.reader.emit('relocated', { seq: seq });
  }

  _reframePage(image, page) {

    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.image');
      var img = frame.querySelector('img');

      var r = image.width / image.height;

      // with view=2up we only care about reframing the *image*

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
          // DUH: this doesn't return an SVG _element_
          // var backdrop = this.svg({
          //   bgColor: '#eee',
          //   width: w,
          //   height: frame.offsetHeight,
          //   dataUri: false
          // });
          var backdrop = document.createElement('div');
          backdrop.classList.add('page--backdrop');
          backdrop.setAttribute('aria-hidden', 'true');
          backdrop.style.width = `${Math.ceil((w / frame.offsetWidth) * 100)}%`;
          // backdrop.style.backgroundColor = 'chartreuse';
          // backdrop.style.height = `${frame.offsetHeight}px`;
          frame.insertBefore(backdrop, img);
        }


        // var backdrop = new Image();
        // backdrop.src = '/imgsrv/graphics/1x1b.png';
        // backdrop.classList.add('page--backdrop');
        // backdrop.style.width = img.style.width;
        // backdrop.setAttribute('aria-hidden', 'true');
        // backdrop.setAttribute('alt', '');
        // frame.insertBefore(backdrop, img);

      } else {
        // normal
        var w = img.offsetHeight * r;
        img.style.width = `${w}px`;
        img.style.backgroundColor = 'chartreuse';
      }

      page.dataset.reframed = 'true';
      console.log("-- _reframePage", page.dataset.seq, img.style.width, img.style.height);
    }

  }

  _reframePageXX(image, page) {
    return; 

    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.image');
      var img = frame.querySelector('img');

      var frameHeight = frame.offsetHeight;
      var frameWidth = this.minWidth() * this.scale; // this.container.offsetWidth / 2;

      var r = frameHeight / image.height;


      if ( false && this._checkForFoldouts(image, page) ) {
        // do something different
        r = image.width / image.height;
        img.style.width = `${frameWidth * 0.9}px`;
        img.style.height = `${( frameWidth * 0.9 ) / r}px`;

        // // this results in a shorter frame but will be consistent
        // frameHeight = img.offsetHeight;
        // frame.style.height = `${frameHeight}px`;

        var backdrop = new Image();
        backdrop.src = '/imgsrv/graphics/1x1b.png';
        backdrop.classList.add('page--backdrop');
        backdrop.style.width = img.style.width;
        frame.appendChild(backdrop);

      } else {

        var w = image.width * r;
        var h = frameHeight;
        if ( w > this.minWidth() * this.scale ) {
          r = ( this.minWidth() * this.scale * 0.9 ) / w;
          w = this.minWidth() * this.scale * 0.9;
          frameHeight *= r;
        }

        img.style.height = `${frameHeight}px`;
        img.style.width = `${w}px`;
        frame.style.height = img.style.height;
      }
      
      // change the width to match how much padding we have
      var slice_index = parseInt(page.dataset.slice, 10);
      var slice_max = this._slicify(this.service.manifest.totalSeq);
      var slice_fraction;
      if ( page.classList.contains('verso') ) {
        slice_fraction = slice_index / slice_max;
      } else {
        slice_fraction = ( slice_max - slice_index ) / slice_max;
      }
      var edge_width = ( frameWidth - img.offsetWidth ) * slice_fraction;

      img.dataset.width = image.width * r;
      img.dataset.height = frameHeight;
      img.dataset.scale = this.scale;

      frame.style.width = `${img.offsetWidth + edge_width}px`;

      page.dataset.reframed = 'true';
      console.log("-- _reframePage", page.dataset.seq, edge_width, slice_fraction, img.clientWidth, frameWidth * slice_fraction, img.clientWidth + ( frameWidth * slice_fraction ));
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
    // var page = slice.querySelector(expr);
    var page = this.container.querySelector(expr);
    return page ? page.dataset.seq : null;
  }

  currentPage() {
    // return this.container.querySelector('.page[data-visible="true"]');
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

  minWidthOld() {
    if ( ! this._max ) {
      var max = null;
      for(var seq = 1; seq < this.service.manifest.totalSeq; seq++) {
        var meta = this.service.manifest.meta(seq);
        if ( max === null || meta.width > max.width ) {
          max = meta;
        }
      }
      this._max = max;
    }

    var w = this.container.parentNode.offsetWidth;
    var h = this.container.parentNode.offsetHeight;

    var r = h / this._max.height;
    var ideal_w = ( this._max.width * r * 1 );
    if ( ideal_w < w ) { this._minWidth = w; }
    else if ( ideal_w / w < 1.125 ) { this._minWidth = w; }
    else { this._minWidth = ideal_w; }

    return this._minWidth;
  }

  _reframeUnusualImage(page) {
    // NOP
  }

  bindEvents() {
    var self = this;

    super.bindEvents();

    this._clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._clickHandler);

    this.reader.on('redraw', (params) => {
      if ( params.scale ) {
        this.scale = params.scale;
      }
      this.reader.emit('resize');
    });

    // this._handlers.resize = this.reader.on('resize', () => {

    //   // this._updateLayout();

    //   // this.slices.forEach((datum) => {
    //   //   this._updateLayoutSlice(datum);
    //   // });

    //   // this._updateLayoutEdges();

    //   // this.slices.forEach((datum) => {
    //   //   this._updateLayoutSliceSize(datum);
    //   // });

    //   // if ( this._redrawPageImagesTimer ) { clearTimeout(this._redrawPageImagesTimer); }
    //   // this._redrawPageImagesTimer = setTimeout(() => {
    //   //   this.redrawPageImages();
    //   // }, 100);

    // })

    // })
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
      this.prev();
    } else {
      // navigating next
      this.next();
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

    // TEST WITH RTL
    if ( page.classList.contains('recto') ) {
      targetSeq = Math.ceil(( totalSeq - seq ) * ( ( offsetX - img.offsetWidth ) / edgeWidth )) + seq;
    } else {
      targetSeq = Math.ceil(seq * ( offsetX / edgeWidth ) );
    }
    // console.log("_clickHandlerEdge", seq, offsetX, page.classList.contains('recto'), targetSeq);
    if ( targetSeq < 1 ) { targetSeq = 1; }
    else if ( targetSeq > totalSeq ) { targetSeq = totalSeq; }
    this.display(targetSeq);
  }

  destroy() {
    super.destroy();
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.container.removeChild(pages[i]);
    }
    this.container.removeEventListener('click', this._clickHandler);
    this._handlers.resize();

  }

  config() {
    var retval = super.config();
    retval.rotate = false;
    return retval;
  }

};
