
/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */

(function(window, document) {
'use strict';


// Exits early if all IntersectionObserver and IntersectionObserverEntry
// features are natively supported.
if ('IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype) {

  // Minimal polyfill for Edge 15's lack of `isIntersecting`
  // See: https://github.com/w3c/IntersectionObserver/issues/211
  if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
    Object.defineProperty(window.IntersectionObserverEntry.prototype,
      'isIntersecting', {
      get: function () {
        return this.intersectionRatio > 0;
      }
    });
  }
  return;
}


/**
 * An IntersectionObserver registry. This registry exists to hold a strong
 * reference to IntersectionObserver instances currently observing a target
 * element. Without this registry, instances without another reference may be
 * garbage collected.
 */
var registry = [];


/**
 * Creates the global IntersectionObserverEntry constructor.
 * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
 * @param {Object} entry A dictionary of instance properties.
 * @constructor
 */
function IntersectionObserverEntry(entry) {
  this.time = entry.time;
  this.target = entry.target;
  this.rootBounds = entry.rootBounds;
  this.boundingClientRect = entry.boundingClientRect;
  this.intersectionRect = entry.intersectionRect || getEmptyRect();
  this.isIntersecting = !!entry.intersectionRect;

  // Calculates the intersection ratio.
  var targetRect = this.boundingClientRect;
  var targetArea = targetRect.width * targetRect.height;
  var intersectionRect = this.intersectionRect;
  var intersectionArea = intersectionRect.width * intersectionRect.height;

  // Sets intersection ratio.
  if (targetArea) {
    // Round the intersection ratio to avoid floating point math issues:
    // https://github.com/w3c/IntersectionObserver/issues/324
    this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
  } else {
    // If area is zero and is intersecting, sets to 1, otherwise to 0
    this.intersectionRatio = this.isIntersecting ? 1 : 0;
  }
}


/**
 * Creates the global IntersectionObserver constructor.
 * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
 * @param {Function} callback The function to be invoked after intersection
 *     changes have queued. The function is not invoked if the queue has
 *     been emptied by calling the `takeRecords` method.
 * @param {Object=} opt_options Optional configuration options.
 * @constructor
 */
function IntersectionObserver(callback, opt_options) {

  var options = opt_options || {};

  if (typeof callback != 'function') {
    throw new Error('callback must be a function');
  }

  if (options.root && options.root.nodeType != 1) {
    throw new Error('root must be an Element');
  }

  // Binds and throttles `this._checkForIntersections`.
  this._checkForIntersections = throttle(
      this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

  // Private properties.
  this._callback = callback;
  this._observationTargets = [];
  this._queuedEntries = [];
  this._rootMarginValues = this._parseRootMargin(options.rootMargin);

  // Public properties.
  this.thresholds = this._initThresholds(options.threshold);
  this.root = options.root || null;
  this.rootMargin = this._rootMarginValues.map(function(margin) {
    return margin.value + margin.unit;
  }).join(' ');
}


/**
 * The minimum interval within which the document will be checked for
 * intersection changes.
 */
IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;


/**
 * The frequency in which the polyfill polls for intersection changes.
 * this can be updated on a per instance basis and must be set prior to
 * calling `observe` on the first target.
 */
IntersectionObserver.prototype.POLL_INTERVAL = null;

/**
 * Use a mutation observer on the root element
 * to detect intersection changes.
 */
IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;


/**
 * Starts observing a target element for intersection changes based on
 * the thresholds values.
 * @param {Element} target The DOM element to observe.
 */
IntersectionObserver.prototype.observe = function(target) {
  var isTargetAlreadyObserved = this._observationTargets.some(function(item) {
    return item.element == target;
  });

  if (isTargetAlreadyObserved) {
    return;
  }

  if (!(target && target.nodeType == 1)) {
    throw new Error('target must be an Element');
  }

  this._registerInstance();
  this._observationTargets.push({element: target, entry: null});
  this._monitorIntersections();
  this._checkForIntersections();
};


/**
 * Stops observing a target element for intersection changes.
 * @param {Element} target The DOM element to observe.
 */
IntersectionObserver.prototype.unobserve = function(target) {
  this._observationTargets =
      this._observationTargets.filter(function(item) {

    return item.element != target;
  });
  if (!this._observationTargets.length) {
    this._unmonitorIntersections();
    this._unregisterInstance();
  }
};


/**
 * Stops observing all target elements for intersection changes.
 */
IntersectionObserver.prototype.disconnect = function() {
  this._observationTargets = [];
  this._unmonitorIntersections();
  this._unregisterInstance();
};


/**
 * Returns any queue entries that have not yet been reported to the
 * callback and clears the queue. This can be used in conjunction with the
 * callback to obtain the absolute most up-to-date intersection information.
 * @return {Array} The currently queued entries.
 */
IntersectionObserver.prototype.takeRecords = function() {
  var records = this._queuedEntries.slice();
  this._queuedEntries = [];
  return records;
};


/**
 * Accepts the threshold value from the user configuration object and
 * returns a sorted array of unique threshold values. If a value is not
 * between 0 and 1 and error is thrown.
 * @private
 * @param {Array|number=} opt_threshold An optional threshold value or
 *     a list of threshold values, defaulting to [0].
 * @return {Array} A sorted list of unique and valid threshold values.
 */
IntersectionObserver.prototype._initThresholds = function(opt_threshold) {
  var threshold = opt_threshold || [0];
  if (!Array.isArray(threshold)) threshold = [threshold];

  return threshold.sort().filter(function(t, i, a) {
    if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
      throw new Error('threshold must be a number between 0 and 1 inclusively');
    }
    return t !== a[i - 1];
  });
};


/**
 * Accepts the rootMargin value from the user configuration object
 * and returns an array of the four margin values as an object containing
 * the value and unit properties. If any of the values are not properly
 * formatted or use a unit other than px or %, and error is thrown.
 * @private
 * @param {string=} opt_rootMargin An optional rootMargin value,
 *     defaulting to '0px'.
 * @return {Array<Object>} An array of margin objects with the keys
 *     value and unit.
 */
IntersectionObserver.prototype._parseRootMargin = function(opt_rootMargin) {
  var marginString = opt_rootMargin || '0px';
  var margins = marginString.split(/\s+/).map(function(margin) {
    var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
    if (!parts) {
      throw new Error('rootMargin must be specified in pixels or percent');
    }
    return {value: parseFloat(parts[1]), unit: parts[2]};
  });

  // Handles shorthand.
  margins[1] = margins[1] || margins[0];
  margins[2] = margins[2] || margins[0];
  margins[3] = margins[3] || margins[1];

  return margins;
};


/**
 * Starts polling for intersection changes if the polling is not already
 * happening, and if the page's visibility state is visible.
 * @private
 */
IntersectionObserver.prototype._monitorIntersections = function() {
  if (!this._monitoringIntersections) {
    this._monitoringIntersections = true;

    // If a poll interval is set, use polling instead of listening to
    // resize and scroll events or DOM mutations.
    if (this.POLL_INTERVAL) {
      this._monitoringInterval = setInterval(
          this._checkForIntersections, this.POLL_INTERVAL);
    }
    else {
      addEvent(window, 'resize', this._checkForIntersections, true);
      addEvent(document, 'scroll', this._checkForIntersections, true);

      if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
        this._domObserver = new MutationObserver(this._checkForIntersections);
        this._domObserver.observe(document, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }
  }
};


/**
 * Stops polling for intersection changes.
 * @private
 */
IntersectionObserver.prototype._unmonitorIntersections = function() {
  if (this._monitoringIntersections) {
    this._monitoringIntersections = false;

    clearInterval(this._monitoringInterval);
    this._monitoringInterval = null;

    removeEvent(window, 'resize', this._checkForIntersections, true);
    removeEvent(document, 'scroll', this._checkForIntersections, true);

    if (this._domObserver) {
      this._domObserver.disconnect();
      this._domObserver = null;
    }
  }
};


/**
 * Scans each observation target for intersection changes and adds them
 * to the internal entries queue. If new entries are found, it
 * schedules the callback to be invoked.
 * @private
 */
IntersectionObserver.prototype._checkForIntersections = function() {
  var rootIsInDom = this._rootIsInDom();
  var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

  this._observationTargets.forEach(function(item) {
    var target = item.element;
    var targetRect = getBoundingClientRect(target);
    var rootContainsTarget = this._rootContainsTarget(target);
    var oldEntry = item.entry;
    var intersectionRect = rootIsInDom && rootContainsTarget &&
        this._computeTargetAndRootIntersection(target, rootRect);

    var newEntry = item.entry = new IntersectionObserverEntry({
      time: now(),
      target: target,
      boundingClientRect: targetRect,
      rootBounds: rootRect,
      intersectionRect: intersectionRect
    });

    if (!oldEntry) {
      this._queuedEntries.push(newEntry);
    } else if (rootIsInDom && rootContainsTarget) {
      // If the new entry intersection ratio has crossed any of the
      // thresholds, add a new entry.
      if (this._hasCrossedThreshold(oldEntry, newEntry)) {
        this._queuedEntries.push(newEntry);
      }
    } else {
      // If the root is not in the DOM or target is not contained within
      // root but the previous entry for this target had an intersection,
      // add a new record indicating removal.
      if (oldEntry && oldEntry.isIntersecting) {
        this._queuedEntries.push(newEntry);
      }
    }
  }, this);

  if (this._queuedEntries.length) {
    this._callback(this.takeRecords(), this);
  }
};


/**
 * Accepts a target and root rect computes the intersection between then
 * following the algorithm in the spec.
 * TODO(philipwalton): at this time clip-path is not considered.
 * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
 * @param {Element} target The target DOM element
 * @param {Object} rootRect The bounding rect of the root after being
 *     expanded by the rootMargin value.
 * @return {?Object} The final intersection rect object or undefined if no
 *     intersection is found.
 * @private
 */
IntersectionObserver.prototype._computeTargetAndRootIntersection =
    function(target, rootRect) {

  // If the element isn't displayed, an intersection can't happen.
  if (window.getComputedStyle(target).display == 'none') return;

  var targetRect = getBoundingClientRect(target);
  var intersectionRect = targetRect;
  var parent = getParentNode(target);
  var atRoot = false;

  while (!atRoot) {
    var parentRect = null;
    var parentComputedStyle = parent.nodeType == 1 ?
        window.getComputedStyle(parent) : {};

    // If the parent isn't displayed, an intersection can't happen.
    if (parentComputedStyle.display == 'none') return;

    if (parent == this.root || parent == document) {
      atRoot = true;
      parentRect = rootRect;
    } else {
      // If the element has a non-visible overflow, and it's not the <body>
      // or <html> element, update the intersection rect.
      // Note: <body> and <html> cannot be clipped to a rect that's not also
      // the document rect, so no need to compute a new intersection.
      if (parent != document.body &&
          parent != document.documentElement &&
          parentComputedStyle.overflow != 'visible') {
        parentRect = getBoundingClientRect(parent);
      }
    }

    // If either of the above conditionals set a new parentRect,
    // calculate new intersection data.
    if (parentRect) {
      intersectionRect = computeRectIntersection(parentRect, intersectionRect);

      if (!intersectionRect) break;
    }
    parent = getParentNode(parent);
  }
  return intersectionRect;
};


/**
 * Returns the root rect after being expanded by the rootMargin value.
 * @return {Object} The expanded root rect.
 * @private
 */
IntersectionObserver.prototype._getRootRect = function() {
  var rootRect;
  if (this.root) {
    rootRect = getBoundingClientRect(this.root);
  } else {
    // Use <html>/<body> instead of window since scroll bars affect size.
    var html = document.documentElement;
    var body = document.body;
    rootRect = {
      top: 0,
      left: 0,
      right: html.clientWidth || body.clientWidth,
      width: html.clientWidth || body.clientWidth,
      bottom: html.clientHeight || body.clientHeight,
      height: html.clientHeight || body.clientHeight
    };
  }
  return this._expandRectByRootMargin(rootRect);
};


/**
 * Accepts a rect and expands it by the rootMargin value.
 * @param {Object} rect The rect object to expand.
 * @return {Object} The expanded rect.
 * @private
 */
IntersectionObserver.prototype._expandRectByRootMargin = function(rect) {
  var margins = this._rootMarginValues.map(function(margin, i) {
    return margin.unit == 'px' ? margin.value :
        margin.value * (i % 2 ? rect.width : rect.height) / 100;
  });
  var newRect = {
    top: rect.top - margins[0],
    right: rect.right + margins[1],
    bottom: rect.bottom + margins[2],
    left: rect.left - margins[3]
  };
  newRect.width = newRect.right - newRect.left;
  newRect.height = newRect.bottom - newRect.top;

  return newRect;
};


/**
 * Accepts an old and new entry and returns true if at least one of the
 * threshold values has been crossed.
 * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
 *    particular target element or null if no previous entry exists.
 * @param {IntersectionObserverEntry} newEntry The current entry for a
 *    particular target element.
 * @return {boolean} Returns true if a any threshold has been crossed.
 * @private
 */
IntersectionObserver.prototype._hasCrossedThreshold =
    function(oldEntry, newEntry) {

  // To make comparing easier, an entry that has a ratio of 0
  // but does not actually intersect is given a value of -1
  var oldRatio = oldEntry && oldEntry.isIntersecting ?
      oldEntry.intersectionRatio || 0 : -1;
  var newRatio = newEntry.isIntersecting ?
      newEntry.intersectionRatio || 0 : -1;

  // Ignore unchanged ratios
  if (oldRatio === newRatio) return;

  for (var i = 0; i < this.thresholds.length; i++) {
    var threshold = this.thresholds[i];

    // Return true if an entry matches a threshold or if the new ratio
    // and the old ratio are on the opposite sides of a threshold.
    if (threshold == oldRatio || threshold == newRatio ||
        threshold < oldRatio !== threshold < newRatio) {
      return true;
    }
  }
};


/**
 * Returns whether or not the root element is an element and is in the DOM.
 * @return {boolean} True if the root element is an element and is in the DOM.
 * @private
 */
IntersectionObserver.prototype._rootIsInDom = function() {
  return !this.root || containsDeep(document, this.root);
};


/**
 * Returns whether or not the target element is a child of root.
 * @param {Element} target The target element to check.
 * @return {boolean} True if the target element is a child of root.
 * @private
 */
IntersectionObserver.prototype._rootContainsTarget = function(target) {
  return containsDeep(this.root || document, target);
};


/**
 * Adds the instance to the global IntersectionObserver registry if it isn't
 * already present.
 * @private
 */
IntersectionObserver.prototype._registerInstance = function() {
  if (registry.indexOf(this) < 0) {
    registry.push(this);
  }
};


/**
 * Removes the instance from the global IntersectionObserver registry.
 * @private
 */
IntersectionObserver.prototype._unregisterInstance = function() {
  var index = registry.indexOf(this);
  if (index != -1) registry.splice(index, 1);
};


/**
 * Returns the result of the performance.now() method or null in browsers
 * that don't support the API.
 * @return {number} The elapsed time since the page was requested.
 */
function now() {
  return window.performance && performance.now && performance.now();
}


/**
 * Throttles a function and delays its execution, so it's only called at most
 * once within a given time period.
 * @param {Function} fn The function to throttle.
 * @param {number} timeout The amount of time that must pass before the
 *     function can be called again.
 * @return {Function} The throttled function.
 */
function throttle(fn, timeout) {
  var timer = null;
  return function () {
    if (!timer) {
      timer = setTimeout(function() {
        fn();
        timer = null;
      }, timeout);
    }
  };
}


/**
 * Adds an event handler to a DOM node ensuring cross-browser compatibility.
 * @param {Node} node The DOM node to add the event handler to.
 * @param {string} event The event name.
 * @param {Function} fn The event handler to add.
 * @param {boolean} opt_useCapture Optionally adds the even to the capture
 *     phase. Note: this only works in modern browsers.
 */
function addEvent(node, event, fn, opt_useCapture) {
  if (typeof node.addEventListener == 'function') {
    node.addEventListener(event, fn, opt_useCapture || false);
  }
  else if (typeof node.attachEvent == 'function') {
    node.attachEvent('on' + event, fn);
  }
}


/**
 * Removes a previously added event handler from a DOM node.
 * @param {Node} node The DOM node to remove the event handler from.
 * @param {string} event The event name.
 * @param {Function} fn The event handler to remove.
 * @param {boolean} opt_useCapture If the event handler was added with this
 *     flag set to true, it should be set to true here in order to remove it.
 */
function removeEvent(node, event, fn, opt_useCapture) {
  if (typeof node.removeEventListener == 'function') {
    node.removeEventListener(event, fn, opt_useCapture || false);
  }
  else if (typeof node.detatchEvent == 'function') {
    node.detatchEvent('on' + event, fn);
  }
}


/**
 * Returns the intersection between two rect objects.
 * @param {Object} rect1 The first rect.
 * @param {Object} rect2 The second rect.
 * @return {?Object} The intersection rect or undefined if no intersection
 *     is found.
 */
function computeRectIntersection(rect1, rect2) {
  var top = Math.max(rect1.top, rect2.top);
  var bottom = Math.min(rect1.bottom, rect2.bottom);
  var left = Math.max(rect1.left, rect2.left);
  var right = Math.min(rect1.right, rect2.right);
  var width = right - left;
  var height = bottom - top;

  return (width >= 0 && height >= 0) && {
    top: top,
    bottom: bottom,
    left: left,
    right: right,
    width: width,
    height: height
  };
}


/**
 * Shims the native getBoundingClientRect for compatibility with older IE.
 * @param {Element} el The element whose bounding rect to get.
 * @return {Object} The (possibly shimmed) rect of the element.
 */
function getBoundingClientRect(el) {
  var rect;

  try {
    rect = el.getBoundingClientRect();
  } catch (err) {
    // Ignore Windows 7 IE11 "Unspecified error"
    // https://github.com/w3c/IntersectionObserver/pull/205
  }

  if (!rect) return getEmptyRect();

  // Older IE
  if (!(rect.width && rect.height)) {
    rect = {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top
    };
  }
  return rect;
}


/**
 * Returns an empty rect object. An empty rect is returned when an element
 * is not in the DOM.
 * @return {Object} The empty rect.
 */
function getEmptyRect() {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0
  };
}

/**
 * Checks to see if a parent element contains a child element (including inside
 * shadow DOM).
 * @param {Node} parent The parent element.
 * @param {Node} child The child element.
 * @return {boolean} True if the parent node contains the child node.
 */
function containsDeep(parent, child) {
  var node = child;
  while (node) {
    if (node == parent) return true;

    node = getParentNode(node);
  }
  return false;
}


/**
 * Gets the parent node of an element or its host element if the parent node
 * is a shadow root.
 * @param {Node} node The node whose parent to get.
 * @return {Node|null} The parent node or null if no parent exists.
 */
function getParentNode(node) {
  var parent = node.parentNode;

  if (parent && parent.nodeType == 11 && parent.host) {
    // If the parent is a shadow root, return the host element.
    return parent.host;
  }

  if (parent && parent.assignedSlot) {
    // If the parent is distributed in a <slot>, return the parent of a slot.
    return parent.assignedSlot.parentNode;
  }

  return parent;
}


// Exposes the constructors globally.
window.IntersectionObserver = IntersectionObserver;
window.IntersectionObserverEntry = IntersectionObserverEntry;

}(window, document));


