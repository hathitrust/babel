import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

const hideOnEsc = {
  name: 'hideOnEsc',
  defaultValue: true,
  fn({ hide }) {
    function onKeyDown(event) {
      if (event.keyCode === 27) {
        hide();
      }
    }

    return {
      onShow() {
        document.addEventListener('keydown', onKeyDown);
      },
      onHide() {
        document.removeEventListener('keydown', onKeyDown);
      },
    };
  },
};

export function tooltippy(element) {
  const tooltippy = tippy(element, {
    content: (reference) => reference.getAttribute('aria-label'),
    appendTo: document.body,
    interactive: true,
    plugins: [hideOnEsc],
    // hideOnClick: true,
    placement: 'top',
    theme: 'pt',
    maxWidth: 'none',
  });
  console.log('tippy', tooltippy);
  return {
    update(options) {
      tooltippy.setProps(options);
    },
    destroy() {
      tooltippy.destroy();
    },
  };
}
