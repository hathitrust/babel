import Shepherd from 'shepherd.js';
import { createNanoEvents } from 'nanoevents';

export var Helpinator = class {
  constructor(options={}) {
    this.input = options.input;
    this.reader = options.reader;
    this.steps = [];
    this.emitter = createNanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {

    this.configureTour();

    this.watchMediaQuery();

    let action = document.querySelector(this.input.trigger);
    action.addEventListener('click', (event) => {
      if ( event.shiftKey ) {
        this.configureTour(true);
        return;
      }
      this.tour.start();
    });

  }

  configureTour(doAlert) {
    const self = this;

    this.tour = new Shepherd.Tour({
      defaultStepOptions: {
        classes: 'shadow-md bg-purple-dark',
        scrollTo: false,
        popperOptions: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [ 0, 25 ]
              }
            }
          ]
        },
      },
      useModalOverlay: true
    });

    // hateful
    this.tour.on('cancel', (event) => {
      HT.analytics.trackEvent({
        category: 'PT.walkthrough',
        action: `${this.tour.currentStep.id}:exit`,
        label: `${this.tour.currentStep.id}:exit`
      })
    })

    // fetch data on startup
    const sourceUrl = '/cgi/pt/walkthrough-config/2021';
    fetch(sourceUrl)
      .then(response => response.json())
      .then(data => {
        data.forEach((step, idx, array) => {
          if ( step['attachTo'] && step['attachTo'].element.indexOf('#panel-') > -1 ) {
            // this is a panel
            step['when'] = {
              show: function() {
                const el = document.querySelector(step['attachTo'].element);
                if ( el.nodeName == 'DETAILS' ) {
                  setTimeout(() => {
                    el.open = true;
                  }, 100);
                }
              }
            }
          }

          if ( step['attachTo'] && step['attachTo'].element.indexOf('data-action') > -1 ) {
            step['attachTo'].element = `button[${step.attachTo.element}]`;
            step['showOn'] = function() {
              const seq = self.reader.view.currentSeq;
              const el = document.querySelector(`.page[data-seq="${seq}"] ${step.attachTo.element}`);
              if ( el ) {
                return true;
              }
              return false;
            }
          }

          if ( idx < array.length - 1 ) {
            step['buttons'] = [
              {
                text: 'Exit',
                secondary: true,
                action: self.tour.cancel
              },
              {
                text: 'Next',
                action: this.tour.next
              }
            ]
          } else {
            step['buttons'] = [
              {
                text: 'Done',
                action: this.tour.complete
              }
            ]
          }
          this.tour.addStep(step);
        })
        if ( doAlert ) {
          window.alert("Tour updated");
        }
      })
  }

  watchMediaQuery() {
    const mql = window.matchMedia('( max-width: 700px )');
    mql.addEventListener('change', (event) => {
      if ( event.matches ) {
        if ( this.tour && this.tour.isActive() ) {
          this.tour.cancel();
        }
      }
    })
  }
};