function NanoEvents () {
  /**
   * Event names in keys and arrays with listeners in values.
   * @type {object}
   *
   * @example
   * Object.keys(ee.events)
   *
   * @alias NanoEvents#events
   */
  this.events = { }
}
NanoEvents.prototype = {

  /**
   * Calls each of the listeners registered for a given event.
   *
   * @param {string} event The event name.
   * @param {...*} arguments The arguments for listeners.
   *
   * @return {undefined}
   *
   * @example
   * ee.emit('tick', tickType, tickDuration)
   *
   * @alias NanoEvents#emit
   * @method
   */
  emit: function emit (event) {
    var args = [].slice.call(arguments, 1)
    // Array.prototype.call() returns empty array if context is not array-like
    ;[].slice.call(this.events[event] || []).filter(function (i) {
      i.apply(this, args) // this === global or window
    })
  },

  /**
   * Add a listener for a given event.
   *
   * @param {string} event The event name.
   * @param {function} cb The listener function.
   *
   * @return {function} Unbind listener from event.
   *
   * @example
   * const unbind = ee.on('tick', (tickType, tickDuration) => {
   *   count += 1
   * })
   *
   * disable () {
   *   unbind()
   * }
   *
   * @alias NanoEvents#on
   * @method
   */
  on: function on (event, cb) {
    // if (process.env.NODE_ENV !== 'production' && typeof cb !== 'function') {
    //   throw new Error('Listener must be a function')
    // }

    (this.events[event] = this.events[event] || []).push(cb)

    return function () {
      this.events[event] = this.events[event].filter(function (i) {
        return i !== cb
      })
    }.bind(this)
  }
}
var HT = window.HT || {};
HT.controls = HT.controls || {};

HT.controls.Navigator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.output = options.output;
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this.input.addEventListener('change', function(event) {
      var seq = this.value;
      // gotoPage(seq);
    })
  }
}







var HT = window.HT || {};
HT.controls = HT.controls || {};

var Reader = class {
  constructor(options={}) {
    this.options = Object.assign({}, options);
    this.emitter = new NanoEvents();
    this.controls = {};
    this.bindEvents();
  }

  bindEvents() {
    /* NOOP */
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }
}

var reader = new Reader();

// var $viewer = document.querySelector('main section');
var $main = document.querySelector('main');
var $viewer = $main.querySelector('.viewer');
var $inner = $viewer.querySelector('.viewer-inner');
var is_active = false;
var scale = 0.75;
var image_width = 680;

reader.controls.navigator = new HT.controls.Navigator({
  input: document.querySelector('input[type="range"]'),
  output: document.querySelector('.navigator .output .current-seq')
})

// reader.on('gotoPage', function() {
//   console.log("AHOY gotoPage", arguments);
// })

reader.controls.navigator.on('gotoPage', function() {
  console.log("AHOY gotoPage", arguments);
})

var handleObserver = function(entries, observer) {
  var current = { page: null, ratio: 0 };
  entries.forEach(entry => {
    var div = entry.target;
    var seq = div.dataset.seq;
    var viewed = div.querySelector('img');
    if ( entry.isIntersecting && entry.intersectionRatio > 0.0  ) {
      console.log("AHOY OBSERVING", entries.length, seq, 'onEnter', entry.intersectionRatio);
      if ( entry.intersectionRatio > current.ratio ) {
        current.ration = entry.intersectionRatio;
        current.page = div;
      }
      if ( ! viewed ) {
        // console.log("AHOY OBSERVING", entries.length, seq, 'onEnter');
        loadImage(div, true);
      } else if (  div.dataset.preloaded ) {
        div.dataset.preloaded = false;
        resizePage(div);
      }
    } else if ( viewed && ! div.dataset.preloaded ) {
      console.log("AHOY OBSERVING", entries.length, seq, 'onExit');
      unloadImage(div);
    }
  })
  if ( current.page ) {
    update_navigator(current.page);
  }
};

var $observer = new IntersectionObserver(handleObserver, {
    root: $viewer,
    rootMargin: '0px',
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
});

var resizePage = function(page) {
  var canvas = page.querySelector('img');
  if ( ! canvas ) { return ; }

  if ( page.dataset.loading !== 'false' ) {
    return;
  }

  var bounds = $viewer.getBoundingClientRect();
  var rect = page.getBoundingClientRect();

  if ( canvas.height < parseInt(page.style.height) ) {
    console.log("AHOY shrinking", page.dataset.seq, page.style.height, canvas.height);
  }
  page.style.height = `${canvas.height}px`;
  var updated_rect = page.getBoundingClientRect();
  var scrollTop = $viewer.scrollTop;

  if ( $main.dataset.view == '1up' && rect.bottom <= bounds.bottom && rect.top < 0 ) {
    setTimeout(function() {
      delta = updated_rect.height - rect.height;
      if ( $viewer.scrollTop == scrollTop ) {
        // delta /= this.settings.scale;
        // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
        $viewer.scrollTop += Math.ceil(delta);
        console.log("AHOY afterResized", page.dataset.seq, scrollTop, $viewer.scrollTop, delta);
      } else {
        console.log("AHOY donotResized", page.dataset.seq, scrollTop, $viewer.scrollTop, delta);
      }
    }, 500);
  }
}

var fitImageOn = function(canvas, imageObj) {
  if ( ! canvas.parentNode ) {
    console.log("AHOY LOST PARENT", canvas.dataset.seq);
  }
  var imageAspectRatio = imageObj.width / imageObj.height;

  // canvas.width = canvas.height * imageAspectRatio;
  canvas.height = canvas.width / imageAspectRatio;
  // canvas.parentNode.style.height = `${canvas.height}px`;

  var context = canvas.getContext('2d');
  
  var canvasAspectRatio = canvas.width / canvas.height;
  var renderableHeight, renderableWidth, xStart, yStart;

  // If image's aspect ratio is less than canvas's we fit on height
  // and place the image centrally along width
  if(imageAspectRatio < canvasAspectRatio) {
    renderableHeight = canvas.height;
    renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
    xStart = (canvas.width - renderableWidth) / 2;
    yStart = 0;
    // console.log(`AHOY a : ${canvas.width} x ${canvas.height} / ${canvas.offsetHeight} :: ${renderableWidth} x ${renderableHeight}`);
  }

  // If image's aspect ratio is greater than canvas's we fit on width
  // and place the image centrally along height
  else if(imageAspectRatio > canvasAspectRatio) {

    renderableWidth = canvas.width
    renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
    xStart = 0;
    yStart = (canvas.height - renderableHeight) / 2;
  }

  // Happy path - keep aspect ratio
  else {
    
    renderableHeight = canvas.height;
    renderableWidth = canvas.width;
    xStart = 0;
    yStart = 0;
  }
  xStart = 0;
  yStart = 0;
  context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
  canvas.style.visibility = 'visible';
  // context.font = '48px monospace';
  // context.textAlign = 'center';
  // context.fillText('Hello world', canvas.width / 2, (canvas.height / 2) );
};

var loadImage = function(page, check_scroll) {
  if ( ! is_active ) { return ; }
  var seq = page.dataset.seq;
  var bounds = $viewer.getBoundingClientRect();
  var rect = page.getBoundingClientRect();

  console.log("AHOY LOADING", seq);

  // var image_url = `/cgi/imgsrv/image?id=${HT.params.id};seq=${seq};size=100`;
  var image_url = `/cgi/imgsrv/image?id=${HT.params.id};seq=${seq};width=${page.offsetWidth}`;
  var html_url = `/cgi/imgsrv/html?id=${HT.params.id};seq=${seq}`;

  if ( page.querySelector('img') ) {
    // preloadImages(page);
    return;
  }

  // var canvas = document.createElement('canvas');
  // canvas.dataset.seq = seq;

  var html_request = fetch(html_url);

  var page_height = page.offsetHeight;
  var page_width = page.offsetWidth;
  // canvas.height = page_height;
  // canvas.width = page_width;
  // canvas.style.visibility = 'hidden';
  // page.appendChild(canvas);

  var img = new Image();
  img.alt = `Page scan of sequence ${seq}`;

  page.dataset.loading = true;
  img.addEventListener('load', function() {
    page.dataset.loading = false;
    // /fitImageOn(canvas, this);

    var imageAspectRatio = img.width / img.height;
    img.style.width = page_width;
    img.style.height = page_width / imageAspectRatio;
    page.appendChild(img);

    html_request
      .then(function(response) {
        return response.text();
      })
      .then(function(text) {
        var page_text = page.querySelector('.page-text');
        page_text.innerHTML = text;
      });


    if ( check_scroll || $main.dataset.view == 'thumbnail' ) { resizePage(page); }
    // var updated_rect = page.getBoundingClientRect();
    // if ( check_scroll && rect.bottom <= bounds.bottom && rect.top < 0 ) {
    //   delta = updated_rect.height - rect.height;
    //   // delta /= this.settings.scale;
    //   // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
    //   $viewer.scrollTop += Math.ceil(delta);
    // } else {
    //   console.log("AHOY NO CHANGE?")
    // }
  })

  img.src = image_url;

  if ( ! page.dataset.preloaded ) {
    preloadImages(page);
  }
}

var unloadImage = function(page) {
  if ( page.dataset.preloaded ) { return; }
  if ( page.dataset.loading ) { return ; }
  var canvas = page.querySelector('img');
  if ( canvas ) {
    page.removeChild(canvas);
  }
  var page_text = page.querySelector('.page-text');
  page_text.innerHTML = '';
  page.dataset.preloaded = false;
}

var preloadImages = function(page) {
  var seq = parseInt(page.dataset.seq, 10);
  var delta = 1;
  while ( delta <= 1 ) {
    var prev_page = document.querySelector(`.page[data-seq="${seq - delta}"]`);
    if ( prev_page ) {
      prev_page.dataset.preloaded = true;
      loadImage(prev_page);
    }
    delta += 1;
  }
  delta = 1;
  while ( delta <= 1 ) {
    var next_page = document.querySelector(`.page[data-seq="${seq + delta}"]`);
    if ( next_page ) {
      next_page.dataset.preloaded = true;
      loadImage(next_page);
    }
    delta += 1;
  }
}

var getPage = function(seq) {
  return document.querySelector(`.page[data-seq="${seq}"]`);
}

