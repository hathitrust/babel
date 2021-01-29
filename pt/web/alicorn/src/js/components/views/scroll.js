import NanoEvents from 'nanoevents';
import {Base, setfn} from './base';

import debounce from 'lodash/debounce';

export var Scroll = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'scroll';
    this.name = '1up';
    this.displayLabel = 'scroll page scans';
    this.pageOptions = {};
    this.embedHtml = true;
    this._debugLog = [];
  }

  _renderr(page) {
    // var button = document.createElement('button');
    // button.classList.add('button', 'btn-sm', 'action-load-page');
    // button.dataset.seq = page.dataset.seq;
    // button.innerText = 'Load page';
    // button.setAttribute('tabindex', '-1');
    // page.appendChild(button);
  }

  display(seq) {
    seq = parseInt(seq, 10);
    var target = this.pagesIndex[seq];

    // var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }
    target.dataset.visible = true; target.classList.add('page--visible');
    // console.log("-- display", seq, target);
    // console.trace();
    this.container.parentNode.scrollTop = target.offsetTop;
    this.emitter.emit('scrolled');
  }

  handleObserver(entries, observer) {
    entries.forEach(entry => {
      var page = entry.target;
      var seq = parseInt(page.dataset.seq, 10);
      // console.log('-- handleObserver', this._installed, seq);
      if ( entry.isIntersecting ) {
        if ( entry.intersectionRatio > 0 ) {
          page.dataset.lastViewsStarted = entry.time;
          this.sets.visible.add(seq);
        }
      } else {
        this.sets.visible.delete(seq);
        // console.log("****", page.dataset.seq);
        if ( entry.intersectionRatio == 0.0 && page.dataset.lastViewsStarted >= ( 60000 * 2 ) ) {
          // page.dataset.loaded = false;
          // var img = page.querySelector('img');
          // img.src = img.dataset.placeholderSrc;
        }
        // console.log("<|", entry.target.dataset.seq);      
      }
    });

    this.emitter.emit('scrolled');
  };

  currentLocation() {
    var page = this.currentPage();
    return page ? page.dataset.seq : null;
  }

  currentPage() {
    var operating = this._operating();
    var visible = operating.visible;
    var maxPercentage = 0; var currentPage;
    for(var i = 0; i < visible.length; i++) {
      var page = this.getPage(visible[i]);
      var percentage = this.visibility(page, { rootMargin: 0 });
      // console.log("-- currentPage", page, percentage);
      if ( percentage > maxPercentage ) { currentPage = page; maxPercentage = percentage; }
    }
    return currentPage;
  }

  next() {
    // var scrollTop = this.container.scrollTop;
    // this.container.scrollTop += this.container.offsetHeight;
    this.display(this.currentSeq + 1);
  }

  prev() {
    // if ( this.container.scrollTop == 0 ) { return ; }
    // this.container.scrollTop -= this.container.offsetHeight;
    this.display(this.currentSeq - 1);
  }

  // _postResizePage(page, bounds, rect) {
  //   if ( this._scrollPause ) { return ; }
  //   if ( rect.bottom <= bounds.bottom && rect.top < 0 ) {
  //     var scrollTop = this.container.scrollTop;
  //     setTimeout(function() {
  //       var updated_rect = page.getBoundingClientRect();
  //       var delta = updated_rect.height - rect.height;
  //       if ( this.container.scrollTop == scrollTop ) {
  //         // delta /= this.settings.scale;
  //         // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
  //         this.container.scrollTop += Math.ceil(delta);
  //         console.log("AHOY afterResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
  //       } else {
  //         console.log("AHOY donotResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
  //       }
  //     }.bind(this), 500);
  //   }
  // }

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
        root: this.container.parentNode,
        rootMargin: `${this.rootMargin}px`,
        threshold: 0
    });

    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentSeq; // self.currentLocation();
      var page = self.pagesIndex[seq];
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

      // self.service.manifest.rotateBy(seq, delta);
      // self.redrawPage(self.getPage(seq));
    });

    this._handlers.scrolled = this.on('scrolled', debounce(this.scrollHandler.bind(this), 50));

    this._handlers.click = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._handlers.click);

  }

  scrollHandler() {
    if ( this._scrollPause ) { return ; }
    this.loadPages();
    var page = this.currentPage();
    console.log("-- scrollHandler", page, this.currentSeq);
    if ( page != null && this.currentSeq != page.dataset.seq ) {
      var seq = page.dataset.seq;
      this.reader.emit('relocated', { seq: seq });
      this.currentSeq = parseInt(seq, 10);
      if ( this._currentPage ) {
        this.unfocus(this._currentPage);
      }
      if ( this._targetSeq ) {
        this.focus(this.getPage(this._targetSeq));
        this.currentSeq = this._targetSeq;
      } else {
        this.focus(page);
      }
      this._currentPage = page;
    }
  }

  bindPageEvents(page) {
    this.observer.observe(page);
  }

  clickHandler(event) {
    var element = event.target;
    super.clickHandler(event);
    if ( element.tagName.toLowerCase() == 'button' && element.classList.contains('action-load-page') ) {
      event.preventDefault();
      event.stopPropagation();
      this.loadImage(element.parentNode, { preload: false });
    }
  }

  focusHandler(event) {
    super.focusHandler(event);
    var target = event.target;
    if ( target.tagName.toLowerCase() == 'div' && target.classList.contains('page') && ! window.reactivated ) {
      target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop;
    }
  }

  visibility(page, options={}) {
    var windowTop = this.container.parentNode.scrollTop;
    var windowHeight = this.container.parentNode.offsetHeight;
    var windowBottom = windowTop + windowHeight;

    options.percentage = options.percentage || 0;

    // var rootMargin = this.rootMargin;
    var rootMargin = options.rootMargin === undefined ? this.rootMargin : options.rootMargin;

    var top = page.offsetTop;
    var height = page.offsetHeight;
    var bottom = top + height;
    // var top = page.__coords.offsetTop;
    // var height = page.__coords.offsetHeight;

    var topIsVisible = ( top <= ( windowBottom + rootMargin ) && top >= ( windowTop - rootMargin ) );
    var bottomIsVisible = ( bottom <= ( windowBottom + rootMargin ) && bottom >= ( windowTop - rootMargin ) );

    var percentage = 0; var test;
    if ( topIsVisible || bottomIsVisible ) {
      // now we're visible
      if ( topIsVisible && bottomIsVisible ) {
        percentage = 100;
        test = 'topIsVisible && bottomIsVisible';
      } else if ( topIsVisible ) {
        // only the top is visible
        var height_visible = windowBottom - top;
        percentage = height_visible / height;
        test = 'topIsVisible';
      } else if ( bottomIsVisible ) {
        var height_visible = bottom - windowTop;
        percentage = height_visible / height;
        test = 'bottomIsVisible';
      }
    }

    // console.log("-- visibility", page.dataset.seq, percentage, test);
    return percentage;

    if (top + height + rootMargin >= windowTop &&
              top - rootMargin <= windowTop + windowHeight ) {

      var height_visible = height - ( bottom - ( windowTop + windowHeight ) );
      var percentage = height_visible / height;

      return percentage;
    }

    return 0;
  }

  // unloadPages() {
  //   // if ( setfn.eqSet(this.sets.visible, this.sets.unloaded) ) { return; }
  //   // this.sets.unloaded = new Set(this.sets.visible);

  //   var pages = this.container.querySelectorAll('.page[data-loaded="true"]');
  //   var possibles = new Set();
  //   pages.forEach((page) => possibles.add(page.dataset.seq));
  //   if ( setfn.eqSet(this.sets.unloaded, possibles )) { return ; }
  //   this.sets.unloaded = possibles;

  //   var nearest = 5;
  //   var visible = this.sets.visible;

  //   var now = Date.now();
  //   var tmp = [...visible].sort((a,b) => { return a - b});
  //   var seq1 = parseInt(tmp[0], 10);
  //   var seq2 = parseInt(tmp[1], 10);

  //   pages.forEach((page) => {
  //     var seq = parseInt(page.dataset.seq, 10);
  //     if ( ! this.isVisible(page) ) {
  //       if ( ! ( ( Math.abs(seq - seq1) <= nearest ) || ( Math.abs(seq - seq2) <= nearest ) ) ) {
  //         this.unloadImage(page);
  //         console.log("<<", seq);
  //       } else {
  //         console.log("**", seq);
  //       }
  //     }
  //   })

  //   // for(const [seq, page] of Object.entries(this.pagesIndex)) {
  //   //   if ( ! this.isVisible(page) && page.dataset.loaded == 'true' ) {
  //   //     if ( ! ( ( Math.abs(seq - seq1) <= nearest ) || ( Math.abs(seq - seq2) <= nearest ) ) ) {
  //   //       this.unloadImage(page);
  //   //       // page.dataset.loaded = 'false';
  //   //       // page.dataset.isLeaving = false;

  //   //       // var img = page.querySelector('img');
  //   //       // // img.src = img.dataset.thumbnailSrc;
  //   //       // img.src = img.dataset.thumbnailSrc || img.dataset.placeholderSrc;

  //   //     } else {
  //   //       console.log("**", page.dataset.seq);
  //   //     }
  //   //   }
  //   // }
  // }

  loadPages() {
    // this.sets.visible = this.debugScrolled();
    if ( setfn.eqSet(this.sets.visible, this.sets.loaded) ) { return; }
    this.sets.loaded = new Set(this.sets.visible);

    var visible = this.sets.visible;
    // console.log('-- loadPages', visible);

    var tmp = [...visible].sort((a,b) => { return a - b});

    for(var i = 0; i < tmp.length; i++) {
      var seq = tmp[i];
      var page = this.pagesIndex[seq];
      if ( this.isVisible(page) ) {
        // console.log("//", seq);
        this.loadImage(page);
      } else {
        // console.log("@@", seq);
        // visible.delete(seq);
      }
    }
  }

  debugScrolled(debug) {
    var t1 = (new Date).getTime();
    var visible = new Set;
    for(var idx in this.pages) {
      var page = this.pages[idx];
      if ( this.isVisible(page)) {
        visible.add(page.dataset.seq)
      }
    }
    if ( debug ) {
      console.log("!!", visible, ( ( new Date ).getTime() - t1 ));
    }
    return visible;
  }

  destroy() {
    super.destroy();
    this._handlers.rotate();
    this.container.removeEventListener('click', this._handlers.click);
    var pages = this.container.querySelectorAll('.page');
    this.observer.disconnect();
    for(var i = 0; i < pages.length; i++) {
      this.observer.unobserve(pages[i]);
      this.container.removeChild(pages[i]);
    }
    this.observer = null;
    // clearInterval(this.intervals.loader);
    // clearInterval(this.intervals.unloader);
  }

};
