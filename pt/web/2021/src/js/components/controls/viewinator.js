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

    const action = document.querySelector(this.input.view);
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

        if ( targetView != currentView ) {
          actionSelectSvg.innerHTML = possibles.view[targetView].querySelector('svg').innerHTML;
        }

        possibles.view[currentView].classList.remove('active');
        possibles.format[currentFormat].classList.remove('active');
        possibles.view[targetView].classList.add('active');
        possibles.format[targetFormat].classList.add('active');

        reader.options.format = targetFormat;

        reader.restart({ view: actualTargetView, format: targetFormat, clicked: 0 });

      }
    });

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
      actionSelectSvg.innerHTML = possibles.view[view].querySelector('svg').innerHTML;
    })

    if ( ! this.reader.service.hasOcr ) {
      self.disable('plaintext');
    }

    if ( ! ( this.reader.service.manifest.totalSeq > 1 ) ) {
      self.disable('flip');
      self.disable('thumb');
    }

  }

  enable(view) {
    this.possibles.view[view].classList.remove('disabled');
    this.possibles.view[view].setAttribute('aria-disabled', false);
  }

  disable(view) {
    this.possibles.view[view].classList.add('disabled');
    this.possibles.view[view].setAttribute('aria-disabled', true);
  }

}
