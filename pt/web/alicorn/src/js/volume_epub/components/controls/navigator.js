import NanoEvents from 'nanoevents';

export var Navigator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.output = options.output;
    this.reader = options.reader;
    this.prompt = options.prompt;
    this.form = options.form;
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;

    this.input.addEventListener('change', (event) => {
      if ( self._ignore ) { self._ignore = false; console.log("AHOY NAVIGATOR IGNORING CHANGE"); return ; }
      console.log("AHOY NAVIGATOR change", event);
      this.output.classList.remove('updating');
      this._updateInputBackground();
      this.render('current-seq', this.input.value);
      this._renderCurrentPage(this.input.value);
      this.reader.trigger.push('control-navigator');
      this.emitter.emit('updateLocation', { value: this.input.value, trigger: 'control-navigator' });
    })

    this.input.addEventListener('input', (event) => {
      console.log("AHOY NAVIGATOR input", event);
      this.output.classList.add('updating');
      this.render('current-seq', this.input.value);
      this._renderCurrentPage(this.input.value);
    })

    // var pageNumRange = this.reader.service.manifest.pageNumRange();
    // this._hasPageNum = ( pageNumRange != null );

    // var promptHTML = `
    // <p>Jump to a page scan by <strong>page number</strong> or <strong>page scan sequence</strong>.</p>
    // <div class="alert alert-error alert-block" role="alert" aria-atomic="true"></div>
    // <p><label for="navigator-jump" class="offscreen">Page number or sequence: </label><input id="navigator-jump" aria-describedby="navigator-hint-info" type="text" name="seq" class="input-medium" /></p>
    // <p class="offscreen" id="navigator-hint-info">Hints follow.</p>
    // <h3>Hints</h3>
    // <ul class="bullets">
    //   <li>Page numbers are entered as <tt><em>number</em></tt>, e.g. <strong><tt>10</tt></strong></li>
    //   <li>Page scan sequences are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
    //   <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
    //   <li>Use a page number between ${pageNumRange}</li>
    //   <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
    //   <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
    // </ul>
    // `;

    // if ( ! pageNumRange ) {
    //   promptHTML = `
    //       <p>Jump to a page scan by <strong>page scan sequence</strong>.</p>
    //       <div class="alert alert-error alert-block" role="alert" aria-atomic="true" aria-live="assertive"></div>
    //       <p><label for="navigator-jump" class="offscreen">Page sequence: </label><input id="navigator-jump" type="text" name="seq" class="input-medium" /></p>
    //       <h3>Hints</h3>
    //       <ul class="bullets">
    //         <li>Page scan sequences are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
    //         <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
    //         <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
    //         <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
    //       </ul>
    //       `;
    // }

    // this.prompt.addEventListener('click', (event) => {
    //   event.preventDefault();
    //   var $dialog = bootbox.dialog(
    //     // `<p>Jump to which page scan?</p><p><input type="text" name="seq" class="input-medium" placeholder="Enter a page scan sequence (e.g. 1-${this.reader.service.manifest.totalSeq})" /></p>`,
    //     promptHTML,
    //     [
    //       { label: "Close", class: 'btn-dismiss' },
    //       {
    //         label: "Jump",
    //         class: 'btn-dismiss btn btn-primary',
    //         callback: function(modal) {
    //           var input = modal.modal.querySelector('input[name="seq"]');
    //           var retval = this.handleValue(input.value);
    //           if ( retval ) {
    //             return true;
    //           }
    //           this.handleError($dialog);
    //           return false;
    //         }.bind(this)
    //       }
    //     ],
    //     {
    //       header: "Jump to page scan",
    //       onShow: function(modal) {
    //         modal.querySelector("input[name='seq']").focus();
    //       }
    //     }
    //   );
    //   var input_seq = $dialog.modal.querySelector('input[name="seq"]');
    //   input_seq.addEventListener('keydown', function(event) {
    //     if ( event.keyCode == 13 ) {
    //       event.preventDefault();
    //       var retval = this.handleValue(input_seq.value);
    //       if ( retval ) {
    //         $dialog.closeModal();
    //         return;            
    //       }
    //       this.handleError($dialog);
    //     }
    //   }.bind(this));
    // })

    if ( this.form ) {
      var input = this.form.querySelector('input[type="text"]');
      this.form.addEventListener('submit', (event) => {
        event.preventDefault();
        var value = (input.value || '').trim();
        if ( ! value ) {
          return;
        }
        this.handleValue(value);
        return false;
      })
    }

    this.reader.on('ready', () => {
      this.reader.view.on('updateLocations', function(locations) {
        self._initiated = true;
        self._total = self.reader.view.locations.total;

        var max = self._total; var min = 1;
        if ( self.reader.view.locations.spine ) { max -= 1; min -= 1; }
        self.input.max = max; // setAttribute('max', max);
        self.input.min = min; // setAttribute('min', min);

        var value = self._parseLocation(self.reader.view.currentLocation());
        self.input.value = value;
        self._last_value = self.input.value

        self.render('current-seq', value);
        self.render('total-seq', self._total);
        self._updateInputBackground();
        self.input.setAttribute('aria-valuenow', value);

        var percent = Math.ceil((parseInt(value, 10) / parseInt(self.input.max, 10)) * 100.0);
        self.input.setAttribute('aria-valuetext', `${percent}% • Location ${value} of ${self.input.max}`);

      })
    })

    this.reader.on('relocated', function(location) {

      var value; var percentage;
      if ( ! self._initiated ) { return ; }
      if ( self._ignore ) { self._ignore = false; console.log("AHOY NAVIGATOR IGNORING relocated", self._ignore); return; }
      if ( ! ( location && location.start ) ) { return ; }

      var check = self.reader.view.currentLocation();
      console.log("AHOY NAVIGATOR check", check, location);

      var value;
      if ( location.start && location.end ) {
        // EPUB
        value = parseInt(self.input.value, 10);
        var start = parseInt(location.start.location, 10);
        var end = parseInt(location.end.location, 10);
        console.log("AHOY NAVIGATOR relocated", value, start, end, value < start, value > end, location);
        if ( value < start || value > end ) {
          self._last_value = value;
          value = ( value < start ) ? start : end;
        }
      }

      self._ignore = true;

      self.render('current-seq', value);
      self._renderCurrentPage(value);
      self.input.value = value;
      self._updateInputBackground();
      self.input.setAttribute('aria-valuenow', value);

      var percent = Math.ceil((parseInt(value, 10) / parseInt(self.input.max, 10)) * 100.0);
      self.input.setAttribute('aria-valuetext', `${percent}% Location ${value} of ${self.input.max}`);
    })

    // if ( this.form && this.reader.service.manifest.pageNumRange() ) {
    //   this.reader.on('relocated', (params) => {
    //     var pageNum = this.reader.service.manifest.pageNum(params.seq);
    //     this.form.querySelector('input[type="text"]').value = pageNum || '';
    //   });
    // }
  }

  handleValue(value) {
    var seq; var retval = true;
    if ( value.substr(0, 1) == '+' || value.substr(0, 1) == '-' ) {
      var delta = value.substr(0, 1) == '+' ? +1 : -1;
      value = parseInt(value.substr(1), 10);
      this.reader.jump(delta * value);
      return;
    }

    if ( value.substr(0, 2) == 'p.' ) {
      // sequence
      seq = this.reader.service.manifest.seq(value.substr(2));
    } else if ( value.substr(0, 1) == 'p' ) {
      seq = this.reader.service.manifest.seq(value.substr(1));
    } else if ( value.substr(0, 1) == '#' || value.substr(0, 1) == 'n' ) {
      seq = parseInt(value.substr(1), 10);
    } else {
      // seq = parseInt(value, 10);
      seq = this.reader.service.manifest.seq(value);
    }
    if ( seq && seq >= 1 && seq <= this.reader.service.manifest.totalSeq ) {
      this.reader.trigger.push('action-prompt-seq');
      this.reader.display(seq);
    } else {
      retval = false;
    }
    return retval;
  }

  handleError($dialog) {
    var div = $dialog.modal.querySelector('div[role="alert"]');
    var input = $dialog.modal.querySelector('input[name="seq"]');
    var value = input.value;
    var possible = '';
    var pageNumRange = this.reader.service.manifest.pageNumRange();
    if ( pageNumRange ) { possible = `page number between ${pageNumRange} or `; }
    possible += `a sequence between #1-#${this.reader.service.manifest.totalSeq}`;
    div.innerHTML = `<p>Could not find a page scan that matched ${value}; enter a ${possible}.`;
    input.focus();
  }

  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }

  _renderCurrentPage(value) {
    if ( false && this.reader.service.manifest.hasPageNum() ) {
      var page_num = this.reader.service.manifest.pageNum(value);
      if ( page_num ) {
        this.render('current-page-number', ` (${page_num})`);
      } else {
        this.render('current-page-number', '');
      }
    }
  }

  _updateInputBackground() {
    var val = parseInt(this.input.value, 10);
    var total = parseInt(this.input.max, 10);
    var p = Math.ceil(( ( val - 1 ) / ( total - 1 ) ) * 100);
    var fill = '#ff9f1a';
    var end = '#444';
    this.input.style.background = `linear-gradient(to right, ${fill} 0%, ${fill} ${p}%, ${end} ${p}%, ${end} 100%)`;
  }

  _parseLocation(location) {
    var self = this;
    var value;

    if ( typeof(location.start) == 'object' ) {
      if ( location.start.location != null ) {
        value = location.start.location;
      } else {
        var percentage = self._reader.locations.percentageFromCfi(location.start.cfi);
        value = Math.ceil(self._total * percentage);
      }
    } else {
      // PDF bug
      value = parseInt(location.start, 10);
    }

    return value;
  }
}