var gotoPage = function(seq, delta) {
  var currentSeq = parseInt($navigator.input.value, 10);
  if ( ! seq ) {
    seq = currentSeq;
  }
  if ( delta ) {
    seq += delta;
  }

  var currentPage = getPage(currentSeq);
  console.log("AHOY AHOY", currentSeq, currentPage);
  if ( currentPage ) {
    // currentPage.addEventListener('animationend', function exitPage() {
    //   console.log("AHOY ANIMATION ENDED", currentPage);
    //   currentPage.classList.remove('pt-page-moveToLeft');
    //   currentPage.dataset.visible = false;
    //   currentPage.removeEventListener('animationend', exitPage);
    //   unloadImage(currentPage);
    // })
    // currentPage.classList.add('pt-page-moveToLeft');

    currentPage.dataset.visible = false;
    setTimeout(function() {
      unloadImage(currentPage);
    })
  }

  var target = getPage(seq);
  // target.addEventListener('animationend', function enterPage() {
  //   target.classList.remove('pt-page-moveFromRight');
  //   target.removeEventListener('animationend', enterPage);
  // })
  // target.classList.add('pt-page-moveFromRight');
  target.dataset.visible = true;
  target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop;
  if ( $observer.inactive ) { loadImage(target, true); update_navigator(target);}
  // target.scrollIntoView(false);
}

var nextPage = function() {
  gotoPage(null, 1);
}

var previousPage = function() {
  gotoPage(null, -1);
}

var update_navigator = function(page) {
  var seq = parseInt(page.dataset.seq, 10);
  $navigator.input.value = seq;
  var percentage = ( seq / $navigator.input.max ) * 100.0;
  $navigator.input.style.backgroundSize = `${percentage}% 100%`;
  // $navigator.status.setAttribute('style', 'background-position: ' + (-percentage) + '% 0%, left top;');
}

var min_height = $viewer.offsetHeight;
var min_width = $viewer.offsetWidth * 0.80;
$main.dataset.view = 'image';

if ( $main.dataset.view == 'thumbnail' ) {
  scale = 0.25;
}

var $data;
// fetch(`/cgi/imgsrv/meta?id=${HT.params.id}`)
//   .then(function(response) {
//     return response.json();
//   })
//   .then(function(data) {

//     $data = data;

//     $navigator.input.max = data.items.length;
//     $navigator.input.min = 1;
//     $navigator.input.style.backgroundSize = '0% 100%';
//     // $navigator.status.setAttribute('style', 'background-position: ' + (0) + '% 0%, left top;');

//     var meta = $data.items[0];
//     var r = meta.height / meta.width;

//     data.items.forEach(function(item) {
//       var page = document.createElement('div');
//       page.style.height = `${min_width * r * scale}px`;
//       page.style.width = `${min_width * scale}px`;
//       page.dataset.bestFit = ( scale <= 1 );

//       // if ( $main.dataset.view == 'image' ) {
//       //   page.style.marginLeft = `-${(min_width * r * scale) / 2}px`;
//       // }

//       // if ( $main.dataset.view == 'image' ) {
//       //   page.style.top = '0px';
//       //   page.style.left = `${- ( item.seq - 1 ) * min_width}px`;
//       // }

//       page.classList.add('page');
//       page.dataset.seq = item.seq;
//       page.innerHTML = `<div class="page-text"></div><div class="info">${item.seq}</div>`;
//       $inner.appendChild(page);
//     })

//     var pages = document.querySelectorAll('.page');
//     for(var i = 0; i < pages.length; i++) {
//       if ( $main.dataset.view == 'image' ) {
//         pages[i].dataset.visible = false;
//         $observer.inactive = true;
//       } else {
//         $observer.observe(pages[i]);
//       }
//     }

