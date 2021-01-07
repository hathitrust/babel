import {Scroll} from './scroll';
import {setfn} from './base';

export var Thumbnail = class extends Scroll {
  constructor(options={}) {
    super(options);
    this.mode = 'thumbnail';
    this.name = 'thumb';
    this.displayLabel = 'thumbnails';
    this.possibles = [ 0.5, 0.75, 1.0 ];
    this.scale = 1.0;
    this.embedHtml = false;
    this.trackResize = false;

    // this.rootMargin = options.rootMargin || 256;
    this.unloadNearestThreshold = 20;

  }

  loadImage(page, options={}) {
    var self = this;

    var _process = function(seq, loadImage) {
      var page = self.pagesIndex[seq] ? self.pagesIndex[seq] : null;
      if ( page && page.dataset.loaded == 'false' ) {
        var img = page.querySelector('img');
        // img.src.indexOf(img.dataset.thumbnailSrc) < 0 
        if ( page.dataset.reframed != 'true' ) {
          self._tracker.thumbnails[seq] = self._tracker.thumbnails[seq] ? self._tracker.thumbnails[seq] + 1 : 1;
          self.service.loaders.thumbnails.queue({ src: img.dataset.thumbnailSrc, page: page });          
        }
      }
    }

    var pages = Array.isArray(page) ? page : [ page ];
    console.log("?? loadImage", pages, options.lazy !== false);
    if ( ! pages.length ) { return; }
    var page = pages[0];

    var seq = parseInt(page.dataset.seq, 10);
    if ( Math.abs(seq - self.currentSeq ) > 20 ) {
      console.log("-- RESETTING THE LOADERS");
      self.service.loaders.thumbnails.stop(true);
    }

    for(var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var seq = parseInt(page.dataset.seq, 10);
      _process(seq, true);
    }

    if ( options.lazy !== false ) {
      var page = pages[0];
      var seq = parseInt(page.dataset.seq, 10);
      for(var ii = seq - 20; ii < seq; ii++) {
        _process(ii, false);
      }

      if ( pages.length > 1 ) {
        page = pages[pages.length - 1];
        seq = parseInt(page.dataset.seq, 10);
        for(var ii = seq + 20; ii > seq; ii--) {
          _process(ii, false);
        }
      }
    }


    self.service.loaders.thumbnails.start();

    console.log("// loading:", page.dataset.seq);
  }

  loadPages() {
    // this.sets.visible = this.debugScrolled();
    if ( setfn.eqSet(this.sets.visible, this.sets.loaded) ) { return; }
    this.sets.loaded = new Set(this.sets.visible);

    var visible = this.sets.visible;

    var tmp = [...visible].sort((a,b) => { return a - b});

    var possibles = [];
    for(var i = 0; i < tmp.length; i++) {
      var seq = tmp[i];
      var page = this.pagesIndex[seq];
      if ( this.isVisible(page) ) {
        possibles.push(page);
      } else {
        console.log("@@", seq, page.dataset.lastViewsStarted >= ( 60000 * 2 ));
        if ( false && page.dataset.lastViewsStarted >= ( 60000 * 2 ) ) {
          visible.delete(seq);
        }
      }
    }

    this.loadImage(possibles);
  }

  postThumbnail(image, datum) {
    var page = datum.page;
    if ( page.dataset.loaded != 'true' ) {
      super.postThumbnail(image, datum);
      page.dataset.loaded = true;
    }
  }

  imageUrl(params) {
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth;
    }
    return this.service.thumbnail(params);
  }

  minWidth() {
    // best guess
    // return 160;
    var max = null;
    for(var seq = 1; seq < this.service.manifest.totalSeq; seq++) {
      var meta = this.service.manifest.meta(seq);
      if ( max === null || meta.width > max.width ) {
        max = meta;
      }
    }
    // calculate a ratio based on the max height of a thumbnail,
    // since most page scans are taller than wider
    var r = 250 / max.height;
    var w = max.width * r;

    if ( window.innerWidth < 680 ) {
      w *= ( window.innerWidth / 680 );
    }
    
    return w;
  }

  bindEvents() {
    super.bindEvents();

    this.service.loaders.thumbnails.limit(4);

    this._clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._clickHandler);

    this.reader.on('redraw', (params) => {
      if ( ! params.scale ) { return; }
      this.scale = params.scale;
      this._resizePages();
    });
  }

  currentPage() {
    var operating = this._operating({ percentage: 0.75 });
    var visible = operating.visible;
    return this.getPage(visible[0]);
  }

  _resizePageByPages(page) {
    // var img = page.querySelector('img');
    // if ( img ) {
    //   img.style.width = page.style.width;
    //   img.style.height = page.style.height;
    // }
  }

  _checkForFoldouts(image, page) {
    /* NO OP */
  }

  redrawPageImages() {
    this._redrawPageImagesTimer = null;
  }

  clickHandler(event) {
    var element = event.target;
    console.log("-- thumbnail clickHandler", event, event.tagName);
    var check = element.closest('button');
    if ( ! check ) {
      element = element.closest('.page');
      if ( element ) {
        this.reader.restart({ view: '1up', seq: element.dataset.seq });
      }
    }
  }

  next(params={}) {
    var operating = this._operating({ percentage: 0.75 });
    var visible = operating.visible;
    if ( params.eventReferrer == 'accesskey' && document.activeElement && document.activeElement.closest(".page") ) {
      var focused = this.container.querySelector('.page[tabindex="0"]');
      var currentSeq = parseInt(focused.dataset.seq, 10);
      if ( ! this.pagesIndex[currentSeq + 1] ) { return ; }

      this.unfocus(focused);
      console.log("-- next", currentSeq, visible.indexOf(currentSeq + 1), visible.join(" : "));
      if ( visible.indexOf(currentSeq + 1) > -1 ) {
        // this.unfocus(this.getPage(currentSeq));
        currentSeq += 1;
        this.currentSeq = currentSeq;
        this.focus(this.getPage(currentSeq));
        return;
      }
    }
    var lastSeq = parseInt(visible.pop(), 10);
    this.display(lastSeq + 1);
  }

  prev(params={}) {
    var operating = this._operating({ percentage: 0.75 });
    var visible = operating.visible;

    var targetSeq;

    if ( params.eventReferrer == 'accesskey' && document.activeElement && document.activeElement.closest(".page") ) {
      // var currentSeq = parseInt(this.currentSeq, 10);
      var focused = this.container.querySelector('.page[tabindex="0"]');
      var currentSeq = parseInt(focused.dataset.seq, 10);
      if ( ! this.pagesIndex[currentSeq - 1] ) { return ; }

      this.unfocus(focused);
      console.log("-- prev", currentSeq, visible.indexOf(currentSeq - 1), visible.join(" : "));
      if ( visible.indexOf(currentSeq - 1) > -1 ) {
        currentSeq -= 1;
        this.currentSeq = currentSeq;
        this.focus(this.getPage(currentSeq));
        return;
      } else {
        targetSeq = currentSeq - 1;
      }
    }

    var firstSeq = parseInt(visible[0], 10);
    this._targetSeq = targetSeq;
    this.display(firstSeq - visible.length);
  }

  destroy() {
    super.destroy();
    this.service.loaders.thumbnails.limit(2); // restore default
    this.container.removeEventListener('click', this._clickHandler);
  }

  config() {
    var retval = super.config();
    retval.zoom = true;
    retval.rotate = false;
    retval.foldouts = false;
    return retval;
  }

};