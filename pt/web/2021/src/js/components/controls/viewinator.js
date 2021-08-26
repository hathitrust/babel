import { createNanoEvents } from 'nanoevents';

export var Viewinator = class {
  constructor(options={}) {
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = new createNanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;

    const action = this.action = document.querySelector(this.input.view);
    const reader = this.reader;
    let possibles = { format: {}, view: {} };
    this.possibles = possibles;

    action.parentElement.querySelectorAll('button[data-role]').forEach((button) => {
      const role = button.dataset.role;
      const value = button.dataset.value;
      possibles[role][value] = button;
    })

    action.addEventListener('show.bs.dropdown', (event) => {
      action._tippy.disable();
    })

    action.addEventListener('hide.bs.dropdown', (event) => {
      action._tippy.enable();
    })

    var actionSelectSvg = action.querySelector('svg');
    action.addEventListener('hidden.bs.dropdown', (event) => {
      if ( event.clickEvent ) {
        var target = event.clickEvent.target.closest("button");
        if ( ! target ) { return ; }
        var role = target.dataset.role;

        var currentView = reader.view.name;
        var currentFormat = reader.options.format;
        var targetView = currentView;
        var targetFormat = currentFormat;
        var actualTargetView = currentView;

        if ( role == 'format' ) {
          targetFormat = target.dataset.value;
        } else if ( role == 'view' ) {
          targetView = target.dataset.value;
          if ( targetView == 'page' ) {
            if ( currentFormat == 'plaintext' ) { actualTargetView = 'page'; }
            else { actualTargetView = 'page'; }
          } else {
            actualTargetView = targetView;
          }
        }

        // if ( targetView != currentView ) {
        //   actionSelectSvg.innerHTML = possibles.view[targetView].querySelector('svg').innerHTML;
        // }

        self.describe(targetView, targetFormat);

        possibles.view[currentView].classList.remove('active');
        possibles.format[currentFormat].classList.remove('active');
        possibles.view[targetView].classList.add('active');
        possibles.format[targetFormat].classList.add('active');

        reader.options.format = targetFormat;

        reader.restart({ view: actualTargetView, format: targetFormat, clicked: 0 });

      }
    });

    const accessPlaintextButton = document.querySelector(this.input.accessPlaintext);
    if ( accessPlaintextButton ) {
      accessPlaintextButton.addEventListener('click', (event) => {
        this.reader.restart({ view: 'page', format: 'plaintext'});
        return;
      })
    }

    this.reader.on('configure', function(config) {
      const view = self.reader.view.name;
      let currentViewItem;
      Object.keys(possibles.view).forEach((possible) => {
        if ( possibles.view[possible].classList.contains('active') ) {
          currentViewItem = possibles.view[possible];
        }
      })
      if ( currentViewItem && currentViewItem.dataset.view != view ) {
        currentViewItem.classList.remove('active');
      }
      possibles.view[view].classList.add('active');
      // actionSelectSvg.innerHTML = possibles.view[view].querySelector('svg').innerHTML;
      self.describe(view, self.reader.options.format);
    })

    if ( ! this.reader.service.hasOcr ) {
      self.disable('plaintext', 'format');
    }

    if ( ! ( this.reader.service.manifest.totalSeq > 1 ) ) {
      self.disable('2up');
      self.disable('thumb');
    }

  }

  enable(view) {
    if ( ! this.possibles[key][view] ) { return; }
    this.possibles.view[view].classList.remove('disabled');
    this.possibles.view[view].setAttribute('aria-disabled', false);
  }

  disable(view, key='view') {
    if ( ! this.possibles[key][view] ) { return; }
    this.possibles[key][view].classList.add('disabled');
    this.possibles[key][view].setAttribute('aria-disabled', true);
  }

  describe(view, format) {
    const svg = this.action.querySelector('svg');
    const span = this.action.querySelector('span[data-role="description"]');
    const currentView = this.possibles.view[view];
    const currentFormat = this.possibles.format[format];
    span.innerText = `${currentView.innerText.trim()}/${currentFormat.innerText.trim()}`;
    svg.innerHTML = currentView.querySelector('svg').innerHTML;
  }

}
