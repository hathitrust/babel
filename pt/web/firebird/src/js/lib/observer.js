export const default_callback = ({ entry, observer }) => {
  const el = entry.target;
  if (entry.isIntersecting) {
    el.dispatchEvent(
      new CustomEvent('intersecting', {
        detail: entry,
      })
    );
    if (el.dataset.ioOnce === 'true') {
      observer.unobserve(el);
    }
  } else {
    el.dispatchEvent(
      new CustomEvent('unintersecting', {
        detail: entry,
      })
    );
  }
};
const default_options = {
  root: null,
  rootMargin: '0px',
  callback: default_callback,
};
export function createObserver(options = {}) {
  let io = {
    disconnect: () => null,
  };
  let observer;
  const { callback, showRootBound, ...io_options } = {
    ...default_options,
    ...options,
  };
  const cb = (entries, observer) => {
    entries.forEach((entry) => {
      callback({
        entry,
        observer,
      });
    });
  };
  if (typeof window !== 'undefined') {
    io = new IntersectionObserver(cb, io_options);
    observer = (node, { once = false } = {}) => {
      node.dataset.ioOnce = once.toString();
      io.observe(node);
      observer.observedIdx += 1;
      // console.log("-- observer.add", observer.observedIdx, observer.totalIdx);
      return {
        update(nextOption) {
          const current_once = node.dataset.ioOnce;
          const next_once = nextOption.once.toString();

          // re-observe this node if 'once' is disabled
          if (current_once === 'true' && next_once === 'false') {
            io.observe(node);
          }
          node.dataset.ioOnce = next_once;
        },
        destroy() {
          // should make this a flag
          // io.unobserve(node);
        },
      };
    };
  }
  return {
    observer,
    io,
  };
}
