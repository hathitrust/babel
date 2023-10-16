const setHeight = function(details, open=false) {
  details.open = open;
  const rect = details.getBoundingClientRect();
  details.dataset.width = rect.width;
  if ( open ) { details.dataset.panelHeight = details.querySelector('.panel').offsetHeight ; }
  details.style.setProperty(open ? `--expanded` : `--collapsed`,`${rect.height}px`);   
}

export var Accordion = class {

  static __details = [];
  static __openDetails;
  static __observer;

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
    if ( ! Accordion.__observer ) {
      Accordion.__observer = new ResizeObserver(entries => {
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
            const height = parseInt(details.dataset.panelHeight || 0, 10);
            if ( ! height || height != el.offsetHeight ) {
              el.dataset.panelHeight = el.offsetHeight;
              if ( el.offsetHeight > 0 ) {
                setTimeout(() => {
                  details.style.setProperty(`--expanded`,`${el.offsetHeight + summary.offsetHeight + 45}px`);
                }, 0);
              }
            }
            HT.log("-- panel", height, el.offsetHeight, entry.contentRect.height);
          }
        })
      });
    }
    Accordion.__observer.observe(this.el);
    Accordion.__observer.observe(this.el.querySelector('.panel'));
    Accordion.__details.push(this.el);

    this.el.addEventListener('toggle', (event) => {
      if ( this.el.open && this.el.dataset.interactive != 'false' ) {
        // close the other details
        if ( Accordion.__openDetails && Accordion.__openDetails != this.el ) {
          Accordion.__openDetails.open = false;
        }
        Accordion.__openDetails = this.el;
      }
    })
  }
}

Accordion.configure = function(selector, wrapper=document) {
  wrapper.querySelectorAll(selector).forEach((details) => {
    new Accordion(details);
  })
}