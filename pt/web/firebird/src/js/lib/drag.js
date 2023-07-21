/**
 * @param {HTMLElement} node
 * @param {(event: PointerEvent) => void} callback
 */
export function drag(node, callback) {
  /** @param {PointerEvent} event */
  const pointerdown = (event) => {
    
    if ( event.target.closest('button') ) {
      return;
    }

    if (
      (event.pointerType === 'mouse' && event.button === 2) ||
      (event.pointerType !== 'mouse' && !event.isPrimary)
    )
      return;

    node.setPointerCapture(event.pointerId);

    event.preventDefault();

    dragging = true;

    const onpointerup = () => {
      dragging = false;

      node.setPointerCapture(event.pointerId);

      window.removeEventListener('pointermove', callback, false);
      window.removeEventListener('pointerup', onpointerup, false);
      // snapPane();
    };

    window.addEventListener('pointermove', callback, false);
    window.addEventListener('pointerup', onpointerup, false);
  };

  node.addEventListener('pointerdown', pointerdown, { capture: true, passive: false });

  return {
    destroy() {
      node.removeEventListener('pointerdown', pointerdown);
    }
  };
}
