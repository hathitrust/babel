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

      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = minWidth * ratio * scale;
      var w = minWidth * scale;
      // if ( meta.rotation % 180 != 0 ) {
      //   w = minWidth * ratio * scale;
      //   h = minWidth * scale;
      // }

      page.style.height = `${h}px`;
      page.style.width = `${w}px`;
      page.dataset.bestFit = ( scale <= 1 );

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      this.container.appendChild(page);
    }

    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
      // if ( this.mode == 'image' ) {
      //   pages[i].dataset.visible = false;
      //   this.observer.inactive = true;
      // } else {
      //   this.observer.observe(pages[i]);
      // }
    }

    this.is_active = true;
    this.loadImage(this.container.querySelector('[data-seq="1"]'), true);
    if ( cb ) {
      cb();
    }
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
    var updated_rect = page.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;

    this._postResizePage(rect, bounds);
  }

  _postResizePage(rect, bounds) {

  }

  loadImage(page, check_scroll) {
    if ( ! this.is_active ) { return ; }
    var seq = page.dataset.seq;
    var rect = page.getBoundingClientRect();

    console.log("AHOY LOADING", seq);

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
    if ( false && this.embedHtml) {
      html_request = fetch(html_url);
    }

    var page_height = page.offsetHeight;
    var page_width = page.offsetWidth;

    var img = new Image();
    img.alt = `Page scan of sequence ${seq}`;

    page.dataset.loading = true;
    img.addEventListener('load', function _imgHandler() {
      page.dataset.loading = false;

      this.service.manifest.update(seq, { width: img.width, height: img.height });

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

      if ( check_scroll || this.mode == 'thumbnail' ) { this.resizePage(page); }
      img.removeEventListener('load', _imgHandler, true);
    }.bind(this), true)

    img.src = image_url;

    if ( ! page.dataset.preloaded ) {
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

  bindEvents() {
  }

  bindPageEvents(page) {
  }

  config() {
    // the empty set supports everything
    return {};
  }

  destroy() {
    unbindAll(this.emitter);
  }

}

