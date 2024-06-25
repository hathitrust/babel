import { createNanoEvents } from 'nanoevents';

export var Zoominator = class {
  constructor(options={}) {
    this.scale = parseInt(options.scale || 1.0, 10);
    this.input = options.input;
    this.reader = options.reader;
    this._possibles = {};
    this._possibles.image = [ 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0 ];
    this._possibles.plaintext = [ 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0 ];
    this.emitter = new createNanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  get possibles() {
    if ( this.reader && this.reader.view && this.reader.view.possibles ) {
      return this.reader.view.possibles;
    }
    return this._possibles[this.reader.options.format];
  }

  bindEvents() {
    var self = this;

    document.addEventListener('click', function(event) {
      var target = event.target.closest('button');
      if ( ! target ) { return; }
      if ( target.classList.contains('action-zoom-in') ) {
        var idx = self.possibles.indexOf(self.scale);
        idx += 1;
        self.update(idx);
      } else if ( target.classList.contains('action-zoom-out') ) {
        var idx = self.possibles.indexOf(self.scale);
        idx -= 1;
        self.update(idx);
      } else if ( target.classList.contains('action-zoom-reset') ) {
        // self.update(-1);
        var idx = self.possibles.indexOf(1);
        self.update(idx);
      }
    })

    this.reader.on('configure', function(config) {
      if ( config.zoom === false ) {
        // this.input.zoom_in.disabled = true;
        // this.input.zoom_out.disabled = true;
        this.enable(document.querySelectorAll('.action-zoom-in'), false);
        this.enable(document.querySelectorAll('.action-zoom-out'), false);
        this.enable(document.querySelectorAll('.action-zoom-reset'), false);
      } else {
        this.scale = this.reader.view.scale || 1.0;
        var idx = this.possibles.indexOf(this.scale);
        if ( idx < 0 ) {
          idx = 0;
        }

        this.update(idx);

        // this.enable(document.querySelectorAll('.action-zoom-in'), ! ( idx == ( this.possibles.length - 1 )))
        // this.enable(document.querySelectorAll('.action-zoom-out'), ! ( idx == 0 ))

        // this.input.zoom_in.disabled = ( idx == ( this.possibles.length - 1 ) );
        // this.input.zoom_out.disabled = ( idx == 0 );
      }
    }.bind(this));
  }

  disable(elements) {
    elements.forEach((element) => {
      element.disabled = true;
    })
  }

  enable(elements, state) {
    elements.forEach((element) => {
      element.disabled = ! state;
    })
  }

  update(idx) {
    this.scale = this.possibles[idx];

    this.enable(document.querySelectorAll('.action-zoom-in'), ! ( idx == ( this.possibles.length - 1 )))
    this.enable(document.querySelectorAll('.action-zoom-out'), ! ( idx == 0 ))

    document.body.dataset.zoomedIn = ( this.scale > 1 );
    // document.body.dataset.zoomedScale = this.scale;

    // const fontSize = this.scale > 1 ? 1.25 * this.scale : 1.25;
    const fontSize = this.scale * 1.25;
    document.body.style.setProperty('--page-text-font-size', `${fontSize}rem`);

    this.reader.emit('redraw', { scale: this.scale });
  }

  check(value) {
    return this.possibles.indexOf(value) > -1;
  }
}
