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
  }

  attachTo(element, cb) {
    this.container = element;
    this.bindEvents();
    this.render(cb);
  }

  render(cb) {
    var minWidth = this.minWidth();
    var scale = this.scale;
    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');

      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = minWidth * ratio * scale;
      var w = minWidth * scale;

      page.style.height = `${h}px`;
      page.style.width = `${w}px`;
      page.dataset.bestFit = ( scale <= 1 );
      page.style.setProperty('--width', page.style.width);

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      this._renderr(page);
      this.container.appendChild(page);
    }

    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
    }

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

    if ( canvas.height < parseInt(page.style.height, 10) ) {
      console.log("AHOY shrinking", page.dataset.seq, page.style.height, canvas.height);
    }
    page.style.height = `${canvas.height}px`;
    page.style.setProperty('--width', `${canvas.width}px`);
    
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
      return;
    }

    if ( page.dataset.loading == "true" ) {
      return;
    }

    var html_request;
    if ( this.embedHtml) {
      html_request = fetch(html_url);
    }

    var page_height = page.offsetHeight;
    var page_width = page.offsetWidth;

    var img = new Image();
    img.alt = `Page scan of sequence ${seq}`;

    page.dataset.loading = true;
    img.addEventListener('load', function _imgHandler() {
      page.dataset.loading = false;

      this.emitter.emit('loaded', page);

      this.service.manifest.update(seq, { width: img.width, height: img.height });

      if ( img.width > img.height ) {
        img.classList.add('foldout');
        img.dataset.width = img.width;
        img.dataset.height = img.height;
      }


      var imageAspectRatio = img.width / img.height;
      img.style.width = page_width;
      img.style.height = page_width / imageAspectRatio;

      page.appendChild(img);
      page.dataset.loaded = true;

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

      if ( options.check_scroll || this.mode == 'thumbnail' ) { this.resizePage(page); }
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
    var new_img = new Image();
    new_img.addEventListener('load', function _redrawHandler() {
      page.replaceChild(new_img, img);
      this.resizePage(page);
      new_img.removeEventListener('load', _redrawHandler, true);
    }.bind(this), true);
    new_img.src = image_url;
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
    page.dataset.loaded = false;
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
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth;
    }
    // if ( this.reader.pagedetails.rotate[params.seq] ) {
    //   params.rotation = this.reader.pagedetails.rotate[params.seq];
    // }
    return this.service.image(params);
  }

  minWidth() {
    return this.container.parentNode.offsetWidth * 0.80;
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
  }

  _enableControlTabIndex(page) {
    var page_controls = page.querySelectorAll('[tabindex="-1"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '0');
      console.log("--- AHOY", page_controls[i]);
    }
  }

}

