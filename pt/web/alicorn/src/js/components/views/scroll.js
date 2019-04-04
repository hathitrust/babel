import NanoEvents from 'nanoevents';

export var View = class {
  constructor(options={}) {
    this.service = options.service;
    this.reader = options.reader;
    this.scale = options.scale || 1.0;
    this.mode = 'scroll';
    this.emitter = new NanoEvents();
  }

  attachTo(element) {
    this.container = element;
    this.bindEvents();
    this.render();
  }

  render() {
    var minWidth = this.container.parentNode.offsetWidth * 0.80;
    var ratio = this.service.manifest.defaultImage.height / this.service.manifest.defaultImage.width;
    var scale = this.scale;
    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {
      var page = document.createElement('div');
      page.style.height = `${minWidth * ratio * scale}px`;
      page.style.width = `${minWidth * scale}px`;
      page.dataset.bestFit = ( scale <= 1 );

      // if ( $main.dataset.view == 'image' ) {
      //   page.style.marginLeft = `-${(min_width * r * scale) / 2}px`;
      // }

      // if ( $main.dataset.view == 'image' ) {
      //   page.style.top = '0px';
      //   page.style.left = `${- ( item.seq - 1 ) * min_width}px`;
      // }

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      this.container.appendChild(page);
    }

    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      if ( this.mode == 'image' ) {
        pages[i].dataset.visible = false;
        this.observer.inactive = true;
      } else {
        this.observer.observe(pages[i]);
      }
    }

    this.is_active = true;
    this.loadImage(this.container.querySelector('[data-seq="1"]'), true);
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

  resizePage(page) {
    var canvas = page.querySelector('img');
    if ( ! canvas ) { return ; }

    if ( page.dataset.loading !== 'false' ) {
      return;
    }

    var bounds = this.container.getBoundingClientRect();
    var rect = page.getBoundingClientRect();

    if ( canvas.height < parseInt(page.style.height) ) {
      console.log("AHOY shrinking", page.dataset.seq, page.style.height, canvas.height);
    }
    page.style.height = `${canvas.height}px`;
    var updated_rect = page.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;

    if ( this.mode == '1up' && rect.bottom <= bounds.bottom && rect.top < 0 ) {
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

  loadImage(page, check_scroll) {
    if ( ! this.is_active ) { return ; }
    var seq = page.dataset.seq;
    var rect = page.getBoundingClientRect();

    console.log("AHOY LOADING", seq);

    // var image_url = `/cgi/imgsrv/image?id=${HT.params.id};seq=${seq};size=100`;
    var image_url = this.service.image({ seq: seq, width: page.offsetWidth });
    var html_url = this.service.html({ seq: seq });

    if ( page.querySelector('img') ) {
      // preloadImages(page);
      return;
    }

    var html_request = fetch(html_url);

    var page_height = page.offsetHeight;
    var page_width = page.offsetWidth;

    var img = new Image();
    img.alt = `Page scan of sequence ${seq}`;

    page.dataset.loading = true;
    img.addEventListener('load', function() {
      page.dataset.loading = false;
      // /fitImageOn(canvas, this);

      var imageAspectRatio = img.width / img.height;
      img.style.width = page_width;
      img.style.height = page_width / imageAspectRatio;
      page.appendChild(img);

      html_request
        .then(function(response) {
          return response.text();
        })
        .then(function(text) {
          var page_text = page.querySelector('.page-text');
          page_text.innerHTML = text;
        });


      if ( check_scroll || this.mode == 'thumbnail' ) { this.resizePage(page); }
      // var updated_rect = page.getBoundingClientRect();
      // if ( check_scroll && rect.bottom <= bounds.bottom && rect.top < 0 ) {
      //   delta = updated_rect.height - rect.height;
      //   // delta /= this.settings.scale;
      //   // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
      //   $viewer.scrollTop += Math.ceil(delta);
      // } else {
      //   console.log("AHOY NO CHANGE?")
      // }
    }.bind(this))

    img.src = image_url;

    if ( ! page.dataset.preloaded ) {
      this.preloadImages(page);
    }
  }

  unloadImage(page) {
    if ( page.dataset.preloaded ) { return; }
    if ( page.dataset.loading ) { return ; }
    var canvas = page.querySelector('img');
    if ( canvas ) {
      page.removeChild(canvas);
    }
    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = '';
    page.dataset.preloaded = false;
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

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this.observer = new IntersectionObserver(this.handleObserver.bind(this), {
        root: this.container,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    });
  }

};