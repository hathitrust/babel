import NanoEvents from 'nanoevents';
import {Base} from './base';

export var Single = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.embedHtml = true;
  }

  display(seq) {
    seq = parseInt(seq, 10);
    var current = this.container.querySelector(`.page[data-visible="true"]`);
    var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }

    if ( current ) {
      current.dataset.visible = false;
      setTimeout(function() {
        this.unloadImage(current);
      }.bind(this))
    }

    target.dataset.visible = true;
    this.loadImage(target, true);
    this.reader.emit('relocated', { seq: target.dataset.seq });
    this.currentSeq = seq;
  }

  currentLocation() {
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
    this.display(this.currentSeq + 1);
    // var current = this.container.querySelector(`.page[data-seq="${this.currentSeq}"]`);
    // var next = current.nextSiblingElement;
    // if ( next ) {
    //   this.display(next);
    // }
  }

  prev() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq - 1);
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

  updatePageRotation(target, rotate) {
    var margin = ( rotate % 180 == 0 ) ? 0 : ( target.offsetHeight - target.offsetWidth ) / 2;
    target.dataset.rotate = rotate;
    target.style.setProperty('--rotate', `${rotate}deg`);
    target.style.setProperty('--rotate-margin', `-${margin}px`);
    this.reader.pagedetails.rotate[target.dataset.seq] = rotate;
  }

  bindEvents() {
    super.bindEvents();
    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentLocation();
      var target = self.container.querySelector(`.page[data-seq="${seq}"]`);
      var rotate = parseInt(target.dataset.rotate || 0, 10);
      rotate += delta;
      rotate = rotate % 360;
      self.updatePageRotation(target, rotate);
    });

    this.reader.on('relocated', (params) => {
      this.reader.emit('status', `Showing page scan ${params.seq}`);
    });
  }

  bindPageEvents(page) {
    page.dataset.visible = false;
    if ( this.reader.pagedetails.rotate[page.dataset.seq] ) {
      page.dataset.rotate = this.reader.pagedetails.rotate[page.dataset.seq];
      this.updatePageRotation(page, page.dataset.rotate);
    }
  }

  destroy() {
    super.destroy();
    this._handlers.rotate();
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.container.removeChild(pages[i]);
    }
  }

};