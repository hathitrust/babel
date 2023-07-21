import { Tooltip } from 'bootstrap';

export function tooltip(node) {

  node.bs = new Tooltip(
    node,
    { 
      title: function() { return this.getAttribute('aria-label'); }, 
      container: node.dataset.bsContainer || 'body'
    }
  );

  const hide = function() { node.bs.hide(); }

  node.addEventListener('click', hide, { once: false });
  node.addEventListener('mouseleave', hide, { once: false });

  return { 
    destroy() {
      node.bs.disable();
      node.bs.dispose();
      node.removeEventListener('mouseleave', hide);
      node.removeEventListener('click', hide);
    }
  }
}