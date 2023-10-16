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
    this._lastKnownScrollPosition = this.root.scrollTop;    
    this.emitter.emit('scrolled');
  }

  _reframePageText(page) {
    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.page-text');
      var seq = this.getPageSeq(page);
      var offsetHeight = frame.offsetHeight;
      var scrollHeight = frame.scrollHeight;
      var check = offsetHeight > scrollHeight ? scrollHeight / offsetHeight : offsetHeight / scrollHeight;
      HT.log("AHOY _reframePageText", seq, this.currentSeq, "/", offsetHeight, scrollHeight, check);
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
      var isAdjusting = true;
      var message;
      if ( check <= 0.90 ) {
        if ( seq < this.currentSeq ) {
          // delay this resize
          page.dataset.expandableHeight = newFrameHeight;
          this.sets.expandable.set(seq, page);
          message = 'QUEUED';
        } else {
          frame.style.height = `${newFrameHeight}px`;
          page.dataset.unaltered = false;
          message = 'ALTERED';
        }
      } else {
        // ignore this
        page.dataset.unaltered = 'true';
        isAdjusting = false;
        message = 'UNALTERED';
      }

      HT.log("AHOY _reframePage", message, seq, this.currentSeq, "/", frameHeight, newFrameHeight, check);

      if ( isAdjusting ) {
        img.dataset.width = frameWidth;
        img.dataset.height = newFrameHeight; // frameWidth * r;

        img.style.height = `${img.dataset.width}px`;
        img.style.height = `${img.dataset.height}px`;

        page.dataset.height = page.offsetHeight;
      } else {
        // we're not adjusting the height, which means we should 
        // change the _width_
        img.dataset.naturalWidth = image.width;
        img.dataset.naturalHeight = image.height;
        img.dataset.naturalRatio = r;
        img.dataset.width = frameHeight / r;
        img.dataset.height = frameHeight;
        img.dataset.check = check;
        img.style.width = `${img.dataset.width}px`;
        frame.style.width = `${img.dataset.width}px`;
      }

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
    });

    this._lastKnownScrollPosition = this.root.scrollTop;
    this._ticking = false;

    this._handlers.scrolled = this.on('scrolled', debounce(this.scrollHandler.bind(this), 50));
  }

  scrollHandler() {
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

    this._setupExpandableTimer();
  }

  _setupExpandableTimer() {
    this._lastKnownScrollPosition = this.root.scrollTop;

    if ( this._expanding ) { HT.log("AHOY _expandableScrollHandler IN PROGRESS"); return; }
    if ( this._tickingTimer ) { HT.log("AHOY _expandableScrollHandler :: resetting timer", this._expandable.size); }
    if ( this._tickingTimer ) { clearTimeout(this._tickingTimer); }
    if ( this.sets.expandable.size == 0 ) { return ; }
    this._tickingTimer = setTimeout(() => {
      this._resizeExpandablePages();
      this._tickingTimer = null;
    }, 0);
  }

  _resizeExpandablePages() {
    let root = this.root;
    let delta = 0;
    if ( this.sets.expandable.size == 0 ) { return ; }
    this._expanding = true;

    let sequences = [...this.sets.expandable.keys()].sort((a, b) => { return a - b });
    sequences.forEach((seq) => {
      let page = this.sets.expandable.get(seq);
      if ( page.dataset.expandableHeight == 'resolved' ) { return; }
      let frame = this.format == 'plaintext' ? page.querySelector('.page-text') : page.querySelector('.image');
      let height1 = frame.offsetHeight; // arseFloat(frame.style.height, 10);
      let height2 = parseFloat(page.dataset.expandableHeight, 10);
      HT.log("AHOY _resizeExpandablePages ->", seq, height1, height2);
      if ( seq < this.currentSeq ) {
        delta += ( height2 - height1 );
      }
      frame.style.height = this.format == 'plaintext' ? 'auto' : `${height2}px`;
      page.dataset.expandableHeight = 'resolved';
      this.sets.expandable.delete(seq);
    })

    // in theory we'd use _lastKnownScrollPosition, but it 
    // seems to drift further in Safari/WebKit
    window.requestAnimationFrame(() => {
      HT.log("AHOY _resizeExpandablePages SCROLLING", root.scrollTop, this._lastKnownScrollPosition, delta, this.currentSeq);
      root.scrollTop = root.scrollTop + delta
      this._lastKnownScrollPosition = root.scrollTop;
    })
    this._expanding = false;
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

    if ( this._tickingTimer ) { clearTimeout(this._tickingTimer); }
  }

  _destroy_page(page) {
    this.observer.unobserve(page);
  }

};
