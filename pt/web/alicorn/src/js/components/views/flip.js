import NanoEvents from 'nanoevents';
import {Base} from './base';

import debounce from 'lodash/debounce';

export var Flip = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.name = '2up';
    this.embedHtml = true;
    this.is_active = false;
    this.isRTL = this.service.manifest.options.readingOrder  == 'right-to-left';
    this._checkForFoldouts = this.checkForFoldouts.bind(this);
    this._edges = {};
    this._layout = {};
    this.trackResize = false;

    this.setupSlices();
  }

  setupSlices() {
    var totalSeq = this.service.manifest.totalSeq;
    var num_slices = Math.ceil((this.service.manifest.totalSeq - 2) / 2) + 2;
    this.seq2slice = {};
    this.slices = [];

    var startSeq = 1;
    var endSeq = this.service.manifest.totalSeq;

    if ( this.service.manifest.checkFeatures(1, "FRONT_COVER") || ( this.service.manifest.checkFeatures(1, "COVER") && this.service.manifest.checkFeatures(1, "RIGHT") ) || this.service.manifest.checkFeatures(1, "COVER") || ! this.service.manifest.checkFeatures(1) ) {
        // first page is a cover
        this.slices.push([ { seq: null }, {seq: 1 }]);
        startSeq = 2;
    }
    var lastSlice;
    if ( this.service.manifest.checkFeatures(endSeq, "BACK_COVER") || ( this.service.manifest.checkFeatures(endSeq, "COVER") && this.service.manifest.checkFeatures(endSeq, "LEFT") ) ) {
        lastSlice = [ { seq: endSeq }, { seq: null } ];
        endSeq -= 1;
    }

    for(var seq = startSeq; seq <= endSeq; seq += 2) {
      var next_seq = seq + 1;
      if ( next_seq > this.service.manifest.totalSeq ) {
        next_seq = null;
      }
      this.slices.push([ {seq: seq }, { seq: next_seq } ]);
    }

    if ( lastSlice ) {
      this.slices.push(lastSlice);
    }

    if ( this.isRTL ) {
      this.slices.reverse();
    }

    this.slices.forEach((tuple, slice_idx) => {
      if ( this.isRTL ) { tuple.reverse(); }
      tuple.forEach((slice) => {
        if ( slice.seq !== null ) {
          this.seq2slice[slice.seq] = slice_idx;
        }
      })
    })
  }

  render(cb) {
    var slices = this.slices;

    this._updateLayout();
    
    // this.container.style.display = 'none';

    var fragment = document.createDocumentFragment();

    slices.forEach((datum, slice_idx) => {
      var slice = this._buildSlice(datum, slice_idx);
      fragment.appendChild(slice);
      datum.slice = slice;
      this._updateLayoutSlice(datum);
    })

    this._updateLayoutEdges();

    this.container.appendChild(fragment);
    // this.container.style.display = 'block';

    this.is_active = true;
    this.loadSlice(this.container.querySelector('.slice'));
    if ( cb ) {
      cb();
    }
  }

  _updateLayout() {
    this._layout.minWidth = this.minWidth() / 2;
    this._layout.maxHeight = this.container.parentNode.offsetHeight * 0.95;
    this._layout.offsetWidth = this.minWidth();
    this._layout.pageHeight = this._layout.maxHeight * this.scale;
    this._layout.edgeHeight = this._layout.pageHeight * 0.98;
    this._layout.sliceWidth = this._layout.offsetWidth * this.scale;

    this.container.style.setProperty('--page-height', `${this._layout.pageHeight}px`);
    this.container.style.setProperty('--slice-width', `${this._layout.sliceWidth}px`);

    this._layout.maxEdgeWidth = 0;
    this._layout.maxSliceWidth = 0;
  }

  _updateLayoutSlice(datum) {
    var slice, edge, page, slice_width;
    slice = datum.slice;
    edge = slice.querySelector('.edge.verso');
    edge.style.height = `${this._layout.edgeHeight}px`;

    page = slice.querySelector('.page.verso');
    page.style.height = `${this._layout.pageHeight}px`;
    page.style.width = `${this._layout.pageHeight * datum[0].ratio}px`;
    slice_width = this._layout.pageHeight * datum[0].ratio;

    edge = slice.querySelector('.edge.recto');
    edge.style.height = `${this._layout.edgeHeight}px`;

    page = slice.querySelector('.page.recto');
    page.style.height = `${this._layout.pageHeight}px`;
    page.style.width = `${this._layout.pageHeight * datum[1].ratio}px`;
    slice_width += this._layout.pageHeight * datum[1].ratio;

    if ( slice_width > this._layout.maxSliceWidth ) {
      this._layout.maxSliceWidth = slice_width;
    }
  }

  _updateLayoutEdges() {
    var max_edge_width = Math.abs(( ( this._layout.offsetWidth - ( this._layout.maxSliceWidth / this.scale ) ) * 0.85 ) / 2);
    var page_factor = 10;
    var edge_width = 3 * Math.ceil(this.service.manifest.totalSeq / page_factor);
    if ( edge_width > max_edge_width ) { edge_width = max_edge_width; }

    this.slices.forEach((datum) => {
      var slice = datum.slice;
      slice.querySelector('.edge.verso').style.width = `${edge_width * datum[0].edgeFraction}px`;
      slice.querySelector('.edge.recto').style.width = `${edge_width * datum[1].edgeFraction}px`;
    })
  }

  renderXX(cb) {
    var minWidth = this.minWidth();
    minWidth /= 2;

    var maxHeight = this.container.offsetHeight * 0.95;
    var pageHeight = maxHeight * this.scale;
    var offsetWidth = this.container.offsetWidth;
    var sliceWidth = offsetWidth * this.scale;
    this.container.style.setProperty('--page-height', `${maxHeight * this.scale}px`);
    this.container.style.setProperty('--slice-width', `${offsetWidth * this.scale}px`);

    var max_edge_width = 0;
    var max_slice_width = 0;

    var scale = this.scale;

    // group into pages
    var slices = this.slices;

    var slices_indexes = [];
    for(var slice_idx = 0; slice_idx < slices.length; slice_idx++) {
      slices_indexes.push(slice_idx);
    }
    
    // this.container.style.display = 'none';

    var fragment = document.createDocumentFragment();

    slices.forEach((datum, slice_idx) => {
      var slice = this._buildSlice(datum, slice_idx);
      fragment.appendChild(slice);
      datum.slice = slice;
      this._updateLayoutSlice(slice);
    })

    for(var j = 0; j < slices_indexes.length; j++ ) {
      var slice_idx = slices_indexes[j];
      var tuple = slices[slice_idx];
      this._edges[slice_idx] = { recto: {}, verso: {} };

      var slice = document.createElement('div');
      slice.classList.add('slice');
      slice.style.width = `${sliceWidth}px`;

      var edge = document.createElement('div');
      edge.classList.add('edge', 'verso');
      this._edges[slice_idx].verso.fraction = slice_idx / slices.length;
      edge.style.setProperty('--fraction', this._edges[slice_idx]);
      edge.style.height = `${pageHeight * 0.98}px`;
      slice.appendChild(edge);

      var page = document.createElement('div');
      page.classList.add('page', 'verso');

      var seq;
      var slice_width = 0;
      var slice_height = 0;
      if ( tuple[0] ) {
        seq = tuple[0];
        var meta = this.service.manifest.meta(tuple[0]);

        var ratio;
        if ( meta.width > meta.height ) {
          ratio = meta.height / meta.width;
          page.style.setProperty('--page-ratio', meta.height / meta.width );
        } else {
          ratio = meta.width / meta.height;
          page.style.setProperty('--page-ratio', meta.width / meta.height);
        }
        page.style.height = `${pageHeight}px`;
        page.style.width = `${pageHeight * ratio}px`;

        slice_height = maxHeight * scale;
        slice_width = maxHeight * scale / ratio;

        page.dataset.bestFit = ( scale <= 1 ); page.classList.toggle('page--best-fit', ( scale <= 1 ));

        page.dataset.seq = seq;
        page.setAttribute('tabindex', -1);

        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;

      } else {
        var meta = this.service.manifest.meta(1);
        var ratio;
        if ( meta.width > meta.height ) {
          ratio = meta.height / meta.width;
          page.style.setProperty('--page-ratio', meta.height / meta.width );
        } else {
          ratio = meta.width / meta.height;
          page.style.setProperty('--page-ratio', meta.width / meta.height);
        }

        page.style.height = `${pageHeight}px`;
        page.style.width = `${pageHeight * ratio}px`;

        page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;
        slice_width = maxHeight * scale / ratio;
      }
      slice.appendChild(page);
      this._slices.push(slice);

      page = document.createElement('div');
      page.classList.add('page');
      page.classList.add('recto');
      if ( tuple[1] ) {
        seq = tuple[1];
        var meta = this.service.manifest.meta(tuple[1]);
        page.style.setProperty('--page-ratio', meta.width / meta.height);

        var ratio;
        if ( meta.width > meta.height ) {
          ratio = meta.height / meta.width;
          page.style.setProperty('--page-ratio', meta.height / meta.width );
        } else {
          ratio = meta.width / meta.height;
          page.style.setProperty('--page-ratio', meta.width / meta.height);
        }
        page.style.height = `${pageHeight}px`;
        page.style.width = `${pageHeight * ratio}px`;

        page.dataset.bestFit = ( scale <= 1 ); page.classList.toggle('page--best-fit', ( scale <= 1 ));

        slice_height = slice_height || ( maxHeight * scale );
        slice_width += ( maxHeight * scale / ratio );

        page.dataset.seq = seq;
        page.setAttribute('tabindex', 0);

        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
        slice.appendChild(page);
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio;
        if ( meta.width > meta.height ) {
          ratio = meta.height / meta.width;
          page.style.setProperty('--page-ratio', meta.height / meta.width );
        } else {
          ratio = meta.width / meta.height;
          page.style.setProperty('--page-ratio', meta.width / meta.height);
        }

        page.style.height = `${pageHeight}px`;
        page.style.width = `${pageHeight * ratio}px`;

        page.style.height = `${pageHeight}px`;
        page.style.width = `${pageHeight * ratio}px`;

        slice_width += ( maxHeight * scale / ratio );

        page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;
      }
      slice.appendChild(page);

      if ( this.scale > 1.0 ) {
        // slice.style.height = `${slice_height}px`;
        // slice.style.width = `${slice_width * 1.2}px`;
        // slice.style.width = `${this.`
      }

      if ( max_slice_width < slice_width ) {
        max_slice_width = slice_width;
      }

      edge = document.createElement('div');
      edge.classList.add('edge', 'recto');
      edge.style.setProperty('--fraction', (( slices.length - slice_idx ) / slices.length));
      edge.style.height = `${pageHeight * 0.98}px`;
      this._edges[slice_idx].recto.fraction = (( slices.length - slice_idx ) / slices.length);

      // edge.style.width = `${(( slices.length - slice_idx ) / slices.length) * max_edge_width}px`;
      // edge.style.height = `${slice_height * 0.95}px`; // this is complicated

      slice.appendChild(edge);
      // slice.querySelector('.edge.verso').style.height = edge.style.height;

      slice.dataset.visible = false; slice.classList.remove('slice--visible');
      slice.dataset.slice = slice_idx;

      // this.container.appendChild(slice);
      fragment.appendChild(slice);
    }

    var max_edge_width = Math.abs(( ( offsetWidth - ( max_slice_width / this.scale ) ) * 0.85 ) / 2);
    var page_factor = 10;
    var edge_width = 3 * Math.ceil(this.service.manifest.totalSeq / page_factor);
    if ( edge_width > max_edge_width ) { edge_width = max_edge_width; }

    // var slices__ = fragment.querySelectorAll('.slice');
    for(var i = 0; i < this._slices.length; i++) {
      var slice = this._slices[i];
      var edgedata = this._edges[i];
      slice.querySelector('.edge.verso').style.width = `${edge_width * edgedata.verso.fraction}px`;
      slice.querySelector('.edge.recto').style.width = `${edge_width * edgedata.recto.fraction}px`;
    }

    this.container.appendChild(fragment);
    this.container.style.setProperty('--edge-width', `${edge_width}px`);
    // this.container.style.display = 'block';

    this.is_active = true;
    this.loadSlice(this.container.querySelector('.slice'));
    if ( cb ) {
      cb();
    }
  }

  _buildSlice(datum, slice_idx) {
    var edge, page, slice;

    slice = document.createElement('div');
    slice.classList.add('slice');

    datum[0].edgeFraction = slice_idx / this.slices.length;
    edge = this._buildEdge('verso', datum[0].edgeFraction);
    slice.appendChild(edge);
    page = this._buildPage('verso', datum[0]);
    slice.appendChild(page);

    datum[1].edgeFraction = ( this.slices.length - slice_idx ) / this.slices.length;
    page = this._buildPage('recto', datum[1]);
    slice.appendChild(page);
    edge = this._buildEdge('recto', datum[1].edgeFraction);
    slice.appendChild(edge);

    slice.dataset.visible = false; slice.classList.remove('slice--visible');
    slice.dataset.slice = slice_idx;

    return slice;
  }

  _buildEdge(side, fraction) {
    var div = document.createElement('div');
    div.classList.add('edge', side);
    div.style.setProperty('--fraction', fraction);
    return div;
  }

  _buildPage(side, datum) {
    if ( datum.seq === null ) {
      return this._buildNull(side, datum);
    }

    var page = document.createElement('page');
    page.classList.add('page', side);
    var seq = datum.seq;

    datum.ratio = this._pageRatio(datum.seq);
    page.style.setProperty('--page-ratio', datum.ratio);

    page.dataset.seq = seq;
    page.setAttribute('tabindex', 0);

    page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
    return page;
  }

  _buildNull(side, datum) {
    var page = document.createElement('page');
    page.classList.add('page', side);
    datum.ratio = this._pageRatio(1);
    page.style.setProperty('--page-ratio', datum.ratio);
    page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;

    return page;
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
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.height = element.offsetHeight;
    }
    return this.service.image(params);
  }

  loadSlice(slice) {
    var pages = slice.querySelectorAll('.page[data-seq]');
    for(var i = 0; i < pages.length; i++) {
      this.loadImage(pages[i], { check_scroll: true, callback: this._checkForFoldouts });
    }
    slice.dataset.visible = true; slice.classList.add('slice--visible');
  }

  unloadSlice(slice) {

  }

  resizePage(page) {
  }

  display(seq) {
    seq = parseInt(seq, 10);
    var current = this.container.querySelector(`.slice[data-visible="true"]`);
    var slice_idx = this.seq2slice[seq];
    var target = this.container.querySelector(`.slice[data-slice="${slice_idx}"]`);
    // var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }

    if ( current ) {
      // current.dataset.visible = false; current.classList.remove('slice--visible');
      this._invisible(current);
      setTimeout(function() {
        this.unloadSlice(current);
      }.bind(this))
    }

    this._visible(target);

    this.loadSlice(target);
    // this.loadImage(target, true);
    this.reader.emit('relocated', { seq: this.slice2seq(slice_idx) });
    this.currentSeq = seq;
  }

  _visible(target) {
    target.dataset.visible = true; target.classList.add('slice--visible');
    var pages = target.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      pages[i].classList.add('page--visible');
    }
  }

  _invisible(target) {
    target.dataset.visible = false; target.classList.remove('slice--visible');
    var pages = target.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('page--visible');
    }
  }

  slice2seq(slice_idx) {
    var tuple = this.slices[slice_idx];
    if ( tuple[0] ) { return tuple[0].seq; }
    return tuple[1].seq;
  }

  currentLocation() {
    var slice = this.container.querySelector('.slice[data-visible="true"]');
    var page = slice.querySelector('.page[data-seq]');
    return page.dataset.seq;
  }

  currentPage() {
    var slice = this.container.querySelector('.slice[data-visible="true"]');
    var page = slice.querySelector('.page[data-seq]');
    return page;
  }

  _calculateSeq(direction) {
    if ( this.isRTL ) { direction = -direction; }
    var delta;
    if ( direction > 0 ) {
      delta = this.currentSeq == 1 ? 1 : 2;
    } else {
      delta = -2;
    }
    var seq = this.currentSeq + delta;
    if ( seq <= 0 ) { seq = 1; }
    if ( seq > this.service.manifest.totalSeq ) { seq = this.service.manifest.totalSeq; }
    return seq;
  }

  next() {
    this.container.scrollTop = 0;
    this.display(this._calculateSeq(1));
  }

  prev() {
    this.container.scrollTop = 0;
    this.display(this._calculateSeq(-1));
  }

  first() {
    this.display(this.isRTL ? this.service.manifest.totalSeq : 1);
  }

  last() {
    this.display(this.isRTL ? 1 : this.service.manifest.totalSeq);
  }

  minWidth() {
    return this.container.parentNode.offsetWidth;
  }

  preloadImages(page) {
    var seq = parseInt(page.dataset.seq, 10);
    var delta = 1;
    while ( delta <= 2 ) {
      var prev_page = this.container.querySelector(`.page[data-seq="${seq - delta}"]`);
      if ( prev_page ) {
        prev_page.dataset.preloaded = true;
        this.loadImage(prev_page, { check_scroll: true, callback: this._checkForFoldouts });
      }
      delta += 1;
    }
    delta = 1;
    while ( delta <= 2 ) {
      var next_page = this.container.querySelector(`.page[data-seq="${seq + delta}"]`);
      if ( next_page ) {
        next_page.dataset.preloaded = true;
        this.loadImage(next_page, { check_scroll: true, callback: this._checkForFoldouts });
      }
      delta += 1;
    }
  }

  bindEvents() {
    var self = this;

    super.bindEvents();

    this._clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._clickHandler);

    this._handlers.resize = this.reader.on('resize', () => {

      this._updateLayout();

      this.slices.forEach((datum) => {
        this._updateLayoutSlice(datum);
      });

      this._updateLayoutEdges();
    })
  }

  bindPageEvents(page) {
    page.parentElement.dataset.visible = false;
  }

  clickHandler(event) {
    var element = event.target;
    if ( element.classList.contains('edge') ) {
      return this._clickHandlerEdge(element, event);
    }
    if ( element.tagName.toLowerCase() == 'button' ) {
      if ( element.classList.contains('action-view-foldout') ) {
        event.preventDefault();
        event.stopPropagation();
        var page = element.closest('.page');
        var img = page.querySelector('img.foldout');
        var new_img = `<div><img src="${img.src}" height="${img.dataset.height}" width="${img.dataset.width}" /></div>`;
        bootbox.dialog(new_img,
          [{ label: 'Close', class: 'btn-dismiss' }],
          {
            lightbox: true,
            header: `View page scan ${page.dataset.seq} foldout`,
            width: img.dataset.width,
            height: img.dataset.height
          }
        );
      }
    } else {
      // check that this is a page
      element = element.closest('.page');
      if ( element ) {
        return this._clickHandlerPage(element, event);
      }
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

  _clickHandlerEdge(edge, event) {
    var offsetX = event.offsetX;
    var edge_width = edge.offsetWidth;
    var totalSeq = this.service.manifest.totalSeq;
    var target_slice; var target_seq;
    if ( edge.classList.contains('recto') ) {
      // recto edge
      var page = edge.parentElement.querySelector('.page.recto');
      var seq = parseInt(page.dataset.seq, 10);
      target_seq = Math.ceil(seq + ( totalSeq - seq ) * ( offsetX / edge_width ));
      if ( target_seq > totalSeq ) { target_seq = totalSeq; }
    } else {
      // verso edge
      var page = edge.parentElement.querySelector('.page.verso');
      var seq = parseInt(page.dataset.seq, 10);
      target_seq = Math.ceil(seq - ( seq ) * ( ( edge_width - offsetX ) / edge_width ));
      if ( target_seq < 1 ) { target_seq = 1; }
    }
    // console.log("AHOY AHOY flip.click edge", event.target, offsetX, seq, target_seq, ( edge_width - offsetX ) / edge_width);
    this.display(target_seq);
  }

  checkForFoldouts(img) {
    if ( img.classList.contains('foldout') ) {
      var page = img.parentElement;
      var button = document.createElement('button');
      button.classList.add('btn', 'btn-mini', 'action-view-foldout');
      button.innerText = 'View Foldout';
      button.dataset.seq = page.dataset.seq;
      page.appendChild(button);
    }
  }

  destroy() {
    super.destroy();
    var pages = this.container.querySelectorAll('.slice');
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
