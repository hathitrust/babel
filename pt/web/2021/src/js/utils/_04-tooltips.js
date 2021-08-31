head.ready(function() {

  // initialize tooltips
  tippy.delegate('#root', {
    target: '[data-tippy-role="tooltip"]',
    interactive: true,
    content: (reference) => {
      // reference.dataset.untoggledLabel = reference.getAttribute('aria-label');
      // return reference.dataset.untoggledLabel;
      if ( reference.dataset.toggledLabel && ! reference.dataset.untoggledLabel ) {
        reference.dataset.untoggledLabel = reference.getAttribute('aria-label');
      }
      return reference.getAttribute('aria-label');
    },
    theme: 'hathitrust'
  });

  setTimeout(() => {
    document.querySelectorAll('.share-toolbar button').forEach((button) => {
      button.dataset.tippyRole = 'tooltip';
      button.dataset.role = null;
    })
  }, 100);

});