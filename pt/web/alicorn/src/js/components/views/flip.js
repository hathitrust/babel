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
        this.slices.push([ null, 1 ]);
        startSeq = 2;
    }
    var lastSlice;
    if ( this.service.manifest.checkFeatures(endSeq, "BACK_COVER") || ( this.service.manifest.checkFeatures(endSeq, "COVER") && this.service.manifest.checkFeatures(endSeq, "LEFT") ) ) {
        lastSlice = [ end_seq, null ];
        endSeq -= 1;
    }

    for(var seq = startSeq; seq <= endSeq; seq += 2) {
      var next_seq = seq + 1;
      if ( next_seq > this.service.manifest.totalSeq ) {
        next_seq = null;
      }
      this.slices.push([ seq, next_seq ]);
    }

    if ( lastSlice ) {
      this.slices.push(lastSlice);
    }

    if ( this.isRTL ) {
      this.slices.reverse();
    }

    this.slices.forEach((tuple, slice_idx) => {
      if ( this.isRTL ) { tuple.reverse(); }
      tuple.forEach((seq) => {
        if ( seq !== null ) {
          this.seq2slice[seq] = slice_idx;
        }
      })
    })
  }

  render(cb) {
    var minWidth = this.minWidth();
    minWidth /= 2;

    // return;

    var maxHeight = this.container.offsetHeight * 0.95;
    console.log("AHOY AHOY", maxHeight);
    this.container.style.setProperty('--page-height', `${maxHeight * this.scale}px`);
    this.container.style.setProperty('--slice-width', `${this.container.offsetWidth * this.scale}px`);

    var max_edge_width = 0;
    var max_slice_width = 0;

    var scale = this.scale;

    // group into pages
    var slices = this.slices;

    var slices_indexes = [];
    for(var slice_idx = 0; slice_idx < slices.length; slice_idx++) {
      slices_indexes.push(slice_idx);
    }
    // if ( this.isRTL ) { slices_indexes.reverse(); }

    for(var j = 0; j < slices_indexes.length; j++ ) {
      var slice_idx = slices_indexes[j];
      var tuple = slices[slice_idx];

      var slice = document.createElement('div');
      slice.classList.add('slice');

      var edge = document.createElement('div');
      edge.classList.add('edge', 'verso');
      edge.style.setProperty('--fraction', slice_idx / slices.length);
      // edge.style.width = `${(slice_idx / slices.length) * max_edge_width}px`;
      slice.appendChild(edge);

      var page = document.createElement('div');
      page.classList.add('page');
      page.classList.add('verso');

      var seq;
      var slice_width = 0;
      var slice_height = 0;
      if ( tuple[0] ) {
        seq = tuple[0];
        var meta = this.service.manifest.meta(tuple[0]);
        var ratio = meta.height / meta.width;
        // page.style.height = `${minWidth * ratio * scale}px`;
        // page.style.width = `${minWidth * scale}px`;

        if ( meta.width > meta.height ) {
          var r = minWidth / meta.width;
          page.style.setProperty('--page-ratio', meta.height / meta.width );
        } else {
          page.style.setProperty('--page-ratio', meta.width / meta.height);
        }
        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;

        slice_height = maxHeight * scale;
        slice_width = maxHeight * scale / ratio;

        page.dataset.bestFit = ( scale <= 1 );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;
        page.style.setProperty('--page-ratio', meta.width / meta.height);

        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;

        page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;
        slice_width = maxHeight * scale / ratio;
      }
      slice.appendChild(page);

      page = document.createElement('div');
      page.classList.add('page');
      page.classList.add('recto');
      if ( tuple[1] ) {
        seq = tuple[1];
        var meta = this.service.manifest.meta(tuple[1]);
        var ratio = meta.height / meta.width;
        // page.style.height = `${minWidth * ratio * scale}px`;
        // page.style.width = `${minWidth * scale}px`;

        page.style.setProperty('--page-ratio', meta.width / meta.height);

        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;
        page.dataset.bestFit = ( scale <= 1 );

        slice_height = slice_height || ( maxHeight * scale );
        slice_width += ( maxHeight * scale / ratio );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
        slice.appendChild(page);
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;

        page.style.setProperty('--page-ratio', meta.width / meta.height);

        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;

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

      // edge.style.width = `${(( slices.length - slice_idx ) / slices.length) * max_edge_width}px`;
      // edge.style.height = `${slice_height * 0.95}px`; // this is complicated

      slice.appendChild(edge);
      // slice.querySelector('.edge.verso').style.height = edge.style.height;

      slice.dataset.visible = false;
      slice.dataset.slice = slice_idx;

      this.container.appendChild(slice);
    }

    var max_edge_width = ( ( this.container.offsetWidth - ( max_slice_width / this.scale ) ) * 0.85 ) / 2;
    var page_factor = 10;
    var edge_width = 3 * Math.ceil(this.service.manifest.totalSeq / page_factor);
    if ( edge_width > max_edge_width ) { edge_width = max_edge_width; }
    this.container.style.setProperty('--edge-width', `${edge_width}px`);

    this.is_active = true;
    this.loadSlice(this.container.querySelector('.slice'));
    if ( cb ) {
      cb();
    }

    console.log("AHOY AHOY RENDER", this.container.offsetHeight);
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
    slice.dataset.visible = true;
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
      current.dataset.visible = false;
      setTimeout(function() {
        this.unloadSlice(current);
      }.bind(this))
    }

    target.dataset.visible = true;
    this.loadSlice(target);
    // this.loadImage(target, true);
    this.reader.emit('relocated', { seq: this.slice2seq(slice_idx) });
    this.currentSeq = seq;
  }

  slice2seq(slice_idx) {
    var tuple = this.slices[slice_idx];
    if ( tuple[0] ) { return tuple[0]; }
    return tuple[1];
  }

  currentLocation() {
    var slice = this.container.querySelector('.slice[data-visible="true"]');
    var page = slice.querySelector('.page[data-seq]');
    return page.dataset.seq;
  }

  currentLocationXX() {
    return 1;
    var current_percentage = 0;
    var current;
    var bounds = this.container.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;
    var visible = this.container.querySelectorAll('.page[data-loaded="true"]');
    for(var i = 0; i < visible.length; i++) {
      var page = visible[i];
      var page_bounds = page.getBoundingClientRect();
      if ( page.offsetTop > ( scrollTop + bounds.height ) ) { continue; }
      if ( current_percentage < 1.0 && page.offsetTop >= scrollTop && (page.offsetTop + page_bounds.height) <= scrollTop + bounds.height ) {
        current_percentage = 1.0;
        current = page;
        continue;
      }

      var y1 = Math.abs(scrollTop - page.offsetTop);
      var y2 = Math.abs( ( scrollTop + bounds.height ) - ( page.offsetTop + page_bounds.height ) );
      var h = page_bounds.height - y1 - y2;
      var percentage = h / bounds.height;
      if ( percentage < 0 ) { continue; }
      if ( percentage > current_percentage ) {
        current_percentage = percentage;
        current = page;
      }
      console.log("AHOY currentLocation", page.dataset.seq, percentage);
    }
    return current.dataset.seq;
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

  _postResizePage(bounds, rect) {
    if ( rect.bottom <= bounds.bottom && rect.top < 0 ) {
      setTimeout(function() {
        delta = updated_rect.height - rect.height;
        if ( this.container.scrollTop == scrollTop ) {
          // delta /= this.settings.scale;
          // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
          this.container.scrollTop += Math.ceil(delta);
          console.log("AHOY afterResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        } else {
          console.log("AHOY donotResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        }
      }.bind(this), 500);
    }
  }

  minWidth() {
    return this.container.offsetWidth;
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

    this._resizer = this.reader.on('resize', () => {
      self.container.style.setProperty('--page-height', `${self.container.offsetHeight * 0.95 * self.scale}px`);
      self.container.style.setProperty('--slice-width', `${self.container.offsetWidth * self.scale}px`)
      console.log("AHOY flip.resize", self.container.style.getPropertyValue('--page-height'));
    });

    // this._resizer = debounce(function() {
    //   self.container.style.setProperty('--page-height', `${self.container.offsetHeight * 0.95 * self.scale}px`);
    //   self.container.style.setProperty('--slice-width', `${self.container.offsetWidth * self.scale}px`)
    //   console.log("AHOY flip.resize", self.container.style.getPropertyValue('--page-height'));
    // }, 50);

    // window.addEventListener('resize', this._resizer);

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
    console.log("AHOY AHOY flip.click NOP", event.target);
  }

  _clickHandlerPage(page, event) {
    console.log("AHOY AHOY flip.click page", event.target, page);
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
    this._resizer();
    console.log("AHOY AHOY flip.destroy");

  }

  config() {
    var retval = super.config();
    retval.rotate = false;
    return retval;
  }

};
