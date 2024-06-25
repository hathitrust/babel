import { createNanoEvents } from 'nanoevents';

export var Jumpinator = class {
  constructor(options={}) {
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = createNanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this._bindSections();

    let action = document.querySelector(this.input.prompt);
    if ( ! action ) { return ; }

    var pageNumRange = this.reader.service.manifest.pageNumRange();
    this._hasPageNum = ( pageNumRange != null );

    var promptHTML = `
    <p>Jump to a page scan by <strong>page number</strong> or <strong>page scan sequence</strong>.</p>
    <div class="alert alert-error alert-block" role="alert" aria-atomic="true"></div>
    <p><label for="navigator-jump" class="offscreen">Page number or sequence: </label><input id="navigator-jump" aria-describedby="navigator-hint-info" type="text" name="seq" class="input-medium" /></p>
    <p class="offscreen" id="navigator-hint-info">Hints follow.</p>
    <h3>Hints</h3>
    <ul class="bullets">
      <li>Page numbers are entered as <tt><em>number</em></tt>, e.g. <strong><tt>10</tt></strong></li>
      <li>Page scan sequences are entered as <tt><em><span aria-hidden="true">#</span>number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
      <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
      <li>Use a page number between ${pageNumRange}</li>
      <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
      <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
    </ul>
    `;

    if ( ! pageNumRange ) {
      promptHTML = `
          <p>Jump to a page scan by <strong>page scan sequence</strong>.</p>
          <div class="alert alert-error alert-block" role="alert" aria-atomic="true" aria-live="assertive"></div>
          <p><label for="navigator-jump" class="offscreen">Page sequence: </label><input id="navigator-jump" type="text" name="seq" class="input-medium" /></p>
          <h3>Hints</h3>
          <ul class="bullets">
            <li>Page scan sequences are entered as <tt><em><span aria-hidden="true">#</span>number</em></tt>, e.g. <strong><tt>#10</tt></strong></li>
            <li>Use a page scan sequence between #1-#${this.reader.service.manifest.totalSeq}</li>
            <li>Use <tt>+</tt> to jump ahead by a number of pages, e.g. <strong><tt>+10</tt></strong></li>
            <li>Use <tt>-</tt> to jump back by a number of pages, e.g. <strong><tt>-10</tt></strong></li>
          </ul>
          `;
    }

    action.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

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
              var retval = this.handleValue(input.value);
              if ( retval ) {
                return true;
              }
              this.handleError($dialog);
              return false;
            }.bind(this)
          }
        ],
        {
          header: "Jump to page scan",
          onShow: function(modal) {
            // modal.querySelector("input[name='seq']").value = '#' + seq;
            modal.querySelector("input[name='seq']").focus();
          }
        }
      );
      var input_seq = $dialog.modal.querySelector('input[name="seq"]');
      input_seq.addEventListener('keydown', function(event) {
        if ( event.keyCode == 13 ) {
          event.preventDefault();
          var retval = this.handleValue(input_seq.value);
          if ( retval ) {
            $dialog.closeModal();
            return;            
          }
          this.handleError($dialog);
        }
      }.bind(this));

    })
  }

  handleValue(value) {
    var seq; var retval = true;
    if ( value.substr(0, 1) == '+' || value.substr(0, 1) == '-' ) {
      var delta = value.substr(0, 1) == '+' ? +1 : -1;
      value = parseInt(value.substr(1), 10);
      this.reader.jump(delta * value);
      return true;
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

  _bindSections() {
    const panelSections = document.querySelector(this.input.sections);
    panelSections.addEventListener('click', (event) => {
      if ( event.target.closest("a[data-seq]") ) {
        event.preventDefault();
        event.stopPropagation();
        var target = event.target.closest("a");
        var seq = target.dataset.seq;
        this.reader.display(seq);
      }
    })

  }

};