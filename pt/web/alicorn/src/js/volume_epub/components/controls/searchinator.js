import NanoEvents from 'nanoevents';

export var Searchinator = class {
  constructor(options={}) {
    this.forms = [];
    this.reader = options.reader;
    this.q = '';
    this.emitter = new NanoEvents();
    options.inputs = options.inputs || [];
    for(var i = 0; i < options.inputs.length; i++) {
      this.bind(options.inputs[i]);
    }
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;

    self.$reader = document.querySelector('main#main');

    var body = document.body;
    body.addEventListener('click', function(event) {
      var target = event.target.closest('a');
      if ( ! target ) { return ; }

      if ( target.closest('.back-to-beginning-link') ) {
        event.preventDefault();
        event.stopPropagation();
        self.mode('reader');
        return;
      }

      if ( target.closest('article.result') ) {
        event.preventDefault();
        event.stopPropagation();
        var href = target.getAttribute('href');
        var fragment = href.split('#');
        var cfi = `epubcfi(${fragment.pop()})`;
        var highlight = target.dataset.highlight;
        sessionStorage.setItem('highlight', highlight);
        self.mode('reader');

        setTimeout(() => {
          self.$searchResults.scrollTop = 0;
          self.reader.emit('updateHighlights');
          self.reader._updateHistoryUrl({});
          setTimeout(() => {
            console.log("AHOY RESULTS gotoPage CLICK X", cfi);
            self.reader.view.rendition.display(cfi).then(() => {
              console.log("AHOY RESULTS gotoPage DONE X", cfi, self.reader.view.currentLocation());
            });
          }, 100);
        }, 100);

        return;
      }

      if ( target.dataset.trackingAction == 'PT Back to In Item Results' ) {
        event.preventDefault();
        event.stopPropagation();
        
        self.mode('search-results');

        return false;
      }

      // https://roger-full.babel.hathitrust.org/cgi/pt/search?q1=education;id=test.9781469642215;view=1up;seq=1;start=11;sz=10;page=search;orient=0
      if ( target.closest('.pagination-container') ) {
        event.preventDefault();
        event.stopPropagation();

        self._submit(target.getAttribute('href'));
        return;
      }

    })
  }

  bind(form) {
    this.forms.push(form);
  }

  submit(form) {
    var self = this;
    var input = form.querySelector('input[name="q1"]');
    var button = form.querySelector('button[type="submit"]');

    if ( input.value.trim() == this.q && this.$searchResults ) {
      this.enable(button);
      this.mode('search-results');
      return;
    }

    this.q = input.value.trim();
    this.updateQ();

    this.disable(button);

    var params = new URLSearchParams([...(new FormData(form))]);
    this._submit(`/cgi/pt/search?${params}`, function() {
      self.enable(button);
    });
  }

  _submit(search_url, callback) {
    var self = this;

    fetch(search_url, { 
      credentials: 'include'
    })
    .then(function(response) {
      return response.text();
    })
    .then(function(html) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var $searchResults = doc.querySelector('main');
      $searchResults.setAttribute('id', 'search-results');

      if ( self.$searchResults ) {
        self.$searchResults.replaceWith($searchResults);
      } else {
        self.$reader.after($searchResults);
      }
      self.$searchResults = document.querySelector('main#search-results');
      self.mode('search-results');

      if ( callback ) { callback(); }

      // this is why?
      var toggleButton = self.$searchResults.querySelector(".sidebar-toggle-button");
      if ( toggleButton.offsetHeight == 0 && 
           ( document.documentElement.classList.contains('ios') || 
             document.documentElement.classList.contains('safari') ) ) {
        toggleButton.classList.add('stupid-hack');
      }
    })
    .catch(function(err) {
      console.warn("Could not submit search:", err);
    })
  }

  updateQ() {
    this.forms.forEach((form) => {
      form.querySelector('input[name="q1"]').value = this.q;
    })
  }

  enable(button) {
    button.classList.remove('btn-loading');
    button.disabled = false;
  }

  disable(button) {
    button.classList.add('btn-loading');
    button.disabled = true;
  }

  mode(mode_) {
    document.documentElement.dataset.sidebarExpanded = false;
    document.documentElement.dataset.mode = mode_;
    this._setVisibility(this.$reader, mode_ == 'reader');
    this._setVisibility(this.$searchResults, mode_ == 'search-results');
    HT.toggle(false);
  }

  _setVisibility(main, visible) {
    if ( visible ) {
      main.setAttribute('aria-hidden', false);
      main.removeAttribute('tabindex');
    } else {
      main.setAttribute('aria-hidden', true);
      main.setAttribute('tabindex', '-1');
    }
  }

}