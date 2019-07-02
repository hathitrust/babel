import NanoEvents from 'nanoevents';

export var Zoominator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.scale = parseInt(options.scale || 1.0, 10);
    this.input = options.input;
    this.reader = options.reader;
    this._possibles = [ 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0 ];
    // this.possibles = [ 0.75, 1.0, 1.25, 1.5 ];
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  get possibles() {
    if ( this.reader && this.reader.view && this.reader.view.possibles ) {
      return this.reader.view.possibles;
    }
    return this._possibles;
  }

  bindEvents() {
    var self = this;
    this.input.zoom_in = this.input.querySelector('.action-zoom-in');
    this.input.zoom_in.addEventListener('click', function(event) {
      var idx = self.possibles.indexOf(self.scale);
      idx += 1;
      self.update(idx);
    })

    this.input.zoom_out = this.input.querySelector('.action-zoom-out');
    this.input.zoom_out.addEventListener('click', function(event) {
      var idx = self.possibles.indexOf(self.scale);
      idx -= 1;
      self.update(idx);
    })

    this.input.zoom_reset = this.input.querySelector('.action-zoom-reset');
    if ( this.input.zoom_reset ) {
      this.input.zoom_reset.addEventListener('click', function(event) {
        self.update(-1);
        // this.input.zoom_in.disabled = false;
        // this.input.zoom_out.disabled = false;
        // this.reader.emit('redraw', { scale: this.reader.options.bestFitScale });
      })
    }

    this.reader.on('configure', function(config) {
      if ( config.zoom === false ) {
        this.input.zoom_in.disabled = true;
        this.input.zoom_out.disabled = true;
      } else {
        this.scale = this.reader.view.scale || 1.0;
        var idx = this.possibles.indexOf(this.scale);
        this.input.zoom_in.disabled = ( idx == ( this.possibles.length - 1 ) );
        this.input.zoom_out.disabled = ( idx == 0 );
      }
    }.bind(this));
  }

  update(idx) {
    this.scale = idx < 0 ? this.reader.options.bestFitScale : this.possibles[idx];
    this.input.zoom_in.disabled = ( idx == ( this.possibles.length - 1 ) );
    this.input.zoom_out.disabled = ( idx == 0 );
    this.reader.emit('redraw', { scale: this.scale });
    // this.reader.restart({ scale: this.scale });
  }

  check(value) {
    return this.possibles.indexOf(value) > -1;
  }
}
