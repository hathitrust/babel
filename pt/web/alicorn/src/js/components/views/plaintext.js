import NanoEvents from 'nanoevents';
import {Single} from './image';

import debounce from 'lodash/debounce';

export var PlainText = class extends Single {
  constructor(options={}) {
    super(options);
    this.mode = 'plaintext';
  }

  render(cb) {
    // var minWidth = this.minWidth();
    // var scale = this.scale;
    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');

      // page.style.height = `${h}px`;
      // page.style.width = `${w}px`;
      page.dataset.bestFit = true;

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      this.container.appendChild(page);
    }

    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
    }

    this.is_active = true;
    this.loadImage(this.container.querySelector('[data-seq="1"]'), true);
    if ( cb ) {
      cb();
    }
  }

  loadImage(page, check_scroll) {
    if ( ! this.is_active ) { return ; }
    var seq = page.dataset.seq;
    var rect = page.getBoundingClientRect();

    var html_url = this.service.html({ seq: seq });

    if ( page.querySelectorAll('.page-text > *').length ) {
      return;
    }

    if ( page.dataset.loading == "true" ) {
      return;
    }

    var html_request;
    html_request = fetch(html_url);

    page.dataset.loading = true;
    html_request
      .then(function(response) {
        return response.text();
      })
      .then(function(text) {
        var page_text = page.querySelector('.page-text');
        page_text.innerHTML = text;
        page.dataset.loaded = true;

        if ( page_text.offsetHeight < page_text.scrollHeight ) {
          page.style.height = `${page_text.scrollHeight}px`;
        }

        var page_div = page_text.children[0];
        var words = page_div.dataset.words;
        if ( words !== undefined ) {
          words = JSON.parse(words);

          function textNodesUnder(el){
            var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
            while(n=walk.nextNode()) a.push(n);
            return a;
          }

          var textNodes = textNodesUnder(page_div);
          var spanClass = 'solr_highlight_1';
          textNodes.forEach(function(text) {
            var innerHTML = text.nodeValue.trim();
            if ( ! innerHTML ) { return; }
            words.forEach(function(word) {
              var pattern = new RegExp(`\\b(${word})\\b`, 'gis');
              var replaceWith = '<span' + ( spanClass ? ' class="' + spanClass + '"' : '' ) + '>$1</span>';
              innerHTML = innerHTML.replace(pattern, replaceWith);
            })
            if ( innerHTML == text.nodeValue.trim() ) { return; }
            text.parentElement.innerHTML = innerHTML;
          })
        }
      });

    if ( ! page.dataset.preloaded ) {
      this.preloadImages(page);
    }
  }

  unloadImage(page) {
    if ( page.dataset.preloaded == "true" ) { return; }
    if ( page.dataset.loading == "true" ) { return ; }
    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = '';
    page.dataset.preloaded = false;
    page.dataset.loaded = false;
  }

  bindEvents() {
    this._resizer = debounce(function() {
      // self.container.style.setProperty('--page-height', `${self.container.offsetHeight * 0.95 * self.scale}px`);
      // self.container.style.setProperty('--slice-width', `${self.container.offsetWidth * self.scale}px`)
      var loaded = this.container.querySelectorAll('[data-loaded="true"]');
      for(var i = 0; i < loaded.length; i++) {
        var page = loaded[i];
        var page_text = page.querySelector('.page-text');
        if ( page_text.offsetHeight < page_text.scrollHeight ) {
          page.style.height = `${page_text.scrollHeight}px`;
        }
      }
    }.bind(this), 50);

    this.reader.on('relocated', (params) => {
      this.reader.emit('status', `Showing page scan ${params.seq}`);
    });

    window.addEventListener('resize', this._resizer);

  }

  bindPageEvents(page) {
    page.dataset.visible = false;
  }

  destroy() {
    super.destroy();
    window.removeEventListener('resize', this._resizer);
  }

  config() {
    var retval = super.config();
    retval.rotate = false;
    retval.zoom = false;
    return retval;
  }


};
