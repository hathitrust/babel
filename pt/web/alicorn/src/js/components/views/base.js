import NanoEvents from 'nanoevents';
import unbindAll from 'nanoevents/unbind-all';

export var Base = class {
  constructor(options={}) {
    this.service = options.service;
    this.reader = options.reader;
    this.scale = options.scale || 1.0;
    this.mode = 'scroll';
    this.emitter = new NanoEvents();
    this._handlers = {};
    this.id = (new Date()).getTime();
    this.pages = [];
    this.trackResize = true;
  }

  attachTo(element, cb) {
    this.container = element;
    var t0 = performance.now();
    this.bindEvents();
    var t1 = performance.now();
    this.render(cb);
    var t2 = performance.now();
    console.log(`BENCHMARK view.attachTo: ${t2 - t0} / ${t1 - t0} / ${t2 - t1}`);
  }

  render(cb) {
    var minWidth = this.minWidth();
    var scale = this.scale;

    // this.container.style.display = 'none';

    var t0 = performance.now();
    var fragment = document.createDocumentFragment();

    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');

      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = Math.ceil(minWidth * ratio * scale);
      var w = Math.ceil(minWidth * scale);

      page.style.height = `${h}px`;
      page.style.width = `${w}px`;
      page.dataset.bestFit = ( scale <= 1 ) ? 'true' : 'false';
      if ( scale <= 1 ) {
        page.classList.add('page--best-fit');
      }
      page.style.setProperty('--width', page.style.width);

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      this._renderr(page);

      fragment.appendChild(page);
      this.pages.push(page);
    }

    var t11 = performance.now();
    console.log(`-- BENCHMARK render loop ${t11 - t0}`);

    this.container.appendChild(fragment);
    // this.container.style.display = 'block';

    var t1 = performance.now();

    var pages = this.container.querySelectorAll('.page');
    var t2 = performance.now();

    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
    }
    var t3 = performance.now();
    console.log(`BENCHMARK base.render: ${t3 - t0} / ${t1 - t0} / ${t2 - t1} / ${t3 - t2} / ${t1 - t11}`);

    this.is_active = true;
    this.loadImage(this.container.querySelector('[data-seq="1"]'), { check_scroll: true });
    if ( cb ) {
      cb();
    }
  }

  _renderr(page) {
    /* NOP */
  }

  resizePage(page) {
    var canvas = page.querySelector('img');
    if ( ! canvas ) { return ; }

    if ( page.dataset.loading !== 'false' ) {
      return;
    }

    var bounds = this.container.getBoundingClientRect();
    var rect = page.getBoundingClientRect();

    if ( canvas.height == 0 ) {
      // punt? I guess?
      var x = ( page.dataset.attempts || 1 ) - 0;
      x += 1;
      if ( x < 3 ) {
        // console.log(`--- AHOY ATTEMPTING resizePage ${page.dataset.seq} : ${x}`);
        page.dataset.attempts = x;
        setTimeout(function() {
          this.resizePage(page);
        }.bind(this), 0);
        return;
      } else {
        // console.log(`--- AHOY PUNTING resizePage ${page.dataset.seq} : ${x}`);
        return;
      }
    }

    if ( canvas.height < parseInt(page.style.height, 10) ) {
      // console.log("AHOY shrinking", page.dataset.seq, page.style.height, canvas.height);
    }

    var pageHeight = canvas.height;

    // if ( page.dataset.scale ) {
    //   var scale = parseFloat(page.dataset.scale);
    //   pageHeight *= scale;
    // }

    page.style.height = `${pageHeight}px`;
    // page.style.setProperty('--width', `${canvas.naturalWidth}px`);

    var updated_rect = page.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;

    this._postResizePage(rect, bounds);
  }

  _postResizePage(rect, bounds) {

  }

  loadImage(page, options={}) {
    if ( ! this.is_active ) { return ; }
    options = Object.assign({ check_scroll: false, preload: true }, options);
    var seq = page.dataset.seq;
    var rect = page.getBoundingClientRect();

    var image_url = this.imageUrl(page);
    var html_url = this.service.html({ seq: seq });

    if ( page.querySelector('img') ) {
      // preloadImages(page);
      // console.log(`AHOY loadImage ${seq} PRELOADED`);
      return;
    }

    if ( page.dataset.loading == "true" ) {
      return;
    }

    var html_request;
    if ( this.embedHtml && html_url ) {
      html_request = fetch(html_url, { credentials: 'include' });
    }

    var img = new Image();
    img.alt = `Page scan of sequence ${seq}`;

    page.dataset.loading = true;
    page.classList.add('page--loading');
    img.addEventListener('load', function _imgHandler() {
      var page_height = page.offsetHeight;
      var page_width = page.offsetWidth;

      page.dataset.loading = false;
      page.classList.remove('page--loading');

      this.emitter.emit('loaded', page);

      this.service.manifest.update(seq, { width: img.width, height: img.height });

      if ( img.width > img.height ) {
        img.classList.add('foldout');
        img.dataset.width = img.width;
        img.dataset.height = img.height;
      }


      var imageAspectRatio = img.width / img.height;
      // console.log(`AHOY LOAD ${seq} : ${img.width} x ${img.height} : ${page_width}`);
      // img.style.width = `${page_width}px`;
      // img.style.height = `${page_width / imageAspectRatio}px`;

      img.width = `${page_width}`;
      img.height = `${page_width / imageAspectRatio}`;

      // console.log(`AHOY LOAD ${seq} REDUX : ${img.width} x ${img.height} : ${img.style.width} x ${img.style.height} : ${page_width}`);

      page.appendChild(img);
      page.dataset.loaded = true;
      page.classList.add('page--loaded');

      if ( html_request ) {
        html_request
          .then(function(response) {
            return response.text();
          })
          .then(function(text) {
            var page_text = page.querySelector('.page-text');
            page_text.innerHTML = text;
          });
      }

      if ( options.check_scroll || this.mode == 'thumbnail' ) {
        this.resizePage(page);
      }
      img.removeEventListener('load', _imgHandler, true);
      if ( options.callback ) {
        options.callback(img);
      }
    }.bind(this), true)

    img.src = image_url;

    if ( ! page.dataset.preloaded && options.preload ) {
      this.preloadImages(page);
    }
  }

  redrawPage(page) {
    if ( typeof(page) == "number" || typeof(page) == "string" ) {
      page = this.container.querySelector(`[data-seq="${page}"]`);
    }
    var image_url = this.imageUrl(page);
    var img = page.querySelector('img');
    if ( ! img || img.getAttribute('src') == image_url ) { return ; }
    var new_img = new Image();
    new_img.addEventListener('load', function _redrawHandler() {
      if ( img && img.parentElement && img.parentElement == page ) {
        page.replaceChild(new_img, img);
        this.resizePage(page);
        new_img.removeEventListener('load', _redrawHandler, true);
      }
      delete page.dataset.reloading;
    }.bind(this), true);
    new_img.src = image_url;
  }

  redrawPageImages() {
    var images = this.container.querySelectorAll('.page img');
    for(var i = 0; i < images.length; i++) {
      var img = images[i];
      var page = img.parentElement;
      this.redrawPage(page);
    }
    this._redrawPageImagesTimer = null;
  }

  unloadImage(page) {
    if ( page.dataset.preloaded == "true" ) { return; }
    if ( page.dataset.loading == "true" ) { return ; }
    var canvas = page.querySelector('img');
    if ( canvas ) {
      page.removeChild(canvas);
    }
    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = '';
    page.dataset.preloaded = false;
    page.dataset.loaded = false; page.classList.remove('page--loaded');
  }

  preloadImages(page) {
    var seq = parseInt(page.dataset.seq, 10);
    var delta = 1;
    while ( delta <= 1 ) {
      var prev_page = this.container.querySelector(`.page[data-seq="${seq - delta}"]`);
      if ( prev_page ) {
        prev_page.dataset.preloaded = true;
        this.loadImage(prev_page);
      }
      delta += 1;
    }
    delta = 1;
    while ( delta <= 1 ) {
      var next_page = this.container.querySelector(`.page[data-seq="${seq + delta}"]`);
      if ( next_page ) {
        next_page.dataset.preloaded = true;
        this.loadImage(next_page);
      }
      delta += 1;
    }
  }

  imageUrl(params) {
    var oprams =  params;
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth || 680;
    }
    // if ( this.reader.pagedetails.rotate[params.seq] ) {
    //   params.rotation = this.reader.pagedetails.rotate[params.seq];
    // }

    if ( ! params.width && ! params.height ) {
      console.log("AHOY IMAGEURL PROBLEM", params, oprams);
    }

    return this.service.image(params);
  }

  minWidth() {
    var minWidth = this.container.parentNode.offsetWidth * 0.80;
    if ( minWidth < 680 ) { minWidth = 680; }
    return minWidth;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  first() {
    this.display(1);
  }

  last() {
    this.display(this.service.manifest.totalSeq);
  }

  currentPage() {
    if ( this._currentPage ) {
      return this._currentPage;
    }
    return null;
  }

  bindEvents() {
    this._handlers.focus = this.focusHandler.bind(this);
    this.container.addEventListener('focusin', this._handlers.focus);

    if ( this.trackResize ) {

      this.reader.on('redraw', (params) => {
        console.log("AHOY PARAMS", params);
        this.scale = params.scale;
        this.reader.emit('resize');
      });

      this._handlers.resize = this.reader.on('resize', () => {
        this._resizePages();
      })
    }
  }

  bindPageEvents(page) {
  }

  focusHandler(event) {
    var target = event.target;
    if ( target.tagName.toLowerCase() == 'div' && target.classList.contains('page') ) {
      this._enableControlTabIndex(target);
    }
  }

  focus(page, invoke=false) {
    // page.setAttribute('accesskey', "9");
    if ( page === true || page === false ) {
      invoke = page;
      page = null;
    }
    if ( ! page ) {
      page = this.currentPage();
    }
    page.setAttribute('tabindex', '0');
    this._enableControlTabIndex(page);
    if ( invoke ){
      page.focus();
    }
  }

  unfocus(page) {
    page.setAttribute('tabindex', '-1');
    var page_controls = page.querySelectorAll('[tabindex="0"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '-1');
    }
  }

  config() {
    // the empty set supports everything
    return {};
  }

  destroy() {
    unbindAll(this.emitter);
    if ( this._handlers.focus ) {
      this.container.removeEventListener('focusin', this._handlers.focus);
    }
    if ( this._handlers.resize ) {
      this._handlers.resize();
    }
  }

  _enableControlTabIndex(page) {
    var page_controls = page.querySelectorAll('[tabindex="-1"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '0');
      // console.log("--- AHOY", page_controls[i]);
    }
  }

  _resizePages() {
    this._scrollPause = true;
    var minWidth = this.minWidth();
    var scale = this.scale;
    var currentSeq = this.currentLocation();
    var dirty = false;
    this.pages.forEach((page) => {
      var seq = parseInt(page.dataset.seq, 10);
      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = Math.ceil(minWidth * ratio * scale);
      var w = Math.ceil(minWidth * scale);

      // console.log("AHOY _resizePages", seq, page.style.width, "x", page.style.height, "/", w, "x", h);

      dirty = dirty || ( page.style.height != `${h}px` );

      page.style.height = `${h}px`;
      page.style.width = `${w}px`;
      page.dataset.bestFit = ( scale <= 1 ) ? 'true' : 'false';
      if ( scale <= 1 ) {
        page.classList.add('page--best-fit');
      }
      this._resizePageByPages(page);
    })

    if ( dirty ) {
      if ( this._redrawPageImagesTimer ) { clearTimeout(this._redrawPageImagesTimer); }
      this._redrawPageImagesTimer = setTimeout(() => {
        this.redrawPageImages();
      }, 100);
    }

    this.display(currentSeq);
    this._scrollPause = false;
  }

  _resizePageByPages() {
    /* NOP */
  }

}

