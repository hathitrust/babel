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



export function tooltippy(element, params = {}) {
  const custom = params.content;
  const label = element.getAttribute("aria-label");
  
  const content = custom || label;

  const tooltippy = tippy(element, {
    // content: (reference) => reference.getAttribute('aria-label'),
    content,
    appendTo: 'parent',
    interactive: true,
    aria: { 
      expanded: false, 
    },
    plugins: [hideOnEsc],
    // hideOnClick: true,
    placement: 'top',
    theme: 'pt',
    maxWidth: 'none',
    ...params
  });
  return {
    update(newParams) {
      tooltippy.setProps({content, ...newParams});
    },
    destroy() {
      tooltippy.destroy();
    },
  };
}
