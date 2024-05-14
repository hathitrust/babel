import { createNanoEvents } from 'nanoevents';

export var Minimizer = class {
  constructor(options={}) {
    this.input = options.input;
    this.emitter = createNanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    let action = document.querySelector(this.input.minimizer);
    if ( action ) {
      action.addEventListener('click', (event) => {
        const nextView = document.body.dataset.uiView == 'minimal' ? 'full' : 'minimal';
        document.body.dataset.uiView = nextView;
        action.setAttribute('aria-label', 
          nextView == 'minimal' ? 
          action.dataset.toggledLabel :
          action.dataset.untoggledLabel
        );
        action._tippy.setContent(action.getAttribute('aria-label'));
        HT.prefs.set({ pt: { uiView: document.body.dataset.uiView } });
      })
    }
  }

};