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

// var $section = document.querySelector('main section');
var $main = document.querySelector('main');
var $section = document.querySelector('section .pages');
var $inner = document.querySelector('section .pages .pages-inner');
var is_active = false;
var scale = 0.75;
var image_width = 680;

var $navigator = { 
  input: document.querySelector('input[type="range"]'),
  status: document.querySelector('.navigator-range__background')
};
$navigator.input.addEventListener('change', function(event) {
  var seq = this.value;
  gotoPage(seq);
})

var handleObserver = function(entries, observer) {
  var current = { page: null, ratio: 0 };
  entries.forEach(entry => {
    var div = entry.target;
    var seq = div.dataset.seq;
    var viewed = div.querySelector('canvas');
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
    root: $section,
    rootMargin: '0px',
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
});

var resizePage = function(page) {
  var canvas = page.querySelector('canvas');
  if ( ! canvas ) { return ; }

  if ( page.dataset.loading !== 'false' ) {
    return;
  }

  var bounds = $section.getBoundingClientRect();
  var rect = page.getBoundingClientRect();

  if ( canvas.height < parseInt(page.style.height) ) {
    console.log("AHOY shrinking", page.dataset.seq, page.style.height, canvas.height);
  }
  page.style.height = `${canvas.height}px`;
  var updated_rect = page.getBoundingClientRect();
  var scrollTop = $section.scrollTop;

  if ( $main.dataset.view == '1up' && rect.bottom <= bounds.bottom && rect.top < 0 ) {
    setTimeout(function() {
      delta = updated_rect.height - rect.height;
      if ( $section.scrollTop == scrollTop ) {
        // delta /= this.settings.scale;
        // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
        $section.scrollTop += Math.ceil(delta);
        console.log("AHOY afterResized", page.dataset.seq, scrollTop, $section.scrollTop, delta);
      } else {
        console.log("AHOY donotResized", page.dataset.seq, scrollTop, $section.scrollTop, delta);
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
  var bounds = $section.getBoundingClientRect();
  var rect = page.getBoundingClientRect();

  console.log("AHOY LOADING", seq);

  // var image_url = `/cgi/imgsrv/image?id=${HT.params.id};seq=${seq};size=100`;
  var image_url = `/cgi/imgsrv/image?id=${HT.params.id};seq=${seq};width=${page.offsetWidth}`;
  if ( page.querySelector('canvas') ) {
    // preloadImages(page);
    return;
  }

  var canvas = document.createElement('canvas');
  canvas.dataset.seq = seq;

  var page_height = page.offsetHeight;
  var page_width = page.offsetWidth;
  // canvas.height = page_height;
  canvas.width = page_width;
  canvas.style.visibility = 'hidden';
  page.appendChild(canvas);

  var img = new Image();

  page.dataset.loading = true;
  img.addEventListener('load', function() {
    page.dataset.loading = false;
    fitImageOn(canvas, this);
    if ( check_scroll || $main.dataset.view == 'thumbnail' ) { resizePage(page); }
    // var updated_rect = page.getBoundingClientRect();
    // if ( check_scroll && rect.bottom <= bounds.bottom && rect.top < 0 ) {
    //   delta = updated_rect.height - rect.height;
    //   // delta /= this.settings.scale;
    //   // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
    //   $section.scrollTop += Math.ceil(delta);
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
  var canvas = page.querySelector('canvas');
  if ( canvas ) {
    page.removeChild(canvas);
  }
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

var min_height = $section.offsetHeight;
var min_width = $section.offsetWidth * 0.80;
$main.dataset.view = 'image';

if ( $main.dataset.view == 'thumbnail' ) {
  scale = 0.25;
}

var $data;
fetch(`/cgi/imgsrv/meta?id=${HT.params.id}`)
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {

    $data = data;

    $navigator.input.max = data.items.length;
    $navigator.input.min = 1;
    $navigator.input.style.backgroundSize = '0% 100%';
    // $navigator.status.setAttribute('style', 'background-position: ' + (0) + '% 0%, left top;');

    var meta = $data.items[0];
    var r = meta.height / meta.width;

    data.items.forEach(function(item) {
      var page = document.createElement('div');
      page.style.height = `${min_width * r * scale}px`;
      page.style.width = `${min_width * scale}px`;
      page.dataset.bestFit = ( scale <= 1 );

      // if ( $main.dataset.view == 'image' ) {
      //   page.style.marginLeft = `-${(min_width * r * scale) / 2}px`;
      // }

      // if ( $main.dataset.view == 'image' ) {
      //   page.style.top = '0px';
      //   page.style.left = `${- ( item.seq - 1 ) * min_width}px`;
      // }

      page.classList.add('page');
      page.dataset.seq = item.seq;
      page.innerHTML = `<div class="info">${item.seq}</div>`;
      $inner.appendChild(page);
    })

    var pages = document.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      if ( $main.dataset.view == 'image' ) {
        pages[i].dataset.visible = false;
        $observer.inactive = true;
      } else {
        $observer.observe(pages[i]);
      }
    }

    var page = document.querySelector('.page[data-seq="25"]');
    setTimeout(function() {
      is_active = true;
      gotoPage(25);
      // var offsetTop = page.offsetTop;
      // $inner.scrollTop = offsetTop;
    }, 100);
  })
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludGVyc2VjdGlvbi1vYnNlcnZlci5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1dEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBXM0MgU09GVFdBUkUgQU5EIERPQ1VNRU5UIE5PVElDRSBBTkQgTElDRU5TRS5cbiAqXG4gKiAgaHR0cHM6Ly93d3cudzMub3JnL0NvbnNvcnRpdW0vTGVnYWwvMjAxNS9jb3B5cmlnaHQtc29mdHdhcmUtYW5kLWRvY3VtZW50XG4gKlxuICovXG5cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50KSB7XG4ndXNlIHN0cmljdCc7XG5cblxuLy8gRXhpdHMgZWFybHkgaWYgYWxsIEludGVyc2VjdGlvbk9ic2VydmVyIGFuZCBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5XG4vLyBmZWF0dXJlcyBhcmUgbmF0aXZlbHkgc3VwcG9ydGVkLlxuaWYgKCdJbnRlcnNlY3Rpb25PYnNlcnZlcicgaW4gd2luZG93ICYmXG4gICAgJ0ludGVyc2VjdGlvbk9ic2VydmVyRW50cnknIGluIHdpbmRvdyAmJlxuICAgICdpbnRlcnNlY3Rpb25SYXRpbycgaW4gd2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkucHJvdG90eXBlKSB7XG5cbiAgLy8gTWluaW1hbCBwb2x5ZmlsbCBmb3IgRWRnZSAxNSdzIGxhY2sgb2YgYGlzSW50ZXJzZWN0aW5nYFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS93M2MvSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvaXNzdWVzLzIxMVxuICBpZiAoISgnaXNJbnRlcnNlY3RpbmcnIGluIHdpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5LnByb3RvdHlwZSkpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkod2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkucHJvdG90eXBlLFxuICAgICAgJ2lzSW50ZXJzZWN0aW5nJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyc2VjdGlvblJhdGlvID4gMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm47XG59XG5cblxuLyoqXG4gKiBBbiBJbnRlcnNlY3Rpb25PYnNlcnZlciByZWdpc3RyeS4gVGhpcyByZWdpc3RyeSBleGlzdHMgdG8gaG9sZCBhIHN0cm9uZ1xuICogcmVmZXJlbmNlIHRvIEludGVyc2VjdGlvbk9ic2VydmVyIGluc3RhbmNlcyBjdXJyZW50bHkgb2JzZXJ2aW5nIGEgdGFyZ2V0XG4gKiBlbGVtZW50LiBXaXRob3V0IHRoaXMgcmVnaXN0cnksIGluc3RhbmNlcyB3aXRob3V0IGFub3RoZXIgcmVmZXJlbmNlIG1heSBiZVxuICogZ2FyYmFnZSBjb2xsZWN0ZWQuXG4gKi9cbnZhciByZWdpc3RyeSA9IFtdO1xuXG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyRW50cnkgY29uc3RydWN0b3IuXG4gKiBodHRwczovL3czYy5naXRodWIuaW8vSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvI2ludGVyc2VjdGlvbi1vYnNlcnZlci1lbnRyeVxuICogQHBhcmFtIHtPYmplY3R9IGVudHJ5IEEgZGljdGlvbmFyeSBvZiBpbnN0YW5jZSBwcm9wZXJ0aWVzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEludGVyc2VjdGlvbk9ic2VydmVyRW50cnkoZW50cnkpIHtcbiAgdGhpcy50aW1lID0gZW50cnkudGltZTtcbiAgdGhpcy50YXJnZXQgPSBlbnRyeS50YXJnZXQ7XG4gIHRoaXMucm9vdEJvdW5kcyA9IGVudHJ5LnJvb3RCb3VuZHM7XG4gIHRoaXMuYm91bmRpbmdDbGllbnRSZWN0ID0gZW50cnkuYm91bmRpbmdDbGllbnRSZWN0O1xuICB0aGlzLmludGVyc2VjdGlvblJlY3QgPSBlbnRyeS5pbnRlcnNlY3Rpb25SZWN0IHx8IGdldEVtcHR5UmVjdCgpO1xuICB0aGlzLmlzSW50ZXJzZWN0aW5nID0gISFlbnRyeS5pbnRlcnNlY3Rpb25SZWN0O1xuXG4gIC8vIENhbGN1bGF0ZXMgdGhlIGludGVyc2VjdGlvbiByYXRpby5cbiAgdmFyIHRhcmdldFJlY3QgPSB0aGlzLmJvdW5kaW5nQ2xpZW50UmVjdDtcbiAgdmFyIHRhcmdldEFyZWEgPSB0YXJnZXRSZWN0LndpZHRoICogdGFyZ2V0UmVjdC5oZWlnaHQ7XG4gIHZhciBpbnRlcnNlY3Rpb25SZWN0ID0gdGhpcy5pbnRlcnNlY3Rpb25SZWN0O1xuICB2YXIgaW50ZXJzZWN0aW9uQXJlYSA9IGludGVyc2VjdGlvblJlY3Qud2lkdGggKiBpbnRlcnNlY3Rpb25SZWN0LmhlaWdodDtcblxuICAvLyBTZXRzIGludGVyc2VjdGlvbiByYXRpby5cbiAgaWYgKHRhcmdldEFyZWEpIHtcbiAgICAvLyBSb3VuZCB0aGUgaW50ZXJzZWN0aW9uIHJhdGlvIHRvIGF2b2lkIGZsb2F0aW5nIHBvaW50IG1hdGggaXNzdWVzOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS93M2MvSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvaXNzdWVzLzMyNFxuICAgIHRoaXMuaW50ZXJzZWN0aW9uUmF0aW8gPSBOdW1iZXIoKGludGVyc2VjdGlvbkFyZWEgLyB0YXJnZXRBcmVhKS50b0ZpeGVkKDQpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiBhcmVhIGlzIHplcm8gYW5kIGlzIGludGVyc2VjdGluZywgc2V0cyB0byAxLCBvdGhlcndpc2UgdG8gMFxuICAgIHRoaXMuaW50ZXJzZWN0aW9uUmF0aW8gPSB0aGlzLmlzSW50ZXJzZWN0aW5nID8gMSA6IDA7XG4gIH1cbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGdsb2JhbCBJbnRlcnNlY3Rpb25PYnNlcnZlciBjb25zdHJ1Y3Rvci5cbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9JbnRlcnNlY3Rpb25PYnNlcnZlci8jaW50ZXJzZWN0aW9uLW9ic2VydmVyLWludGVyZmFjZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgaW50ZXJzZWN0aW9uXG4gKiAgICAgY2hhbmdlcyBoYXZlIHF1ZXVlZC4gVGhlIGZ1bmN0aW9uIGlzIG5vdCBpbnZva2VkIGlmIHRoZSBxdWV1ZSBoYXNcbiAqICAgICBiZWVuIGVtcHRpZWQgYnkgY2FsbGluZyB0aGUgYHRha2VSZWNvcmRzYCBtZXRob2QuXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdF9vcHRpb25zIE9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnRlcnNlY3Rpb25PYnNlcnZlcihjYWxsYmFjaywgb3B0X29wdGlvbnMpIHtcblxuICB2YXIgb3B0aW9ucyA9IG9wdF9vcHRpb25zIHx8IHt9O1xuXG4gIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5yb290ICYmIG9wdGlvbnMucm9vdC5ub2RlVHlwZSAhPSAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyb290IG11c3QgYmUgYW4gRWxlbWVudCcpO1xuICB9XG5cbiAgLy8gQmluZHMgYW5kIHRocm90dGxlcyBgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zYC5cbiAgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zID0gdGhyb3R0bGUoXG4gICAgICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMuYmluZCh0aGlzKSwgdGhpcy5USFJPVFRMRV9USU1FT1VUKTtcblxuICAvLyBQcml2YXRlIHByb3BlcnRpZXMuXG4gIHRoaXMuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cyA9IFtdO1xuICB0aGlzLl9xdWV1ZWRFbnRyaWVzID0gW107XG4gIHRoaXMuX3Jvb3RNYXJnaW5WYWx1ZXMgPSB0aGlzLl9wYXJzZVJvb3RNYXJnaW4ob3B0aW9ucy5yb290TWFyZ2luKTtcblxuICAvLyBQdWJsaWMgcHJvcGVydGllcy5cbiAgdGhpcy50aHJlc2hvbGRzID0gdGhpcy5faW5pdFRocmVzaG9sZHMob3B0aW9ucy50aHJlc2hvbGQpO1xuICB0aGlzLnJvb3QgPSBvcHRpb25zLnJvb3QgfHwgbnVsbDtcbiAgdGhpcy5yb290TWFyZ2luID0gdGhpcy5fcm9vdE1hcmdpblZhbHVlcy5tYXAoZnVuY3Rpb24obWFyZ2luKSB7XG4gICAgcmV0dXJuIG1hcmdpbi52YWx1ZSArIG1hcmdpbi51bml0O1xuICB9KS5qb2luKCcgJyk7XG59XG5cblxuLyoqXG4gKiBUaGUgbWluaW11bSBpbnRlcnZhbCB3aXRoaW4gd2hpY2ggdGhlIGRvY3VtZW50IHdpbGwgYmUgY2hlY2tlZCBmb3JcbiAqIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuVEhST1RUTEVfVElNRU9VVCA9IDEwMDtcblxuXG4vKipcbiAqIFRoZSBmcmVxdWVuY3kgaW4gd2hpY2ggdGhlIHBvbHlmaWxsIHBvbGxzIGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqIHRoaXMgY2FuIGJlIHVwZGF0ZWQgb24gYSBwZXIgaW5zdGFuY2UgYmFzaXMgYW5kIG11c3QgYmUgc2V0IHByaW9yIHRvXG4gKiBjYWxsaW5nIGBvYnNlcnZlYCBvbiB0aGUgZmlyc3QgdGFyZ2V0LlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuUE9MTF9JTlRFUlZBTCA9IG51bGw7XG5cbi8qKlxuICogVXNlIGEgbXV0YXRpb24gb2JzZXJ2ZXIgb24gdGhlIHJvb3QgZWxlbWVudFxuICogdG8gZGV0ZWN0IGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuVVNFX01VVEFUSU9OX09CU0VSVkVSID0gdHJ1ZTtcblxuXG4vKipcbiAqIFN0YXJ0cyBvYnNlcnZpbmcgYSB0YXJnZXQgZWxlbWVudCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgYmFzZWQgb25cbiAqIHRoZSB0aHJlc2hvbGRzIHZhbHVlcy5cbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSBET00gZWxlbWVudCB0byBvYnNlcnZlLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUub2JzZXJ2ZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICB2YXIgaXNUYXJnZXRBbHJlYWR5T2JzZXJ2ZWQgPSB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMuc29tZShmdW5jdGlvbihpdGVtKSB7XG4gICAgcmV0dXJuIGl0ZW0uZWxlbWVudCA9PSB0YXJnZXQ7XG4gIH0pO1xuXG4gIGlmIChpc1RhcmdldEFscmVhZHlPYnNlcnZlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghKHRhcmdldCAmJiB0YXJnZXQubm9kZVR5cGUgPT0gMSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3RhcmdldCBtdXN0IGJlIGFuIEVsZW1lbnQnKTtcbiAgfVxuXG4gIHRoaXMuX3JlZ2lzdGVySW5zdGFuY2UoKTtcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLnB1c2goe2VsZW1lbnQ6IHRhcmdldCwgZW50cnk6IG51bGx9KTtcbiAgdGhpcy5fbW9uaXRvckludGVyc2VjdGlvbnMoKTtcbiAgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zKCk7XG59O1xuXG5cbi8qKlxuICogU3RvcHMgb2JzZXJ2aW5nIGEgdGFyZ2V0IGVsZW1lbnQgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgVGhlIERPTSBlbGVtZW50IHRvIG9ic2VydmUuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS51bm9ic2VydmUgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID1cbiAgICAgIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgcmV0dXJuIGl0ZW0uZWxlbWVudCAhPSB0YXJnZXQ7XG4gIH0pO1xuICBpZiAoIXRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5sZW5ndGgpIHtcbiAgICB0aGlzLl91bm1vbml0b3JJbnRlcnNlY3Rpb25zKCk7XG4gICAgdGhpcy5fdW5yZWdpc3Rlckluc3RhbmNlKCk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBTdG9wcyBvYnNlcnZpbmcgYWxsIHRhcmdldCBlbGVtZW50cyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cyA9IFtdO1xuICB0aGlzLl91bm1vbml0b3JJbnRlcnNlY3Rpb25zKCk7XG4gIHRoaXMuX3VucmVnaXN0ZXJJbnN0YW5jZSgpO1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgYW55IHF1ZXVlIGVudHJpZXMgdGhhdCBoYXZlIG5vdCB5ZXQgYmVlbiByZXBvcnRlZCB0byB0aGVcbiAqIGNhbGxiYWNrIGFuZCBjbGVhcnMgdGhlIHF1ZXVlLiBUaGlzIGNhbiBiZSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlXG4gKiBjYWxsYmFjayB0byBvYnRhaW4gdGhlIGFic29sdXRlIG1vc3QgdXAtdG8tZGF0ZSBpbnRlcnNlY3Rpb24gaW5mb3JtYXRpb24uXG4gKiBAcmV0dXJuIHtBcnJheX0gVGhlIGN1cnJlbnRseSBxdWV1ZWQgZW50cmllcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLnRha2VSZWNvcmRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZWNvcmRzID0gdGhpcy5fcXVldWVkRW50cmllcy5zbGljZSgpO1xuICB0aGlzLl9xdWV1ZWRFbnRyaWVzID0gW107XG4gIHJldHVybiByZWNvcmRzO1xufTtcblxuXG4vKipcbiAqIEFjY2VwdHMgdGhlIHRocmVzaG9sZCB2YWx1ZSBmcm9tIHRoZSB1c2VyIGNvbmZpZ3VyYXRpb24gb2JqZWN0IGFuZFxuICogcmV0dXJucyBhIHNvcnRlZCBhcnJheSBvZiB1bmlxdWUgdGhyZXNob2xkIHZhbHVlcy4gSWYgYSB2YWx1ZSBpcyBub3RcbiAqIGJldHdlZW4gMCBhbmQgMSBhbmQgZXJyb3IgaXMgdGhyb3duLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8bnVtYmVyPX0gb3B0X3RocmVzaG9sZCBBbiBvcHRpb25hbCB0aHJlc2hvbGQgdmFsdWUgb3JcbiAqICAgICBhIGxpc3Qgb2YgdGhyZXNob2xkIHZhbHVlcywgZGVmYXVsdGluZyB0byBbMF0uXG4gKiBAcmV0dXJuIHtBcnJheX0gQSBzb3J0ZWQgbGlzdCBvZiB1bmlxdWUgYW5kIHZhbGlkIHRocmVzaG9sZCB2YWx1ZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5faW5pdFRocmVzaG9sZHMgPSBmdW5jdGlvbihvcHRfdGhyZXNob2xkKSB7XG4gIHZhciB0aHJlc2hvbGQgPSBvcHRfdGhyZXNob2xkIHx8IFswXTtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHRocmVzaG9sZCkpIHRocmVzaG9sZCA9IFt0aHJlc2hvbGRdO1xuXG4gIHJldHVybiB0aHJlc2hvbGQuc29ydCgpLmZpbHRlcihmdW5jdGlvbih0LCBpLCBhKSB7XG4gICAgaWYgKHR5cGVvZiB0ICE9ICdudW1iZXInIHx8IGlzTmFOKHQpIHx8IHQgPCAwIHx8IHQgPiAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RocmVzaG9sZCBtdXN0IGJlIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMSBpbmNsdXNpdmVseScpO1xuICAgIH1cbiAgICByZXR1cm4gdCAhPT0gYVtpIC0gMV07XG4gIH0pO1xufTtcblxuXG4vKipcbiAqIEFjY2VwdHMgdGhlIHJvb3RNYXJnaW4gdmFsdWUgZnJvbSB0aGUgdXNlciBjb25maWd1cmF0aW9uIG9iamVjdFxuICogYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIGZvdXIgbWFyZ2luIHZhbHVlcyBhcyBhbiBvYmplY3QgY29udGFpbmluZ1xuICogdGhlIHZhbHVlIGFuZCB1bml0IHByb3BlcnRpZXMuIElmIGFueSBvZiB0aGUgdmFsdWVzIGFyZSBub3QgcHJvcGVybHlcbiAqIGZvcm1hdHRlZCBvciB1c2UgYSB1bml0IG90aGVyIHRoYW4gcHggb3IgJSwgYW5kIGVycm9yIGlzIHRocm93bi5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZz19IG9wdF9yb290TWFyZ2luIEFuIG9wdGlvbmFsIHJvb3RNYXJnaW4gdmFsdWUsXG4gKiAgICAgZGVmYXVsdGluZyB0byAnMHB4Jy5cbiAqIEByZXR1cm4ge0FycmF5PE9iamVjdD59IEFuIGFycmF5IG9mIG1hcmdpbiBvYmplY3RzIHdpdGggdGhlIGtleXNcbiAqICAgICB2YWx1ZSBhbmQgdW5pdC5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9wYXJzZVJvb3RNYXJnaW4gPSBmdW5jdGlvbihvcHRfcm9vdE1hcmdpbikge1xuICB2YXIgbWFyZ2luU3RyaW5nID0gb3B0X3Jvb3RNYXJnaW4gfHwgJzBweCc7XG4gIHZhciBtYXJnaW5zID0gbWFyZ2luU3RyaW5nLnNwbGl0KC9cXHMrLykubWFwKGZ1bmN0aW9uKG1hcmdpbikge1xuICAgIHZhciBwYXJ0cyA9IC9eKC0/XFxkKlxcLj9cXGQrKShweHwlKSQvLmV4ZWMobWFyZ2luKTtcbiAgICBpZiAoIXBhcnRzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Jvb3RNYXJnaW4gbXVzdCBiZSBzcGVjaWZpZWQgaW4gcGl4ZWxzIG9yIHBlcmNlbnQnKTtcbiAgICB9XG4gICAgcmV0dXJuIHt2YWx1ZTogcGFyc2VGbG9hdChwYXJ0c1sxXSksIHVuaXQ6IHBhcnRzWzJdfTtcbiAgfSk7XG5cbiAgLy8gSGFuZGxlcyBzaG9ydGhhbmQuXG4gIG1hcmdpbnNbMV0gPSBtYXJnaW5zWzFdIHx8IG1hcmdpbnNbMF07XG4gIG1hcmdpbnNbMl0gPSBtYXJnaW5zWzJdIHx8IG1hcmdpbnNbMF07XG4gIG1hcmdpbnNbM10gPSBtYXJnaW5zWzNdIHx8IG1hcmdpbnNbMV07XG5cbiAgcmV0dXJuIG1hcmdpbnM7XG59O1xuXG5cbi8qKlxuICogU3RhcnRzIHBvbGxpbmcgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzIGlmIHRoZSBwb2xsaW5nIGlzIG5vdCBhbHJlYWR5XG4gKiBoYXBwZW5pbmcsIGFuZCBpZiB0aGUgcGFnZSdzIHZpc2liaWxpdHkgc3RhdGUgaXMgdmlzaWJsZS5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fbW9uaXRvckludGVyc2VjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucykge1xuICAgIHRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zID0gdHJ1ZTtcblxuICAgIC8vIElmIGEgcG9sbCBpbnRlcnZhbCBpcyBzZXQsIHVzZSBwb2xsaW5nIGluc3RlYWQgb2YgbGlzdGVuaW5nIHRvXG4gICAgLy8gcmVzaXplIGFuZCBzY3JvbGwgZXZlbnRzIG9yIERPTSBtdXRhdGlvbnMuXG4gICAgaWYgKHRoaXMuUE9MTF9JTlRFUlZBTCkge1xuICAgICAgdGhpcy5fbW9uaXRvcmluZ0ludGVydmFsID0gc2V0SW50ZXJ2YWwoXG4gICAgICAgICAgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0aGlzLlBPTExfSU5URVJWQUwpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGFkZEV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdHJ1ZSk7XG4gICAgICBhZGRFdmVudChkb2N1bWVudCwgJ3Njcm9sbCcsIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdHJ1ZSk7XG5cbiAgICAgIGlmICh0aGlzLlVTRV9NVVRBVElPTl9PQlNFUlZFUiAmJiAnTXV0YXRpb25PYnNlcnZlcicgaW4gd2luZG93KSB7XG4gICAgICAgIHRoaXMuX2RvbU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIodGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zKTtcbiAgICAgICAgdGhpcy5fZG9tT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudCwge1xuICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cblxuLyoqXG4gKiBTdG9wcyBwb2xsaW5nIGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fdW5tb25pdG9ySW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMpIHtcbiAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucyA9IGZhbHNlO1xuXG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9tb25pdG9yaW5nSW50ZXJ2YWwpO1xuICAgIHRoaXMuX21vbml0b3JpbmdJbnRlcnZhbCA9IG51bGw7XG5cbiAgICByZW1vdmVFdmVudCh3aW5kb3csICdyZXNpemUnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xuICAgIHJlbW92ZUV2ZW50KGRvY3VtZW50LCAnc2Nyb2xsJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcblxuICAgIGlmICh0aGlzLl9kb21PYnNlcnZlcikge1xuICAgICAgdGhpcy5fZG9tT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgdGhpcy5fZG9tT2JzZXJ2ZXIgPSBudWxsO1xuICAgIH1cbiAgfVxufTtcblxuXG4vKipcbiAqIFNjYW5zIGVhY2ggb2JzZXJ2YXRpb24gdGFyZ2V0IGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcyBhbmQgYWRkcyB0aGVtXG4gKiB0byB0aGUgaW50ZXJuYWwgZW50cmllcyBxdWV1ZS4gSWYgbmV3IGVudHJpZXMgYXJlIGZvdW5kLCBpdFxuICogc2NoZWR1bGVzIHRoZSBjYWxsYmFjayB0byBiZSBpbnZva2VkLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9jaGVja0ZvckludGVyc2VjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3RJc0luRG9tID0gdGhpcy5fcm9vdElzSW5Eb20oKTtcbiAgdmFyIHJvb3RSZWN0ID0gcm9vdElzSW5Eb20gPyB0aGlzLl9nZXRSb290UmVjdCgpIDogZ2V0RW1wdHlSZWN0KCk7XG5cbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgIHZhciB0YXJnZXQgPSBpdGVtLmVsZW1lbnQ7XG4gICAgdmFyIHRhcmdldFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QodGFyZ2V0KTtcbiAgICB2YXIgcm9vdENvbnRhaW5zVGFyZ2V0ID0gdGhpcy5fcm9vdENvbnRhaW5zVGFyZ2V0KHRhcmdldCk7XG4gICAgdmFyIG9sZEVudHJ5ID0gaXRlbS5lbnRyeTtcbiAgICB2YXIgaW50ZXJzZWN0aW9uUmVjdCA9IHJvb3RJc0luRG9tICYmIHJvb3RDb250YWluc1RhcmdldCAmJlxuICAgICAgICB0aGlzLl9jb21wdXRlVGFyZ2V0QW5kUm9vdEludGVyc2VjdGlvbih0YXJnZXQsIHJvb3RSZWN0KTtcblxuICAgIHZhciBuZXdFbnRyeSA9IGl0ZW0uZW50cnkgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeSh7XG4gICAgICB0aW1lOiBub3coKSxcbiAgICAgIHRhcmdldDogdGFyZ2V0LFxuICAgICAgYm91bmRpbmdDbGllbnRSZWN0OiB0YXJnZXRSZWN0LFxuICAgICAgcm9vdEJvdW5kczogcm9vdFJlY3QsXG4gICAgICBpbnRlcnNlY3Rpb25SZWN0OiBpbnRlcnNlY3Rpb25SZWN0XG4gICAgfSk7XG5cbiAgICBpZiAoIW9sZEVudHJ5KSB7XG4gICAgICB0aGlzLl9xdWV1ZWRFbnRyaWVzLnB1c2gobmV3RW50cnkpO1xuICAgIH0gZWxzZSBpZiAocm9vdElzSW5Eb20gJiYgcm9vdENvbnRhaW5zVGFyZ2V0KSB7XG4gICAgICAvLyBJZiB0aGUgbmV3IGVudHJ5IGludGVyc2VjdGlvbiByYXRpbyBoYXMgY3Jvc3NlZCBhbnkgb2YgdGhlXG4gICAgICAvLyB0aHJlc2hvbGRzLCBhZGQgYSBuZXcgZW50cnkuXG4gICAgICBpZiAodGhpcy5faGFzQ3Jvc3NlZFRocmVzaG9sZChvbGRFbnRyeSwgbmV3RW50cnkpKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlZEVudHJpZXMucHVzaChuZXdFbnRyeSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZSByb290IGlzIG5vdCBpbiB0aGUgRE9NIG9yIHRhcmdldCBpcyBub3QgY29udGFpbmVkIHdpdGhpblxuICAgICAgLy8gcm9vdCBidXQgdGhlIHByZXZpb3VzIGVudHJ5IGZvciB0aGlzIHRhcmdldCBoYWQgYW4gaW50ZXJzZWN0aW9uLFxuICAgICAgLy8gYWRkIGEgbmV3IHJlY29yZCBpbmRpY2F0aW5nIHJlbW92YWwuXG4gICAgICBpZiAob2xkRW50cnkgJiYgb2xkRW50cnkuaXNJbnRlcnNlY3RpbmcpIHtcbiAgICAgICAgdGhpcy5fcXVldWVkRW50cmllcy5wdXNoKG5ld0VudHJ5KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHRoaXMpO1xuXG4gIGlmICh0aGlzLl9xdWV1ZWRFbnRyaWVzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrKHRoaXMudGFrZVJlY29yZHMoKSwgdGhpcyk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBBY2NlcHRzIGEgdGFyZ2V0IGFuZCByb290IHJlY3QgY29tcHV0ZXMgdGhlIGludGVyc2VjdGlvbiBiZXR3ZWVuIHRoZW5cbiAqIGZvbGxvd2luZyB0aGUgYWxnb3JpdGhtIGluIHRoZSBzcGVjLlxuICogVE9ETyhwaGlsaXB3YWx0b24pOiBhdCB0aGlzIHRpbWUgY2xpcC1wYXRoIGlzIG5vdCBjb25zaWRlcmVkLlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0ludGVyc2VjdGlvbk9ic2VydmVyLyNjYWxjdWxhdGUtaW50ZXJzZWN0aW9uLXJlY3QtYWxnb1xuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgVGhlIHRhcmdldCBET00gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IHJvb3RSZWN0IFRoZSBib3VuZGluZyByZWN0IG9mIHRoZSByb290IGFmdGVyIGJlaW5nXG4gKiAgICAgZXhwYW5kZWQgYnkgdGhlIHJvb3RNYXJnaW4gdmFsdWUuXG4gKiBAcmV0dXJuIHs/T2JqZWN0fSBUaGUgZmluYWwgaW50ZXJzZWN0aW9uIHJlY3Qgb2JqZWN0IG9yIHVuZGVmaW5lZCBpZiBub1xuICogICAgIGludGVyc2VjdGlvbiBpcyBmb3VuZC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fY29tcHV0ZVRhcmdldEFuZFJvb3RJbnRlcnNlY3Rpb24gPVxuICAgIGZ1bmN0aW9uKHRhcmdldCwgcm9vdFJlY3QpIHtcblxuICAvLyBJZiB0aGUgZWxlbWVudCBpc24ndCBkaXNwbGF5ZWQsIGFuIGludGVyc2VjdGlvbiBjYW4ndCBoYXBwZW4uXG4gIGlmICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpLmRpc3BsYXkgPT0gJ25vbmUnKSByZXR1cm47XG5cbiAgdmFyIHRhcmdldFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QodGFyZ2V0KTtcbiAgdmFyIGludGVyc2VjdGlvblJlY3QgPSB0YXJnZXRSZWN0O1xuICB2YXIgcGFyZW50ID0gZ2V0UGFyZW50Tm9kZSh0YXJnZXQpO1xuICB2YXIgYXRSb290ID0gZmFsc2U7XG5cbiAgd2hpbGUgKCFhdFJvb3QpIHtcbiAgICB2YXIgcGFyZW50UmVjdCA9IG51bGw7XG4gICAgdmFyIHBhcmVudENvbXB1dGVkU3R5bGUgPSBwYXJlbnQubm9kZVR5cGUgPT0gMSA/XG4gICAgICAgIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHBhcmVudCkgOiB7fTtcblxuICAgIC8vIElmIHRoZSBwYXJlbnQgaXNuJ3QgZGlzcGxheWVkLCBhbiBpbnRlcnNlY3Rpb24gY2FuJ3QgaGFwcGVuLlxuICAgIGlmIChwYXJlbnRDb21wdXRlZFN0eWxlLmRpc3BsYXkgPT0gJ25vbmUnKSByZXR1cm47XG5cbiAgICBpZiAocGFyZW50ID09IHRoaXMucm9vdCB8fCBwYXJlbnQgPT0gZG9jdW1lbnQpIHtcbiAgICAgIGF0Um9vdCA9IHRydWU7XG4gICAgICBwYXJlbnRSZWN0ID0gcm9vdFJlY3Q7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRoZSBlbGVtZW50IGhhcyBhIG5vbi12aXNpYmxlIG92ZXJmbG93LCBhbmQgaXQncyBub3QgdGhlIDxib2R5PlxuICAgICAgLy8gb3IgPGh0bWw+IGVsZW1lbnQsIHVwZGF0ZSB0aGUgaW50ZXJzZWN0aW9uIHJlY3QuXG4gICAgICAvLyBOb3RlOiA8Ym9keT4gYW5kIDxodG1sPiBjYW5ub3QgYmUgY2xpcHBlZCB0byBhIHJlY3QgdGhhdCdzIG5vdCBhbHNvXG4gICAgICAvLyB0aGUgZG9jdW1lbnQgcmVjdCwgc28gbm8gbmVlZCB0byBjb21wdXRlIGEgbmV3IGludGVyc2VjdGlvbi5cbiAgICAgIGlmIChwYXJlbnQgIT0gZG9jdW1lbnQuYm9keSAmJlxuICAgICAgICAgIHBhcmVudCAhPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiZcbiAgICAgICAgICBwYXJlbnRDb21wdXRlZFN0eWxlLm92ZXJmbG93ICE9ICd2aXNpYmxlJykge1xuICAgICAgICBwYXJlbnRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgZWl0aGVyIG9mIHRoZSBhYm92ZSBjb25kaXRpb25hbHMgc2V0IGEgbmV3IHBhcmVudFJlY3QsXG4gICAgLy8gY2FsY3VsYXRlIG5ldyBpbnRlcnNlY3Rpb24gZGF0YS5cbiAgICBpZiAocGFyZW50UmVjdCkge1xuICAgICAgaW50ZXJzZWN0aW9uUmVjdCA9IGNvbXB1dGVSZWN0SW50ZXJzZWN0aW9uKHBhcmVudFJlY3QsIGludGVyc2VjdGlvblJlY3QpO1xuXG4gICAgICBpZiAoIWludGVyc2VjdGlvblJlY3QpIGJyZWFrO1xuICAgIH1cbiAgICBwYXJlbnQgPSBnZXRQYXJlbnROb2RlKHBhcmVudCk7XG4gIH1cbiAgcmV0dXJuIGludGVyc2VjdGlvblJlY3Q7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgcm9vdCByZWN0IGFmdGVyIGJlaW5nIGV4cGFuZGVkIGJ5IHRoZSByb290TWFyZ2luIHZhbHVlLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXhwYW5kZWQgcm9vdCByZWN0LlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9nZXRSb290UmVjdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdFJlY3Q7XG4gIGlmICh0aGlzLnJvb3QpIHtcbiAgICByb290UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLnJvb3QpO1xuICB9IGVsc2Uge1xuICAgIC8vIFVzZSA8aHRtbD4vPGJvZHk+IGluc3RlYWQgb2Ygd2luZG93IHNpbmNlIHNjcm9sbCBiYXJzIGFmZmVjdCBzaXplLlxuICAgIHZhciBodG1sID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICByb290UmVjdCA9IHtcbiAgICAgIHRvcDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICByaWdodDogaHRtbC5jbGllbnRXaWR0aCB8fCBib2R5LmNsaWVudFdpZHRoLFxuICAgICAgd2lkdGg6IGh0bWwuY2xpZW50V2lkdGggfHwgYm9keS5jbGllbnRXaWR0aCxcbiAgICAgIGJvdHRvbTogaHRtbC5jbGllbnRIZWlnaHQgfHwgYm9keS5jbGllbnRIZWlnaHQsXG4gICAgICBoZWlnaHQ6IGh0bWwuY2xpZW50SGVpZ2h0IHx8IGJvZHkuY2xpZW50SGVpZ2h0XG4gICAgfTtcbiAgfVxuICByZXR1cm4gdGhpcy5fZXhwYW5kUmVjdEJ5Um9vdE1hcmdpbihyb290UmVjdCk7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyBhIHJlY3QgYW5kIGV4cGFuZHMgaXQgYnkgdGhlIHJvb3RNYXJnaW4gdmFsdWUuXG4gKiBAcGFyYW0ge09iamVjdH0gcmVjdCBUaGUgcmVjdCBvYmplY3QgdG8gZXhwYW5kLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXhwYW5kZWQgcmVjdC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fZXhwYW5kUmVjdEJ5Um9vdE1hcmdpbiA9IGZ1bmN0aW9uKHJlY3QpIHtcbiAgdmFyIG1hcmdpbnMgPSB0aGlzLl9yb290TWFyZ2luVmFsdWVzLm1hcChmdW5jdGlvbihtYXJnaW4sIGkpIHtcbiAgICByZXR1cm4gbWFyZ2luLnVuaXQgPT0gJ3B4JyA/IG1hcmdpbi52YWx1ZSA6XG4gICAgICAgIG1hcmdpbi52YWx1ZSAqIChpICUgMiA/IHJlY3Qud2lkdGggOiByZWN0LmhlaWdodCkgLyAxMDA7XG4gIH0pO1xuICB2YXIgbmV3UmVjdCA9IHtcbiAgICB0b3A6IHJlY3QudG9wIC0gbWFyZ2luc1swXSxcbiAgICByaWdodDogcmVjdC5yaWdodCArIG1hcmdpbnNbMV0sXG4gICAgYm90dG9tOiByZWN0LmJvdHRvbSArIG1hcmdpbnNbMl0sXG4gICAgbGVmdDogcmVjdC5sZWZ0IC0gbWFyZ2luc1szXVxuICB9O1xuICBuZXdSZWN0LndpZHRoID0gbmV3UmVjdC5yaWdodCAtIG5ld1JlY3QubGVmdDtcbiAgbmV3UmVjdC5oZWlnaHQgPSBuZXdSZWN0LmJvdHRvbSAtIG5ld1JlY3QudG9wO1xuXG4gIHJldHVybiBuZXdSZWN0O1xufTtcblxuXG4vKipcbiAqIEFjY2VwdHMgYW4gb2xkIGFuZCBuZXcgZW50cnkgYW5kIHJldHVybnMgdHJ1ZSBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlXG4gKiB0aHJlc2hvbGQgdmFsdWVzIGhhcyBiZWVuIGNyb3NzZWQuXG4gKiBAcGFyYW0gez9JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5fSBvbGRFbnRyeSBUaGUgcHJldmlvdXMgZW50cnkgZm9yIGFcbiAqICAgIHBhcnRpY3VsYXIgdGFyZ2V0IGVsZW1lbnQgb3IgbnVsbCBpZiBubyBwcmV2aW91cyBlbnRyeSBleGlzdHMuXG4gKiBAcGFyYW0ge0ludGVyc2VjdGlvbk9ic2VydmVyRW50cnl9IG5ld0VudHJ5IFRoZSBjdXJyZW50IGVudHJ5IGZvciBhXG4gKiAgICBwYXJ0aWN1bGFyIHRhcmdldCBlbGVtZW50LlxuICogQHJldHVybiB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIGEgYW55IHRocmVzaG9sZCBoYXMgYmVlbiBjcm9zc2VkLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9oYXNDcm9zc2VkVGhyZXNob2xkID1cbiAgICBmdW5jdGlvbihvbGRFbnRyeSwgbmV3RW50cnkpIHtcblxuICAvLyBUbyBtYWtlIGNvbXBhcmluZyBlYXNpZXIsIGFuIGVudHJ5IHRoYXQgaGFzIGEgcmF0aW8gb2YgMFxuICAvLyBidXQgZG9lcyBub3QgYWN0dWFsbHkgaW50ZXJzZWN0IGlzIGdpdmVuIGEgdmFsdWUgb2YgLTFcbiAgdmFyIG9sZFJhdGlvID0gb2xkRW50cnkgJiYgb2xkRW50cnkuaXNJbnRlcnNlY3RpbmcgP1xuICAgICAgb2xkRW50cnkuaW50ZXJzZWN0aW9uUmF0aW8gfHwgMCA6IC0xO1xuICB2YXIgbmV3UmF0aW8gPSBuZXdFbnRyeS5pc0ludGVyc2VjdGluZyA/XG4gICAgICBuZXdFbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyB8fCAwIDogLTE7XG5cbiAgLy8gSWdub3JlIHVuY2hhbmdlZCByYXRpb3NcbiAgaWYgKG9sZFJhdGlvID09PSBuZXdSYXRpbykgcmV0dXJuO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50aHJlc2hvbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRocmVzaG9sZCA9IHRoaXMudGhyZXNob2xkc1tpXTtcblxuICAgIC8vIFJldHVybiB0cnVlIGlmIGFuIGVudHJ5IG1hdGNoZXMgYSB0aHJlc2hvbGQgb3IgaWYgdGhlIG5ldyByYXRpb1xuICAgIC8vIGFuZCB0aGUgb2xkIHJhdGlvIGFyZSBvbiB0aGUgb3Bwb3NpdGUgc2lkZXMgb2YgYSB0aHJlc2hvbGQuXG4gICAgaWYgKHRocmVzaG9sZCA9PSBvbGRSYXRpbyB8fCB0aHJlc2hvbGQgPT0gbmV3UmF0aW8gfHxcbiAgICAgICAgdGhyZXNob2xkIDwgb2xkUmF0aW8gIT09IHRocmVzaG9sZCA8IG5ld1JhdGlvKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSByb290IGVsZW1lbnQgaXMgYW4gZWxlbWVudCBhbmQgaXMgaW4gdGhlIERPTS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHJvb3QgZWxlbWVudCBpcyBhbiBlbGVtZW50IGFuZCBpcyBpbiB0aGUgRE9NLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9yb290SXNJbkRvbSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIXRoaXMucm9vdCB8fCBjb250YWluc0RlZXAoZG9jdW1lbnQsIHRoaXMucm9vdCk7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiByb290LlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgVGhlIHRhcmdldCBlbGVtZW50IHRvIGNoZWNrLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiByb290LlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9yb290Q29udGFpbnNUYXJnZXQgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgcmV0dXJuIGNvbnRhaW5zRGVlcCh0aGlzLnJvb3QgfHwgZG9jdW1lbnQsIHRhcmdldCk7XG59O1xuXG5cbi8qKlxuICogQWRkcyB0aGUgaW5zdGFuY2UgdG8gdGhlIGdsb2JhbCBJbnRlcnNlY3Rpb25PYnNlcnZlciByZWdpc3RyeSBpZiBpdCBpc24ndFxuICogYWxyZWFkeSBwcmVzZW50LlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9yZWdpc3Rlckluc3RhbmNlID0gZnVuY3Rpb24oKSB7XG4gIGlmIChyZWdpc3RyeS5pbmRleE9mKHRoaXMpIDwgMCkge1xuICAgIHJlZ2lzdHJ5LnB1c2godGhpcyk7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBpbnN0YW5jZSBmcm9tIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgcmVnaXN0cnkuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3VucmVnaXN0ZXJJbnN0YW5jZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaW5kZXggPSByZWdpc3RyeS5pbmRleE9mKHRoaXMpO1xuICBpZiAoaW5kZXggIT0gLTEpIHJlZ2lzdHJ5LnNwbGljZShpbmRleCwgMSk7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSBwZXJmb3JtYW5jZS5ub3coKSBtZXRob2Qgb3IgbnVsbCBpbiBicm93c2Vyc1xuICogdGhhdCBkb24ndCBzdXBwb3J0IHRoZSBBUEkuXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBlbGFwc2VkIHRpbWUgc2luY2UgdGhlIHBhZ2Ugd2FzIHJlcXVlc3RlZC5cbiAqL1xuZnVuY3Rpb24gbm93KCkge1xuICByZXR1cm4gd2luZG93LnBlcmZvcm1hbmNlICYmIHBlcmZvcm1hbmNlLm5vdyAmJiBwZXJmb3JtYW5jZS5ub3coKTtcbn1cblxuXG4vKipcbiAqIFRocm90dGxlcyBhIGZ1bmN0aW9uIGFuZCBkZWxheXMgaXRzIGV4ZWN1dGlvbiwgc28gaXQncyBvbmx5IGNhbGxlZCBhdCBtb3N0XG4gKiBvbmNlIHdpdGhpbiBhIGdpdmVuIHRpbWUgcGVyaW9kLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIHRocm90dGxlLlxuICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXQgVGhlIGFtb3VudCBvZiB0aW1lIHRoYXQgbXVzdCBwYXNzIGJlZm9yZSB0aGVcbiAqICAgICBmdW5jdGlvbiBjYW4gYmUgY2FsbGVkIGFnYWluLlxuICogQHJldHVybiB7RnVuY3Rpb259IFRoZSB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZuLCB0aW1lb3V0KSB7XG4gIHZhciB0aW1lciA9IG51bGw7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aW1lcikge1xuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBmbigpO1xuICAgICAgICB0aW1lciA9IG51bGw7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gIH07XG59XG5cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gYSBET00gbm9kZSBlbnN1cmluZyBjcm9zcy1icm93c2VyIGNvbXBhdGliaWxpdHkuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIERPTSBub2RlIHRvIGFkZCB0aGUgZXZlbnQgaGFuZGxlciB0by5cbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBldmVudCBoYW5kbGVyIHRvIGFkZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0X3VzZUNhcHR1cmUgT3B0aW9uYWxseSBhZGRzIHRoZSBldmVuIHRvIHRoZSBjYXB0dXJlXG4gKiAgICAgcGhhc2UuIE5vdGU6IHRoaXMgb25seSB3b3JrcyBpbiBtb2Rlcm4gYnJvd3NlcnMuXG4gKi9cbmZ1bmN0aW9uIGFkZEV2ZW50KG5vZGUsIGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUpIHtcbiAgaWYgKHR5cGVvZiBub2RlLmFkZEV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sIG9wdF91c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgfVxuICBlbHNlIGlmICh0eXBlb2Ygbm9kZS5hdHRhY2hFdmVudCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgbm9kZS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGZuKTtcbiAgfVxufVxuXG5cbi8qKlxuICogUmVtb3ZlcyBhIHByZXZpb3VzbHkgYWRkZWQgZXZlbnQgaGFuZGxlciBmcm9tIGEgRE9NIG5vZGUuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIERPTSBub2RlIHRvIHJlbW92ZSB0aGUgZXZlbnQgaGFuZGxlciBmcm9tLlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGV2ZW50IGhhbmRsZXIgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtib29sZWFufSBvcHRfdXNlQ2FwdHVyZSBJZiB0aGUgZXZlbnQgaGFuZGxlciB3YXMgYWRkZWQgd2l0aCB0aGlzXG4gKiAgICAgZmxhZyBzZXQgdG8gdHJ1ZSwgaXQgc2hvdWxkIGJlIHNldCB0byB0cnVlIGhlcmUgaW4gb3JkZXIgdG8gcmVtb3ZlIGl0LlxuICovXG5mdW5jdGlvbiByZW1vdmVFdmVudChub2RlLCBldmVudCwgZm4sIG9wdF91c2VDYXB0dXJlKSB7XG4gIGlmICh0eXBlb2Ygbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyID09ICdmdW5jdGlvbicpIHtcbiAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gIH1cbiAgZWxzZSBpZiAodHlwZW9mIG5vZGUuZGV0YXRjaEV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICBub2RlLmRldGF0Y2hFdmVudCgnb24nICsgZXZlbnQsIGZuKTtcbiAgfVxufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW50ZXJzZWN0aW9uIGJldHdlZW4gdHdvIHJlY3Qgb2JqZWN0cy5cbiAqIEBwYXJhbSB7T2JqZWN0fSByZWN0MSBUaGUgZmlyc3QgcmVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSByZWN0MiBUaGUgc2Vjb25kIHJlY3QuXG4gKiBAcmV0dXJuIHs/T2JqZWN0fSBUaGUgaW50ZXJzZWN0aW9uIHJlY3Qgb3IgdW5kZWZpbmVkIGlmIG5vIGludGVyc2VjdGlvblxuICogICAgIGlzIGZvdW5kLlxuICovXG5mdW5jdGlvbiBjb21wdXRlUmVjdEludGVyc2VjdGlvbihyZWN0MSwgcmVjdDIpIHtcbiAgdmFyIHRvcCA9IE1hdGgubWF4KHJlY3QxLnRvcCwgcmVjdDIudG9wKTtcbiAgdmFyIGJvdHRvbSA9IE1hdGgubWluKHJlY3QxLmJvdHRvbSwgcmVjdDIuYm90dG9tKTtcbiAgdmFyIGxlZnQgPSBNYXRoLm1heChyZWN0MS5sZWZ0LCByZWN0Mi5sZWZ0KTtcbiAgdmFyIHJpZ2h0ID0gTWF0aC5taW4ocmVjdDEucmlnaHQsIHJlY3QyLnJpZ2h0KTtcbiAgdmFyIHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xuICB2YXIgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xuXG4gIHJldHVybiAod2lkdGggPj0gMCAmJiBoZWlnaHQgPj0gMCkgJiYge1xuICAgIHRvcDogdG9wLFxuICAgIGJvdHRvbTogYm90dG9tLFxuICAgIGxlZnQ6IGxlZnQsXG4gICAgcmlnaHQ6IHJpZ2h0LFxuICAgIHdpZHRoOiB3aWR0aCxcbiAgICBoZWlnaHQ6IGhlaWdodFxuICB9O1xufVxuXG5cbi8qKlxuICogU2hpbXMgdGhlIG5hdGl2ZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBvbGRlciBJRS5cbiAqIEBwYXJhbSB7RWxlbWVudH0gZWwgVGhlIGVsZW1lbnQgd2hvc2UgYm91bmRpbmcgcmVjdCB0byBnZXQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSAocG9zc2libHkgc2hpbW1lZCkgcmVjdCBvZiB0aGUgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsKSB7XG4gIHZhciByZWN0O1xuXG4gIHRyeSB7XG4gICAgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBJZ25vcmUgV2luZG93cyA3IElFMTEgXCJVbnNwZWNpZmllZCBlcnJvclwiXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3czYy9JbnRlcnNlY3Rpb25PYnNlcnZlci9wdWxsLzIwNVxuICB9XG5cbiAgaWYgKCFyZWN0KSByZXR1cm4gZ2V0RW1wdHlSZWN0KCk7XG5cbiAgLy8gT2xkZXIgSUVcbiAgaWYgKCEocmVjdC53aWR0aCAmJiByZWN0LmhlaWdodCkpIHtcbiAgICByZWN0ID0ge1xuICAgICAgdG9wOiByZWN0LnRvcCxcbiAgICAgIHJpZ2h0OiByZWN0LnJpZ2h0LFxuICAgICAgYm90dG9tOiByZWN0LmJvdHRvbSxcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCxcbiAgICAgIHdpZHRoOiByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0LFxuICAgICAgaGVpZ2h0OiByZWN0LmJvdHRvbSAtIHJlY3QudG9wXG4gICAgfTtcbiAgfVxuICByZXR1cm4gcmVjdDtcbn1cblxuXG4vKipcbiAqIFJldHVybnMgYW4gZW1wdHkgcmVjdCBvYmplY3QuIEFuIGVtcHR5IHJlY3QgaXMgcmV0dXJuZWQgd2hlbiBhbiBlbGVtZW50XG4gKiBpcyBub3QgaW4gdGhlIERPTS5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGVtcHR5IHJlY3QuXG4gKi9cbmZ1bmN0aW9uIGdldEVtcHR5UmVjdCgpIHtcbiAgcmV0dXJuIHtcbiAgICB0b3A6IDAsXG4gICAgYm90dG9tOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgcmlnaHQ6IDAsXG4gICAgd2lkdGg6IDAsXG4gICAgaGVpZ2h0OiAwXG4gIH07XG59XG5cbi8qKlxuICogQ2hlY2tzIHRvIHNlZSBpZiBhIHBhcmVudCBlbGVtZW50IGNvbnRhaW5zIGEgY2hpbGQgZWxlbWVudCAoaW5jbHVkaW5nIGluc2lkZVxuICogc2hhZG93IERPTSkuXG4gKiBAcGFyYW0ge05vZGV9IHBhcmVudCBUaGUgcGFyZW50IGVsZW1lbnQuXG4gKiBAcGFyYW0ge05vZGV9IGNoaWxkIFRoZSBjaGlsZCBlbGVtZW50LlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgcGFyZW50IG5vZGUgY29udGFpbnMgdGhlIGNoaWxkIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGNvbnRhaW5zRGVlcChwYXJlbnQsIGNoaWxkKSB7XG4gIHZhciBub2RlID0gY2hpbGQ7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgaWYgKG5vZGUgPT0gcGFyZW50KSByZXR1cm4gdHJ1ZTtcblxuICAgIG5vZGUgPSBnZXRQYXJlbnROb2RlKG5vZGUpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG4vKipcbiAqIEdldHMgdGhlIHBhcmVudCBub2RlIG9mIGFuIGVsZW1lbnQgb3IgaXRzIGhvc3QgZWxlbWVudCBpZiB0aGUgcGFyZW50IG5vZGVcbiAqIGlzIGEgc2hhZG93IHJvb3QuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIG5vZGUgd2hvc2UgcGFyZW50IHRvIGdldC5cbiAqIEByZXR1cm4ge05vZGV8bnVsbH0gVGhlIHBhcmVudCBub2RlIG9yIG51bGwgaWYgbm8gcGFyZW50IGV4aXN0cy5cbiAqL1xuZnVuY3Rpb24gZ2V0UGFyZW50Tm9kZShub2RlKSB7XG4gIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XG5cbiAgaWYgKHBhcmVudCAmJiBwYXJlbnQubm9kZVR5cGUgPT0gMTEgJiYgcGFyZW50Lmhvc3QpIHtcbiAgICAvLyBJZiB0aGUgcGFyZW50IGlzIGEgc2hhZG93IHJvb3QsIHJldHVybiB0aGUgaG9zdCBlbGVtZW50LlxuICAgIHJldHVybiBwYXJlbnQuaG9zdDtcbiAgfVxuXG4gIGlmIChwYXJlbnQgJiYgcGFyZW50LmFzc2lnbmVkU2xvdCkge1xuICAgIC8vIElmIHRoZSBwYXJlbnQgaXMgZGlzdHJpYnV0ZWQgaW4gYSA8c2xvdD4sIHJldHVybiB0aGUgcGFyZW50IG9mIGEgc2xvdC5cbiAgICByZXR1cm4gcGFyZW50LmFzc2lnbmVkU2xvdC5wYXJlbnROb2RlO1xuICB9XG5cbiAgcmV0dXJuIHBhcmVudDtcbn1cblxuXG4vLyBFeHBvc2VzIHRoZSBjb25zdHJ1Y3RvcnMgZ2xvYmFsbHkuXG53aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbndpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5ID0gSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeTtcblxufSh3aW5kb3csIGRvY3VtZW50KSk7XG4iLCIvLyB2YXIgJHNlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluIHNlY3Rpb24nKTtcbnZhciAkbWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKTtcbnZhciAkc2VjdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3NlY3Rpb24gLnBhZ2VzJyk7XG52YXIgJGlubmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcignc2VjdGlvbiAucGFnZXMgLnBhZ2VzLWlubmVyJyk7XG52YXIgaXNfYWN0aXZlID0gZmFsc2U7XG52YXIgc2NhbGUgPSAwLjc1O1xudmFyIGltYWdlX3dpZHRoID0gNjgwO1xuXG52YXIgJG5hdmlnYXRvciA9IHsgXG4gIGlucHV0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwicmFuZ2VcIl0nKSxcbiAgc3RhdHVzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2aWdhdG9yLXJhbmdlX19iYWNrZ3JvdW5kJylcbn07XG4kbmF2aWdhdG9yLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gIHZhciBzZXEgPSB0aGlzLnZhbHVlO1xuICBnb3RvUGFnZShzZXEpO1xufSlcblxudmFyIGhhbmRsZU9ic2VydmVyID0gZnVuY3Rpb24oZW50cmllcywgb2JzZXJ2ZXIpIHtcbiAgdmFyIGN1cnJlbnQgPSB7IHBhZ2U6IG51bGwsIHJhdGlvOiAwIH07XG4gIGVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgdmFyIGRpdiA9IGVudHJ5LnRhcmdldDtcbiAgICB2YXIgc2VxID0gZGl2LmRhdGFzZXQuc2VxO1xuICAgIHZhciB2aWV3ZWQgPSBkaXYucXVlcnlTZWxlY3RvcignY2FudmFzJyk7XG4gICAgaWYgKCBlbnRyeS5pc0ludGVyc2VjdGluZyAmJiBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyA+IDAuMCAgKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWSU5HXCIsIGVudHJpZXMubGVuZ3RoLCBzZXEsICdvbkVudGVyJywgZW50cnkuaW50ZXJzZWN0aW9uUmF0aW8pO1xuICAgICAgaWYgKCBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyA+IGN1cnJlbnQucmF0aW8gKSB7XG4gICAgICAgIGN1cnJlbnQucmF0aW9uID0gZW50cnkuaW50ZXJzZWN0aW9uUmF0aW87XG4gICAgICAgIGN1cnJlbnQucGFnZSA9IGRpdjtcbiAgICAgIH1cbiAgICAgIGlmICggISB2aWV3ZWQgKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQUhPWSBPQlNFUlZJTkdcIiwgZW50cmllcy5sZW5ndGgsIHNlcSwgJ29uRW50ZXInKTtcbiAgICAgICAgbG9hZEltYWdlKGRpdiwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKCAgZGl2LmRhdGFzZXQucHJlbG9hZGVkICkge1xuICAgICAgICBkaXYuZGF0YXNldC5wcmVsb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgcmVzaXplUGFnZShkaXYpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIHZpZXdlZCAmJiAhIGRpdi5kYXRhc2V0LnByZWxvYWRlZCApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBPQlNFUlZJTkdcIiwgZW50cmllcy5sZW5ndGgsIHNlcSwgJ29uRXhpdCcpO1xuICAgICAgdW5sb2FkSW1hZ2UoZGl2KTtcbiAgICB9XG4gIH0pXG4gIGlmICggY3VycmVudC5wYWdlICkge1xuICAgIHVwZGF0ZV9uYXZpZ2F0b3IoY3VycmVudC5wYWdlKTtcbiAgfVxufTtcblxudmFyICRvYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihoYW5kbGVPYnNlcnZlciwge1xuICAgIHJvb3Q6ICRzZWN0aW9uLFxuICAgIHJvb3RNYXJnaW46ICcwcHgnLFxuICAgIHRocmVzaG9sZDogWzAsIDAuMSwgMC4yLCAwLjMsIDAuNCwgMC41LCAwLjYsIDAuNywgMC44LCAwLjksIDFdXG59KTtcblxudmFyIHJlc2l6ZVBhZ2UgPSBmdW5jdGlvbihwYWdlKSB7XG4gIHZhciBjYW52YXMgPSBwYWdlLnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpO1xuICBpZiAoICEgY2FudmFzICkgeyByZXR1cm4gOyB9XG5cbiAgaWYgKCBwYWdlLmRhdGFzZXQubG9hZGluZyAhPT0gJ2ZhbHNlJyApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYm91bmRzID0gJHNlY3Rpb24uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHZhciByZWN0ID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICBpZiAoIGNhbnZhcy5oZWlnaHQgPCBwYXJzZUludChwYWdlLnN0eWxlLmhlaWdodCkgKSB7XG4gICAgY29uc29sZS5sb2coXCJBSE9ZIHNocmlua2luZ1wiLCBwYWdlLmRhdGFzZXQuc2VxLCBwYWdlLnN0eWxlLmhlaWdodCwgY2FudmFzLmhlaWdodCk7XG4gIH1cbiAgcGFnZS5zdHlsZS5oZWlnaHQgPSBgJHtjYW52YXMuaGVpZ2h0fXB4YDtcbiAgdmFyIHVwZGF0ZWRfcmVjdCA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIHZhciBzY3JvbGxUb3AgPSAkc2VjdGlvbi5zY3JvbGxUb3A7XG5cbiAgaWYgKCAkbWFpbi5kYXRhc2V0LnZpZXcgPT0gJzF1cCcgJiYgcmVjdC5ib3R0b20gPD0gYm91bmRzLmJvdHRvbSAmJiByZWN0LnRvcCA8IDAgKSB7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGRlbHRhID0gdXBkYXRlZF9yZWN0LmhlaWdodCAtIHJlY3QuaGVpZ2h0O1xuICAgICAgaWYgKCAkc2VjdGlvbi5zY3JvbGxUb3AgPT0gc2Nyb2xsVG9wICkge1xuICAgICAgICAvLyBkZWx0YSAvPSB0aGlzLnNldHRpbmdzLnNjYWxlO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgYWZ0ZXJSZXNpemVkXCIsIHZpZXcuaW5kZXgsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgdmlldy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCwgcmVjdC5oZWlnaHQsIGRlbHRhIC8gdGhpcy5zZXR0aW5ncy5zY2FsZSk7XG4gICAgICAgICRzZWN0aW9uLnNjcm9sbFRvcCArPSBNYXRoLmNlaWwoZGVsdGEpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgYWZ0ZXJSZXNpemVkXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHNjcm9sbFRvcCwgJHNlY3Rpb24uc2Nyb2xsVG9wLCBkZWx0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgZG9ub3RSZXNpemVkXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHNjcm9sbFRvcCwgJHNlY3Rpb24uc2Nyb2xsVG9wLCBkZWx0YSk7XG4gICAgICB9XG4gICAgfSwgNTAwKTtcbiAgfVxufVxuXG52YXIgZml0SW1hZ2VPbiA9IGZ1bmN0aW9uKGNhbnZhcywgaW1hZ2VPYmopIHtcbiAgaWYgKCAhIGNhbnZhcy5wYXJlbnROb2RlICkge1xuICAgIGNvbnNvbGUubG9nKFwiQUhPWSBMT1NUIFBBUkVOVFwiLCBjYW52YXMuZGF0YXNldC5zZXEpO1xuICB9XG4gIHZhciBpbWFnZUFzcGVjdFJhdGlvID0gaW1hZ2VPYmoud2lkdGggLyBpbWFnZU9iai5oZWlnaHQ7XG5cbiAgLy8gY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCAqIGltYWdlQXNwZWN0UmF0aW87XG4gIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggLyBpbWFnZUFzcGVjdFJhdGlvO1xuICAvLyBjYW52YXMucGFyZW50Tm9kZS5zdHlsZS5oZWlnaHQgPSBgJHtjYW52YXMuaGVpZ2h0fXB4YDtcblxuICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBcbiAgdmFyIGNhbnZhc0FzcGVjdFJhdGlvID0gY2FudmFzLndpZHRoIC8gY2FudmFzLmhlaWdodDtcbiAgdmFyIHJlbmRlcmFibGVIZWlnaHQsIHJlbmRlcmFibGVXaWR0aCwgeFN0YXJ0LCB5U3RhcnQ7XG5cbiAgLy8gSWYgaW1hZ2UncyBhc3BlY3QgcmF0aW8gaXMgbGVzcyB0aGFuIGNhbnZhcydzIHdlIGZpdCBvbiBoZWlnaHRcbiAgLy8gYW5kIHBsYWNlIHRoZSBpbWFnZSBjZW50cmFsbHkgYWxvbmcgd2lkdGhcbiAgaWYoaW1hZ2VBc3BlY3RSYXRpbyA8IGNhbnZhc0FzcGVjdFJhdGlvKSB7XG4gICAgcmVuZGVyYWJsZUhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgcmVuZGVyYWJsZVdpZHRoID0gaW1hZ2VPYmoud2lkdGggKiAocmVuZGVyYWJsZUhlaWdodCAvIGltYWdlT2JqLmhlaWdodCk7XG4gICAgeFN0YXJ0ID0gKGNhbnZhcy53aWR0aCAtIHJlbmRlcmFibGVXaWR0aCkgLyAyO1xuICAgIHlTdGFydCA9IDA7XG4gICAgLy8gY29uc29sZS5sb2coYEFIT1kgYSA6ICR7Y2FudmFzLndpZHRofSB4ICR7Y2FudmFzLmhlaWdodH0gLyAke2NhbnZhcy5vZmZzZXRIZWlnaHR9IDo6ICR7cmVuZGVyYWJsZVdpZHRofSB4ICR7cmVuZGVyYWJsZUhlaWdodH1gKTtcbiAgfVxuXG4gIC8vIElmIGltYWdlJ3MgYXNwZWN0IHJhdGlvIGlzIGdyZWF0ZXIgdGhhbiBjYW52YXMncyB3ZSBmaXQgb24gd2lkdGhcbiAgLy8gYW5kIHBsYWNlIHRoZSBpbWFnZSBjZW50cmFsbHkgYWxvbmcgaGVpZ2h0XG4gIGVsc2UgaWYoaW1hZ2VBc3BlY3RSYXRpbyA+IGNhbnZhc0FzcGVjdFJhdGlvKSB7XG5cbiAgICByZW5kZXJhYmxlV2lkdGggPSBjYW52YXMud2lkdGhcbiAgICByZW5kZXJhYmxlSGVpZ2h0ID0gaW1hZ2VPYmouaGVpZ2h0ICogKHJlbmRlcmFibGVXaWR0aCAvIGltYWdlT2JqLndpZHRoKTtcbiAgICB4U3RhcnQgPSAwO1xuICAgIHlTdGFydCA9IChjYW52YXMuaGVpZ2h0IC0gcmVuZGVyYWJsZUhlaWdodCkgLyAyO1xuICB9XG5cbiAgLy8gSGFwcHkgcGF0aCAtIGtlZXAgYXNwZWN0IHJhdGlvXG4gIGVsc2Uge1xuICAgIFxuICAgIHJlbmRlcmFibGVIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgIHJlbmRlcmFibGVXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICB4U3RhcnQgPSAwO1xuICAgIHlTdGFydCA9IDA7XG4gIH1cbiAgeFN0YXJ0ID0gMDtcbiAgeVN0YXJ0ID0gMDtcbiAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2VPYmosIHhTdGFydCwgeVN0YXJ0LCByZW5kZXJhYmxlV2lkdGgsIHJlbmRlcmFibGVIZWlnaHQpO1xuICBjYW52YXMuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgLy8gY29udGV4dC5mb250ID0gJzQ4cHggbW9ub3NwYWNlJztcbiAgLy8gY29udGV4dC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgLy8gY29udGV4dC5maWxsVGV4dCgnSGVsbG8gd29ybGQnLCBjYW52YXMud2lkdGggLyAyLCAoY2FudmFzLmhlaWdodCAvIDIpICk7XG59O1xuXG52YXIgbG9hZEltYWdlID0gZnVuY3Rpb24ocGFnZSwgY2hlY2tfc2Nyb2xsKSB7XG4gIGlmICggISBpc19hY3RpdmUgKSB7IHJldHVybiA7IH1cbiAgdmFyIHNlcSA9IHBhZ2UuZGF0YXNldC5zZXE7XG4gIHZhciBib3VuZHMgPSAkc2VjdGlvbi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgdmFyIHJlY3QgPSBwYWdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIGNvbnNvbGUubG9nKFwiQUhPWSBMT0FESU5HXCIsIHNlcSk7XG5cbiAgLy8gdmFyIGltYWdlX3VybCA9IGAvY2dpL2ltZ3Nydi9pbWFnZT9pZD0ke0hULnBhcmFtcy5pZH07c2VxPSR7c2VxfTtzaXplPTEwMGA7XG4gIHZhciBpbWFnZV91cmwgPSBgL2NnaS9pbWdzcnYvaW1hZ2U/aWQ9JHtIVC5wYXJhbXMuaWR9O3NlcT0ke3NlcX07d2lkdGg9JHtwYWdlLm9mZnNldFdpZHRofWA7XG4gIGlmICggcGFnZS5xdWVyeVNlbGVjdG9yKCdjYW52YXMnKSApIHtcbiAgICAvLyBwcmVsb2FkSW1hZ2VzKHBhZ2UpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgY2FudmFzLmRhdGFzZXQuc2VxID0gc2VxO1xuXG4gIHZhciBwYWdlX2hlaWdodCA9IHBhZ2Uub2Zmc2V0SGVpZ2h0O1xuICB2YXIgcGFnZV93aWR0aCA9IHBhZ2Uub2Zmc2V0V2lkdGg7XG4gIC8vIGNhbnZhcy5oZWlnaHQgPSBwYWdlX2hlaWdodDtcbiAgY2FudmFzLndpZHRoID0gcGFnZV93aWR0aDtcbiAgY2FudmFzLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgcGFnZS5hcHBlbmRDaGlsZChjYW52YXMpO1xuXG4gIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICBwYWdlLmRhdGFzZXQubG9hZGluZyA9IHRydWU7XG4gIGltZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgcGFnZS5kYXRhc2V0LmxvYWRpbmcgPSBmYWxzZTtcbiAgICBmaXRJbWFnZU9uKGNhbnZhcywgdGhpcyk7XG4gICAgaWYgKCBjaGVja19zY3JvbGwgfHwgJG1haW4uZGF0YXNldC52aWV3ID09ICd0aHVtYm5haWwnICkgeyByZXNpemVQYWdlKHBhZ2UpOyB9XG4gICAgLy8gdmFyIHVwZGF0ZWRfcmVjdCA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgLy8gaWYgKCBjaGVja19zY3JvbGwgJiYgcmVjdC5ib3R0b20gPD0gYm91bmRzLmJvdHRvbSAmJiByZWN0LnRvcCA8IDAgKSB7XG4gICAgLy8gICBkZWx0YSA9IHVwZGF0ZWRfcmVjdC5oZWlnaHQgLSByZWN0LmhlaWdodDtcbiAgICAvLyAgIC8vIGRlbHRhIC89IHRoaXMuc2V0dGluZ3Muc2NhbGU7XG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgYWZ0ZXJSZXNpemVkXCIsIHZpZXcuaW5kZXgsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgdmlldy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCwgcmVjdC5oZWlnaHQsIGRlbHRhIC8gdGhpcy5zZXR0aW5ncy5zY2FsZSk7XG4gICAgLy8gICAkc2VjdGlvbi5zY3JvbGxUb3AgKz0gTWF0aC5jZWlsKGRlbHRhKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgY29uc29sZS5sb2coXCJBSE9ZIE5PIENIQU5HRT9cIilcbiAgICAvLyB9XG4gIH0pXG5cbiAgaW1nLnNyYyA9IGltYWdlX3VybDtcblxuICBpZiAoICEgcGFnZS5kYXRhc2V0LnByZWxvYWRlZCApIHtcbiAgICBwcmVsb2FkSW1hZ2VzKHBhZ2UpO1xuICB9XG59XG5cbnZhciB1bmxvYWRJbWFnZSA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgaWYgKCBwYWdlLmRhdGFzZXQucHJlbG9hZGVkICkgeyByZXR1cm47IH1cbiAgaWYgKCBwYWdlLmRhdGFzZXQubG9hZGluZyApIHsgcmV0dXJuIDsgfVxuICB2YXIgY2FudmFzID0gcGFnZS5xdWVyeVNlbGVjdG9yKCdjYW52YXMnKTtcbiAgaWYgKCBjYW52YXMgKSB7XG4gICAgcGFnZS5yZW1vdmVDaGlsZChjYW52YXMpO1xuICB9XG4gIHBhZ2UuZGF0YXNldC5wcmVsb2FkZWQgPSBmYWxzZTtcbn1cblxudmFyIHByZWxvYWRJbWFnZXMgPSBmdW5jdGlvbihwYWdlKSB7XG4gIHZhciBzZXEgPSBwYXJzZUludChwYWdlLmRhdGFzZXQuc2VxLCAxMCk7XG4gIHZhciBkZWx0YSA9IDE7XG4gIHdoaWxlICggZGVsdGEgPD0gMSApIHtcbiAgICB2YXIgcHJldl9wYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcSAtIGRlbHRhfVwiXWApO1xuICAgIGlmICggcHJldl9wYWdlICkge1xuICAgICAgcHJldl9wYWdlLmRhdGFzZXQucHJlbG9hZGVkID0gdHJ1ZTtcbiAgICAgIGxvYWRJbWFnZShwcmV2X3BhZ2UpO1xuICAgIH1cbiAgICBkZWx0YSArPSAxO1xuICB9XG4gIGRlbHRhID0gMTtcbiAgd2hpbGUgKCBkZWx0YSA8PSAxICkge1xuICAgIHZhciBuZXh0X3BhZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7c2VxICsgZGVsdGF9XCJdYCk7XG4gICAgaWYgKCBuZXh0X3BhZ2UgKSB7XG4gICAgICBuZXh0X3BhZ2UuZGF0YXNldC5wcmVsb2FkZWQgPSB0cnVlO1xuICAgICAgbG9hZEltYWdlKG5leHRfcGFnZSk7XG4gICAgfVxuICAgIGRlbHRhICs9IDE7XG4gIH1cbn1cblxudmFyIGdldFBhZ2UgPSBmdW5jdGlvbihzZXEpIHtcbiAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5wYWdlW2RhdGEtc2VxPVwiJHtzZXF9XCJdYCk7XG59XG5cbnZhciBnb3RvUGFnZSA9IGZ1bmN0aW9uKHNlcSwgZGVsdGEpIHtcbiAgdmFyIGN1cnJlbnRTZXEgPSBwYXJzZUludCgkbmF2aWdhdG9yLmlucHV0LnZhbHVlLCAxMCk7XG4gIGlmICggISBzZXEgKSB7XG4gICAgc2VxID0gY3VycmVudFNlcTtcbiAgfVxuICBpZiAoIGRlbHRhICkge1xuICAgIHNlcSArPSBkZWx0YTtcbiAgfVxuXG4gIHZhciBjdXJyZW50UGFnZSA9IGdldFBhZ2UoY3VycmVudFNlcSk7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBBSE9ZXCIsIGN1cnJlbnRTZXEsIGN1cnJlbnRQYWdlKTtcbiAgaWYgKCBjdXJyZW50UGFnZSApIHtcbiAgICAvLyBjdXJyZW50UGFnZS5hZGRFdmVudExpc3RlbmVyKCdhbmltYXRpb25lbmQnLCBmdW5jdGlvbiBleGl0UGFnZSgpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKFwiQUhPWSBBTklNQVRJT04gRU5ERURcIiwgY3VycmVudFBhZ2UpO1xuICAgIC8vICAgY3VycmVudFBhZ2UuY2xhc3NMaXN0LnJlbW92ZSgncHQtcGFnZS1tb3ZlVG9MZWZ0Jyk7XG4gICAgLy8gICBjdXJyZW50UGFnZS5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbiAgICAvLyAgIGN1cnJlbnRQYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIGV4aXRQYWdlKTtcbiAgICAvLyAgIHVubG9hZEltYWdlKGN1cnJlbnRQYWdlKTtcbiAgICAvLyB9KVxuICAgIC8vIGN1cnJlbnRQYWdlLmNsYXNzTGlzdC5hZGQoJ3B0LXBhZ2UtbW92ZVRvTGVmdCcpO1xuXG4gICAgY3VycmVudFBhZ2UuZGF0YXNldC52aXNpYmxlID0gZmFsc2U7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHVubG9hZEltYWdlKGN1cnJlbnRQYWdlKTtcbiAgICB9KVxuICB9XG5cbiAgdmFyIHRhcmdldCA9IGdldFBhZ2Uoc2VxKTtcbiAgLy8gdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIGZ1bmN0aW9uIGVudGVyUGFnZSgpIHtcbiAgLy8gICB0YXJnZXQuY2xhc3NMaXN0LnJlbW92ZSgncHQtcGFnZS1tb3ZlRnJvbVJpZ2h0Jyk7XG4gIC8vICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FuaW1hdGlvbmVuZCcsIGVudGVyUGFnZSk7XG4gIC8vIH0pXG4gIC8vIHRhcmdldC5jbGFzc0xpc3QuYWRkKCdwdC1wYWdlLW1vdmVGcm9tUmlnaHQnKTtcbiAgdGFyZ2V0LmRhdGFzZXQudmlzaWJsZSA9IHRydWU7XG4gIHRhcmdldC5wYXJlbnROb2RlLnNjcm9sbFRvcCA9IHRhcmdldC5vZmZzZXRUb3AgLSB0YXJnZXQucGFyZW50Tm9kZS5vZmZzZXRUb3A7XG4gIGlmICggJG9ic2VydmVyLmluYWN0aXZlICkgeyBsb2FkSW1hZ2UodGFyZ2V0LCB0cnVlKTsgdXBkYXRlX25hdmlnYXRvcih0YXJnZXQpO31cbiAgLy8gdGFyZ2V0LnNjcm9sbEludG9WaWV3KGZhbHNlKTtcbn1cblxudmFyIG5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG4gIGdvdG9QYWdlKG51bGwsIDEpO1xufVxuXG52YXIgcHJldmlvdXNQYWdlID0gZnVuY3Rpb24oKSB7XG4gIGdvdG9QYWdlKG51bGwsIC0xKTtcbn1cblxudmFyIHVwZGF0ZV9uYXZpZ2F0b3IgPSBmdW5jdGlvbihwYWdlKSB7XG4gIHZhciBzZXEgPSBwYXJzZUludChwYWdlLmRhdGFzZXQuc2VxLCAxMCk7XG4gICRuYXZpZ2F0b3IuaW5wdXQudmFsdWUgPSBzZXE7XG4gIHZhciBwZXJjZW50YWdlID0gKCBzZXEgLyAkbmF2aWdhdG9yLmlucHV0Lm1heCApICogMTAwLjA7XG4gICRuYXZpZ2F0b3IuaW5wdXQuc3R5bGUuYmFja2dyb3VuZFNpemUgPSBgJHtwZXJjZW50YWdlfSUgMTAwJWA7XG4gIC8vICRuYXZpZ2F0b3Iuc3RhdHVzLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnYmFja2dyb3VuZC1wb3NpdGlvbjogJyArICgtcGVyY2VudGFnZSkgKyAnJSAwJSwgbGVmdCB0b3A7Jyk7XG59XG5cbnZhciBtaW5faGVpZ2h0ID0gJHNlY3Rpb24ub2Zmc2V0SGVpZ2h0O1xudmFyIG1pbl93aWR0aCA9ICRzZWN0aW9uLm9mZnNldFdpZHRoICogMC44MDtcbiRtYWluLmRhdGFzZXQudmlldyA9ICdpbWFnZSc7XG5cbmlmICggJG1haW4uZGF0YXNldC52aWV3ID09ICd0aHVtYm5haWwnICkge1xuICBzY2FsZSA9IDAuMjU7XG59XG5cbnZhciAkZGF0YTtcbmZldGNoKGAvY2dpL2ltZ3Nydi9tZXRhP2lkPSR7SFQucGFyYW1zLmlkfWApXG4gIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgfSlcbiAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgJGRhdGEgPSBkYXRhO1xuXG4gICAgJG5hdmlnYXRvci5pbnB1dC5tYXggPSBkYXRhLml0ZW1zLmxlbmd0aDtcbiAgICAkbmF2aWdhdG9yLmlucHV0Lm1pbiA9IDE7XG4gICAgJG5hdmlnYXRvci5pbnB1dC5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICcwJSAxMDAlJztcbiAgICAvLyAkbmF2aWdhdG9yLnN0YXR1cy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2JhY2tncm91bmQtcG9zaXRpb246ICcgKyAoMCkgKyAnJSAwJSwgbGVmdCB0b3A7Jyk7XG5cbiAgICB2YXIgbWV0YSA9ICRkYXRhLml0ZW1zWzBdO1xuICAgIHZhciByID0gbWV0YS5oZWlnaHQgLyBtZXRhLndpZHRoO1xuXG4gICAgZGF0YS5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHZhciBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwYWdlLnN0eWxlLmhlaWdodCA9IGAke21pbl93aWR0aCAqIHIgKiBzY2FsZX1weGA7XG4gICAgICBwYWdlLnN0eWxlLndpZHRoID0gYCR7bWluX3dpZHRoICogc2NhbGV9cHhgO1xuICAgICAgcGFnZS5kYXRhc2V0LmJlc3RGaXQgPSAoIHNjYWxlIDw9IDEgKTtcblxuICAgICAgLy8gaWYgKCAkbWFpbi5kYXRhc2V0LnZpZXcgPT0gJ2ltYWdlJyApIHtcbiAgICAgIC8vICAgcGFnZS5zdHlsZS5tYXJnaW5MZWZ0ID0gYC0keyhtaW5fd2lkdGggKiByICogc2NhbGUpIC8gMn1weGA7XG4gICAgICAvLyB9XG5cbiAgICAgIC8vIGlmICggJG1haW4uZGF0YXNldC52aWV3ID09ICdpbWFnZScgKSB7XG4gICAgICAvLyAgIHBhZ2Uuc3R5bGUudG9wID0gJzBweCc7XG4gICAgICAvLyAgIHBhZ2Uuc3R5bGUubGVmdCA9IGAkey0gKCBpdGVtLnNlcSAtIDEgKSAqIG1pbl93aWR0aH1weGA7XG4gICAgICAvLyB9XG5cbiAgICAgIHBhZ2UuY2xhc3NMaXN0LmFkZCgncGFnZScpO1xuICAgICAgcGFnZS5kYXRhc2V0LnNlcSA9IGl0ZW0uc2VxO1xuICAgICAgcGFnZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImluZm9cIj4ke2l0ZW0uc2VxfTwvZGl2PmA7XG4gICAgICAkaW5uZXIuYXBwZW5kQ2hpbGQocGFnZSk7XG4gICAgfSlcblxuICAgIHZhciBwYWdlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdlJyk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoICRtYWluLmRhdGFzZXQudmlldyA9PSAnaW1hZ2UnICkge1xuICAgICAgICBwYWdlc1tpXS5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgJG9ic2VydmVyLmluYWN0aXZlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRvYnNlcnZlci5vYnNlcnZlKHBhZ2VzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcGFnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYWdlW2RhdGEtc2VxPVwiMjVcIl0nKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgaXNfYWN0aXZlID0gdHJ1ZTtcbiAgICAgIGdvdG9QYWdlKDI1KTtcbiAgICAgIC8vIHZhciBvZmZzZXRUb3AgPSBwYWdlLm9mZnNldFRvcDtcbiAgICAgIC8vICRpbm5lci5zY3JvbGxUb3AgPSBvZmZzZXRUb3A7XG4gICAgfSwgMTAwKTtcbiAgfSkiXX0=
