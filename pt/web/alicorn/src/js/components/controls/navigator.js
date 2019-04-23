import NanoEvents from 'nanoevents';

export var Navigator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.output = options.output;
    this.reader = options.reader;
    this.prompt = options.prompt;
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
      this.emitter.emit('updateLocation', { seq: this.input.value });
    })

    this.input.addEventListener('input', (event) => {
      this.output.classList.add('updating');
      this.render('current-seq', this.input.value);
    })

    this.prompt.addEventListener('click', (event) => {
      event.preventDefault();
      bootbox.dialog(
        `<p>Jump to which page scan?</p><p><input type="text" name="seq" class="input-medium" placeholder="Enter a page scan sequence (e.g. 1-${this.reader.service.manifest.totalSeq})" /></p>`,
        [ 
          { label: "Close", class: 'btn-dismiss' },
          { 
            label: "Jump", 
            class: 'btn-dismiss btn btn-primary',
            callback: function(modal) {
              var input = modal.modal.querySelector('input[name="seq"]');
              var seq = input.value;
              if ( seq && seq >= 1 && seq <= this.reader.service.manifest.totalSeq ) {
                this.reader.display(seq);
              }
              return true;
            }.bind(this)
          }
        ],
        {
          header: "Jump to page scan"
        }
      )
    })

    this.reader.on('relocated', (params) => {
      this.render('current-seq', params.seq);
      this.input.value = params.seq;
      this.input.setAttribute('aria-valuenow', params.seq);

      var percent = Math.ceil((parseInt(params.seq, 10) / parseInt(this.input.max, 10)) * 100.0);
      this.input.setAttribute('aria-valuetext', `${percent}% • Page scan ${params.seq} of ${this.input.max}`);
    })
  }

  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }
}
