var HT = window.HT || {};
HT.controls = HT.controls || {};

HT.controls.Navigator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.output = options.output;
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this.input.addEventListener('change', function(event) {
      var seq = this.value;
      // gotoPage(seq);
    })
  }
}
