import { createNanoEvents } from 'nanoevents';
import Dropdown from 'bootstrap/js/dist/dropdown';

export var Searchinator = class {
  constructor(options={}) {
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = createNanoEvents();
    this.searchStart = 1;
    this.searchSize = 10;
    this.searchSort = 'seq';
    this.showHighlights = true;
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  emit(event, params={}) {
    this.emitter.emit(event, params);
  }

  clear() {
    setTimeout(() => {
      this.searchResultsContainer.innerHTML = '';
    }, 0);
    this.searchInput.value = '';
    this.searchStart = 1;
    this.searchPanel.dataset.hasResults = false;

    this.emit('update', { q1: null });
  }

  submit() {
    var self = this;

    let search_url = `/cgi/pt/search?id=${HT.params.id}&skin=2021&sz=25&q1=${this.searchInput.value}&start=${this.searchStart}&sort=${this.searchSort}`;
    if ( ! this.showHighlights ) {
      search_url += '&hl=false';
    }
    if ( HT.params.debug ) {
      search_url += `&debug=${HT.params.debug}`;
    }
    
    this.searchResultsContainer.innerHTML = '<div class="alert alert-info">Searching...</div>';
    HT.update_status(this.searchResultsContainer.innerText);

    this.clearButton.style.display = 'none';
    this.submitButton.classList.add('btn-loading');

    fetch(search_url, { credentials: 'include' })
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        var parser = new DOMParser();
        if ( String.prototype.replaceAll ) {
          html = html.replaceAll('<h3 class="results-header">', '<h4 class="results-header">').replaceAll('</h3>', '</h4>')
        }
        var doc = parser.parseFromString(html, 'text/html');
        var resultsContainer = doc.querySelector('.results-container');
        self.searchResultsContainer.innerHTML = '';
        // should also copy 'nav'
        [ '.alert', 'article', 'nav' ].forEach((expr) => {
          let tmp = resultsContainer.querySelectorAll(expr);
          for(var ix = 0; ix < tmp.length; ix++ ) {
            self.searchResultsContainer.appendChild(tmp[ix]);
          }
        })
        if ( self.searchResultsContainer.querySelectorAll('article').length > 0 ) {
          self.emit('update', { q1: this.searchInput.value });
          self.searchPanel.dataset.hasResults = true;
          self.emit('update', { q1: null });
        }

        this.submitButton.classList.remove('btn-loading');
        this.clearButton.style.display = null;

        const alertEl = self.searchResultsContainer.querySelector('.alert--summary,.alert-error');
        HT.update_status(alertEl.innerText);
        alertEl.focus();
      })
  }

  bindEvents() {
    var self = this;

    this.searchResultsContainer = document.querySelector(this.input.container);
    const searchForm = document.querySelector(this.input.form);
    this.searchInput = searchForm.querySelector('input[name="q1"]');
    this.submitButton = searchForm.querySelector('button[data-action="submit-search"]');
    this.clearButton = searchForm.querySelector('button[data-action="clear-search"]');
    this.searchPanel = document.querySelector(this.input.panel);

    this.searchResultsContainer.addEventListener('click', (event) => {
      if ( event.target.closest('a[data-seq]') ) {
        event.preventDefault();
        event.stopPropagation();
        var target = event.target.closest('a');
        var seq = target.dataset.seq;
        this.reader.display(seq);
        return;
      }

      if ( event.target.closest('a[data-start]') ) {
        event.preventDefault();
        event.stopPropagation();
        var target = event.target.closest('a');
        this.searchStart = target.dataset.start;
        this.submit();
        return;        
      }

      if ( event.target.closest('button[data-action="sort"]') ) {
        event.preventDefault();
        event.stopPropagation();
        var target = event.target.closest('button');
        var value = target.dataset.value;
        if ( value != this.searchSort ) {
          this.searchSort = value;
          this.submit();
        }
        return;
      }

      if ( event.target.closest('button[data-action="toggle-highlights"]') ) {
        event.preventDefault();
        event.stopPropagation();
        var target = event.target.closest('button');
        target.classList.toggle("active");
        target.setAttribute('aria-pressed', target.classList.contains('active'));
        this.showHighlights = ! this.showHighlights;
        document.body.dataset.showHighlights = this.showHighlights;
        document.body.classList.toggle('hide-highlights', ! this.showHighlights);
        target.setAttribute('aria-label', 
          this.showHighlights ? 
          target.dataset.toggledLabel :
          target.dataset.untoggledLabel
        );
        target._tippy.setContent(target.getAttribute('aria-label'));

        return;
      }

      // if ( event.target.closest('button[data-action="clear-search"]') ) {
      //   event.preventDefault();
      //   event.stopPropagation();
      //   var target = event.target.closest('button');
      //   this.clear();
      //   return;
      // }


    })

    this.clearButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      var target = event.target.closest('button');
      this.clear();
    })

    this.searchResultsContainer.addEventListener('change', (event) => {
      const target = event.target.closest('input#action-start-jump');
      if ( target ) {
        const max = parseInt(target.max);
        const min = parseInt(target.min);
        const sz = parseInt(target.dataset.sz, 10);
        const value = parseInt(target.value, 10);

        if ( isNaN(value) || value > max || value < min ) {
          target.value = target.dataset.value;
          return;
        }

        const start = ( value - 1 ) * sz + 1;

        // resubmit the form
        this.searchStart = start;
        this.submit();
      }
    })

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submit();
    })

    const skipLink = document.querySelector('#skiplinks a[href="#input-search-text"]');
    if ( skipLink ) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        // this really shouldn't be here
        if ( document.body.dataset.sidebarState == 'closed' ) {
          document.body.dataset.sidebarState = 'open';
        }
        document.querySelector('#panel-search').open = true;
        document.querySelector('#input-search-text').focus();
      })
    }


  }

};