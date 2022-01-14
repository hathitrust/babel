import { createNanoEvents } from 'nanoevents';
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
    this.sets.expandable = new Map();
  }

  attachTo(element, cb) {
    this.root = element.parentElement;
    super.attachTo(element, cb);
  }

  _renderr(page) {
  }

  display(seq) {
    var target = this.getPage(seq);

    if ( ! target ) { return; }
    target.dataset.visible = true; target.classList.add('page--visible');
    let parentEl = this.root;
    if ( parentEl.scroll ) {
      parentEl.scroll(0, target.offsetTop);
    } else {
      parentEl.scrollTop = target.offsetTop;
    }
    

    this.emitter.emit('scrolled');
  }

  _reframePageText(page) {
    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.page-text');
      var seq = this.getPageSeq(page);
      var offsetHeight = frame.offsetHeight;
      var scrollHeight = frame.scrollHeight;
      var check = offsetHeight > scrollHeight ? scrollHeight / offsetHeight : offsetHeight / scrollHeight;
      console.log("AHOY _reframePageText", seq, this.currentSeq, "/", offsetHeight, scrollHeight, check);
      if ( offsetHeight < scrollHeight ) {
        if ( check <= 0.90 && seq < this.currentSeq ) {
          page.dataset.expandableHeight = scrollHeight;
          this.sets.expandable.set(seq, page);
        } else {
          frame.style.height = `${scrollHeight}px`;
        }
      }
      page.dataset.reframed = true;
    }
  }

  _reframePage(image, page) {
    if (page.dataset.reframed != 'true') {
      var frame = page.querySelector('.image');
      var img = frame.querySelector('img');
      var seq = this.getPageSeq(page);

      var r = image.height / image.width;
      var frameWidth = parseFloat(frame.style.width);
      var frameHeight = parseFloat(frame.style.height);
      var newFrameHeight = frameWidth * r;

      var check = frameHeight > newFrameHeight ? newFrameHeight / frameHeight : frameHeight / newFrameHeight;
      if ( check <= 0.90 && seq < this.currentSeq ) {
        page.dataset.expandableHeight = newFrameHeight;
        this.sets.expandable.set(seq, page);
      } else {
        frame.style.height = `${frameWidth * r}px`;
      }


      img.dataset.width = frameWidth;
      img.dataset.height = frameWidth * r;

      img.style.height = `${img.dataset.width}px`;
      img.style.height = `${img.dataset.height}px`;

      page.dataset.height = page.offsetHeight;

      if (this._checkForFoldouts(image, page)) {
        var altText = img.getAttribute('alt');
        if (altText.indexOf('Foldout') < 0) {
          altText += '; Foldout';
          img.setAttribute('alt', altText);
        }
      }
      page.dataset.reframed = 'true';
    }

  }

  handleObserver(entries, observer) {
    entries.forEach(entry => {
      var page = entry.target;
      var seq = parseInt(page.dataset.seq, 10);
      if ( entry.isIntersecting && seq ) {
        if ( entry.intersectionRatio > 0 ) {
          page.dataset.lastViewsStarted = entry.time;
          this.sets.visible.add(seq);
        }
      } else {
        this.sets.visible.delete(seq);
        // console.log("<|", entry.target.dataset.seq);      
      }
    });

    this.emitter.emit('scrolled');
  };

  currentLocation() {
    return this.currentSeq;
    // var page = this.currentPage();
    // return page ? this.getPageSeq(page) : null;
  }

  currentPage() {
    var operating = this._operating();
    var visible = operating.visible;
    var maxPercentage = 0; var currentPage;
    for(var i = 0; i < visible.length; i++) {
      var page = this.getPage(visible[i]);
      var percentage = this.visibility(page, { rootMargin: 0 });
      if ( percentage > maxPercentage ) { currentPage = page; maxPercentage = percentage; }
    }
    return currentPage;
  }

  next() {
    this.display(this.currentSeq + 1);
  }

  prev() {
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
        root: this.root,
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

    this._lastKnownScrollPosition = this.root.scrollTop;
    this._ticking = false;

    this._handlers.scrolled = this.on('scrolled', debounce(this.scrollHandler.bind(this), 50));

    this._handlers.expanded = debounce(this._expandableScrollHandler.bind(this), 50);
    this.root.addEventListener('scroll', this._handlers.expanded);

    // this._handlers.click = this.clickHandler.bind(this);
    // this.container.addEventListener('click', this._handlers.click);

  }

  scrollHandler() {
    // this._lastKnownScrollPosition = this.container.parentElement.scrollTop;
    if ( this._scrollPause ) { return ; }
    this.updateViewport();
    this.loadPages();
    var page = this.currentPage();
    HT.log("-- scrollHandler", page, this.currentSeq);
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

    // if ( ! this._ticking ) {
    //   window.requestAnimationFrame(() => {
    //     this._resizeOffscreen();
    //     this._ticking = false;
    //   })
    // }
  }

  _expandableScrollHandler() {
    this._lastKnownScrollPosition = this.root.scrollTop;
    // if (!this._ticking && this._expandable.size > 0) {
    //   console.log("AHOY _expandableScrollHandler ::", this._lastKnownScrollPosition);
    //   window.requestAnimationFrame(() => {
    //     this._resizeOffscreen();
    //     this._ticking = false;
    //   })
    //   this._ticking = true;
    // }

    if ( this._tickingTimer ) { console.log("AHOY _expandableScrollHandler :: resetting timer", this._expandable.size); }
    if ( this._tickingTimer ) { clearTimeout(this._tickingTimer); }
    if ( this.sets.expandable.size == 0 ) { return ; }
    this._tickingTimer = setTimeout(() => {
      this._resizeOffscreen();
      this._tickingTimer = null;
    }, 250);
  }

  _resizeOffscreen() {
    let root = this.root;
    let delta = 0;
    if ( this.sets.expandable.size == 0 ) { return ; }
    // let fragment = document.createDocumentFragment();
    // fragment.appendChild(this.container);
    let sequences = [...this.sets.expandable.keys()].sort((a, b) => { return a - b });
    sequences.forEach((seq) => {
      let page = this.sets.expandable.get(seq);
      if ( page.dataset.expandableHeight == 'resolved' ) { return; }
      let frame = this.format == 'plaintext' ? page.querySelector('.page-text') : page.querySelector('.image');
      let height1 = frame.offsetHeight; // arseFloat(frame.style.height, 10);
      let height2 = parseFloat(page.dataset.expandableHeight, 10);
      console.log("AHOY _resizeOffScreen ->", seq, height1, height2);
      if ( seq < this.currentSeq ) {
        delta += ( height2 - height1 );
      }
      frame.style.height = this.format == 'plaintext' ? 'auto' : `${height2}px`;
      page.dataset.expandableHeight = 'resolved';
      this.sets.expandable.delete(seq);
    })
    // root.appendChild(this.container);
    console.log("AHOY _resizeOffScreen", this._lastKnownScrollPosition, delta, this.currentSeq);
    root.scrollTop = this._lastKnownScrollPosition + delta;
    this._lastKnownScrollPosition = root.scrollTop;
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

    let { windowTop, windowHeight, windowBottom } = this.viewport();

    options.percentage = options.percentage || 0;

    // var rootMargin = this.rootMargin;
    var rootMargin = options.rootMargin === undefined ? this.rootMargin : options.rootMargin;

    var top = page.offsetTop;
    var height = parseInt(page.dataset.height, 10); // ppage.offsetHeight;
    var bottom = top + height;

    var containerTop = windowTop; var containerBottom = windowBottom;
    var elemTop = top; var elemBottom = bottom;

    var pageIsVisible = ( elemTop >= ( containerTop - rootMargin ) && elemBottom <= ( containerBottom + rootMargin ));
    var bottomIsVisible = ( elemTop < ( containerTop - rootMargin ) && containerTop < ( elemBottom + rootMargin ) )
    var topIsVisible = ( elemTop < ( containerBottom + rootMargin ) && containerBottom < ( elemBottom + rootMargin ));

    var percentage = 0; var test;
    if ( topIsVisible || bottomIsVisible || pageIsVisible ) {
      // now we're visible
      if ( pageIsVisible ) {
        percentage = 1.0;
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

    return percentage;

    if (top + height + rootMargin >= windowTop &&
              top - rootMargin <= windowTop + windowHeight ) {

      var height_visible = height - ( bottom - ( windowTop + windowHeight ) );
      var percentage = height_visible / height;

      return percentage;
    }

    return 0;
  }

  isVisible(page) {
    let percentage = this.visibility(page); // no rootMargin
    return percentage > 0;
  }

  loadPages() {
    // this.sets.visible = this.debugScrolled();
    if ( setfn.eqSet(this.sets.visible, this.sets.loaded) ) { return; }
    this.sets.loaded = new Set(this.sets.visible);

    var visible = this.sets.visible;
    // console.log('-- loadPages', visible);

    var tmp = [...visible].sort((a,b) => { return a - b});

    for(var i = 0; i < tmp.length; i++) {
      var seq = tmp[i];
      var page = this.getPage(seq);
      if ( this.isVisible(page) ) {
        // console.log("//", seq);
        this.loadImage(page);
      } else {
        // console.log("@@", seq);
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
      HT.log("!!", visible, ( ( new Date ).getTime() - t1 ));
    }
    return visible;
  }

  destroy() {
    this.observer.disconnect();
    // this.container.removeEventListener('click', this._handlers.click);

    super.destroy();
    this.observer = null;

    this.root.removeEventListener('scroll', this._handlers.expanded);
    if ( this._tickingTimer ) { clearTimeout(this._tickingTimer); }
  }

  _destroy_page(page) {
    this.observer.unobserve(page);
  }

};
