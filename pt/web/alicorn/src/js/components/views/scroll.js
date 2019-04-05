import NanoEvents from 'nanoevents';
import {Base} from './base';

export var Scroll = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'scroll';
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
          current.ration = entry.intersectionRatio;
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

  bindEvents() {
    super.bindEvents();
    this.observer = new IntersectionObserver(this.handleObserver.bind(this), {
        root: this.container,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    });
  }

};