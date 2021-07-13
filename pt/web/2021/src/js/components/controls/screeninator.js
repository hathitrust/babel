import screenfull from 'screenfull';
import { createNanoEvents } from 'nanoevents';

export var Screeninator = class {
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
    let action = document.querySelector(this.input.fullscreen);
    if ( action ) {
      if ( screenfull.isEnabled ) {
        const el = this.reader.$root.parentNode; // document.documentElement
        action.addEventListener('click', (event) => {
          let target = event.target.closest('button');
          screenfull.toggle(el).then((args) => {
            // this._updateState(target);
          })
        })

        screenfull.on('change', (event) => {
          document.body.dataset.fullscreen = screenfull.isFullscreen;
          this._updateState(action);
        })

      } else {
        action.style.display = 'none';
      }
    }
  }

  _updateState(target) {
    target.setAttribute('aria-label', 
      screenfull.isFullscreen ? 
      target.dataset.toggledLabel :
      target.dataset.untoggledLabel
    );
    target._tippy.setContent(target.getAttribute('aria-label'));
  }

};