//     var page = document.querySelector('.page[data-seq="25"]');
//     setTimeout(function() {
//       is_active = true;
//       gotoPage(25);
//       // var offsetTop = page.offsetTop;
//       // $inner.scrollTop = offsetTop;
//     }, 100);
//   })
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImltZ3Nydi5qcyIsImludGVyc2VjdGlvbi1vYnNlcnZlci5qcyIsIm1hbmlmZXN0LmpzIiwibmFub2V2ZW50cy5qcyIsIm5hdmlnYXRvci5qcyIsInZpZXdzLmpzIiwidmlld3MvMXVwLmpzIiwidmlld3MvMnVwLmpzIiwidmlld3MvaW1hZ2UuanMiLCJ2aWV3cy9wbGFpbnRleHQuanMiLCJ2aWV3cy90aHVtYm5haWwuanMiLCJtYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1dEJBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FDQUE7QUNBQTtBQ0FBO0FDQUE7QUNBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIiLCIvKipcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFczQyBTT0ZUV0FSRSBBTkQgRE9DVU1FTlQgTk9USUNFIEFORCBMSUNFTlNFLlxuICpcbiAqICBodHRwczovL3d3dy53My5vcmcvQ29uc29ydGl1bS9MZWdhbC8yMDE1L2NvcHlyaWdodC1zb2Z0d2FyZS1hbmQtZG9jdW1lbnRcbiAqXG4gKi9cblxuKGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpIHtcbid1c2Ugc3RyaWN0JztcblxuXG4vLyBFeGl0cyBlYXJseSBpZiBhbGwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgYW5kIEludGVyc2VjdGlvbk9ic2VydmVyRW50cnlcbi8vIGZlYXR1cmVzIGFyZSBuYXRpdmVseSBzdXBwb3J0ZWQuXG5pZiAoJ0ludGVyc2VjdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cgJiZcbiAgICAnSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeScgaW4gd2luZG93ICYmXG4gICAgJ2ludGVyc2VjdGlvblJhdGlvJyBpbiB3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeS5wcm90b3R5cGUpIHtcblxuICAvLyBNaW5pbWFsIHBvbHlmaWxsIGZvciBFZGdlIDE1J3MgbGFjayBvZiBgaXNJbnRlcnNlY3RpbmdgXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3czYy9JbnRlcnNlY3Rpb25PYnNlcnZlci9pc3N1ZXMvMjExXG4gIGlmICghKCdpc0ludGVyc2VjdGluZycgaW4gd2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkucHJvdG90eXBlKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeS5wcm90b3R5cGUsXG4gICAgICAnaXNJbnRlcnNlY3RpbmcnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJzZWN0aW9uUmF0aW8gPiAwO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybjtcbn1cblxuXG4vKipcbiAqIEFuIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5LiBUaGlzIHJlZ2lzdHJ5IGV4aXN0cyB0byBob2xkIGEgc3Ryb25nXG4gKiByZWZlcmVuY2UgdG8gSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgaW5zdGFuY2VzIGN1cnJlbnRseSBvYnNlcnZpbmcgYSB0YXJnZXRcbiAqIGVsZW1lbnQuIFdpdGhvdXQgdGhpcyByZWdpc3RyeSwgaW5zdGFuY2VzIHdpdGhvdXQgYW5vdGhlciByZWZlcmVuY2UgbWF5IGJlXG4gKiBnYXJiYWdlIGNvbGxlY3RlZC5cbiAqL1xudmFyIHJlZ2lzdHJ5ID0gW107XG5cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeSBjb25zdHJ1Y3Rvci5cbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9JbnRlcnNlY3Rpb25PYnNlcnZlci8jaW50ZXJzZWN0aW9uLW9ic2VydmVyLWVudHJ5XG4gKiBAcGFyYW0ge09iamVjdH0gZW50cnkgQSBkaWN0aW9uYXJ5IG9mIGluc3RhbmNlIHByb3BlcnRpZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeShlbnRyeSkge1xuICB0aGlzLnRpbWUgPSBlbnRyeS50aW1lO1xuICB0aGlzLnRhcmdldCA9IGVudHJ5LnRhcmdldDtcbiAgdGhpcy5yb290Qm91bmRzID0gZW50cnkucm9vdEJvdW5kcztcbiAgdGhpcy5ib3VuZGluZ0NsaWVudFJlY3QgPSBlbnRyeS5ib3VuZGluZ0NsaWVudFJlY3Q7XG4gIHRoaXMuaW50ZXJzZWN0aW9uUmVjdCA9IGVudHJ5LmludGVyc2VjdGlvblJlY3QgfHwgZ2V0RW1wdHlSZWN0KCk7XG4gIHRoaXMuaXNJbnRlcnNlY3RpbmcgPSAhIWVudHJ5LmludGVyc2VjdGlvblJlY3Q7XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgaW50ZXJzZWN0aW9uIHJhdGlvLlxuICB2YXIgdGFyZ2V0UmVjdCA9IHRoaXMuYm91bmRpbmdDbGllbnRSZWN0O1xuICB2YXIgdGFyZ2V0QXJlYSA9IHRhcmdldFJlY3Qud2lkdGggKiB0YXJnZXRSZWN0LmhlaWdodDtcbiAgdmFyIGludGVyc2VjdGlvblJlY3QgPSB0aGlzLmludGVyc2VjdGlvblJlY3Q7XG4gIHZhciBpbnRlcnNlY3Rpb25BcmVhID0gaW50ZXJzZWN0aW9uUmVjdC53aWR0aCAqIGludGVyc2VjdGlvblJlY3QuaGVpZ2h0O1xuXG4gIC8vIFNldHMgaW50ZXJzZWN0aW9uIHJhdGlvLlxuICBpZiAodGFyZ2V0QXJlYSkge1xuICAgIC8vIFJvdW5kIHRoZSBpbnRlcnNlY3Rpb24gcmF0aW8gdG8gYXZvaWQgZmxvYXRpbmcgcG9pbnQgbWF0aCBpc3N1ZXM6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3czYy9JbnRlcnNlY3Rpb25PYnNlcnZlci9pc3N1ZXMvMzI0XG4gICAgdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA9IE51bWJlcigoaW50ZXJzZWN0aW9uQXJlYSAvIHRhcmdldEFyZWEpLnRvRml4ZWQoNCkpO1xuICB9IGVsc2Uge1xuICAgIC8vIElmIGFyZWEgaXMgemVybyBhbmQgaXMgaW50ZXJzZWN0aW5nLCBzZXRzIHRvIDEsIG90aGVyd2lzZSB0byAwXG4gICAgdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA9IHRoaXMuaXNJbnRlcnNlY3RpbmcgPyAxIDogMDtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIGNvbnN0cnVjdG9yLlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0ludGVyc2VjdGlvbk9ic2VydmVyLyNpbnRlcnNlY3Rpb24tb2JzZXJ2ZXItaW50ZXJmYWNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBhZnRlciBpbnRlcnNlY3Rpb25cbiAqICAgICBjaGFuZ2VzIGhhdmUgcXVldWVkLiBUaGUgZnVuY3Rpb24gaXMgbm90IGludm9rZWQgaWYgdGhlIHF1ZXVlIGhhc1xuICogICAgIGJlZW4gZW1wdGllZCBieSBjYWxsaW5nIHRoZSBgdGFrZVJlY29yZHNgIG1ldGhvZC5cbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0X29wdGlvbnMgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEludGVyc2VjdGlvbk9ic2VydmVyKGNhbGxiYWNrLCBvcHRfb3B0aW9ucykge1xuXG4gIHZhciBvcHRpb25zID0gb3B0X29wdGlvbnMgfHwge307XG5cbiAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnJvb3QgJiYgb3B0aW9ucy5yb290Lm5vZGVUeXBlICE9IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Jvb3QgbXVzdCBiZSBhbiBFbGVtZW50Jyk7XG4gIH1cblxuICAvLyBCaW5kcyBhbmQgdGhyb3R0bGVzIGB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnNgLlxuICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMgPSB0aHJvdHRsZShcbiAgICAgIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucy5iaW5kKHRoaXMpLCB0aGlzLlRIUk9UVExFX1RJTUVPVVQpO1xuXG4gIC8vIFByaXZhdGUgcHJvcGVydGllcy5cbiAgdGhpcy5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID0gW107XG4gIHRoaXMuX3F1ZXVlZEVudHJpZXMgPSBbXTtcbiAgdGhpcy5fcm9vdE1hcmdpblZhbHVlcyA9IHRoaXMuX3BhcnNlUm9vdE1hcmdpbihvcHRpb25zLnJvb3RNYXJnaW4pO1xuXG4gIC8vIFB1YmxpYyBwcm9wZXJ0aWVzLlxuICB0aGlzLnRocmVzaG9sZHMgPSB0aGlzLl9pbml0VGhyZXNob2xkcyhvcHRpb25zLnRocmVzaG9sZCk7XG4gIHRoaXMucm9vdCA9IG9wdGlvbnMucm9vdCB8fCBudWxsO1xuICB0aGlzLnJvb3RNYXJnaW4gPSB0aGlzLl9yb290TWFyZ2luVmFsdWVzLm1hcChmdW5jdGlvbihtYXJnaW4pIHtcbiAgICByZXR1cm4gbWFyZ2luLnZhbHVlICsgbWFyZ2luLnVuaXQ7XG4gIH0pLmpvaW4oJyAnKTtcbn1cblxuXG4vKipcbiAqIFRoZSBtaW5pbXVtIGludGVydmFsIHdpdGhpbiB3aGljaCB0aGUgZG9jdW1lbnQgd2lsbCBiZSBjaGVja2VkIGZvclxuICogaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5USFJPVFRMRV9USU1FT1VUID0gMTAwO1xuXG5cbi8qKlxuICogVGhlIGZyZXF1ZW5jeSBpbiB3aGljaCB0aGUgcG9seWZpbGwgcG9sbHMgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICogdGhpcyBjYW4gYmUgdXBkYXRlZCBvbiBhIHBlciBpbnN0YW5jZSBiYXNpcyBhbmQgbXVzdCBiZSBzZXQgcHJpb3IgdG9cbiAqIGNhbGxpbmcgYG9ic2VydmVgIG9uIHRoZSBmaXJzdCB0YXJnZXQuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5QT0xMX0lOVEVSVkFMID0gbnVsbDtcblxuLyoqXG4gKiBVc2UgYSBtdXRhdGlvbiBvYnNlcnZlciBvbiB0aGUgcm9vdCBlbGVtZW50XG4gKiB0byBkZXRlY3QgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5VU0VfTVVUQVRJT05fT0JTRVJWRVIgPSB0cnVlO1xuXG5cbi8qKlxuICogU3RhcnRzIG9ic2VydmluZyBhIHRhcmdldCBlbGVtZW50IGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcyBiYXNlZCBvblxuICogdGhlIHRocmVzaG9sZHMgdmFsdWVzLlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgVGhlIERPTSBlbGVtZW50IHRvIG9ic2VydmUuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIHZhciBpc1RhcmdldEFscmVhZHlPYnNlcnZlZCA9IHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5zb21lKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICByZXR1cm4gaXRlbS5lbGVtZW50ID09IHRhcmdldDtcbiAgfSk7XG5cbiAgaWYgKGlzVGFyZ2V0QWxyZWFkeU9ic2VydmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCEodGFyZ2V0ICYmIHRhcmdldC5ub2RlVHlwZSA9PSAxKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IG11c3QgYmUgYW4gRWxlbWVudCcpO1xuICB9XG5cbiAgdGhpcy5fcmVnaXN0ZXJJbnN0YW5jZSgpO1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMucHVzaCh7ZWxlbWVudDogdGFyZ2V0LCBlbnRyeTogbnVsbH0pO1xuICB0aGlzLl9tb25pdG9ySW50ZXJzZWN0aW9ucygpO1xuICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMoKTtcbn07XG5cblxuLyoqXG4gKiBTdG9wcyBvYnNlcnZpbmcgYSB0YXJnZXQgZWxlbWVudCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgRE9NIGVsZW1lbnQgdG8gb2JzZXJ2ZS5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLnVub2JzZXJ2ZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMgPVxuICAgICAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG5cbiAgICByZXR1cm4gaXRlbS5lbGVtZW50ICE9IHRhcmdldDtcbiAgfSk7XG4gIGlmICghdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmxlbmd0aCkge1xuICAgIHRoaXMuX3VubW9uaXRvckludGVyc2VjdGlvbnMoKTtcbiAgICB0aGlzLl91bnJlZ2lzdGVySW5zdGFuY2UoKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIFN0b3BzIG9ic2VydmluZyBhbGwgdGFyZ2V0IGVsZW1lbnRzIGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID0gW107XG4gIHRoaXMuX3VubW9uaXRvckludGVyc2VjdGlvbnMoKTtcbiAgdGhpcy5fdW5yZWdpc3Rlckluc3RhbmNlKCk7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBhbnkgcXVldWUgZW50cmllcyB0aGF0IGhhdmUgbm90IHlldCBiZWVuIHJlcG9ydGVkIHRvIHRoZVxuICogY2FsbGJhY2sgYW5kIGNsZWFycyB0aGUgcXVldWUuIFRoaXMgY2FuIGJlIHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGVcbiAqIGNhbGxiYWNrIHRvIG9idGFpbiB0aGUgYWJzb2x1dGUgbW9zdCB1cC10by1kYXRlIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvbi5cbiAqIEByZXR1cm4ge0FycmF5fSBUaGUgY3VycmVudGx5IHF1ZXVlZCBlbnRyaWVzLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUudGFrZVJlY29yZHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlY29yZHMgPSB0aGlzLl9xdWV1ZWRFbnRyaWVzLnNsaWNlKCk7XG4gIHRoaXMuX3F1ZXVlZEVudHJpZXMgPSBbXTtcbiAgcmV0dXJuIHJlY29yZHM7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyB0aGUgdGhyZXNob2xkIHZhbHVlIGZyb20gdGhlIHVzZXIgY29uZmlndXJhdGlvbiBvYmplY3QgYW5kXG4gKiByZXR1cm5zIGEgc29ydGVkIGFycmF5IG9mIHVuaXF1ZSB0aHJlc2hvbGQgdmFsdWVzLiBJZiBhIHZhbHVlIGlzIG5vdFxuICogYmV0d2VlbiAwIGFuZCAxIGFuZCBlcnJvciBpcyB0aHJvd24uXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxudW1iZXI9fSBvcHRfdGhyZXNob2xkIEFuIG9wdGlvbmFsIHRocmVzaG9sZCB2YWx1ZSBvclxuICogICAgIGEgbGlzdCBvZiB0aHJlc2hvbGQgdmFsdWVzLCBkZWZhdWx0aW5nIHRvIFswXS5cbiAqIEByZXR1cm4ge0FycmF5fSBBIHNvcnRlZCBsaXN0IG9mIHVuaXF1ZSBhbmQgdmFsaWQgdGhyZXNob2xkIHZhbHVlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9pbml0VGhyZXNob2xkcyA9IGZ1bmN0aW9uKG9wdF90aHJlc2hvbGQpIHtcbiAgdmFyIHRocmVzaG9sZCA9IG9wdF90aHJlc2hvbGQgfHwgWzBdO1xuICBpZiAoIUFycmF5LmlzQXJyYXkodGhyZXNob2xkKSkgdGhyZXNob2xkID0gW3RocmVzaG9sZF07XG5cbiAgcmV0dXJuIHRocmVzaG9sZC5zb3J0KCkuZmlsdGVyKGZ1bmN0aW9uKHQsIGksIGEpIHtcbiAgICBpZiAodHlwZW9mIHQgIT0gJ251bWJlcicgfHwgaXNOYU4odCkgfHwgdCA8IDAgfHwgdCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhyZXNob2xkIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZWx5Jyk7XG4gICAgfVxuICAgIHJldHVybiB0ICE9PSBhW2kgLSAxXTtcbiAgfSk7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyB0aGUgcm9vdE1hcmdpbiB2YWx1ZSBmcm9tIHRoZSB1c2VyIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgZm91ciBtYXJnaW4gdmFsdWVzIGFzIGFuIG9iamVjdCBjb250YWluaW5nXG4gKiB0aGUgdmFsdWUgYW5kIHVuaXQgcHJvcGVydGllcy4gSWYgYW55IG9mIHRoZSB2YWx1ZXMgYXJlIG5vdCBwcm9wZXJseVxuICogZm9ybWF0dGVkIG9yIHVzZSBhIHVuaXQgb3RoZXIgdGhhbiBweCBvciAlLCBhbmQgZXJyb3IgaXMgdGhyb3duLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nPX0gb3B0X3Jvb3RNYXJnaW4gQW4gb3B0aW9uYWwgcm9vdE1hcmdpbiB2YWx1ZSxcbiAqICAgICBkZWZhdWx0aW5nIHRvICcwcHgnLlxuICogQHJldHVybiB7QXJyYXk8T2JqZWN0Pn0gQW4gYXJyYXkgb2YgbWFyZ2luIG9iamVjdHMgd2l0aCB0aGUga2V5c1xuICogICAgIHZhbHVlIGFuZCB1bml0LlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3BhcnNlUm9vdE1hcmdpbiA9IGZ1bmN0aW9uKG9wdF9yb290TWFyZ2luKSB7XG4gIHZhciBtYXJnaW5TdHJpbmcgPSBvcHRfcm9vdE1hcmdpbiB8fCAnMHB4JztcbiAgdmFyIG1hcmdpbnMgPSBtYXJnaW5TdHJpbmcuc3BsaXQoL1xccysvKS5tYXAoZnVuY3Rpb24obWFyZ2luKSB7XG4gICAgdmFyIHBhcnRzID0gL14oLT9cXGQqXFwuP1xcZCspKHB4fCUpJC8uZXhlYyhtYXJnaW4pO1xuICAgIGlmICghcGFydHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncm9vdE1hcmdpbiBtdXN0IGJlIHNwZWNpZmllZCBpbiBwaXhlbHMgb3IgcGVyY2VudCcpO1xuICAgIH1cbiAgICByZXR1cm4ge3ZhbHVlOiBwYXJzZUZsb2F0KHBhcnRzWzFdKSwgdW5pdDogcGFydHNbMl19O1xuICB9KTtcblxuICAvLyBIYW5kbGVzIHNob3J0aGFuZC5cbiAgbWFyZ2luc1sxXSA9IG1hcmdpbnNbMV0gfHwgbWFyZ2luc1swXTtcbiAgbWFyZ2luc1syXSA9IG1hcmdpbnNbMl0gfHwgbWFyZ2luc1swXTtcbiAgbWFyZ2luc1szXSA9IG1hcmdpbnNbM10gfHwgbWFyZ2luc1sxXTtcblxuICByZXR1cm4gbWFyZ2lucztcbn07XG5cblxuLyoqXG4gKiBTdGFydHMgcG9sbGluZyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgaWYgdGhlIHBvbGxpbmcgaXMgbm90IGFscmVhZHlcbiAqIGhhcHBlbmluZywgYW5kIGlmIHRoZSBwYWdlJ3MgdmlzaWJpbGl0eSBzdGF0ZSBpcyB2aXNpYmxlLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9tb25pdG9ySW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zKSB7XG4gICAgdGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMgPSB0cnVlO1xuXG4gICAgLy8gSWYgYSBwb2xsIGludGVydmFsIGlzIHNldCwgdXNlIHBvbGxpbmcgaW5zdGVhZCBvZiBsaXN0ZW5pbmcgdG9cbiAgICAvLyByZXNpemUgYW5kIHNjcm9sbCBldmVudHMgb3IgRE9NIG11dGF0aW9ucy5cbiAgICBpZiAodGhpcy5QT0xMX0lOVEVSVkFMKSB7XG4gICAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChcbiAgICAgICAgICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRoaXMuUE9MTF9JTlRFUlZBTCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcbiAgICAgIGFkZEV2ZW50KGRvY3VtZW50LCAnc2Nyb2xsJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcblxuICAgICAgaWYgKHRoaXMuVVNFX01VVEFUSU9OX09CU0VSVkVSICYmICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcbiAgICAgICAgdGhpcy5fZG9tT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMpO1xuICAgICAgICB0aGlzLl9kb21PYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LCB7XG4gICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG4vKipcbiAqIFN0b3BzIHBvbGxpbmcgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl91bm1vbml0b3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucykge1xuICAgIHRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zID0gZmFsc2U7XG5cbiAgICBjbGVhckludGVydmFsKHRoaXMuX21vbml0b3JpbmdJbnRlcnZhbCk7XG4gICAgdGhpcy5fbW9uaXRvcmluZ0ludGVydmFsID0gbnVsbDtcblxuICAgIHJlbW92ZUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdHJ1ZSk7XG4gICAgcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xuXG4gICAgaWYgKHRoaXMuX2RvbU9ic2VydmVyKSB7XG4gICAgICB0aGlzLl9kb21PYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICB0aGlzLl9kb21PYnNlcnZlciA9IG51bGw7XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogU2NhbnMgZWFjaCBvYnNlcnZhdGlvbiB0YXJnZXQgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzIGFuZCBhZGRzIHRoZW1cbiAqIHRvIHRoZSBpbnRlcm5hbCBlbnRyaWVzIHF1ZXVlLiBJZiBuZXcgZW50cmllcyBhcmUgZm91bmQsIGl0XG4gKiBzY2hlZHVsZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGludm9rZWQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdElzSW5Eb20gPSB0aGlzLl9yb290SXNJbkRvbSgpO1xuICB2YXIgcm9vdFJlY3QgPSByb290SXNJbkRvbSA/IHRoaXMuX2dldFJvb3RSZWN0KCkgOiBnZXRFbXB0eVJlY3QoKTtcblxuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgdmFyIHRhcmdldCA9IGl0ZW0uZWxlbWVudDtcbiAgICB2YXIgdGFyZ2V0UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0YXJnZXQpO1xuICAgIHZhciByb290Q29udGFpbnNUYXJnZXQgPSB0aGlzLl9yb290Q29udGFpbnNUYXJnZXQodGFyZ2V0KTtcbiAgICB2YXIgb2xkRW50cnkgPSBpdGVtLmVudHJ5O1xuICAgIHZhciBpbnRlcnNlY3Rpb25SZWN0ID0gcm9vdElzSW5Eb20gJiYgcm9vdENvbnRhaW5zVGFyZ2V0ICYmXG4gICAgICAgIHRoaXMuX2NvbXB1dGVUYXJnZXRBbmRSb290SW50ZXJzZWN0aW9uKHRhcmdldCwgcm9vdFJlY3QpO1xuXG4gICAgdmFyIG5ld0VudHJ5ID0gaXRlbS5lbnRyeSA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KHtcbiAgICAgIHRpbWU6IG5vdygpLFxuICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICBib3VuZGluZ0NsaWVudFJlY3Q6IHRhcmdldFJlY3QsXG4gICAgICByb290Qm91bmRzOiByb290UmVjdCxcbiAgICAgIGludGVyc2VjdGlvblJlY3Q6IGludGVyc2VjdGlvblJlY3RcbiAgICB9KTtcblxuICAgIGlmICghb2xkRW50cnkpIHtcbiAgICAgIHRoaXMuX3F1ZXVlZEVudHJpZXMucHVzaChuZXdFbnRyeSk7XG4gICAgfSBlbHNlIGlmIChyb290SXNJbkRvbSAmJiByb290Q29udGFpbnNUYXJnZXQpIHtcbiAgICAgIC8vIElmIHRoZSBuZXcgZW50cnkgaW50ZXJzZWN0aW9uIHJhdGlvIGhhcyBjcm9zc2VkIGFueSBvZiB0aGVcbiAgICAgIC8vIHRocmVzaG9sZHMsIGFkZCBhIG5ldyBlbnRyeS5cbiAgICAgIGlmICh0aGlzLl9oYXNDcm9zc2VkVGhyZXNob2xkKG9sZEVudHJ5LCBuZXdFbnRyeSkpIHtcbiAgICAgICAgdGhpcy5fcXVldWVkRW50cmllcy5wdXNoKG5ld0VudHJ5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlIHJvb3QgaXMgbm90IGluIHRoZSBET00gb3IgdGFyZ2V0IGlzIG5vdCBjb250YWluZWQgd2l0aGluXG4gICAgICAvLyByb290IGJ1dCB0aGUgcHJldmlvdXMgZW50cnkgZm9yIHRoaXMgdGFyZ2V0IGhhZCBhbiBpbnRlcnNlY3Rpb24sXG4gICAgICAvLyBhZGQgYSBuZXcgcmVjb3JkIGluZGljYXRpbmcgcmVtb3ZhbC5cbiAgICAgIGlmIChvbGRFbnRyeSAmJiBvbGRFbnRyeS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICB0aGlzLl9xdWV1ZWRFbnRyaWVzLnB1c2gobmV3RW50cnkpO1xuICAgICAgfVxuICAgIH1cbiAgfSwgdGhpcyk7XG5cbiAgaWYgKHRoaXMuX3F1ZXVlZEVudHJpZXMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2sodGhpcy50YWtlUmVjb3JkcygpLCB0aGlzKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIEFjY2VwdHMgYSB0YXJnZXQgYW5kIHJvb3QgcmVjdCBjb21wdXRlcyB0aGUgaW50ZXJzZWN0aW9uIGJldHdlZW4gdGhlblxuICogZm9sbG93aW5nIHRoZSBhbGdvcml0aG0gaW4gdGhlIHNwZWMuXG4gKiBUT0RPKHBoaWxpcHdhbHRvbik6IGF0IHRoaXMgdGltZSBjbGlwLXBhdGggaXMgbm90IGNvbnNpZGVyZWQuXG4gKiBodHRwczovL3czYy5naXRodWIuaW8vSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvI2NhbGN1bGF0ZS1pbnRlcnNlY3Rpb24tcmVjdC1hbGdvXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgdGFyZ2V0IERPTSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gcm9vdFJlY3QgVGhlIGJvdW5kaW5nIHJlY3Qgb2YgdGhlIHJvb3QgYWZ0ZXIgYmVpbmdcbiAqICAgICBleHBhbmRlZCBieSB0aGUgcm9vdE1hcmdpbiB2YWx1ZS5cbiAqIEByZXR1cm4gez9PYmplY3R9IFRoZSBmaW5hbCBpbnRlcnNlY3Rpb24gcmVjdCBvYmplY3Qgb3IgdW5kZWZpbmVkIGlmIG5vXG4gKiAgICAgaW50ZXJzZWN0aW9uIGlzIGZvdW5kLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9jb21wdXRlVGFyZ2V0QW5kUm9vdEludGVyc2VjdGlvbiA9XG4gICAgZnVuY3Rpb24odGFyZ2V0LCByb290UmVjdCkge1xuXG4gIC8vIElmIHRoZSBlbGVtZW50IGlzbid0IGRpc3BsYXllZCwgYW4gaW50ZXJzZWN0aW9uIGNhbid0IGhhcHBlbi5cbiAgaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkuZGlzcGxheSA9PSAnbm9uZScpIHJldHVybjtcblxuICB2YXIgdGFyZ2V0UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0YXJnZXQpO1xuICB2YXIgaW50ZXJzZWN0aW9uUmVjdCA9IHRhcmdldFJlY3Q7XG4gIHZhciBwYXJlbnQgPSBnZXRQYXJlbnROb2RlKHRhcmdldCk7XG4gIHZhciBhdFJvb3QgPSBmYWxzZTtcblxuICB3aGlsZSAoIWF0Um9vdCkge1xuICAgIHZhciBwYXJlbnRSZWN0ID0gbnVsbDtcbiAgICB2YXIgcGFyZW50Q29tcHV0ZWRTdHlsZSA9IHBhcmVudC5ub2RlVHlwZSA9PSAxID9cbiAgICAgICAgd2luZG93LmdldENvbXB1dGVkU3R5bGUocGFyZW50KSA6IHt9O1xuXG4gICAgLy8gSWYgdGhlIHBhcmVudCBpc24ndCBkaXNwbGF5ZWQsIGFuIGludGVyc2VjdGlvbiBjYW4ndCBoYXBwZW4uXG4gICAgaWYgKHBhcmVudENvbXB1dGVkU3R5bGUuZGlzcGxheSA9PSAnbm9uZScpIHJldHVybjtcblxuICAgIGlmIChwYXJlbnQgPT0gdGhpcy5yb290IHx8IHBhcmVudCA9PSBkb2N1bWVudCkge1xuICAgICAgYXRSb290ID0gdHJ1ZTtcbiAgICAgIHBhcmVudFJlY3QgPSByb290UmVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGEgbm9uLXZpc2libGUgb3ZlcmZsb3csIGFuZCBpdCdzIG5vdCB0aGUgPGJvZHk+XG4gICAgICAvLyBvciA8aHRtbD4gZWxlbWVudCwgdXBkYXRlIHRoZSBpbnRlcnNlY3Rpb24gcmVjdC5cbiAgICAgIC8vIE5vdGU6IDxib2R5PiBhbmQgPGh0bWw+IGNhbm5vdCBiZSBjbGlwcGVkIHRvIGEgcmVjdCB0aGF0J3Mgbm90IGFsc29cbiAgICAgIC8vIHRoZSBkb2N1bWVudCByZWN0LCBzbyBubyBuZWVkIHRvIGNvbXB1dGUgYSBuZXcgaW50ZXJzZWN0aW9uLlxuICAgICAgaWYgKHBhcmVudCAhPSBkb2N1bWVudC5ib2R5ICYmXG4gICAgICAgICAgcGFyZW50ICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJlxuICAgICAgICAgIHBhcmVudENvbXB1dGVkU3R5bGUub3ZlcmZsb3cgIT0gJ3Zpc2libGUnKSB7XG4gICAgICAgIHBhcmVudFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QocGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBlaXRoZXIgb2YgdGhlIGFib3ZlIGNvbmRpdGlvbmFscyBzZXQgYSBuZXcgcGFyZW50UmVjdCxcbiAgICAvLyBjYWxjdWxhdGUgbmV3IGludGVyc2VjdGlvbiBkYXRhLlxuICAgIGlmIChwYXJlbnRSZWN0KSB7XG4gICAgICBpbnRlcnNlY3Rpb25SZWN0ID0gY29tcHV0ZVJlY3RJbnRlcnNlY3Rpb24ocGFyZW50UmVjdCwgaW50ZXJzZWN0aW9uUmVjdCk7XG5cbiAgICAgIGlmICghaW50ZXJzZWN0aW9uUmVjdCkgYnJlYWs7XG4gICAgfVxuICAgIHBhcmVudCA9IGdldFBhcmVudE5vZGUocGFyZW50KTtcbiAgfVxuICByZXR1cm4gaW50ZXJzZWN0aW9uUmVjdDtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByb290IHJlY3QgYWZ0ZXIgYmVpbmcgZXhwYW5kZWQgYnkgdGhlIHJvb3RNYXJnaW4gdmFsdWUuXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBleHBhbmRlZCByb290IHJlY3QuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2dldFJvb3RSZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciByb290UmVjdDtcbiAgaWYgKHRoaXMucm9vdCkge1xuICAgIHJvb3RSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMucm9vdCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVXNlIDxodG1sPi88Ym9keT4gaW5zdGVhZCBvZiB3aW5kb3cgc2luY2Ugc2Nyb2xsIGJhcnMgYWZmZWN0IHNpemUuXG4gICAgdmFyIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgIHJvb3RSZWN0ID0ge1xuICAgICAgdG9wOiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIHJpZ2h0OiBodG1sLmNsaWVudFdpZHRoIHx8IGJvZHkuY2xpZW50V2lkdGgsXG4gICAgICB3aWR0aDogaHRtbC5jbGllbnRXaWR0aCB8fCBib2R5LmNsaWVudFdpZHRoLFxuICAgICAgYm90dG9tOiBodG1sLmNsaWVudEhlaWdodCB8fCBib2R5LmNsaWVudEhlaWdodCxcbiAgICAgIGhlaWdodDogaHRtbC5jbGllbnRIZWlnaHQgfHwgYm9keS5jbGllbnRIZWlnaHRcbiAgICB9O1xuICB9XG4gIHJldHVybiB0aGlzLl9leHBhbmRSZWN0QnlSb290TWFyZ2luKHJvb3RSZWN0KTtcbn07XG5cblxuLyoqXG4gKiBBY2NlcHRzIGEgcmVjdCBhbmQgZXhwYW5kcyBpdCBieSB0aGUgcm9vdE1hcmdpbiB2YWx1ZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSByZWN0IFRoZSByZWN0IG9iamVjdCB0byBleHBhbmQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBleHBhbmRlZCByZWN0LlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9leHBhbmRSZWN0QnlSb290TWFyZ2luID0gZnVuY3Rpb24ocmVjdCkge1xuICB2YXIgbWFyZ2lucyA9IHRoaXMuX3Jvb3RNYXJnaW5WYWx1ZXMubWFwKGZ1bmN0aW9uKG1hcmdpbiwgaSkge1xuICAgIHJldHVybiBtYXJnaW4udW5pdCA9PSAncHgnID8gbWFyZ2luLnZhbHVlIDpcbiAgICAgICAgbWFyZ2luLnZhbHVlICogKGkgJSAyID8gcmVjdC53aWR0aCA6IHJlY3QuaGVpZ2h0KSAvIDEwMDtcbiAgfSk7XG4gIHZhciBuZXdSZWN0ID0ge1xuICAgIHRvcDogcmVjdC50b3AgLSBtYXJnaW5zWzBdLFxuICAgIHJpZ2h0OiByZWN0LnJpZ2h0ICsgbWFyZ2luc1sxXSxcbiAgICBib3R0b206IHJlY3QuYm90dG9tICsgbWFyZ2luc1syXSxcbiAgICBsZWZ0OiByZWN0LmxlZnQgLSBtYXJnaW5zWzNdXG4gIH07XG4gIG5ld1JlY3Qud2lkdGggPSBuZXdSZWN0LnJpZ2h0IC0gbmV3UmVjdC5sZWZ0O1xuICBuZXdSZWN0LmhlaWdodCA9IG5ld1JlY3QuYm90dG9tIC0gbmV3UmVjdC50b3A7XG5cbiAgcmV0dXJuIG5ld1JlY3Q7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyBhbiBvbGQgYW5kIG5ldyBlbnRyeSBhbmQgcmV0dXJucyB0cnVlIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGVcbiAqIHRocmVzaG9sZCB2YWx1ZXMgaGFzIGJlZW4gY3Jvc3NlZC5cbiAqIEBwYXJhbSB7P0ludGVyc2VjdGlvbk9ic2VydmVyRW50cnl9IG9sZEVudHJ5IFRoZSBwcmV2aW91cyBlbnRyeSBmb3IgYVxuICogICAgcGFydGljdWxhciB0YXJnZXQgZWxlbWVudCBvciBudWxsIGlmIG5vIHByZXZpb3VzIGVudHJ5IGV4aXN0cy5cbiAqIEBwYXJhbSB7SW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeX0gbmV3RW50cnkgVGhlIGN1cnJlbnQgZW50cnkgZm9yIGFcbiAqICAgIHBhcnRpY3VsYXIgdGFyZ2V0IGVsZW1lbnQuXG4gKiBAcmV0dXJuIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgYSBhbnkgdGhyZXNob2xkIGhhcyBiZWVuIGNyb3NzZWQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2hhc0Nyb3NzZWRUaHJlc2hvbGQgPVxuICAgIGZ1bmN0aW9uKG9sZEVudHJ5LCBuZXdFbnRyeSkge1xuXG4gIC8vIFRvIG1ha2UgY29tcGFyaW5nIGVhc2llciwgYW4gZW50cnkgdGhhdCBoYXMgYSByYXRpbyBvZiAwXG4gIC8vIGJ1dCBkb2VzIG5vdCBhY3R1YWxseSBpbnRlcnNlY3QgaXMgZ2l2ZW4gYSB2YWx1ZSBvZiAtMVxuICB2YXIgb2xkUmF0aW8gPSBvbGRFbnRyeSAmJiBvbGRFbnRyeS5pc0ludGVyc2VjdGluZyA/XG4gICAgICBvbGRFbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyB8fCAwIDogLTE7XG4gIHZhciBuZXdSYXRpbyA9IG5ld0VudHJ5LmlzSW50ZXJzZWN0aW5nID9cbiAgICAgIG5ld0VudHJ5LmludGVyc2VjdGlvblJhdGlvIHx8IDAgOiAtMTtcblxuICAvLyBJZ25vcmUgdW5jaGFuZ2VkIHJhdGlvc1xuICBpZiAob2xkUmF0aW8gPT09IG5ld1JhdGlvKSByZXR1cm47XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRocmVzaG9sZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdGhyZXNob2xkID0gdGhpcy50aHJlc2hvbGRzW2ldO1xuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgYW4gZW50cnkgbWF0Y2hlcyBhIHRocmVzaG9sZCBvciBpZiB0aGUgbmV3IHJhdGlvXG4gICAgLy8gYW5kIHRoZSBvbGQgcmF0aW8gYXJlIG9uIHRoZSBvcHBvc2l0ZSBzaWRlcyBvZiBhIHRocmVzaG9sZC5cbiAgICBpZiAodGhyZXNob2xkID09IG9sZFJhdGlvIHx8IHRocmVzaG9sZCA9PSBuZXdSYXRpbyB8fFxuICAgICAgICB0aHJlc2hvbGQgPCBvbGRSYXRpbyAhPT0gdGhyZXNob2xkIDwgbmV3UmF0aW8pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxufTtcblxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHJvb3QgZWxlbWVudCBpcyBhbiBlbGVtZW50IGFuZCBpcyBpbiB0aGUgRE9NLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgcm9vdCBlbGVtZW50IGlzIGFuIGVsZW1lbnQgYW5kIGlzIGluIHRoZSBET00uXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3Jvb3RJc0luRG9tID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5yb290IHx8IGNvbnRhaW5zRGVlcChkb2N1bWVudCwgdGhpcy5yb290KTtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIHJvb3QuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgdGFyZ2V0IGVsZW1lbnQgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIHJvb3QuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3Jvb3RDb250YWluc1RhcmdldCA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICByZXR1cm4gY29udGFpbnNEZWVwKHRoaXMucm9vdCB8fCBkb2N1bWVudCwgdGFyZ2V0KTtcbn07XG5cblxuLyoqXG4gKiBBZGRzIHRoZSBpbnN0YW5jZSB0byB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5IGlmIGl0IGlzbid0XG4gKiBhbHJlYWR5IHByZXNlbnQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3JlZ2lzdGVySW5zdGFuY2UgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHJlZ2lzdHJ5LmluZGV4T2YodGhpcykgPCAwKSB7XG4gICAgcmVnaXN0cnkucHVzaCh0aGlzKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGluc3RhbmNlIGZyb20gdGhlIGdsb2JhbCBJbnRlcnNlY3Rpb25PYnNlcnZlciByZWdpc3RyeS5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fdW5yZWdpc3Rlckluc3RhbmNlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpbmRleCA9IHJlZ2lzdHJ5LmluZGV4T2YodGhpcyk7XG4gIGlmIChpbmRleCAhPSAtMSkgcmVnaXN0cnkuc3BsaWNlKGluZGV4LCAxKTtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIHBlcmZvcm1hbmNlLm5vdygpIG1ldGhvZCBvciBudWxsIGluIGJyb3dzZXJzXG4gKiB0aGF0IGRvbid0IHN1cHBvcnQgdGhlIEFQSS5cbiAqIEByZXR1cm4ge251bWJlcn0gVGhlIGVsYXBzZWQgdGltZSBzaW5jZSB0aGUgcGFnZSB3YXMgcmVxdWVzdGVkLlxuICovXG5mdW5jdGlvbiBub3coKSB7XG4gIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2UgJiYgcGVyZm9ybWFuY2Uubm93ICYmIHBlcmZvcm1hbmNlLm5vdygpO1xufVxuXG5cbi8qKlxuICogVGhyb3R0bGVzIGEgZnVuY3Rpb24gYW5kIGRlbGF5cyBpdHMgZXhlY3V0aW9uLCBzbyBpdCdzIG9ubHkgY2FsbGVkIGF0IG1vc3RcbiAqIG9uY2Ugd2l0aGluIGEgZ2l2ZW4gdGltZSBwZXJpb2QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dCBUaGUgYW1vdW50IG9mIHRpbWUgdGhhdCBtdXN0IHBhc3MgYmVmb3JlIHRoZVxuICogICAgIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWQgYWdhaW4uXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHRocm90dGxlZCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gdGhyb3R0bGUoZm4sIHRpbWVvdXQpIHtcbiAgdmFyIHRpbWVyID0gbnVsbDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRpbWVyKSB7XG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGZuKCk7XG4gICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgfTtcbn1cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byBhIERPTSBub2RlIGVuc3VyaW5nIGNyb3NzLWJyb3dzZXIgY29tcGF0aWJpbGl0eS5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gYWRkIHRoZSBldmVudCBoYW5kbGVyIHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGV2ZW50IGhhbmRsZXIgdG8gYWRkLlxuICogQHBhcmFtIHtib29sZWFufSBvcHRfdXNlQ2FwdHVyZSBPcHRpb25hbGx5IGFkZHMgdGhlIGV2ZW4gdG8gdGhlIGNhcHR1cmVcbiAqICAgICBwaGFzZS4gTm90ZTogdGhpcyBvbmx5IHdvcmtzIGluIG1vZGVybiBicm93c2Vycy5cbiAqL1xuZnVuY3Rpb24gYWRkRXZlbnQobm9kZSwgZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSkge1xuICBpZiAodHlwZW9mIG5vZGUuYWRkRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBub2RlLmF0dGFjaEV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICBub2RlLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZm4pO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCBldmVudCBoYW5kbGVyIGZyb20gYSBET00gbm9kZS5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gcmVtb3ZlIHRoZSBldmVudCBoYW5kbGVyIGZyb20uXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZXZlbnQgaGFuZGxlciB0byByZW1vdmUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdF91c2VDYXB0dXJlIElmIHRoZSBldmVudCBoYW5kbGVyIHdhcyBhZGRlZCB3aXRoIHRoaXNcbiAqICAgICBmbGFnIHNldCB0byB0cnVlLCBpdCBzaG91bGQgYmUgc2V0IHRvIHRydWUgaGVyZSBpbiBvcmRlciB0byByZW1vdmUgaXQuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG5vZGUsIGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUpIHtcbiAgaWYgKHR5cGVvZiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sIG9wdF91c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgfVxuICBlbHNlIGlmICh0eXBlb2Ygbm9kZS5kZXRhdGNoRXZlbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUuZGV0YXRjaEV2ZW50KCdvbicgKyBldmVudCwgZm4pO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnRlcnNlY3Rpb24gYmV0d2VlbiB0d28gcmVjdCBvYmplY3RzLlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QxIFRoZSBmaXJzdCByZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QyIFRoZSBzZWNvbmQgcmVjdC5cbiAqIEByZXR1cm4gez9PYmplY3R9IFRoZSBpbnRlcnNlY3Rpb24gcmVjdCBvciB1bmRlZmluZWQgaWYgbm8gaW50ZXJzZWN0aW9uXG4gKiAgICAgaXMgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVSZWN0SW50ZXJzZWN0aW9uKHJlY3QxLCByZWN0Mikge1xuICB2YXIgdG9wID0gTWF0aC5tYXgocmVjdDEudG9wLCByZWN0Mi50b3ApO1xuICB2YXIgYm90dG9tID0gTWF0aC5taW4ocmVjdDEuYm90dG9tLCByZWN0Mi5ib3R0b20pO1xuICB2YXIgbGVmdCA9IE1hdGgubWF4KHJlY3QxLmxlZnQsIHJlY3QyLmxlZnQpO1xuICB2YXIgcmlnaHQgPSBNYXRoLm1pbihyZWN0MS5yaWdodCwgcmVjdDIucmlnaHQpO1xuICB2YXIgd2lkdGggPSByaWdodCAtIGxlZnQ7XG4gIHZhciBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG5cbiAgcmV0dXJuICh3aWR0aCA+PSAwICYmIGhlaWdodCA+PSAwKSAmJiB7XG4gICAgdG9wOiB0b3AsXG4gICAgYm90dG9tOiBib3R0b20sXG4gICAgbGVmdDogbGVmdCxcbiAgICByaWdodDogcmlnaHQsXG4gICAgd2lkdGg6IHdpZHRoLFxuICAgIGhlaWdodDogaGVpZ2h0XG4gIH07XG59XG5cblxuLyoqXG4gKiBTaGltcyB0aGUgbmF0aXZlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG9sZGVyIElFLlxuICogQHBhcmFtIHtFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB3aG9zZSBib3VuZGluZyByZWN0IHRvIGdldC5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIChwb3NzaWJseSBzaGltbWVkKSByZWN0IG9mIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZWwpIHtcbiAgdmFyIHJlY3Q7XG5cbiAgdHJ5IHtcbiAgICByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIElnbm9yZSBXaW5kb3dzIDcgSUUxMSBcIlVuc3BlY2lmaWVkIGVycm9yXCJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdzNjL0ludGVyc2VjdGlvbk9ic2VydmVyL3B1bGwvMjA1XG4gIH1cblxuICBpZiAoIXJlY3QpIHJldHVybiBnZXRFbXB0eVJlY3QoKTtcblxuICAvLyBPbGRlciBJRVxuICBpZiAoIShyZWN0LndpZHRoICYmIHJlY3QuaGVpZ2h0KSkge1xuICAgIHJlY3QgPSB7XG4gICAgICB0b3A6IHJlY3QudG9wLFxuICAgICAgcmlnaHQ6IHJlY3QucmlnaHQsXG4gICAgICBib3R0b206IHJlY3QuYm90dG9tLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0LFxuICAgICAgd2lkdGg6IHJlY3QucmlnaHQgLSByZWN0LmxlZnQsXG4gICAgICBoZWlnaHQ6IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcbiAgICB9O1xuICB9XG4gIHJldHVybiByZWN0O1xufVxuXG5cbi8qKlxuICogUmV0dXJucyBhbiBlbXB0eSByZWN0IG9iamVjdC4gQW4gZW1wdHkgcmVjdCBpcyByZXR1cm5lZCB3aGVuIGFuIGVsZW1lbnRcbiAqIGlzIG5vdCBpbiB0aGUgRE9NLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZW1wdHkgcmVjdC5cbiAqL1xuZnVuY3Rpb24gZ2V0RW1wdHlSZWN0KCkge1xuICByZXR1cm4ge1xuICAgIHRvcDogMCxcbiAgICBib3R0b206IDAsXG4gICAgbGVmdDogMCxcbiAgICByaWdodDogMCxcbiAgICB3aWR0aDogMCxcbiAgICBoZWlnaHQ6IDBcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIGEgcGFyZW50IGVsZW1lbnQgY29udGFpbnMgYSBjaGlsZCBlbGVtZW50IChpbmNsdWRpbmcgaW5zaWRlXG4gKiBzaGFkb3cgRE9NKS5cbiAqIEBwYXJhbSB7Tm9kZX0gcGFyZW50IFRoZSBwYXJlbnQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Tm9kZX0gY2hpbGQgVGhlIGNoaWxkIGVsZW1lbnQuXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBwYXJlbnQgbm9kZSBjb250YWlucyB0aGUgY2hpbGQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gY29udGFpbnNEZWVwKHBhcmVudCwgY2hpbGQpIHtcbiAgdmFyIG5vZGUgPSBjaGlsZDtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHJldHVybiB0cnVlO1xuXG4gICAgbm9kZSA9IGdldFBhcmVudE5vZGUobm9kZSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5cbi8qKlxuICogR2V0cyB0aGUgcGFyZW50IG5vZGUgb2YgYW4gZWxlbWVudCBvciBpdHMgaG9zdCBlbGVtZW50IGlmIHRoZSBwYXJlbnQgbm9kZVxuICogaXMgYSBzaGFkb3cgcm9vdC5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB3aG9zZSBwYXJlbnQgdG8gZ2V0LlxuICogQHJldHVybiB7Tm9kZXxudWxsfSBUaGUgcGFyZW50IG5vZGUgb3IgbnVsbCBpZiBubyBwYXJlbnQgZXhpc3RzLlxuICovXG5mdW5jdGlvbiBnZXRQYXJlbnROb2RlKG5vZGUpIHtcbiAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICBpZiAocGFyZW50ICYmIHBhcmVudC5ub2RlVHlwZSA9PSAxMSAmJiBwYXJlbnQuaG9zdCkge1xuICAgIC8vIElmIHRoZSBwYXJlbnQgaXMgYSBzaGFkb3cgcm9vdCwgcmV0dXJuIHRoZSBob3N0IGVsZW1lbnQuXG4gICAgcmV0dXJuIHBhcmVudC5ob3N0O1xuICB9XG5cbiAgaWYgKHBhcmVudCAmJiBwYXJlbnQuYXNzaWduZWRTbG90KSB7XG4gICAgLy8gSWYgdGhlIHBhcmVudCBpcyBkaXN0cmlidXRlZCBpbiBhIDxzbG90PiwgcmV0dXJuIHRoZSBwYXJlbnQgb2YgYSBzbG90LlxuICAgIHJldHVybiBwYXJlbnQuYXNzaWduZWRTbG90LnBhcmVudE5vZGU7XG4gIH1cblxuICByZXR1cm4gcGFyZW50O1xufVxuXG5cbi8vIEV4cG9zZXMgdGhlIGNvbnN0cnVjdG9ycyBnbG9iYWxseS5cbndpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlciA9IEludGVyc2VjdGlvbk9ic2VydmVyO1xud2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkgPSBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5O1xuXG59KHdpbmRvdywgZG9jdW1lbnQpKTtcbiIsIiIsImZ1bmN0aW9uIE5hbm9FdmVudHMgKCkge1xuICAvKipcbiAgICogRXZlbnQgbmFtZXMgaW4ga2V5cyBhbmQgYXJyYXlzIHdpdGggbGlzdGVuZXJzIGluIHZhbHVlcy5cbiAgICogQHR5cGUge29iamVjdH1cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogT2JqZWN0LmtleXMoZWUuZXZlbnRzKVxuICAgKlxuICAgKiBAYWxpYXMgTmFub0V2ZW50cyNldmVudHNcbiAgICovXG4gIHRoaXMuZXZlbnRzID0geyB9XG59XG5OYW5vRXZlbnRzLnByb3RvdHlwZSA9IHtcblxuICAvKipcbiAgICogQ2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAgICogQHBhcmFtIHsuLi4qfSBhcmd1bWVudHMgVGhlIGFyZ3VtZW50cyBmb3IgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGVlLmVtaXQoJ3RpY2snLCB0aWNrVHlwZSwgdGlja0R1cmF0aW9uKVxuICAgKlxuICAgKiBAYWxpYXMgTmFub0V2ZW50cyNlbWl0XG4gICAqIEBtZXRob2RcbiAgICovXG4gIGVtaXQ6IGZ1bmN0aW9uIGVtaXQgKGV2ZW50KSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICAvLyBBcnJheS5wcm90b3R5cGUuY2FsbCgpIHJldHVybnMgZW1wdHkgYXJyYXkgaWYgY29udGV4dCBpcyBub3QgYXJyYXktbGlrZVxuICAgIDtbXS5zbGljZS5jYWxsKHRoaXMuZXZlbnRzW2V2ZW50XSB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uIChpKSB7XG4gICAgICBpLmFwcGx5KHRoaXMsIGFyZ3MpIC8vIHRoaXMgPT09IGdsb2JhbCBvciB3aW5kb3dcbiAgICB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9ufSBVbmJpbmQgbGlzdGVuZXIgZnJvbSBldmVudC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogY29uc3QgdW5iaW5kID0gZWUub24oJ3RpY2snLCAodGlja1R5cGUsIHRpY2tEdXJhdGlvbikgPT4ge1xuICAgKiAgIGNvdW50ICs9IDFcbiAgICogfSlcbiAgICpcbiAgICogZGlzYWJsZSAoKSB7XG4gICAqICAgdW5iaW5kKClcbiAgICogfVxuICAgKlxuICAgKiBAYWxpYXMgTmFub0V2ZW50cyNvblxuICAgKiBAbWV0aG9kXG4gICAqL1xuICBvbjogZnVuY3Rpb24gb24gKGV2ZW50LCBjYikge1xuICAgIC8vIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHR5cGVvZiBjYiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vICAgdGhyb3cgbmV3IEVycm9yKCdMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKVxuICAgIC8vIH1cblxuICAgICh0aGlzLmV2ZW50c1tldmVudF0gPSB0aGlzLmV2ZW50c1tldmVudF0gfHwgW10pLnB1c2goY2IpXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0gdGhpcy5ldmVudHNbZXZlbnRdLmZpbHRlcihmdW5jdGlvbiAoaSkge1xuICAgICAgICByZXR1cm4gaSAhPT0gY2JcbiAgICAgIH0pXG4gICAgfS5iaW5kKHRoaXMpXG4gIH1cbn0iLCJ2YXIgSFQgPSB3aW5kb3cuSFQgfHwge307XG5IVC5jb250cm9scyA9IEhULmNvbnRyb2xzIHx8IHt9O1xuXG5IVC5jb250cm9scy5OYXZpZ2F0b3IgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICAvLyB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcbiAgICB0aGlzLmlucHV0ID0gb3B0aW9ucy5pbnB1dDtcbiAgICB0aGlzLm91dHB1dCA9IG9wdGlvbnMub3V0cHV0O1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKCk7XG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gIH1cblxuICBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZW1pdHRlciwgYXJndW1lbnRzKVxuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB2YXIgc2VxID0gdGhpcy52YWx1ZTtcbiAgICAgIC8vIGdvdG9QYWdlKHNlcSk7XG4gICAgfSlcbiAgfVxufVxuIiwiIiwiIiwiIiwiIiwiIiwiIiwidmFyIEhUID0gd2luZG93LkhUIHx8IHt9O1xuSFQuY29udHJvbHMgPSBIVC5jb250cm9scyB8fCB7fTtcblxudmFyIFJlYWRlciA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKCk7XG4gICAgdGhpcy5jb250cm9scyA9IHt9O1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcbiAgICAvKiBOT09QICovXG4gIH1cblxuICBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZW1pdHRlciwgYXJndW1lbnRzKVxuICB9XG59XG5cbnZhciByZWFkZXIgPSBuZXcgUmVhZGVyKCk7XG5cbi8vIHZhciAkdmlld2VyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbiBzZWN0aW9uJyk7XG52YXIgJG1haW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7XG52YXIgJHZpZXdlciA9ICRtYWluLnF1ZXJ5U2VsZWN0b3IoJy52aWV3ZXInKTtcbnZhciAkaW5uZXIgPSAkdmlld2VyLnF1ZXJ5U2VsZWN0b3IoJy52aWV3ZXItaW5uZXInKTtcbnZhciBpc19hY3RpdmUgPSBmYWxzZTtcbnZhciBzY2FsZSA9IDAuNzU7XG52YXIgaW1hZ2Vfd2lkdGggPSA2ODA7XG5cbnJlYWRlci5jb250cm9scy5uYXZpZ2F0b3IgPSBuZXcgSFQuY29udHJvbHMuTmF2aWdhdG9yKHtcbiAgaW5wdXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJyYW5nZVwiXScpLFxuICBvdXRwdXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXZpZ2F0b3IgLm91dHB1dCAuY3VycmVudC1zZXEnKVxufSlcblxuLy8gcmVhZGVyLm9uKCdnb3RvUGFnZScsIGZ1bmN0aW9uKCkge1xuLy8gICBjb25zb2xlLmxvZyhcIkFIT1kgZ290b1BhZ2VcIiwgYXJndW1lbnRzKTtcbi8vIH0pXG5cbnJlYWRlci5jb250cm9scy5uYXZpZ2F0b3Iub24oJ2dvdG9QYWdlJywgZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBnb3RvUGFnZVwiLCBhcmd1bWVudHMpO1xufSlcblxudmFyIGhhbmRsZU9ic2VydmVyID0gZnVuY3Rpb24oZW50cmllcywgb2JzZXJ2ZXIpIHtcbiAgdmFyIGN1cnJlbnQgPSB7IHBhZ2U6IG51bGwsIHJhdGlvOiAwIH07XG4gIGVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgdmFyIGRpdiA9IGVudHJ5LnRhcmdldDtcbiAgICB2YXIgc2VxID0gZGl2LmRhdGFzZXQuc2VxO1xuICAgIHZhciB2aWV3ZWQgPSBkaXYucXVlcnlTZWxlY3RvcignaW1nJyk7XG4gICAgaWYgKCBlbnRyeS5pc0ludGVyc2VjdGluZyAmJiBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyA+IDAuMCAgKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWSU5HXCIsIGVudHJpZXMubGVuZ3RoLCBzZXEsICdvbkVudGVyJywgZW50cnkuaW50ZXJzZWN0aW9uUmF0aW8pO1xuICAgICAgaWYgKCBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyA+IGN1cnJlbnQucmF0aW8gKSB7XG4gICAgICAgIGN1cnJlbnQucmF0aW9uID0gZW50cnkuaW50ZXJzZWN0aW9uUmF0aW87XG4gICAgICAgIGN1cnJlbnQucGFnZSA9IGRpdjtcbiAgICAgIH1cbiAgICAgIGlmICggISB2aWV3ZWQgKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQUhPWSBPQlNFUlZJTkdcIiwgZW50cmllcy5sZW5ndGgsIHNlcSwgJ29uRW50ZXInKTtcbiAgICAgICAgbG9hZEltYWdlKGRpdiwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKCAgZGl2LmRhdGFzZXQucHJlbG9hZGVkICkge1xuICAgICAgICBkaXYuZGF0YXNldC5wcmVsb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgcmVzaXplUGFnZShkaXYpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIHZpZXdlZCAmJiAhIGRpdi5kYXRhc2V0LnByZWxvYWRlZCApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBPQlNFUlZJTkdcIiwgZW50cmllcy5sZW5ndGgsIHNlcSwgJ29uRXhpdCcpO1xuICAgICAgdW5sb2FkSW1hZ2UoZGl2KTtcbiAgICB9XG4gIH0pXG4gIGlmICggY3VycmVudC5wYWdlICkge1xuICAgIHVwZGF0ZV9uYXZpZ2F0b3IoY3VycmVudC5wYWdlKTtcbiAgfVxufTtcblxudmFyICRvYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihoYW5kbGVPYnNlcnZlciwge1xuICAgIHJvb3Q6ICR2aWV3ZXIsXG4gICAgcm9vdE1hcmdpbjogJzBweCcsXG4gICAgdGhyZXNob2xkOiBbMCwgMC4xLCAwLjIsIDAuMywgMC40LCAwLjUsIDAuNiwgMC43LCAwLjgsIDAuOSwgMV1cbn0pO1xuXG52YXIgcmVzaXplUGFnZSA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgdmFyIGNhbnZhcyA9IHBhZ2UucXVlcnlTZWxlY3RvcignaW1nJyk7XG4gIGlmICggISBjYW52YXMgKSB7IHJldHVybiA7IH1cblxuICBpZiAoIHBhZ2UuZGF0YXNldC5sb2FkaW5nICE9PSAnZmFsc2UnICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBib3VuZHMgPSAkdmlld2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB2YXIgcmVjdCA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgaWYgKCBjYW52YXMuaGVpZ2h0IDwgcGFyc2VJbnQocGFnZS5zdHlsZS5oZWlnaHQpICkge1xuICAgIGNvbnNvbGUubG9nKFwiQUhPWSBzaHJpbmtpbmdcIiwgcGFnZS5kYXRhc2V0LnNlcSwgcGFnZS5zdHlsZS5oZWlnaHQsIGNhbnZhcy5oZWlnaHQpO1xuICB9XG4gIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7Y2FudmFzLmhlaWdodH1weGA7XG4gIHZhciB1cGRhdGVkX3JlY3QgPSBwYWdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB2YXIgc2Nyb2xsVG9wID0gJHZpZXdlci5zY3JvbGxUb3A7XG5cbiAgaWYgKCAkbWFpbi5kYXRhc2V0LnZpZXcgPT0gJzF1cCcgJiYgcmVjdC5ib3R0b20gPD0gYm91bmRzLmJvdHRvbSAmJiByZWN0LnRvcCA8IDAgKSB7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGRlbHRhID0gdXBkYXRlZF9yZWN0LmhlaWdodCAtIHJlY3QuaGVpZ2h0O1xuICAgICAgaWYgKCAkdmlld2VyLnNjcm9sbFRvcCA9PSBzY3JvbGxUb3AgKSB7XG4gICAgICAgIC8vIGRlbHRhIC89IHRoaXMuc2V0dGluZ3Muc2NhbGU7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQUhPWSBhZnRlclJlc2l6ZWRcIiwgdmlldy5pbmRleCwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wLCB2aWV3LmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0LCByZWN0LmhlaWdodCwgZGVsdGEgLyB0aGlzLnNldHRpbmdzLnNjYWxlKTtcbiAgICAgICAgJHZpZXdlci5zY3JvbGxUb3AgKz0gTWF0aC5jZWlsKGRlbHRhKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIGFmdGVyUmVzaXplZFwiLCBwYWdlLmRhdGFzZXQuc2VxLCBzY3JvbGxUb3AsICR2aWV3ZXIuc2Nyb2xsVG9wLCBkZWx0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgZG9ub3RSZXNpemVkXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHNjcm9sbFRvcCwgJHZpZXdlci5zY3JvbGxUb3AsIGRlbHRhKTtcbiAgICAgIH1cbiAgICB9LCA1MDApO1xuICB9XG59XG5cbnZhciBmaXRJbWFnZU9uID0gZnVuY3Rpb24oY2FudmFzLCBpbWFnZU9iaikge1xuICBpZiAoICEgY2FudmFzLnBhcmVudE5vZGUgKSB7XG4gICAgY29uc29sZS5sb2coXCJBSE9ZIExPU1QgUEFSRU5UXCIsIGNhbnZhcy5kYXRhc2V0LnNlcSk7XG4gIH1cbiAgdmFyIGltYWdlQXNwZWN0UmF0aW8gPSBpbWFnZU9iai53aWR0aCAvIGltYWdlT2JqLmhlaWdodDtcblxuICAvLyBjYW52YXMud2lkdGggPSBjYW52YXMuaGVpZ2h0ICogaW1hZ2VBc3BlY3RSYXRpbztcbiAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCAvIGltYWdlQXNwZWN0UmF0aW87XG4gIC8vIGNhbnZhcy5wYXJlbnROb2RlLnN0eWxlLmhlaWdodCA9IGAke2NhbnZhcy5oZWlnaHR9cHhgO1xuXG4gIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIFxuICB2YXIgY2FudmFzQXNwZWN0UmF0aW8gPSBjYW52YXMud2lkdGggLyBjYW52YXMuaGVpZ2h0O1xuICB2YXIgcmVuZGVyYWJsZUhlaWdodCwgcmVuZGVyYWJsZVdpZHRoLCB4U3RhcnQsIHlTdGFydDtcblxuICAvLyBJZiBpbWFnZSdzIGFzcGVjdCByYXRpbyBpcyBsZXNzIHRoYW4gY2FudmFzJ3Mgd2UgZml0IG9uIGhlaWdodFxuICAvLyBhbmQgcGxhY2UgdGhlIGltYWdlIGNlbnRyYWxseSBhbG9uZyB3aWR0aFxuICBpZihpbWFnZUFzcGVjdFJhdGlvIDwgY2FudmFzQXNwZWN0UmF0aW8pIHtcbiAgICByZW5kZXJhYmxlSGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcbiAgICByZW5kZXJhYmxlV2lkdGggPSBpbWFnZU9iai53aWR0aCAqIChyZW5kZXJhYmxlSGVpZ2h0IC8gaW1hZ2VPYmouaGVpZ2h0KTtcbiAgICB4U3RhcnQgPSAoY2FudmFzLndpZHRoIC0gcmVuZGVyYWJsZVdpZHRoKSAvIDI7XG4gICAgeVN0YXJ0ID0gMDtcbiAgICAvLyBjb25zb2xlLmxvZyhgQUhPWSBhIDogJHtjYW52YXMud2lkdGh9IHggJHtjYW52YXMuaGVpZ2h0fSAvICR7Y2FudmFzLm9mZnNldEhlaWdodH0gOjogJHtyZW5kZXJhYmxlV2lkdGh9IHggJHtyZW5kZXJhYmxlSGVpZ2h0fWApO1xuICB9XG5cbiAgLy8gSWYgaW1hZ2UncyBhc3BlY3QgcmF0aW8gaXMgZ3JlYXRlciB0aGFuIGNhbnZhcydzIHdlIGZpdCBvbiB3aWR0aFxuICAvLyBhbmQgcGxhY2UgdGhlIGltYWdlIGNlbnRyYWxseSBhbG9uZyBoZWlnaHRcbiAgZWxzZSBpZihpbWFnZUFzcGVjdFJhdGlvID4gY2FudmFzQXNwZWN0UmF0aW8pIHtcblxuICAgIHJlbmRlcmFibGVXaWR0aCA9IGNhbnZhcy53aWR0aFxuICAgIHJlbmRlcmFibGVIZWlnaHQgPSBpbWFnZU9iai5oZWlnaHQgKiAocmVuZGVyYWJsZVdpZHRoIC8gaW1hZ2VPYmoud2lkdGgpO1xuICAgIHhTdGFydCA9IDA7XG4gICAgeVN0YXJ0ID0gKGNhbnZhcy5oZWlnaHQgLSByZW5kZXJhYmxlSGVpZ2h0KSAvIDI7XG4gIH1cblxuICAvLyBIYXBweSBwYXRoIC0ga2VlcCBhc3BlY3QgcmF0aW9cbiAgZWxzZSB7XG4gICAgXG4gICAgcmVuZGVyYWJsZUhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgcmVuZGVyYWJsZVdpZHRoID0gY2FudmFzLndpZHRoO1xuICAgIHhTdGFydCA9IDA7XG4gICAgeVN0YXJ0ID0gMDtcbiAgfVxuICB4U3RhcnQgPSAwO1xuICB5U3RhcnQgPSAwO1xuICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZU9iaiwgeFN0YXJ0LCB5U3RhcnQsIHJlbmRlcmFibGVXaWR0aCwgcmVuZGVyYWJsZUhlaWdodCk7XG4gIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAvLyBjb250ZXh0LmZvbnQgPSAnNDhweCBtb25vc3BhY2UnO1xuICAvLyBjb250ZXh0LnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICAvLyBjb250ZXh0LmZpbGxUZXh0KCdIZWxsbyB3b3JsZCcsIGNhbnZhcy53aWR0aCAvIDIsIChjYW52YXMuaGVpZ2h0IC8gMikgKTtcbn07XG5cbnZhciBsb2FkSW1hZ2UgPSBmdW5jdGlvbihwYWdlLCBjaGVja19zY3JvbGwpIHtcbiAgaWYgKCAhIGlzX2FjdGl2ZSApIHsgcmV0dXJuIDsgfVxuICB2YXIgc2VxID0gcGFnZS5kYXRhc2V0LnNlcTtcbiAgdmFyIGJvdW5kcyA9ICR2aWV3ZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHZhciByZWN0ID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICBjb25zb2xlLmxvZyhcIkFIT1kgTE9BRElOR1wiLCBzZXEpO1xuXG4gIC8vIHZhciBpbWFnZV91cmwgPSBgL2NnaS9pbWdzcnYvaW1hZ2U/aWQ9JHtIVC5wYXJhbXMuaWR9O3NlcT0ke3NlcX07c2l6ZT0xMDBgO1xuICB2YXIgaW1hZ2VfdXJsID0gYC9jZ2kvaW1nc3J2L2ltYWdlP2lkPSR7SFQucGFyYW1zLmlkfTtzZXE9JHtzZXF9O3dpZHRoPSR7cGFnZS5vZmZzZXRXaWR0aH1gO1xuICB2YXIgaHRtbF91cmwgPSBgL2NnaS9pbWdzcnYvaHRtbD9pZD0ke0hULnBhcmFtcy5pZH07c2VxPSR7c2VxfWA7XG5cbiAgaWYgKCBwYWdlLnF1ZXJ5U2VsZWN0b3IoJ2ltZycpICkge1xuICAgIC8vIHByZWxvYWRJbWFnZXMocGFnZSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAvLyBjYW52YXMuZGF0YXNldC5zZXEgPSBzZXE7XG5cbiAgdmFyIGh0bWxfcmVxdWVzdCA9IGZldGNoKGh0bWxfdXJsKTtcblxuICB2YXIgcGFnZV9oZWlnaHQgPSBwYWdlLm9mZnNldEhlaWdodDtcbiAgdmFyIHBhZ2Vfd2lkdGggPSBwYWdlLm9mZnNldFdpZHRoO1xuICAvLyBjYW52YXMuaGVpZ2h0ID0gcGFnZV9oZWlnaHQ7XG4gIC8vIGNhbnZhcy53aWR0aCA9IHBhZ2Vfd2lkdGg7XG4gIC8vIGNhbnZhcy5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gIC8vIHBhZ2UuYXBwZW5kQ2hpbGQoY2FudmFzKTtcblxuICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gIGltZy5hbHQgPSBgUGFnZSBzY2FuIG9mIHNlcXVlbmNlICR7c2VxfWA7XG5cbiAgcGFnZS5kYXRhc2V0LmxvYWRpbmcgPSB0cnVlO1xuICBpbWcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgIHBhZ2UuZGF0YXNldC5sb2FkaW5nID0gZmFsc2U7XG4gICAgLy8gL2ZpdEltYWdlT24oY2FudmFzLCB0aGlzKTtcblxuICAgIHZhciBpbWFnZUFzcGVjdFJhdGlvID0gaW1nLndpZHRoIC8gaW1nLmhlaWdodDtcbiAgICBpbWcuc3R5bGUud2lkdGggPSBwYWdlX3dpZHRoO1xuICAgIGltZy5zdHlsZS5oZWlnaHQgPSBwYWdlX3dpZHRoIC8gaW1hZ2VBc3BlY3RSYXRpbztcbiAgICBwYWdlLmFwcGVuZENoaWxkKGltZyk7XG5cbiAgICBodG1sX3JlcXVlc3RcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24odGV4dCkge1xuICAgICAgICB2YXIgcGFnZV90ZXh0ID0gcGFnZS5xdWVyeVNlbGVjdG9yKCcucGFnZS10ZXh0Jyk7XG4gICAgICAgIHBhZ2VfdGV4dC5pbm5lckhUTUwgPSB0ZXh0O1xuICAgICAgfSk7XG5cblxuICAgIGlmICggY2hlY2tfc2Nyb2xsIHx8ICRtYWluLmRhdGFzZXQudmlldyA9PSAndGh1bWJuYWlsJyApIHsgcmVzaXplUGFnZShwYWdlKTsgfVxuICAgIC8vIHZhciB1cGRhdGVkX3JlY3QgPSBwYWdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIC8vIGlmICggY2hlY2tfc2Nyb2xsICYmIHJlY3QuYm90dG9tIDw9IGJvdW5kcy5ib3R0b20gJiYgcmVjdC50b3AgPCAwICkge1xuICAgIC8vICAgZGVsdGEgPSB1cGRhdGVkX3JlY3QuaGVpZ2h0IC0gcmVjdC5oZWlnaHQ7XG4gICAgLy8gICAvLyBkZWx0YSAvPSB0aGlzLnNldHRpbmdzLnNjYWxlO1xuICAgIC8vICAgLy8gY29uc29sZS5sb2coXCJBSE9ZIGFmdGVyUmVzaXplZFwiLCB2aWV3LmluZGV4LCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AsIHZpZXcuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQsIHJlY3QuaGVpZ2h0LCBkZWx0YSAvIHRoaXMuc2V0dGluZ3Muc2NhbGUpO1xuICAgIC8vICAgJHZpZXdlci5zY3JvbGxUb3AgKz0gTWF0aC5jZWlsKGRlbHRhKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgY29uc29sZS5sb2coXCJBSE9ZIE5PIENIQU5HRT9cIilcbiAgICAvLyB9XG4gIH0pXG5cbiAgaW1nLnNyYyA9IGltYWdlX3VybDtcblxuICBpZiAoICEgcGFnZS5kYXRhc2V0LnByZWxvYWRlZCApIHtcbiAgICBwcmVsb2FkSW1hZ2VzKHBhZ2UpO1xuICB9XG59XG5cbnZhciB1bmxvYWRJbWFnZSA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgaWYgKCBwYWdlLmRhdGFzZXQucHJlbG9hZGVkICkgeyByZXR1cm47IH1cbiAgaWYgKCBwYWdlLmRhdGFzZXQubG9hZGluZyApIHsgcmV0dXJuIDsgfVxuICB2YXIgY2FudmFzID0gcGFnZS5xdWVyeVNlbGVjdG9yKCdpbWcnKTtcbiAgaWYgKCBjYW52YXMgKSB7XG4gICAgcGFnZS5yZW1vdmVDaGlsZChjYW52YXMpO1xuICB9XG4gIHZhciBwYWdlX3RleHQgPSBwYWdlLnF1ZXJ5U2VsZWN0b3IoJy5wYWdlLXRleHQnKTtcbiAgcGFnZV90ZXh0LmlubmVySFRNTCA9ICcnO1xuICBwYWdlLmRhdGFzZXQucHJlbG9hZGVkID0gZmFsc2U7XG59XG5cbnZhciBwcmVsb2FkSW1hZ2VzID0gZnVuY3Rpb24ocGFnZSkge1xuICB2YXIgc2VxID0gcGFyc2VJbnQocGFnZS5kYXRhc2V0LnNlcSwgMTApO1xuICB2YXIgZGVsdGEgPSAxO1xuICB3aGlsZSAoIGRlbHRhIDw9IDEgKSB7XG4gICAgdmFyIHByZXZfcGFnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5wYWdlW2RhdGEtc2VxPVwiJHtzZXEgLSBkZWx0YX1cIl1gKTtcbiAgICBpZiAoIHByZXZfcGFnZSApIHtcbiAgICAgIHByZXZfcGFnZS5kYXRhc2V0LnByZWxvYWRlZCA9IHRydWU7XG4gICAgICBsb2FkSW1hZ2UocHJldl9wYWdlKTtcbiAgICB9XG4gICAgZGVsdGEgKz0gMTtcbiAgfVxuICBkZWx0YSA9IDE7XG4gIHdoaWxlICggZGVsdGEgPD0gMSApIHtcbiAgICB2YXIgbmV4dF9wYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcSArIGRlbHRhfVwiXWApO1xuICAgIGlmICggbmV4dF9wYWdlICkge1xuICAgICAgbmV4dF9wYWdlLmRhdGFzZXQucHJlbG9hZGVkID0gdHJ1ZTtcbiAgICAgIGxvYWRJbWFnZShuZXh0X3BhZ2UpO1xuICAgIH1cbiAgICBkZWx0YSArPSAxO1xuICB9XG59XG5cbnZhciBnZXRQYWdlID0gZnVuY3Rpb24oc2VxKSB7XG4gIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7c2VxfVwiXWApO1xufVxuXG52YXIgZ290b1BhZ2UgPSBmdW5jdGlvbihzZXEsIGRlbHRhKSB7XG4gIHZhciBjdXJyZW50U2VxID0gcGFyc2VJbnQoJG5hdmlnYXRvci5pbnB1dC52YWx1ZSwgMTApO1xuICBpZiAoICEgc2VxICkge1xuICAgIHNlcSA9IGN1cnJlbnRTZXE7XG4gIH1cbiAgaWYgKCBkZWx0YSApIHtcbiAgICBzZXEgKz0gZGVsdGE7XG4gIH1cblxuICB2YXIgY3VycmVudFBhZ2UgPSBnZXRQYWdlKGN1cnJlbnRTZXEpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgQUhPWVwiLCBjdXJyZW50U2VxLCBjdXJyZW50UGFnZSk7XG4gIGlmICggY3VycmVudFBhZ2UgKSB7XG4gICAgLy8gY3VycmVudFBhZ2UuYWRkRXZlbnRMaXN0ZW5lcignYW5pbWF0aW9uZW5kJywgZnVuY3Rpb24gZXhpdFBhZ2UoKSB7XG4gICAgLy8gICBjb25zb2xlLmxvZyhcIkFIT1kgQU5JTUFUSU9OIEVOREVEXCIsIGN1cnJlbnRQYWdlKTtcbiAgICAvLyAgIGN1cnJlbnRQYWdlLmNsYXNzTGlzdC5yZW1vdmUoJ3B0LXBhZ2UtbW92ZVRvTGVmdCcpO1xuICAgIC8vICAgY3VycmVudFBhZ2UuZGF0YXNldC52aXNpYmxlID0gZmFsc2U7XG4gICAgLy8gICBjdXJyZW50UGFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdhbmltYXRpb25lbmQnLCBleGl0UGFnZSk7XG4gICAgLy8gICB1bmxvYWRJbWFnZShjdXJyZW50UGFnZSk7XG4gICAgLy8gfSlcbiAgICAvLyBjdXJyZW50UGFnZS5jbGFzc0xpc3QuYWRkKCdwdC1wYWdlLW1vdmVUb0xlZnQnKTtcblxuICAgIGN1cnJlbnRQYWdlLmRhdGFzZXQudmlzaWJsZSA9IGZhbHNlO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB1bmxvYWRJbWFnZShjdXJyZW50UGFnZSk7XG4gICAgfSlcbiAgfVxuXG4gIHZhciB0YXJnZXQgPSBnZXRQYWdlKHNlcSk7XG4gIC8vIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdhbmltYXRpb25lbmQnLCBmdW5jdGlvbiBlbnRlclBhZ2UoKSB7XG4gIC8vICAgdGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ3B0LXBhZ2UtbW92ZUZyb21SaWdodCcpO1xuICAvLyAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCdhbmltYXRpb25lbmQnLCBlbnRlclBhZ2UpO1xuICAvLyB9KVxuICAvLyB0YXJnZXQuY2xhc3NMaXN0LmFkZCgncHQtcGFnZS1tb3ZlRnJvbVJpZ2h0Jyk7XG4gIHRhcmdldC5kYXRhc2V0LnZpc2libGUgPSB0cnVlO1xuICB0YXJnZXQucGFyZW50Tm9kZS5zY3JvbGxUb3AgPSB0YXJnZXQub2Zmc2V0VG9wIC0gdGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0VG9wO1xuICBpZiAoICRvYnNlcnZlci5pbmFjdGl2ZSApIHsgbG9hZEltYWdlKHRhcmdldCwgdHJ1ZSk7IHVwZGF0ZV9uYXZpZ2F0b3IodGFyZ2V0KTt9XG4gIC8vIHRhcmdldC5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XG59XG5cbnZhciBuZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuICBnb3RvUGFnZShudWxsLCAxKTtcbn1cblxudmFyIHByZXZpb3VzUGFnZSA9IGZ1bmN0aW9uKCkge1xuICBnb3RvUGFnZShudWxsLCAtMSk7XG59XG5cbnZhciB1cGRhdGVfbmF2aWdhdG9yID0gZnVuY3Rpb24ocGFnZSkge1xuICB2YXIgc2VxID0gcGFyc2VJbnQocGFnZS5kYXRhc2V0LnNlcSwgMTApO1xuICAkbmF2aWdhdG9yLmlucHV0LnZhbHVlID0gc2VxO1xuICB2YXIgcGVyY2VudGFnZSA9ICggc2VxIC8gJG5hdmlnYXRvci5pbnB1dC5tYXggKSAqIDEwMC4wO1xuICAkbmF2aWdhdG9yLmlucHV0LnN0eWxlLmJhY2tncm91bmRTaXplID0gYCR7cGVyY2VudGFnZX0lIDEwMCVgO1xuICAvLyAkbmF2aWdhdG9yLnN0YXR1cy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2JhY2tncm91bmQtcG9zaXRpb246ICcgKyAoLXBlcmNlbnRhZ2UpICsgJyUgMCUsIGxlZnQgdG9wOycpO1xufVxuXG52YXIgbWluX2hlaWdodCA9ICR2aWV3ZXIub2Zmc2V0SGVpZ2h0O1xudmFyIG1pbl93aWR0aCA9ICR2aWV3ZXIub2Zmc2V0V2lkdGggKiAwLjgwO1xuJG1haW4uZGF0YXNldC52aWV3ID0gJ2ltYWdlJztcblxuaWYgKCAkbWFpbi5kYXRhc2V0LnZpZXcgPT0gJ3RodW1ibmFpbCcgKSB7XG4gIHNjYWxlID0gMC4yNTtcbn1cblxudmFyICRkYXRhO1xuLy8gZmV0Y2goYC9jZ2kvaW1nc3J2L21ldGE/aWQ9JHtIVC5wYXJhbXMuaWR9YClcbi8vICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbi8vICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuLy8gICB9KVxuLy8gICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cbi8vICAgICAkZGF0YSA9IGRhdGE7XG5cbi8vICAgICAkbmF2aWdhdG9yLmlucHV0Lm1heCA9IGRhdGEuaXRlbXMubGVuZ3RoO1xuLy8gICAgICRuYXZpZ2F0b3IuaW5wdXQubWluID0gMTtcbi8vICAgICAkbmF2aWdhdG9yLmlucHV0LnN0eWxlLmJhY2tncm91bmRTaXplID0gJzAlIDEwMCUnO1xuLy8gICAgIC8vICRuYXZpZ2F0b3Iuc3RhdHVzLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnYmFja2dyb3VuZC1wb3NpdGlvbjogJyArICgwKSArICclIDAlLCBsZWZ0IHRvcDsnKTtcblxuLy8gICAgIHZhciBtZXRhID0gJGRhdGEuaXRlbXNbMF07XG4vLyAgICAgdmFyIHIgPSBtZXRhLmhlaWdodCAvIG1ldGEud2lkdGg7XG5cbi8vICAgICBkYXRhLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuLy8gICAgICAgdmFyIHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbi8vICAgICAgIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7bWluX3dpZHRoICogciAqIHNjYWxlfXB4YDtcbi8vICAgICAgIHBhZ2Uuc3R5bGUud2lkdGggPSBgJHttaW5fd2lkdGggKiBzY2FsZX1weGA7XG4vLyAgICAgICBwYWdlLmRhdGFzZXQuYmVzdEZpdCA9ICggc2NhbGUgPD0gMSApO1xuXG4vLyAgICAgICAvLyBpZiAoICRtYWluLmRhdGFzZXQudmlldyA9PSAnaW1hZ2UnICkge1xuLy8gICAgICAgLy8gICBwYWdlLnN0eWxlLm1hcmdpbkxlZnQgPSBgLSR7KG1pbl93aWR0aCAqIHIgKiBzY2FsZSkgLyAyfXB4YDtcbi8vICAgICAgIC8vIH1cblxuLy8gICAgICAgLy8gaWYgKCAkbWFpbi5kYXRhc2V0LnZpZXcgPT0gJ2ltYWdlJyApIHtcbi8vICAgICAgIC8vICAgcGFnZS5zdHlsZS50b3AgPSAnMHB4Jztcbi8vICAgICAgIC8vICAgcGFnZS5zdHlsZS5sZWZ0ID0gYCR7LSAoIGl0ZW0uc2VxIC0gMSApICogbWluX3dpZHRofXB4YDtcbi8vICAgICAgIC8vIH1cblxuLy8gICAgICAgcGFnZS5jbGFzc0xpc3QuYWRkKCdwYWdlJyk7XG4vLyAgICAgICBwYWdlLmRhdGFzZXQuc2VxID0gaXRlbS5zZXE7XG4vLyAgICAgICBwYWdlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicGFnZS10ZXh0XCI+PC9kaXY+PGRpdiBjbGFzcz1cImluZm9cIj4ke2l0ZW0uc2VxfTwvZGl2PmA7XG4vLyAgICAgICAkaW5uZXIuYXBwZW5kQ2hpbGQocGFnZSk7XG4vLyAgICAgfSlcblxuLy8gICAgIHZhciBwYWdlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdlJyk7XG4vLyAgICAgZm9yKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICBpZiAoICRtYWluLmRhdGFzZXQudmlldyA9PSAnaW1hZ2UnICkge1xuLy8gICAgICAgICBwYWdlc1tpXS5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbi8vICAgICAgICAgJG9ic2VydmVyLmluYWN0aXZlID0gdHJ1ZTtcbi8vICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICRvYnNlcnZlci5vYnNlcnZlKHBhZ2VzW2ldKTtcbi8vICAgICAgIH1cbi8vICAgICB9XG5cbi8vICAgICB2YXIgcGFnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYWdlW2RhdGEtc2VxPVwiMjVcIl0nKTtcbi8vICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuLy8gICAgICAgaXNfYWN0aXZlID0gdHJ1ZTtcbi8vICAgICAgIGdvdG9QYWdlKDI1KTtcbi8vICAgICAgIC8vIHZhciBvZmZzZXRUb3AgPSBwYWdlLm9mZnNldFRvcDtcbi8vICAgICAgIC8vICRpbm5lci5zY3JvbGxUb3AgPSBvZmZzZXRUb3A7XG4vLyAgICAgfSwgMTAwKTtcbi8vICAgfSkiXX0=
