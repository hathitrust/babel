(function($) {
    "use strict";

  const setHeight = function(details, open=false) {
    details.open = open;
    const rect = details.getBoundingClientRect();
    details.dataset.width = rect.width;
    if ( open ) { details.dataset.panelHeight = details.querySelector('.panel').offsetHeight ; }
    details.style.setProperty(open ? `--expanded` : `--collapsed`,`${rect.height}px`);   
  }

  let __details = [];
  let __openDetails;
  let __observer;

  const Accordion = class {

    constructor(el) {
      this.el = el;
      this.panel = el.querySelector('.panel');
      this.initialize();
    }

    initialize() {
      if ( ! window.ResizeObserver ) {
        // not supported; punt
        return;
      }
      if ( ! __observer ) {
        __observer = new ResizeObserver(entries => {
          return entries.forEach(entry => {
            const el = entry.target;
            if ( el.nodeName == 'DETAILS' ) {
              const width = parseInt(el.dataset.width, 10);
              var openState = el.open;
              // if (width !== entry.contentRect.width) {
              if ( width !== el.clientWidth ) {
                el.removeAttribute('style');
                setHeight(el);
                setHeight(el, true);
                el.open = el.dataset.interactive == 'false' ? true : openState;
              }
            } else if ( el.nodeName == 'DIV' ) {
              const details = el.closest('details');
              const summary = details.querySelector('summary');
              const panelHeight = parseInt(details.dataset.panelHeight || 0, 10);
              const offsetHeight = el.offsetHeight;

              requestAnimationFrame(() => {
                el.clientWidth; // force a reflow
                HT.log("-- panel check", panelHeight, offsetHeight, el.offsetHeight > 0);
                const updated_expanded = `${el.offsetHeight + summary.offsetHeight + 45}px`;
                const expanded = details.style.getPropertyValue('--expanded');
                if ( updated_expanded != expanded ) {
                  details.style.setProperty(`--expanded`, updated_expanded);
                }
              });
              HT.log("-- panel", panelHeight, el.offsetHeight, entry.contentRect.height);
            }
          })
        });
      }
      __observer.observe(this.el);
      __observer.observe(this.el.querySelector('.panel'));
      __details.push(this.el);

      this.el.addEventListener('toggle', (event) => {
        if ( this.el.open && this.el.dataset.interactive != 'false' ) {
          // close the other details
          if ( __openDetails && __openDetails != this.el ) {
            __openDetails.open = false;
          }
          __openDetails = this.el;
          requestAnimationFrame(() => {
            if ( this.el.dataset.ignoreScrollIntoView == 'true' ) {
              this.el.dataset.ignoreScrollIntoView = false;
              return;
            }
            this.el.scrollIntoView(true);
          })
        }
      })
    }
  }

  Accordion.configure = function(selector, wrapper=document) {
    wrapper.querySelectorAll(selector).forEach((details) => {
      new Accordion(details);
    })
  }

  $.Accordion = Accordion;

  window.addEventListener('load', (event) => {
    Accordion.configure('details[data-role="accordion"]');
  })

}(window, 32, 13));