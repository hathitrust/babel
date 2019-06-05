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
    this.input.addEventListener('change', (event) => {
      this.output.classList.remove('updating');
      this.render('current-seq', this.input.value);
      this._renderCurrentPage(this.input.value);
      this.emitter.emit('updateLocation', { seq: this.input.value });
    })

    this.input.addEventListener('input', (event) => {
      this.output.classList.add('updating');
      this.render('current-seq', this.input.value);
      this._renderCurrentPage(this.input.value);
    })

    var pageNumRange = this.reader.service.manifest.pageNumRange();
    this._hasPageNum = ( pageNumRange != null );

    var promptHTML = `
    <p>Jump to a page scan by <strong>page number</strong> or <strong>page scan sequence</strong>.</p>
    <p><label for="navigator-jump" class="offscreen">Page number or sequence: </label><input id="navigator-jump" type="text" name="seq" class="input-medium" /></p>
    <h3>Hints</h3>
    <ul class="bullets">
      <li>Page numbers are entered as <tt><em>number</em></tt>, e.g. <strong><tt>10</tt></strong></li>
      <li>Page scan sequences are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
      <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
      <li>Use a page number between ${pageNumRange}</li>
      <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
      <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
    </ul>
    `;

    if ( ! pageNumRange ) {
      promptHTML = `
          <p>Jump to a page scan by <strong>page scan sequence</strong>.</p>
          <p><label for="navigator-jump" class="offscreen">Page sequence: </label><input id="navigator-jump" type="text" name="seq" class="input-medium" /></p>
          <h3>Hints</h3>
          <ul class="bullets">
            <li>Page scan sequences are entered as <tt><em>#number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
            <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
            <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
            <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
          </ul>
          `;
    }

    this.prompt.addEventListener('click', (event) => {
      event.preventDefault();
      var $dialog = bootbox.dialog(
        // `<p>Jump to which page scan?</p><p><input type="text" name="seq" class="input-medium" placeholder="Enter a page scan sequence (e.g. 1-${this.reader.service.manifest.totalSeq})" /></p>`,
        promptHTML,
        [
          { label: "Close", class: 'btn-dismiss' },
          {
            label: "Jump",
            class: 'btn-dismiss btn btn-primary',
            callback: function(modal) {
              var input = modal.modal.querySelector('input[name="seq"]');
              this.handleValue(input.value);
              return true;
            }.bind(this)
          }
        ],
        {
          header: "Jump to page scan"
        }
      );
      var input_seq = $dialog.modal.querySelector('input[name="seq"]');
      input_seq.addEventListener('keydown', function(event) {
        if ( event.keyCode == 13 ) {
          event.preventDefault();
          this.handleValue(input_seq.value);
          $dialog.closeModal();
        }
      }.bind(this));
    })

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

    this.reader.on('relocated', (params) => {
      this.render('current-seq', params.seq);
      this._renderCurrentPage(params.seq);
      this.input.value = params.seq;
      this.input.setAttribute('aria-valuenow', params.seq);

      var percent = Math.ceil((parseInt(params.seq, 10) / parseInt(this.input.max, 10)) * 100.0);
      this.input.setAttribute('aria-valuetext', `${percent}% • Page scan ${params.seq} of ${this.input.max}`);
    })

    if ( this.form && this.reader.service.manifest.pageNumRange() ) {
      this.reader.on('relocated', (params) => {
        var pageNum = this.reader.service.manifest.pageNum(params.seq);
        this.form.querySelector('input[type="text"]').value = pageNum || '';
      });
    }
  }

  handleValue(value) {
    var seq;
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
      this.reader.display(seq);
    }
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
}
