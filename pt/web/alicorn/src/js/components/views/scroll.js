import NanoEvents from 'nanoevents';
import {Base} from './base';

export var Scroll = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'scroll';
    this.pageOptions = {};
    this.embedHtml = true;
  }

  display(seq) {
    var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }
    target.dataset.visible = true;
    target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop;
  }

  handleObserver(entries, observer) {
    var current = { page: null, ratio: 0 };
    entries.forEach(entry => {
      var div = entry.target;
      var seq = div.dataset.seq;
      var viewed = div.querySelector('img');
      if ( entry.isIntersecting && entry.intersectionRatio > 0.0  ) {
        console.log("AHOY OBSERVING", entries.length, seq, 'onEnter', entry.intersectionRatio);
        if ( entry.intersectionRatio > current.ratio ) {
          current.ratio = entry.intersectionRatio;
          current.page = div;
        }
        if ( ! viewed ) {
          // console.log("AHOY OBSERVING", entries.length, seq, 'onEnter');
          this.loadImage(div, true);
        } else if (  div.dataset.preloaded ) {
          div.dataset.preloaded = false;
          this.resizePage(div);
        }
      } else if ( viewed && ! div.dataset.preloaded ) {
        console.log("AHOY OBSERVING", entries.length, seq, 'onExit');
        this.unloadImage(div);
      }
    })
    if ( current.page ) {
      this.reader.emit('relocated', { seq: current.page.dataset.seq });
    }
  };

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
    var scrollTop = this.container.scrollTop;
    this.container.scrollTop += this.container.offsetHeight;
  }

  prev() {
    if ( this.container.scrollTop == 0 ) { return ; }
    this.container.scrollTop -= this.container.offsetHeight;
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
    // var margin = ( rotate % 180 == 0 ) ? 0 : ( target.offsetHeight - target.offsetWidth ) / 2;
    // target.dataset.rotate = rotate;
    // target.style.setProperty('--rotate', `${rotate}deg`);
    // target.style.setProperty('--rotate-margin', `-${margin}px ${margin}px`);
    this.reader.pagedetails.rotate[target.dataset.seq] = rotate;
  }

  bindEvents() {
    var self = this;

    super.bindEvents();
    this.observer = new IntersectionObserver(this.handleObserver.bind(this), {
        root: this.container,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    });

    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentLocation();
      self.service.manifest.rotateBy(seq, delta);
      self.redrawPage(seq);
    });
  }

  bindPageEvents(page) {
    this.observer.observe(page);
  }

  destroy() {
    super.destroy();
    this._handlers.rotate();
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.observer.unobserve(pages[i]);
      this.container.removeChild(pages[i]);
    }
    this.observer = null;
  }

};
