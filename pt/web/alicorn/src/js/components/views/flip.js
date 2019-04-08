import NanoEvents from 'nanoevents';
import {Base} from './base';

export var Flip = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.embedHtml = true;
    this.setupSlices();
    this.is_active = false;
  }

  setupSlices() {
    this.seq2slice = {};
    this.slices = [];
    this.slices.push([ null, 1 ]);
    this.seq2slice[1] = 0;
    for(var seq = 2; seq <= this.service.manifest.totalSeq; seq += 2) {
      var next_seq = seq + 1;
      if ( next_seq > this.service.manifest.totalSeq ) {
        next_seq = null;
      }
      this.slices.push([ seq, next_seq ]);
      this.seq2slice[seq] = this.slices.length - 1;
      if ( next_seq ) { this.seq2slice[next_seq] = this.slices.length - 1; }
    }

  }

  render(cb) {
    var minWidth = this.minWidth();
    minWidth /= 2;

    var maxHeight = this.container.offsetHeight * 0.90;

    var scale = this.scale;

    // group into pages
    var slices = this.slices;
    var max_edge_width = 50;

    for(var slice_idx = 0; slice_idx < slices.length; slice_idx++ ) {
      var tuple = slices[slice_idx];

      var slice = document.createElement('div');
      slice.classList.add('slice');

      var edge = document.createElement('div');
      edge.classList.add('edge', 'verso');
      edge.style.width = `${(slice_idx / slices.length) * max_edge_width}px`;
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

        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;

        slice_height = maxHeight * scale;
        slice_width = maxHeight * scale / ratio;

        page.dataset.bestFit = ( scale <= 1 );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;
        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;
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

        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;
        page.dataset.bestFit = ( scale <= 1 );

        slice_height = slice_height || ( maxHeight * scale );
        slice_width += ( maxHeight * scale / ratio );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
        slice.appendChild(page);
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;
        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;

        slice_width += ( maxHeight * scale / ratio );

        page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;
      }
      slice.appendChild(page);

      if ( this.scale > 1.0 ) {
        slice.style.height = `${slice_height}px`;
        slice.style.width = `${slice_width * 1.2}px`;
      }

      edge = document.createElement('div');
      edge.classList.add('edge', 'recto');
      edge.style.width = `${(( slices.length - slice_idx ) / slices.length) * max_edge_width}px`;

      edge.style.height = `${slice_height * 0.95}px`; // this is complicated

      slice.appendChild(edge);
      slice.querySelector('.edge.verso').style.height = edge.style.height;

      slice.dataset.visible = false;
      slice.dataset.slice = slice_idx;

      this.container.appendChild(slice);
    }

    this.is_active = true;
    this.loadSlice(this.container.querySelector('.slice'));
    if ( cb ) {
      cb();
    }
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
      this.loadImage(pages[i], true);
    }
    slice.dataset.visible = true;
  }

  unloadSlice(slice) {

  }

  display(seq) {
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

  next() {
    this.container.scrollTop = 0;
    var delta = this.currentSeq == 1 ? 1 : 2;
    this.display(this.currentSeq + delta);
  }

  prev() {
    this.container.scrollTop = 0;
    var delta = 2; // this.currentSeq == this.service.manifest.totalSeq ? 1 : 2;
    var seq = this.currentSeq - delta;
    if ( seq <= 0 ) { seq = 1; }
    this.display(seq);
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
        this.loadImage(prev_page, true);
      }
      delta += 1;
    }
    delta = 1;
    while ( delta <= 2 ) {
      var next_page = this.container.querySelector(`.page[data-seq="${seq + delta}"]`);
      if ( next_page ) {
        next_page.dataset.preloaded = true;
        this.loadImage(next_page, true);
      }
      delta += 1;
    }
  }

  bindEvents() {
    super.bindEvents();
  }

  bindPageEvents(page) {
    page.parentElement.dataset.visible = false;
  }

  destroy() {
    var pages = this.container.querySelectorAll('.slice');
    for(var i = 0; i < pages.length; i++) {
      this.container.removeChild(pages[i]);
    }
  }

};
