/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/intersection-observer/intersection-observer.js":
/*!*********************************************************************!*\
  !*** ./node_modules/intersection-observer/intersection-observer.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
  return parent;
}


// Exposes the constructors globally.
window.IntersectionObserver = IntersectionObserver;
window.IntersectionObserverEntry = IntersectionObserverEntry;

}(window, document));


/***/ }),

/***/ "./node_modules/nanoevents/index.js":
/*!******************************************!*\
  !*** ./node_modules/nanoevents/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

(
  /**
   * Interface for event subscription.
   *
   * @example
   * var NanoEvents = require('nanoevents')
   *
   * class Ticker {
   *   constructor() {
   *     this.emitter = new NanoEvents()
   *   }
   *   on() {
   *     return this.emitter.on.apply(this.events, arguments)
   *   }
   *   tick() {
   *     this.emitter.emit('tick')
   *   }
   * }
   *
   * @alias NanoEvents
   * @class
   */
  module.exports = function NanoEvents () {
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
).prototype = {

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
    if ( true && typeof cb !== 'function') {
      throw new Error('Listener must be a function')
    }

    (this.events[event] = this.events[event] || []).push(cb)

    return function () {
      this.events[event] = this.events[event].filter(function (i) {
        return i !== cb
      })
    }.bind(this)
  }
}


/***/ }),

/***/ "./node_modules/nanoevents/unbind-all.js":
/*!***********************************************!*\
  !*** ./node_modules/nanoevents/unbind-all.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Removes all listeners.
 *
 * @param {NanoEvents} emitter NanoEvents instance.
 *
 * @returns {undefined}
 *
 * @example
 * unbindAll(emitter)
 */
function unbindAll (emitter) {
  emitter.events = { }
}

module.exports = unbindAll


/***/ }),

/***/ "./src/js/components/controls/index.js":
/*!*********************************************!*\
  !*** ./src/js/components/controls/index.js ***!
  \*********************************************/
/*! exports provided: Control */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Control", function() { return Control; });
/* harmony import */ var _navigator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./navigator */ "./src/js/components/controls/navigator.js");
/* harmony import */ var _paginator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./paginator */ "./src/js/components/controls/paginator.js");
/* harmony import */ var _viewinator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./viewinator */ "./src/js/components/controls/viewinator.js");
/* harmony import */ var _zoominator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./zoominator */ "./src/js/components/controls/zoominator.js");
/* harmony import */ var _rotator__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./rotator */ "./src/js/components/controls/rotator.js");






var Control = {};
Control.Navigator = _navigator__WEBPACK_IMPORTED_MODULE_0__["Navigator"];
Control.Paginator = _paginator__WEBPACK_IMPORTED_MODULE_1__["Paginator"];
Control.Viewinator = _viewinator__WEBPACK_IMPORTED_MODULE_2__["Viewinator"];
Control.Zoominator = _zoominator__WEBPACK_IMPORTED_MODULE_3__["Zoominator"];
Control.Rotator = _rotator__WEBPACK_IMPORTED_MODULE_4__["Rotator"];




/***/ }),

/***/ "./src/js/components/controls/navigator.js":
/*!*************************************************!*\
  !*** ./src/js/components/controls/navigator.js ***!
  \*************************************************/
/*! exports provided: Navigator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Navigator", function() { return Navigator; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);


var Navigator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.output = options.output;
    this.reader = options.reader;
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this.input.addEventListener('change', (event) => {
      this.render('current-seq', this.input.value);
      this.emitter.emit('updateLocation', { seq: this.input.value });
    })

    this.reader.on('relocated', (params) => {
      this.render('current-seq', params.seq);
      this.input.value = params.seq;
    })
  }

  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }
}


/***/ }),

/***/ "./src/js/components/controls/paginator.js":
/*!*************************************************!*\
  !*** ./src/js/components/controls/paginator.js ***!
  \*************************************************/
/*! exports provided: Paginator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Paginator", function() { return Paginator; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);


var Paginator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    this.input.querySelector('#action-go-next').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.next();
    })

    this.input.querySelector('#action-go-prev').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.prev();
    })

    this.input.querySelector('#action-go-first').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.first();
    })

    this.input.querySelector('#action-go-last').addEventListener('click', (event) => {
      // this.emitter.emit('updateLocation', { seq: this.input.value });
      this.reader.last();
    })

  }

  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }
}


/***/ }),

/***/ "./src/js/components/controls/rotator.js":
/*!***********************************************!*\
  !*** ./src/js/components/controls/rotator.js ***!
  \***********************************************/
/*! exports provided: Rotator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Rotator", function() { return Rotator; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);


var Rotator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.scale = parseInt(options.scale || 1.0, 10);
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;
    this.input.counterclockwise = this.input.querySelector('#action-rotate-counterclockwise');
    this.input.counterclockwise.addEventListener('click', function(event) {
      self.emitter.emit('rotate', -90);
    })

    this.input.clockwise = this.input.querySelector('#action-rotate-clockwise');
    this.input.clockwise.addEventListener('click', function(event) {
      self.emitter.emit('rotate', 90);
    })

    this.reader.on('configure', function(config) {
      if ( config.rotate === false ) {
        this.input.counterclockwise.disabled = true;
        this.input.clockwise.disabled = true;
      } else {
        // var idx = this.possibles.indexOf(this.scale);
        this.input.counterclockwise.disabled = false;
        this.input.clockwise.disabled = false;
      }
    }.bind(this));
  }
}


/***/ }),

/***/ "./src/js/components/controls/viewinator.js":
/*!**************************************************!*\
  !*** ./src/js/components/controls/viewinator.js ***!
  \**************************************************/
/*! exports provided: Viewinator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Viewinator", function() { return Viewinator; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);


var Viewinator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;
    var buttons = this.input.querySelectorAll('[data-target]');
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      button.addEventListener('click', function(event) {
        var target = this.dataset.target;
        self.reader.restart({ view: target });
      })
    }
  }


  render(slot, value) {
    var span = this.output.querySelector(`[data-slot="${slot}"]`);
    span.innerText = value;
  }
}


/***/ }),

/***/ "./src/js/components/controls/zoominator.js":
/*!**************************************************!*\
  !*** ./src/js/components/controls/zoominator.js ***!
  \**************************************************/
/*! exports provided: Zoominator */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Zoominator", function() { return Zoominator; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);


var Zoominator = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.scale = parseInt(options.scale || 1.0, 10);
    this.input = options.input;
    this.reader = options.reader;
    // this.possibles = [ 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0 ];
    this.possibles = [ 0.75, 1.0, 1.25, 1.5 ];
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;
    this.input.zoom_in = this.input.querySelector('#action-zoom-in');
    this.input.zoom_in.addEventListener('click', function(event) {
      var idx = self.possibles.indexOf(self.scale);
      idx += 1;
      self.update(idx);
    })

    this.input.zoom_out = this.input.querySelector('#action-zoom-out');
    this.input.zoom_out.addEventListener('click', function(event) {
      var idx = self.possibles.indexOf(self.scale);
      idx -= 1;
      self.update(idx);
    })

    this.reader.on('configure', function(config) {
      if ( config.zoom === false ) {
        this.input.zoom_in.disabled = true;
        this.input.zoom_out.disabled = true;
      } else {
        var idx = this.possibles.indexOf(this.scale);
        this.input.zoom_in.disabled = ( idx == ( this.possibles.length - 1 ) );
        this.input.zoom_out.disabled = ( idx == 0 );
      }
    }.bind(this));
  }

  update(idx) {
    this.scale = this.possibles[idx];
    this.input.zoom_in.disabled = ( idx == ( this.possibles.length - 1 ) );
    this.input.zoom_out.disabled = ( idx == 0 );
    this.reader.restart({ scale: this.scale });
  }
}


/***/ }),

/***/ "./src/js/components/imgsrv.js":
/*!*************************************!*\
  !*** ./src/js/components/imgsrv.js ***!
  \*************************************/
/*! exports provided: Manifest, Service */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Manifest", function() { return Manifest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Service", function() { return Service; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);


var Manifest = class {
  constructor(options={}) {
    this.options = Object.assign({}, options);
    this.totalSeq = parseInt(options.totalSeq, 10);
    this.defaultSeq = parseInt(options.defaultSeq, 10);
    this.firstSeq = parseInt(options.firstSeq, 10);
    this.defaultImage = {
      height: parseInt(options.defaultHeight, 10),
      width: parseInt(options.defaultWidth, 10),
      rotation: 0
    };
    this.featureList = options.featureList;
    this.featureMap = {};
    this.featureList.forEach(function(item) {
      this.featureMap[item.seq] = item;
    }.bind(this))

    this.manifest = {};
  }

  update(seq, meta) {
    if ( meta.rotation != null && meta.width === undefined ) {
      // just updating rotation
      this.manifest[seq].rotation = meta.rotation;
      return;
    }
    // ... which will help with switching lanes and rotating
    if ( this.manifest[seq] && this.manifest[seq].width ) { return ; }
    var ratio = this.defaultImage.width / meta.width;
    this.manifest[seq] = {
      width: this.defaultImage.width,
      height: meta.height * ratio,
      rotation: meta.rotation || 0
    }
  }

  meta(seq) {
    if ( this.manifest[seq] ) {
      var meta = this.manifest[seq];
      if ( meta.rotation % 180 != 0 ) {
        return { height: meta.width, width: meta.height, rotation: meta.rotation };
      }
      return meta;
    }
    return this.defaultImage;
  }

  rotateBy(seq, delta) {
    var rotation;
    // this shouldn't happen
    if ( ! this.manifest[seq] ) { return; }
    rotation = this.manifest[seq].rotation;
    if ( rotation == 0 ) { rotation = 360; }
    rotation += delta;
    rotation = rotation % 360;
    this.manifest[seq].rotation = rotation;
  }
}

var Service = class {
  constructor(options={}) {
    this.manifest = new Manifest(options.manifest);
    this.identifier = options.identifier;
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this.bindEvents();
  }

  thumbnail(options={}) {
    var width = 250; // one size fits all
    var meta = this.manifest.meta(options.seq);
    var rotation = meta.rotation || 0;
    return `/cgi/imgsrv/thumbnail?id=${this.identifier};seq=${options.seq};width=${width};rotation=${rotation}`;
  }

  image(options={}) {
    var action = 'image'; // options.mode == 'thumbnail' ? 'thumbnail' : 'image';
    var param = this.bestFit(options);
    var meta = this.manifest.meta(options.seq);
    var rotation = meta.rotation || 0;
    return `/cgi/imgsrv/${action}?id=${this.identifier};seq=${options.seq};${param.param}=${param.value};rotation=${rotation}`;
  }

  html(options={}) {
    return `/cgi/imgsrv/html?id=${this.identifier};seq=${options.seq}`;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {

  }

  bestFit(params) {
    var possibles = [50, 75, 100, 125, 150, 175, 200];
    var retval = {};
    if ( params.width ) {
      retval.param = 'size';
      retval.value = possibles.find(function(possible) {
        var check = 680 * ( possible / 100.0 );
        return params.width <= check;
      })
    } else if ( params.height ) {
      retval.param = 'height';
      retval.value = params.height;
    }
    return retval;
  }

};


/***/ }),

/***/ "./src/js/components/views/base.js":
/*!*****************************************!*\
  !*** ./src/js/components/views/base.js ***!
  \*****************************************/
/*! exports provided: Base */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Base", function() { return Base; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var nanoevents_unbind_all__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! nanoevents/unbind-all */ "./node_modules/nanoevents/unbind-all.js");
/* harmony import */ var nanoevents_unbind_all__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(nanoevents_unbind_all__WEBPACK_IMPORTED_MODULE_1__);



var Base = class {
  constructor(options={}) {
    this.service = options.service;
    this.reader = options.reader;
    this.scale = options.scale || 1.0;
    this.mode = 'scroll';
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this._handlers = {};
    this.id = (new Date()).getTime();
  }

  attachTo(element, cb) {
    this.container = element;
    this.bindEvents();
    this.render(cb);
  }

  render(cb) {
    var minWidth = this.minWidth();
    var scale = this.scale;
    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');

      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = minWidth * ratio * scale;
      var w = minWidth * scale;
      // if ( meta.rotation % 180 != 0 ) {
      //   w = minWidth * ratio * scale;
      //   h = minWidth * scale;
      // }

      page.style.height = `${h}px`;
      page.style.width = `${w}px`;
      page.dataset.bestFit = ( scale <= 1 );

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      this.container.appendChild(page);
    }

    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
      // if ( this.mode == 'image' ) {
      //   pages[i].dataset.visible = false;
      //   this.observer.inactive = true;
      // } else {
      //   this.observer.observe(pages[i]);
      // }
    }

    this.is_active = true;
    this.loadImage(this.container.querySelector('[data-seq="1"]'), true);
    if ( cb ) {
      cb();
    }
  }

  resizePage(page) {
    var canvas = page.querySelector('img');
    if ( ! canvas ) { return ; }

    if ( page.dataset.loading !== 'false' ) {
      return;
    }

    var bounds = this.container.getBoundingClientRect();
    var rect = page.getBoundingClientRect();

    if ( canvas.height < parseInt(page.style.height, 10) ) {
      console.log("AHOY shrinking", page.dataset.seq, page.style.height, canvas.height);
    }
    page.style.height = `${canvas.height}px`;
    var updated_rect = page.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;

    this._postResizePage(rect, bounds);
  }

  _postResizePage(rect, bounds) {

  }

  loadImage(page, check_scroll) {
    if ( ! this.is_active ) { return ; }
    var seq = page.dataset.seq;
    var rect = page.getBoundingClientRect();

    console.log("AHOY LOADING", seq);

    var image_url = this.imageUrl(page);
    var html_url = this.service.html({ seq: seq });

    if ( page.querySelector('img') ) {
      // preloadImages(page);
      return;
    }

    if ( page.dataset.loading == "true" ) {
      return;
    }

    var html_request;
    if ( false) {}

    var page_height = page.offsetHeight;
    var page_width = page.offsetWidth;

    var img = new Image();
    img.alt = `Page scan of sequence ${seq}`;

    page.dataset.loading = true;
    img.addEventListener('load', function _imgHandler() {
      page.dataset.loading = false;

      this.service.manifest.update(seq, { width: img.width, height: img.height });

      var imageAspectRatio = img.width / img.height;
      img.style.width = page_width;
      img.style.height = page_width / imageAspectRatio;
      page.appendChild(img);
      page.dataset.loaded = true;

      if ( html_request ) {
        html_request
          .then(function(response) {
            return response.text();
          })
          .then(function(text) {
            var page_text = page.querySelector('.page-text');
            page_text.innerHTML = text;
          });
      }

      if ( check_scroll || this.mode == 'thumbnail' ) { this.resizePage(page); }
      img.removeEventListener('load', _imgHandler, true);
    }.bind(this), true)

    img.src = image_url;

    if ( ! page.dataset.preloaded ) {
      this.preloadImages(page);
    }
  }

  redrawPage(page) {
    if ( typeof(page) == "number" || typeof(page) == "string" ) {
      page = this.container.querySelector(`[data-seq="${page}"]`);
    }
    var image_url = this.imageUrl(page);
    var img = page.querySelector('img');
    var new_img = new Image();
    new_img.addEventListener('load', function _redrawHandler() {
      page.replaceChild(new_img, img);
      this.resizePage(page);
      new_img.removeEventListener('load', _redrawHandler, true);
    }.bind(this), true);
    new_img.src = image_url;
  }

  unloadImage(page) {
    if ( page.dataset.preloaded == "true" ) { return; }
    if ( page.dataset.loading == "true" ) { return ; }
    var canvas = page.querySelector('img');
    if ( canvas ) {
      page.removeChild(canvas);
    }
    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = '';
    page.dataset.preloaded = false;
    page.dataset.loaded = false;
  }

  preloadImages(page) {
    var seq = parseInt(page.dataset.seq, 10);
    var delta = 1;
    while ( delta <= 1 ) {
      var prev_page = this.container.querySelector(`.page[data-seq="${seq - delta}"]`);
      if ( prev_page ) {
        prev_page.dataset.preloaded = true;
        this.loadImage(prev_page);
      }
      delta += 1;
    }
    delta = 1;
    while ( delta <= 1 ) {
      var next_page = this.container.querySelector(`.page[data-seq="${seq + delta}"]`);
      if ( next_page ) {
        next_page.dataset.preloaded = true;
        this.loadImage(next_page);
      }
      delta += 1;
    }
  }

  imageUrl(params) {
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth;
    }
    // if ( this.reader.pagedetails.rotate[params.seq] ) {
    //   params.rotation = this.reader.pagedetails.rotate[params.seq];
    // }
    return this.service.image(params);
  }

  minWidth() {
    return this.container.parentNode.offsetWidth * 0.80;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
  }

  bindPageEvents(page) {
  }

  config() {
    // the empty set supports everything
    return {};
  }

  destroy() {
    nanoevents_unbind_all__WEBPACK_IMPORTED_MODULE_1___default()(this.emitter);
  }

}



/***/ }),

/***/ "./src/js/components/views/flip.js":
/*!*****************************************!*\
  !*** ./src/js/components/views/flip.js ***!
  \*****************************************/
/*! exports provided: Flip */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Flip", function() { return Flip; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _base__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./base */ "./src/js/components/views/base.js");



var Flip = class extends _base__WEBPACK_IMPORTED_MODULE_1__["Base"] {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.embedHtml = true;
    this.setupSlices();
    this.is_active = false;
  }

  setupSlices() {
    this.seq2slice = {};
    this.slices = [];
    this.slices.push([ null, 1 ]);
    this.seq2slice[1] = 0;
    for(var seq = 2; seq <= this.service.manifest.totalSeq; seq += 2) {
      var next_seq = seq + 1;
      if ( next_seq > this.service.manifest.totalSeq ) {
        next_seq = null;
      }
      this.slices.push([ seq, next_seq ]);
      this.seq2slice[seq] = this.slices.length - 1;
      if ( next_seq ) { this.seq2slice[next_seq] = this.slices.length - 1; }
    }

  }

  render(cb) {
    var minWidth = this.minWidth();
    minWidth /= 2;

    var maxHeight = this.container.offsetHeight * 0.90;

    var scale = this.scale;

    // group into pages
    var slices = this.slices;
    var max_edge_width = 50;

    for(var slice_idx = 0; slice_idx < slices.length; slice_idx++ ) {
      var tuple = slices[slice_idx];

      var slice = document.createElement('div');
      slice.classList.add('slice');

      var edge = document.createElement('div');
      edge.classList.add('edge', 'verso');
      edge.style.width = `${(slice_idx / slices.length) * max_edge_width}px`;
      slice.appendChild(edge);

      var page = document.createElement('div');
      page.classList.add('page');
      page.classList.add('verso');

      var seq;
      var slice_width = 0;
      var slice_height = 0;
      if ( tuple[0] ) {
        seq = tuple[0];
        var meta = this.service.manifest.meta(tuple[0]);
        var ratio = meta.height / meta.width;
        // page.style.height = `${minWidth * ratio * scale}px`;
        // page.style.width = `${minWidth * scale}px`;

        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;

        slice_height = maxHeight * scale;
        slice_width = maxHeight * scale / ratio;

        page.dataset.bestFit = ( scale <= 1 );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;
        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;
        page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;
        slice_width = maxHeight * scale / ratio;
      }
      slice.appendChild(page);

      page = document.createElement('div');
      page.classList.add('page');
      page.classList.add('recto');
      if ( tuple[1] ) {
        seq = tuple[1];
        var meta = this.service.manifest.meta(tuple[1]);
        var ratio = meta.height / meta.width;
        // page.style.height = `${minWidth * ratio * scale}px`;
        // page.style.width = `${minWidth * scale}px`;

        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;
        page.dataset.bestFit = ( scale <= 1 );

        slice_height = slice_height || ( maxHeight * scale );
        slice_width += ( maxHeight * scale / ratio );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
        slice.appendChild(page);
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;
        page.style.height = `${maxHeight * scale}px`;
        page.style.width = `${maxHeight * scale / ratio}px`;

        slice_width += ( maxHeight * scale / ratio );

        page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;
      }
      slice.appendChild(page);

      if ( this.scale > 1.0 ) {
        slice.style.height = `${slice_height}px`;
        slice.style.width = `${slice_width * 1.2}px`;
      }

      edge = document.createElement('div');
      edge.classList.add('edge', 'recto');
      edge.style.width = `${(( slices.length - slice_idx ) / slices.length) * max_edge_width}px`;

      edge.style.height = `${slice_height * 0.95}px`; // this is complicated

      slice.appendChild(edge);
      slice.querySelector('.edge.verso').style.height = edge.style.height;

      slice.dataset.visible = false;
      slice.dataset.slice = slice_idx;

      this.container.appendChild(slice);
    }

    this.is_active = true;
    this.loadSlice(this.container.querySelector('.slice'));
    if ( cb ) {
      cb();
    }
  }

  imageUrl(params) {
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.height = element.offsetHeight;
    }
    return this.service.image(params);
  }

  loadSlice(slice) {
    var pages = slice.querySelectorAll('.page[data-seq]');
    for(var i = 0; i < pages.length; i++) {
      this.loadImage(pages[i], true);
    }
    slice.dataset.visible = true;
  }

  unloadSlice(slice) {

  }

  display(seq) {
    var current = this.container.querySelector(`.slice[data-visible="true"]`);
    var slice_idx = this.seq2slice[seq];
    var target = this.container.querySelector(`.slice[data-slice="${slice_idx}"]`);
    // var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }

    if ( current ) {
      current.dataset.visible = false;
      setTimeout(function() {
        this.unloadSlice(current);
      }.bind(this))
    }

    target.dataset.visible = true;
    this.loadSlice(target);
    // this.loadImage(target, true);
    this.reader.emit('relocated', { seq: this.slice2seq(slice_idx) });
    this.currentSeq = seq;
  }

  slice2seq(slice_idx) {
    var tuple = this.slices[slice_idx];
    if ( tuple[0] ) { return tuple[0]; }
    return tuple[1];
  }

  currentLocation() {
    return 1;
    var current_percentage = 0;
    var current;
    var bounds = this.container.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;
    var visible = this.container.querySelectorAll('.page[data-loaded="true"]');
    for(var i = 0; i < visible.length; i++) {
      var page = visible[i];
      var page_bounds = page.getBoundingClientRect();
      if ( page.offsetTop > ( scrollTop + bounds.height ) ) { continue; }
      if ( current_percentage < 1.0 && page.offsetTop >= scrollTop && (page.offsetTop + page_bounds.height) <= scrollTop + bounds.height ) {
        current_percentage = 1.0;
        current = page;
        continue;
      }

      var y1 = Math.abs(scrollTop - page.offsetTop);
      var y2 = Math.abs( ( scrollTop + bounds.height ) - ( page.offsetTop + page_bounds.height ) );
      var h = page_bounds.height - y1 - y2;
      var percentage = h / bounds.height;
      if ( percentage < 0 ) { continue; }
      if ( percentage > current_percentage ) {
        current_percentage = percentage;
        current = page;
      }
      console.log("AHOY currentLocation", page.dataset.seq, percentage);
    }
    return current.dataset.seq;
  }

  next() {
    this.container.scrollTop = 0;
    var delta = this.currentSeq == 1 ? 1 : 2;
    this.display(this.currentSeq + delta);
  }

  prev() {
    this.container.scrollTop = 0;
    var delta = 2; // this.currentSeq == this.service.manifest.totalSeq ? 1 : 2;
    var seq = this.currentSeq - delta;
    if ( seq <= 0 ) { seq = 1; }
    this.display(seq);
  }

  _postResizePage(bounds, rect) {
    if ( rect.bottom <= bounds.bottom && rect.top < 0 ) {
      setTimeout(function() {
        delta = updated_rect.height - rect.height;
        if ( this.container.scrollTop == scrollTop ) {
          // delta /= this.settings.scale;
          // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
          this.container.scrollTop += Math.ceil(delta);
          console.log("AHOY afterResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        } else {
          console.log("AHOY donotResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        }
      }.bind(this), 500);
    }
  }

  minWidth() {
    return this.container.offsetWidth;
  }

  preloadImages(page) {
    var seq = parseInt(page.dataset.seq, 10);
    var delta = 1;
    while ( delta <= 2 ) {
      var prev_page = this.container.querySelector(`.page[data-seq="${seq - delta}"]`);
      if ( prev_page ) {
        prev_page.dataset.preloaded = true;
        this.loadImage(prev_page, true);
      }
      delta += 1;
    }
    delta = 1;
    while ( delta <= 2 ) {
      var next_page = this.container.querySelector(`.page[data-seq="${seq + delta}"]`);
      if ( next_page ) {
        next_page.dataset.preloaded = true;
        this.loadImage(next_page, true);
      }
      delta += 1;
    }
  }

  bindEvents() {
    super.bindEvents();
  }

  bindPageEvents(page) {
    page.parentElement.dataset.visible = false;
  }

  destroy() {
    super.destroy();
    var pages = this.container.querySelectorAll('.slice');
    for(var i = 0; i < pages.length; i++) {
      this.container.removeChild(pages[i]);
    }
  }

  config() {
    var retval = super.config();
    retval.rotate = false;
    return retval;
  }

};


/***/ }),

/***/ "./src/js/components/views/image.js":
/*!******************************************!*\
  !*** ./src/js/components/views/image.js ***!
  \******************************************/
/*! exports provided: Single */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Single", function() { return Single; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _base__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./base */ "./src/js/components/views/base.js");



var Single = class extends _base__WEBPACK_IMPORTED_MODULE_1__["Base"] {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.embedHtml = true;
  }

  display(seq) {
    var current = this.container.querySelector(`.page[data-visible="true"]`);
    var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }

    if ( current ) {
      current.dataset.visible = false;
      setTimeout(function() {
        this.unloadImage(current);
      }.bind(this))
    }

    target.dataset.visible = true;
    this.loadImage(target, true);
    this.reader.emit('relocated', { seq: target.dataset.seq });
    this.currentSeq = seq;
  }

  currentLocation() {
    var current_percentage = 0;
    var current;
    var bounds = this.container.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;
    var visible = this.container.querySelectorAll('.page[data-loaded="true"]');
    for(var i = 0; i < visible.length; i++) {
      var page = visible[i];
      var page_bounds = page.getBoundingClientRect();
      if ( page.offsetTop > ( scrollTop + bounds.height ) ) { continue; }
      if ( current_percentage < 1.0 && page.offsetTop >= scrollTop && (page.offsetTop + page_bounds.height) <= scrollTop + bounds.height ) {
        current_percentage = 1.0;
        current = page;
        continue;
      }

      var y1 = Math.abs(scrollTop - page.offsetTop);
      var y2 = Math.abs( ( scrollTop + bounds.height ) - ( page.offsetTop + page_bounds.height ) );
      var h = page_bounds.height - y1 - y2;
      var percentage = h / bounds.height;
      if ( percentage < 0 ) { continue; }
      if ( percentage > current_percentage ) {
        current_percentage = percentage;
        current = page;
      }
      console.log("AHOY currentLocation", page.dataset.seq, percentage);
    }
    return current.dataset.seq;
  }

  next() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq + 1);
    // var current = this.container.querySelector(`.page[data-seq="${this.currentSeq}"]`);
    // var next = current.nextSiblingElement;
    // if ( next ) {
    //   this.display(next);
    // }
  }

  prev() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq - 1);
  }

  _postResizePage(bounds, rect) {
    if ( rect.bottom <= bounds.bottom && rect.top < 0 ) {
      setTimeout(function() {
        delta = updated_rect.height - rect.height;
        if ( this.container.scrollTop == scrollTop ) {
          // delta /= this.settings.scale;
          // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
          this.container.scrollTop += Math.ceil(delta);
          console.log("AHOY afterResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        } else {
          console.log("AHOY donotResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        }
      }.bind(this), 500);
    }
  }

  updatePageRotation(target, rotate) {
    var margin = ( rotate % 180 == 0 ) ? 0 : ( target.offsetHeight - target.offsetWidth ) / 2;
    target.dataset.rotate = rotate;
    target.style.setProperty('--rotate', `${rotate}deg`);
    target.style.setProperty('--rotate-margin', `-${margin}px`);
    this.reader.pagedetails.rotate[target.dataset.seq] = rotate;
  }

  bindEvents() {
    super.bindEvents();
    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentLocation();
      var target = self.container.querySelector(`.page[data-seq="${seq}"]`);
      var rotate = parseInt(target.dataset.rotate || 0, 10);
      rotate += delta;
      rotate = rotate % 360;
      self.updatePageRotation(target, rotate);
    });
  }

  bindPageEvents(page) {
    page.dataset.visible = false;
    if ( this.reader.pagedetails.rotate[page.dataset.seq] ) {
      page.dataset.rotate = this.reader.pagedetails.rotate[page.dataset.seq];
      this.updatePageRotation(page, page.dataset.rotate);
    }
  }

  destroy() {
    super.destroy();
    this._handlers.rotate();
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.container.removeChild(pages[i]);
    }
  }

};

/***/ }),

/***/ "./src/js/components/views/index.js":
/*!******************************************!*\
  !*** ./src/js/components/views/index.js ***!
  \******************************************/
/*! exports provided: View */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "View", function() { return View; });
/* harmony import */ var _scroll__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./scroll */ "./src/js/components/views/scroll.js");
/* harmony import */ var _thumbnail__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./thumbnail */ "./src/js/components/views/thumbnail.js");
/* harmony import */ var _image__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./image */ "./src/js/components/views/image.js");
/* harmony import */ var _flip__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./flip */ "./src/js/components/views/flip.js");





var View = {};
View.Scroll = _scroll__WEBPACK_IMPORTED_MODULE_0__["Scroll"];
View.Thumbnail = _thumbnail__WEBPACK_IMPORTED_MODULE_1__["Thumbnail"];
View.Single = _image__WEBPACK_IMPORTED_MODULE_2__["Single"];
View.Flip = _flip__WEBPACK_IMPORTED_MODULE_3__["Flip"];

View.for = function(view) {
  if ( view == '1up' ) { return _scroll__WEBPACK_IMPORTED_MODULE_0__["Scroll"]; }
  else if ( view == 'thumb' ) { return _thumbnail__WEBPACK_IMPORTED_MODULE_1__["Thumbnail"]; }
  else if ( view == 'image' ) { return _image__WEBPACK_IMPORTED_MODULE_2__["Single"]; }
  else if ( view == '2up' ) { return _flip__WEBPACK_IMPORTED_MODULE_3__["Flip"]; }
}




/***/ }),

/***/ "./src/js/components/views/scroll.js":
/*!*******************************************!*\
  !*** ./src/js/components/views/scroll.js ***!
  \*******************************************/
/*! exports provided: Scroll */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Scroll", function() { return Scroll; });
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _base__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./base */ "./src/js/components/views/base.js");



var Scroll = class extends _base__WEBPACK_IMPORTED_MODULE_1__["Base"] {
  constructor(options={}) {
    super(options);
    this.mode = 'scroll';
    this.pageOptions = {};
    this.embedHtml = true;
  }

  display(seq) {
    var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }
    target.dataset.visible = true;
    target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop;
  }

  handleObserver(entries, observer) {
    var current = { page: null, ratio: 0 };
    entries.forEach(entry => {
      var div = entry.target;
      var seq = div.dataset.seq;
      var viewed = div.querySelector('img');
      if ( entry.isIntersecting && entry.intersectionRatio > 0.0  ) {
        console.log("AHOY OBSERVING", entries.length, seq, 'onEnter', entry.intersectionRatio);
        if ( entry.intersectionRatio > current.ratio ) {
          current.ratio = entry.intersectionRatio;
          current.page = div;
        }
        if ( ! viewed ) {
          // console.log("AHOY OBSERVING", entries.length, seq, 'onEnter');
          this.loadImage(div, true);
        } else if (  div.dataset.preloaded ) {
          div.dataset.preloaded = false;
          this.resizePage(div);
        }
      } else if ( viewed && ! div.dataset.preloaded ) {
        console.log("AHOY OBSERVING", entries.length, seq, 'onExit');
        this.unloadImage(div);
      }
    })
    if ( current.page ) {
      this.reader.emit('relocated', { seq: current.page.dataset.seq });
    }
  };

  currentLocation() {
    var current_percentage = 0;
    var current;
    var bounds = this.container.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;
    var visible = this.container.querySelectorAll('.page[data-loaded="true"]');
    for(var i = 0; i < visible.length; i++) {
      var page = visible[i];
      var page_bounds = page.getBoundingClientRect();
      if ( page.offsetTop > ( scrollTop + bounds.height ) ) { continue; }
      if ( current_percentage < 1.0 && page.offsetTop >= scrollTop && (page.offsetTop + page_bounds.height) <= scrollTop + bounds.height ) {
        current_percentage = 1.0;
        current = page;
        continue;
      }

      var y1 = Math.abs(scrollTop - page.offsetTop);
      var y2 = Math.abs( ( scrollTop + bounds.height ) - ( page.offsetTop + page_bounds.height ) );
      var h = page_bounds.height - y1 - y2;
      var percentage = h / bounds.height;
      if ( percentage < 0 ) { continue; }
      if ( percentage > current_percentage ) {
        current_percentage = percentage;
        current = page;
      }
      console.log("AHOY currentLocation", page.dataset.seq, percentage);
    }
    return current.dataset.seq;
  }

  next() {
    var scrollTop = this.container.scrollTop;
    this.container.scrollTop += this.container.offsetHeight;
  }

  prev() {
    if ( this.container.scrollTop == 0 ) { return ; }
    this.container.scrollTop -= this.container.offsetHeight;
  }

  _postResizePage(bounds, rect) {
    if ( rect.bottom <= bounds.bottom && rect.top < 0 ) {
      setTimeout(function() {
        delta = updated_rect.height - rect.height;
        if ( this.container.scrollTop == scrollTop ) {
          // delta /= this.settings.scale;
          // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
          this.container.scrollTop += Math.ceil(delta);
          console.log("AHOY afterResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        } else {
          console.log("AHOY donotResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        }
      }.bind(this), 500);
    }
  }

  updatePageRotation(target, rotate) {
    // var margin = ( rotate % 180 == 0 ) ? 0 : ( target.offsetHeight - target.offsetWidth ) / 2;
    // target.dataset.rotate = rotate;
    // target.style.setProperty('--rotate', `${rotate}deg`);
    // target.style.setProperty('--rotate-margin', `-${margin}px ${margin}px`);
    this.reader.pagedetails.rotate[target.dataset.seq] = rotate;
  }

  bindEvents() {
    var self = this;

    super.bindEvents();
    this.observer = new IntersectionObserver(this.handleObserver.bind(this), {
        root: this.container,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    });

    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentLocation();
      self.service.manifest.rotateBy(seq, delta);
      self.redrawPage(seq);
    });
  }

  bindPageEvents(page) {
    this.observer.observe(page);
  }

  destroy() {
    super.destroy();
    this._handlers.rotate();
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.observer.unobserve(pages[i]);
      this.container.removeChild(pages[i]);
    }
    this.observer = null;
  }

};


/***/ }),

/***/ "./src/js/components/views/thumbnail.js":
/*!**********************************************!*\
  !*** ./src/js/components/views/thumbnail.js ***!
  \**********************************************/
/*! exports provided: Thumbnail */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Thumbnail", function() { return Thumbnail; });
/* harmony import */ var _scroll__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./scroll */ "./src/js/components/views/scroll.js");


var Thumbnail = class extends _scroll__WEBPACK_IMPORTED_MODULE_0__["Scroll"] {
  constructor(options={}) {
    super(options);
    this.mode = 'thumbnail';
    // this.scale = 0.25;
    this.scale = 1.0;
    this.embedHtml = false;
  }

  imageUrl(params) {
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth;
    }
    return this.service.thumbnail(params);
  }

  minWidth() {
    // best guess
    return 160;
  }

  bindPageEvents(page) {
    var self = this;
    super.bindPageEvents(page);
    page.addEventListener('click', function(event) {
      console.log("AHOY CLICK", this.dataset.seq);
      self.reader.restart({ view: '1up', seq: this.dataset.seq });
    })
  }

  config() {
    var retval = super.config();
    retval.zoom = false;
    retval.rotate = false;
    return retval;
  }

};

/***/ }),

/***/ "./src/js/main.js":
/*!************************!*\
  !*** ./src/js/main.js ***!
  \************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! nanoevents */ "./node_modules/nanoevents/index.js");
/* harmony import */ var nanoevents__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(nanoevents__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_controls__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/controls */ "./src/js/components/controls/index.js");
/* harmony import */ var _components_imgsrv__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/imgsrv */ "./src/js/components/imgsrv.js");
/* harmony import */ var _components_views__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/views */ "./src/js/components/views/index.js");






var HT = window.HT || {}; window.HT = HT;
var $main = document.querySelector('main');
var $viewer = $main.querySelector('.viewer');
var $inner = $viewer.querySelector('.viewer-inner');

var $toolbar = $main.querySelector('#toolbar-vertical');

var min_height = $viewer.offsetHeight;
var min_width = $viewer.offsetWidth * 0.80;

// if ( $main.dataset.view == 'thumbnail' ) {
//   scale = 0.25;
// }

var Reader = class {
  constructor(options={}) {
    this.options = Object.assign({ scale: 1.0 }, options);
    this.emitter = new nanoevents__WEBPACK_IMPORTED_MODULE_0___default.a();
    this.controls = {};
    this.pagedetails = { rotate: {}, scale: {} };
    this.bindEvents();
  }

  start(params, cb) {
    if ( cb === undefined ) {
      cb = function() {
        this.view.display(params.seq || 1);
      }.bind(this);
    }
    if ( params.view ) {
      $main.dataset.view = params.view;
    }
    if ( params.scale ) { this.options.scale = params.scale; }
    this.setView({ view: $main.dataset.view });
    this.view.attachTo($inner, cb);
  }

  restart(params) {
    var current = params.seq || this.view.currentLocation();
    if ( this.view ) { this.view.destroy(); this.view = null; }
    this.start(params, function() {
      this.view.display(current);
    }.bind(this));
  }

  setView(params) {
    var cls = _components_views__WEBPACK_IMPORTED_MODULE_3__["View"].for(params.view);
    this.view = new cls({ reader: this, service: this.service, scale: this.options.scale });
    this.emit('configure', this.view.config());
  }

  next() {
    this.view.next();
  }

  prev() {
    this.view.prev();
  }

  first() {
    this.view.display(1);
  }

  last() {
    this.view.display(this.service.manifest.totalSeq);
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  emit(event, params={}) {
    this.emitter.emit(event, params);
  }

  bindEvents() {
    /* NOOP */
  }

}

var service = new _components_imgsrv__WEBPACK_IMPORTED_MODULE_2__["Service"]({
  manifest: {
    totalSeq: $main.dataset.totalSeq,
    defaultSeq: $main.dataset.defaultSeq,
    firstSeq: $main.dataset.firstSeq,
    defaultHeight: $main.dataset.defaultHeight,
    defaultWidth: $main.dataset.defaultWidth,
    featureList: JSON.parse($main.dataset.featureList)
  },
  identifier: HT.params.id
})
HT.service = service;

var reader = new Reader({ identifier: HT.params.id });
reader.service = service;
HT.reader = reader;
HT.View = _components_views__WEBPACK_IMPORTED_MODULE_3__["View"];

var is_active = false;
var scale = 0.75;
var image_width = 680;

reader.controls.navigator = new _components_controls__WEBPACK_IMPORTED_MODULE_1__["Control"].Navigator({
  input: document.querySelector('input[type="range"]'),
  output: document.querySelector('.navigator .output'),
  reader: reader
})

reader.controls.paginator = new _components_controls__WEBPACK_IMPORTED_MODULE_1__["Control"].Paginator({
  input: document.querySelector('#toolbar-horizontal'),
  reader: reader
});

reader.controls.viewinator = new _components_controls__WEBPACK_IMPORTED_MODULE_1__["Control"].Viewinator({
  input: document.querySelector('.action-views'),
  reader: reader
});

reader.controls.navigator.on('updateLocation', (params) => {
  console.log("AHOY updateLocation", params.seq);
  reader.view.display(params.seq);
})

reader.controls.zoominator = new _components_controls__WEBPACK_IMPORTED_MODULE_1__["Control"].Zoominator({
  input: document.querySelector('.action-zoom'),
  reader: reader
})

reader.controls.rotator = new _components_controls__WEBPACK_IMPORTED_MODULE_1__["Control"].Rotator({
  input: document.querySelector('.action-rotate'),
  reader: reader
})
reader.controls.rotator.on('rotate', function(delta) {
  // var seq = this.view.currentLocation();
  // var rotate = this.pagedetails.rotate[seq] || 0;
  // rotate = ( rotate + delta ) % 360;
  // this.pagedetails.rotate[seq] = rotate;
  console.log("AHOY controls.rotator", delta);
  this.emit('rotate', delta);
}.bind(reader))

reader.start({ view: '1up', seq: 10 });






/***/ }),

/***/ 0:
/*!****************************************************!*\
  !*** multi intersection-observer ./src/js/main.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! intersection-observer */"./node_modules/intersection-observer/intersection-observer.js");
module.exports = __webpack_require__(/*! ./src/js/main.js */"./src/js/main.js");


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2ludGVyc2VjdGlvbi1vYnNlcnZlci9pbnRlcnNlY3Rpb24tb2JzZXJ2ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL25hbm9ldmVudHMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL25hbm9ldmVudHMvdW5iaW5kLWFsbC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy9jb250cm9scy9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy9jb250cm9scy9uYXZpZ2F0b3IuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvY29udHJvbHMvcGFnaW5hdG9yLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL2NvbnRyb2xzL3JvdGF0b3IuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvY29udHJvbHMvdmlld2luYXRvci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy9jb250cm9scy96b29taW5hdG9yLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL2ltZ3Nydi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy92aWV3cy9iYXNlLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL3ZpZXdzL2ZsaXAuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvdmlld3MvaW1hZ2UuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvdmlld3MvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvdmlld3Mvc2Nyb2xsLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL3ZpZXdzL3RodW1ibmFpbC5qcyIsIndlYnBhY2s6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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLFdBQVcsT0FBTztBQUNsQjtBQUNBLFlBQVksUUFBUTtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0EsWUFBWSxPQUFPO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHVCQUF1QjtBQUN2QjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxrQkFBa0IsMERBQU87QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQSxDQUFDO0FBQ0Q7O0FBRUEseUJBQXlCLDJCQUEyQjtBQUNwRDtBQUNBO0FBQ0EsVUFBVSxzREFBSTs7QUFFZDtBQUNBO0FBQ0E7O0FBRUEsZ0NBQWdDLDREQUFPO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQsZ0NBQWdDLDREQUFPO0FBQ3ZDO0FBQ0E7QUFDQSxDQUFDOztBQUVELGlDQUFpQyw0REFBTztBQUN4QztBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVELGlDQUFpQyw0REFBTztBQUN4QztBQUNBO0FBQ0EsQ0FBQzs7QUFFRCw4QkFBOEIsNERBQU87QUFDckM7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQsY0FBYyx1QkFBdUIiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgVzNDIFNPRlRXQVJFIEFORCBET0NVTUVOVCBOT1RJQ0UgQU5EIExJQ0VOU0UuXG4gKlxuICogIGh0dHBzOi8vd3d3LnczLm9yZy9Db25zb3J0aXVtL0xlZ2FsLzIwMTUvY29weXJpZ2h0LXNvZnR3YXJlLWFuZC1kb2N1bWVudFxuICpcbiAqL1xuXG4oZnVuY3Rpb24od2luZG93LCBkb2N1bWVudCkge1xuJ3VzZSBzdHJpY3QnO1xuXG5cbi8vIEV4aXRzIGVhcmx5IGlmIGFsbCBJbnRlcnNlY3Rpb25PYnNlcnZlciBhbmQgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeVxuLy8gZmVhdHVyZXMgYXJlIG5hdGl2ZWx5IHN1cHBvcnRlZC5cbmlmICgnSW50ZXJzZWN0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdyAmJlxuICAgICdJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5JyBpbiB3aW5kb3cgJiZcbiAgICAnaW50ZXJzZWN0aW9uUmF0aW8nIGluIHdpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5LnByb3RvdHlwZSkge1xuXG4gIC8vIE1pbmltYWwgcG9seWZpbGwgZm9yIEVkZ2UgMTUncyBsYWNrIG9mIGBpc0ludGVyc2VjdGluZ2BcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vdzNjL0ludGVyc2VjdGlvbk9ic2VydmVyL2lzc3Vlcy8yMTFcbiAgaWYgKCEoJ2lzSW50ZXJzZWN0aW5nJyBpbiB3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeS5wcm90b3R5cGUpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5LnByb3RvdHlwZSxcbiAgICAgICdpc0ludGVyc2VjdGluZycsIHtcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA+IDA7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuO1xufVxuXG5cbi8qKlxuICogQW4gSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgcmVnaXN0cnkuIFRoaXMgcmVnaXN0cnkgZXhpc3RzIHRvIGhvbGQgYSBzdHJvbmdcbiAqIHJlZmVyZW5jZSB0byBJbnRlcnNlY3Rpb25PYnNlcnZlciBpbnN0YW5jZXMgY3VycmVudGx5IG9ic2VydmluZyBhIHRhcmdldFxuICogZWxlbWVudC4gV2l0aG91dCB0aGlzIHJlZ2lzdHJ5LCBpbnN0YW5jZXMgd2l0aG91dCBhbm90aGVyIHJlZmVyZW5jZSBtYXkgYmVcbiAqIGdhcmJhZ2UgY29sbGVjdGVkLlxuICovXG52YXIgcmVnaXN0cnkgPSBbXTtcblxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGdsb2JhbCBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5IGNvbnN0cnVjdG9yLlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0ludGVyc2VjdGlvbk9ic2VydmVyLyNpbnRlcnNlY3Rpb24tb2JzZXJ2ZXItZW50cnlcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbnRyeSBBIGRpY3Rpb25hcnkgb2YgaW5zdGFuY2UgcHJvcGVydGllcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KGVudHJ5KSB7XG4gIHRoaXMudGltZSA9IGVudHJ5LnRpbWU7XG4gIHRoaXMudGFyZ2V0ID0gZW50cnkudGFyZ2V0O1xuICB0aGlzLnJvb3RCb3VuZHMgPSBlbnRyeS5yb290Qm91bmRzO1xuICB0aGlzLmJvdW5kaW5nQ2xpZW50UmVjdCA9IGVudHJ5LmJvdW5kaW5nQ2xpZW50UmVjdDtcbiAgdGhpcy5pbnRlcnNlY3Rpb25SZWN0ID0gZW50cnkuaW50ZXJzZWN0aW9uUmVjdCB8fCBnZXRFbXB0eVJlY3QoKTtcbiAgdGhpcy5pc0ludGVyc2VjdGluZyA9ICEhZW50cnkuaW50ZXJzZWN0aW9uUmVjdDtcblxuICAvLyBDYWxjdWxhdGVzIHRoZSBpbnRlcnNlY3Rpb24gcmF0aW8uXG4gIHZhciB0YXJnZXRSZWN0ID0gdGhpcy5ib3VuZGluZ0NsaWVudFJlY3Q7XG4gIHZhciB0YXJnZXRBcmVhID0gdGFyZ2V0UmVjdC53aWR0aCAqIHRhcmdldFJlY3QuaGVpZ2h0O1xuICB2YXIgaW50ZXJzZWN0aW9uUmVjdCA9IHRoaXMuaW50ZXJzZWN0aW9uUmVjdDtcbiAgdmFyIGludGVyc2VjdGlvbkFyZWEgPSBpbnRlcnNlY3Rpb25SZWN0LndpZHRoICogaW50ZXJzZWN0aW9uUmVjdC5oZWlnaHQ7XG5cbiAgLy8gU2V0cyBpbnRlcnNlY3Rpb24gcmF0aW8uXG4gIGlmICh0YXJnZXRBcmVhKSB7XG4gICAgLy8gUm91bmQgdGhlIGludGVyc2VjdGlvbiByYXRpbyB0byBhdm9pZCBmbG9hdGluZyBwb2ludCBtYXRoIGlzc3VlczpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdzNjL0ludGVyc2VjdGlvbk9ic2VydmVyL2lzc3Vlcy8zMjRcbiAgICB0aGlzLmludGVyc2VjdGlvblJhdGlvID0gTnVtYmVyKChpbnRlcnNlY3Rpb25BcmVhIC8gdGFyZ2V0QXJlYSkudG9GaXhlZCg0KSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWYgYXJlYSBpcyB6ZXJvIGFuZCBpcyBpbnRlcnNlY3RpbmcsIHNldHMgdG8gMSwgb3RoZXJ3aXNlIHRvIDBcbiAgICB0aGlzLmludGVyc2VjdGlvblJhdGlvID0gdGhpcy5pc0ludGVyc2VjdGluZyA/IDEgOiAwO1xuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgY29uc3RydWN0b3IuXG4gKiBodHRwczovL3czYy5naXRodWIuaW8vSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvI2ludGVyc2VjdGlvbi1vYnNlcnZlci1pbnRlcmZhY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFmdGVyIGludGVyc2VjdGlvblxuICogICAgIGNoYW5nZXMgaGF2ZSBxdWV1ZWQuIFRoZSBmdW5jdGlvbiBpcyBub3QgaW52b2tlZCBpZiB0aGUgcXVldWUgaGFzXG4gKiAgICAgYmVlbiBlbXB0aWVkIGJ5IGNhbGxpbmcgdGhlIGB0YWtlUmVjb3Jkc2AgbWV0aG9kLlxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRfb3B0aW9ucyBPcHRpb25hbCBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoY2FsbGJhY2ssIG9wdF9vcHRpb25zKSB7XG5cbiAgdmFyIG9wdGlvbnMgPSBvcHRfb3B0aW9ucyB8fCB7fTtcblxuICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMucm9vdCAmJiBvcHRpb25zLnJvb3Qubm9kZVR5cGUgIT0gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncm9vdCBtdXN0IGJlIGFuIEVsZW1lbnQnKTtcbiAgfVxuXG4gIC8vIEJpbmRzIGFuZCB0aHJvdHRsZXMgYHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9uc2AuXG4gIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyA9IHRocm90dGxlKFxuICAgICAgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLmJpbmQodGhpcyksIHRoaXMuVEhST1RUTEVfVElNRU9VVCk7XG5cbiAgLy8gUHJpdmF0ZSBwcm9wZXJ0aWVzLlxuICB0aGlzLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMgPSBbXTtcbiAgdGhpcy5fcXVldWVkRW50cmllcyA9IFtdO1xuICB0aGlzLl9yb290TWFyZ2luVmFsdWVzID0gdGhpcy5fcGFyc2VSb290TWFyZ2luKG9wdGlvbnMucm9vdE1hcmdpbik7XG5cbiAgLy8gUHVibGljIHByb3BlcnRpZXMuXG4gIHRoaXMudGhyZXNob2xkcyA9IHRoaXMuX2luaXRUaHJlc2hvbGRzKG9wdGlvbnMudGhyZXNob2xkKTtcbiAgdGhpcy5yb290ID0gb3B0aW9ucy5yb290IHx8IG51bGw7XG4gIHRoaXMucm9vdE1hcmdpbiA9IHRoaXMuX3Jvb3RNYXJnaW5WYWx1ZXMubWFwKGZ1bmN0aW9uKG1hcmdpbikge1xuICAgIHJldHVybiBtYXJnaW4udmFsdWUgKyBtYXJnaW4udW5pdDtcbiAgfSkuam9pbignICcpO1xufVxuXG5cbi8qKlxuICogVGhlIG1pbmltdW0gaW50ZXJ2YWwgd2l0aGluIHdoaWNoIHRoZSBkb2N1bWVudCB3aWxsIGJlIGNoZWNrZWQgZm9yXG4gKiBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLlRIUk9UVExFX1RJTUVPVVQgPSAxMDA7XG5cblxuLyoqXG4gKiBUaGUgZnJlcXVlbmN5IGluIHdoaWNoIHRoZSBwb2x5ZmlsbCBwb2xscyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKiB0aGlzIGNhbiBiZSB1cGRhdGVkIG9uIGEgcGVyIGluc3RhbmNlIGJhc2lzIGFuZCBtdXN0IGJlIHNldCBwcmlvciB0b1xuICogY2FsbGluZyBgb2JzZXJ2ZWAgb24gdGhlIGZpcnN0IHRhcmdldC5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLlBPTExfSU5URVJWQUwgPSBudWxsO1xuXG4vKipcbiAqIFVzZSBhIG11dGF0aW9uIG9ic2VydmVyIG9uIHRoZSByb290IGVsZW1lbnRcbiAqIHRvIGRldGVjdCBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLlVTRV9NVVRBVElPTl9PQlNFUlZFUiA9IHRydWU7XG5cblxuLyoqXG4gKiBTdGFydHMgb2JzZXJ2aW5nIGEgdGFyZ2V0IGVsZW1lbnQgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzIGJhc2VkIG9uXG4gKiB0aGUgdGhyZXNob2xkcyB2YWx1ZXMuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgRE9NIGVsZW1lbnQgdG8gb2JzZXJ2ZS5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLm9ic2VydmUgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgdmFyIGlzVGFyZ2V0QWxyZWFkeU9ic2VydmVkID0gdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLnNvbWUoZnVuY3Rpb24oaXRlbSkge1xuICAgIHJldHVybiBpdGVtLmVsZW1lbnQgPT0gdGFyZ2V0O1xuICB9KTtcblxuICBpZiAoaXNUYXJnZXRBbHJlYWR5T2JzZXJ2ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoISh0YXJnZXQgJiYgdGFyZ2V0Lm5vZGVUeXBlID09IDEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0YXJnZXQgbXVzdCBiZSBhbiBFbGVtZW50Jyk7XG4gIH1cblxuICB0aGlzLl9yZWdpc3Rlckluc3RhbmNlKCk7XG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5wdXNoKHtlbGVtZW50OiB0YXJnZXQsIGVudHJ5OiBudWxsfSk7XG4gIHRoaXMuX21vbml0b3JJbnRlcnNlY3Rpb25zKCk7XG4gIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucygpO1xufTtcblxuXG4vKipcbiAqIFN0b3BzIG9ic2VydmluZyBhIHRhcmdldCBlbGVtZW50IGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSBET00gZWxlbWVudCB0byBvYnNlcnZlLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUudW5vYnNlcnZlID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cyA9XG4gICAgICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgIHJldHVybiBpdGVtLmVsZW1lbnQgIT0gdGFyZ2V0O1xuICB9KTtcbiAgaWYgKCF0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fdW5tb25pdG9ySW50ZXJzZWN0aW9ucygpO1xuICAgIHRoaXMuX3VucmVnaXN0ZXJJbnN0YW5jZSgpO1xuICB9XG59O1xuXG5cbi8qKlxuICogU3RvcHMgb2JzZXJ2aW5nIGFsbCB0YXJnZXQgZWxlbWVudHMgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMgPSBbXTtcbiAgdGhpcy5fdW5tb25pdG9ySW50ZXJzZWN0aW9ucygpO1xuICB0aGlzLl91bnJlZ2lzdGVySW5zdGFuY2UoKTtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIGFueSBxdWV1ZSBlbnRyaWVzIHRoYXQgaGF2ZSBub3QgeWV0IGJlZW4gcmVwb3J0ZWQgdG8gdGhlXG4gKiBjYWxsYmFjayBhbmQgY2xlYXJzIHRoZSBxdWV1ZS4gVGhpcyBjYW4gYmUgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZVxuICogY2FsbGJhY2sgdG8gb2J0YWluIHRoZSBhYnNvbHV0ZSBtb3N0IHVwLXRvLWRhdGUgaW50ZXJzZWN0aW9uIGluZm9ybWF0aW9uLlxuICogQHJldHVybiB7QXJyYXl9IFRoZSBjdXJyZW50bHkgcXVldWVkIGVudHJpZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS50YWtlUmVjb3JkcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVjb3JkcyA9IHRoaXMuX3F1ZXVlZEVudHJpZXMuc2xpY2UoKTtcbiAgdGhpcy5fcXVldWVkRW50cmllcyA9IFtdO1xuICByZXR1cm4gcmVjb3Jkcztcbn07XG5cblxuLyoqXG4gKiBBY2NlcHRzIHRoZSB0aHJlc2hvbGQgdmFsdWUgZnJvbSB0aGUgdXNlciBjb25maWd1cmF0aW9uIG9iamVjdCBhbmRcbiAqIHJldHVybnMgYSBzb3J0ZWQgYXJyYXkgb2YgdW5pcXVlIHRocmVzaG9sZCB2YWx1ZXMuIElmIGEgdmFsdWUgaXMgbm90XG4gKiBiZXR3ZWVuIDAgYW5kIDEgYW5kIGVycm9yIGlzIHRocm93bi5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fG51bWJlcj19IG9wdF90aHJlc2hvbGQgQW4gb3B0aW9uYWwgdGhyZXNob2xkIHZhbHVlIG9yXG4gKiAgICAgYSBsaXN0IG9mIHRocmVzaG9sZCB2YWx1ZXMsIGRlZmF1bHRpbmcgdG8gWzBdLlxuICogQHJldHVybiB7QXJyYXl9IEEgc29ydGVkIGxpc3Qgb2YgdW5pcXVlIGFuZCB2YWxpZCB0aHJlc2hvbGQgdmFsdWVzLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2luaXRUaHJlc2hvbGRzID0gZnVuY3Rpb24ob3B0X3RocmVzaG9sZCkge1xuICB2YXIgdGhyZXNob2xkID0gb3B0X3RocmVzaG9sZCB8fCBbMF07XG4gIGlmICghQXJyYXkuaXNBcnJheSh0aHJlc2hvbGQpKSB0aHJlc2hvbGQgPSBbdGhyZXNob2xkXTtcblxuICByZXR1cm4gdGhyZXNob2xkLnNvcnQoKS5maWx0ZXIoZnVuY3Rpb24odCwgaSwgYSkge1xuICAgIGlmICh0eXBlb2YgdCAhPSAnbnVtYmVyJyB8fCBpc05hTih0KSB8fCB0IDwgMCB8fCB0ID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0aHJlc2hvbGQgbXVzdCBiZSBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEgaW5jbHVzaXZlbHknKTtcbiAgICB9XG4gICAgcmV0dXJuIHQgIT09IGFbaSAtIDFdO1xuICB9KTtcbn07XG5cblxuLyoqXG4gKiBBY2NlcHRzIHRoZSByb290TWFyZ2luIHZhbHVlIGZyb20gdGhlIHVzZXIgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBmb3VyIG1hcmdpbiB2YWx1ZXMgYXMgYW4gb2JqZWN0IGNvbnRhaW5pbmdcbiAqIHRoZSB2YWx1ZSBhbmQgdW5pdCBwcm9wZXJ0aWVzLiBJZiBhbnkgb2YgdGhlIHZhbHVlcyBhcmUgbm90IHByb3Blcmx5XG4gKiBmb3JtYXR0ZWQgb3IgdXNlIGEgdW5pdCBvdGhlciB0aGFuIHB4IG9yICUsIGFuZCBlcnJvciBpcyB0aHJvd24uXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmc9fSBvcHRfcm9vdE1hcmdpbiBBbiBvcHRpb25hbCByb290TWFyZ2luIHZhbHVlLFxuICogICAgIGRlZmF1bHRpbmcgdG8gJzBweCcuXG4gKiBAcmV0dXJuIHtBcnJheTxPYmplY3Q+fSBBbiBhcnJheSBvZiBtYXJnaW4gb2JqZWN0cyB3aXRoIHRoZSBrZXlzXG4gKiAgICAgdmFsdWUgYW5kIHVuaXQuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcGFyc2VSb290TWFyZ2luID0gZnVuY3Rpb24ob3B0X3Jvb3RNYXJnaW4pIHtcbiAgdmFyIG1hcmdpblN0cmluZyA9IG9wdF9yb290TWFyZ2luIHx8ICcwcHgnO1xuICB2YXIgbWFyZ2lucyA9IG1hcmdpblN0cmluZy5zcGxpdCgvXFxzKy8pLm1hcChmdW5jdGlvbihtYXJnaW4pIHtcbiAgICB2YXIgcGFydHMgPSAvXigtP1xcZCpcXC4/XFxkKykocHh8JSkkLy5leGVjKG1hcmdpbik7XG4gICAgaWYgKCFwYXJ0cykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdyb290TWFyZ2luIG11c3QgYmUgc3BlY2lmaWVkIGluIHBpeGVscyBvciBwZXJjZW50Jyk7XG4gICAgfVxuICAgIHJldHVybiB7dmFsdWU6IHBhcnNlRmxvYXQocGFydHNbMV0pLCB1bml0OiBwYXJ0c1syXX07XG4gIH0pO1xuXG4gIC8vIEhhbmRsZXMgc2hvcnRoYW5kLlxuICBtYXJnaW5zWzFdID0gbWFyZ2luc1sxXSB8fCBtYXJnaW5zWzBdO1xuICBtYXJnaW5zWzJdID0gbWFyZ2luc1syXSB8fCBtYXJnaW5zWzBdO1xuICBtYXJnaW5zWzNdID0gbWFyZ2luc1szXSB8fCBtYXJnaW5zWzFdO1xuXG4gIHJldHVybiBtYXJnaW5zO1xufTtcblxuXG4vKipcbiAqIFN0YXJ0cyBwb2xsaW5nIGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcyBpZiB0aGUgcG9sbGluZyBpcyBub3QgYWxyZWFkeVxuICogaGFwcGVuaW5nLCBhbmQgaWYgdGhlIHBhZ2UncyB2aXNpYmlsaXR5IHN0YXRlIGlzIHZpc2libGUuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX21vbml0b3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMpIHtcbiAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucyA9IHRydWU7XG5cbiAgICAvLyBJZiBhIHBvbGwgaW50ZXJ2YWwgaXMgc2V0LCB1c2UgcG9sbGluZyBpbnN0ZWFkIG9mIGxpc3RlbmluZyB0b1xuICAgIC8vIHJlc2l6ZSBhbmQgc2Nyb2xsIGV2ZW50cyBvciBET00gbXV0YXRpb25zLlxuICAgIGlmICh0aGlzLlBPTExfSU5URVJWQUwpIHtcbiAgICAgIHRoaXMuX21vbml0b3JpbmdJbnRlcnZhbCA9IHNldEludGVydmFsKFxuICAgICAgICAgIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdGhpcy5QT0xMX0lOVEVSVkFMKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBhZGRFdmVudCh3aW5kb3csICdyZXNpemUnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xuICAgICAgYWRkRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xuXG4gICAgICBpZiAodGhpcy5VU0VfTVVUQVRJT05fT0JTRVJWRVIgJiYgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuICAgICAgICB0aGlzLl9kb21PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyk7XG4gICAgICAgIHRoaXMuX2RvbU9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQsIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgIHN1YnRyZWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogU3RvcHMgcG9sbGluZyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3VubW9uaXRvckludGVyc2VjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zKSB7XG4gICAgdGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMgPSBmYWxzZTtcblxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fbW9uaXRvcmluZ0ludGVydmFsKTtcbiAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJ2YWwgPSBudWxsO1xuXG4gICAgcmVtb3ZlRXZlbnQod2luZG93LCAncmVzaXplJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcbiAgICByZW1vdmVFdmVudChkb2N1bWVudCwgJ3Njcm9sbCcsIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdHJ1ZSk7XG5cbiAgICBpZiAodGhpcy5fZG9tT2JzZXJ2ZXIpIHtcbiAgICAgIHRoaXMuX2RvbU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgIHRoaXMuX2RvbU9ic2VydmVyID0gbnVsbDtcbiAgICB9XG4gIH1cbn07XG5cblxuLyoqXG4gKiBTY2FucyBlYWNoIG9ic2VydmF0aW9uIHRhcmdldCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgYW5kIGFkZHMgdGhlbVxuICogdG8gdGhlIGludGVybmFsIGVudHJpZXMgcXVldWUuIElmIG5ldyBlbnRyaWVzIGFyZSBmb3VuZCwgaXRcbiAqIHNjaGVkdWxlcyB0aGUgY2FsbGJhY2sgdG8gYmUgaW52b2tlZC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIHZhciByb290SXNJbkRvbSA9IHRoaXMuX3Jvb3RJc0luRG9tKCk7XG4gIHZhciByb290UmVjdCA9IHJvb3RJc0luRG9tID8gdGhpcy5fZ2V0Um9vdFJlY3QoKSA6IGdldEVtcHR5UmVjdCgpO1xuXG4gIHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICB2YXIgdGFyZ2V0ID0gaXRlbS5lbGVtZW50O1xuICAgIHZhciB0YXJnZXRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRhcmdldCk7XG4gICAgdmFyIHJvb3RDb250YWluc1RhcmdldCA9IHRoaXMuX3Jvb3RDb250YWluc1RhcmdldCh0YXJnZXQpO1xuICAgIHZhciBvbGRFbnRyeSA9IGl0ZW0uZW50cnk7XG4gICAgdmFyIGludGVyc2VjdGlvblJlY3QgPSByb290SXNJbkRvbSAmJiByb290Q29udGFpbnNUYXJnZXQgJiZcbiAgICAgICAgdGhpcy5fY29tcHV0ZVRhcmdldEFuZFJvb3RJbnRlcnNlY3Rpb24odGFyZ2V0LCByb290UmVjdCk7XG5cbiAgICB2YXIgbmV3RW50cnkgPSBpdGVtLmVudHJ5ID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyRW50cnkoe1xuICAgICAgdGltZTogbm93KCksXG4gICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgIGJvdW5kaW5nQ2xpZW50UmVjdDogdGFyZ2V0UmVjdCxcbiAgICAgIHJvb3RCb3VuZHM6IHJvb3RSZWN0LFxuICAgICAgaW50ZXJzZWN0aW9uUmVjdDogaW50ZXJzZWN0aW9uUmVjdFxuICAgIH0pO1xuXG4gICAgaWYgKCFvbGRFbnRyeSkge1xuICAgICAgdGhpcy5fcXVldWVkRW50cmllcy5wdXNoKG5ld0VudHJ5KTtcbiAgICB9IGVsc2UgaWYgKHJvb3RJc0luRG9tICYmIHJvb3RDb250YWluc1RhcmdldCkge1xuICAgICAgLy8gSWYgdGhlIG5ldyBlbnRyeSBpbnRlcnNlY3Rpb24gcmF0aW8gaGFzIGNyb3NzZWQgYW55IG9mIHRoZVxuICAgICAgLy8gdGhyZXNob2xkcywgYWRkIGEgbmV3IGVudHJ5LlxuICAgICAgaWYgKHRoaXMuX2hhc0Nyb3NzZWRUaHJlc2hvbGQob2xkRW50cnksIG5ld0VudHJ5KSkge1xuICAgICAgICB0aGlzLl9xdWV1ZWRFbnRyaWVzLnB1c2gobmV3RW50cnkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgcm9vdCBpcyBub3QgaW4gdGhlIERPTSBvciB0YXJnZXQgaXMgbm90IGNvbnRhaW5lZCB3aXRoaW5cbiAgICAgIC8vIHJvb3QgYnV0IHRoZSBwcmV2aW91cyBlbnRyeSBmb3IgdGhpcyB0YXJnZXQgaGFkIGFuIGludGVyc2VjdGlvbixcbiAgICAgIC8vIGFkZCBhIG5ldyByZWNvcmQgaW5kaWNhdGluZyByZW1vdmFsLlxuICAgICAgaWYgKG9sZEVudHJ5ICYmIG9sZEVudHJ5LmlzSW50ZXJzZWN0aW5nKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlZEVudHJpZXMucHVzaChuZXdFbnRyeSk7XG4gICAgICB9XG4gICAgfVxuICB9LCB0aGlzKTtcblxuICBpZiAodGhpcy5fcXVldWVkRW50cmllcy5sZW5ndGgpIHtcbiAgICB0aGlzLl9jYWxsYmFjayh0aGlzLnRha2VSZWNvcmRzKCksIHRoaXMpO1xuICB9XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyBhIHRhcmdldCBhbmQgcm9vdCByZWN0IGNvbXB1dGVzIHRoZSBpbnRlcnNlY3Rpb24gYmV0d2VlbiB0aGVuXG4gKiBmb2xsb3dpbmcgdGhlIGFsZ29yaXRobSBpbiB0aGUgc3BlYy5cbiAqIFRPRE8ocGhpbGlwd2FsdG9uKTogYXQgdGhpcyB0aW1lIGNsaXAtcGF0aCBpcyBub3QgY29uc2lkZXJlZC5cbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9JbnRlcnNlY3Rpb25PYnNlcnZlci8jY2FsY3VsYXRlLWludGVyc2VjdGlvbi1yZWN0LWFsZ29cbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSByb290UmVjdCBUaGUgYm91bmRpbmcgcmVjdCBvZiB0aGUgcm9vdCBhZnRlciBiZWluZ1xuICogICAgIGV4cGFuZGVkIGJ5IHRoZSByb290TWFyZ2luIHZhbHVlLlxuICogQHJldHVybiB7P09iamVjdH0gVGhlIGZpbmFsIGludGVyc2VjdGlvbiByZWN0IG9iamVjdCBvciB1bmRlZmluZWQgaWYgbm9cbiAqICAgICBpbnRlcnNlY3Rpb24gaXMgZm91bmQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2NvbXB1dGVUYXJnZXRBbmRSb290SW50ZXJzZWN0aW9uID1cbiAgICBmdW5jdGlvbih0YXJnZXQsIHJvb3RSZWN0KSB7XG5cbiAgLy8gSWYgdGhlIGVsZW1lbnQgaXNuJ3QgZGlzcGxheWVkLCBhbiBpbnRlcnNlY3Rpb24gY2FuJ3QgaGFwcGVuLlxuICBpZiAod2luZG93LmdldENvbXB1dGVkU3R5bGUodGFyZ2V0KS5kaXNwbGF5ID09ICdub25lJykgcmV0dXJuO1xuXG4gIHZhciB0YXJnZXRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRhcmdldCk7XG4gIHZhciBpbnRlcnNlY3Rpb25SZWN0ID0gdGFyZ2V0UmVjdDtcbiAgdmFyIHBhcmVudCA9IGdldFBhcmVudE5vZGUodGFyZ2V0KTtcbiAgdmFyIGF0Um9vdCA9IGZhbHNlO1xuXG4gIHdoaWxlICghYXRSb290KSB7XG4gICAgdmFyIHBhcmVudFJlY3QgPSBudWxsO1xuICAgIHZhciBwYXJlbnRDb21wdXRlZFN0eWxlID0gcGFyZW50Lm5vZGVUeXBlID09IDEgP1xuICAgICAgICB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpIDoge307XG5cbiAgICAvLyBJZiB0aGUgcGFyZW50IGlzbid0IGRpc3BsYXllZCwgYW4gaW50ZXJzZWN0aW9uIGNhbid0IGhhcHBlbi5cbiAgICBpZiAocGFyZW50Q29tcHV0ZWRTdHlsZS5kaXNwbGF5ID09ICdub25lJykgcmV0dXJuO1xuXG4gICAgaWYgKHBhcmVudCA9PSB0aGlzLnJvb3QgfHwgcGFyZW50ID09IGRvY3VtZW50KSB7XG4gICAgICBhdFJvb3QgPSB0cnVlO1xuICAgICAgcGFyZW50UmVjdCA9IHJvb3RSZWN0O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgZWxlbWVudCBoYXMgYSBub24tdmlzaWJsZSBvdmVyZmxvdywgYW5kIGl0J3Mgbm90IHRoZSA8Ym9keT5cbiAgICAgIC8vIG9yIDxodG1sPiBlbGVtZW50LCB1cGRhdGUgdGhlIGludGVyc2VjdGlvbiByZWN0LlxuICAgICAgLy8gTm90ZTogPGJvZHk+IGFuZCA8aHRtbD4gY2Fubm90IGJlIGNsaXBwZWQgdG8gYSByZWN0IHRoYXQncyBub3QgYWxzb1xuICAgICAgLy8gdGhlIGRvY3VtZW50IHJlY3QsIHNvIG5vIG5lZWQgdG8gY29tcHV0ZSBhIG5ldyBpbnRlcnNlY3Rpb24uXG4gICAgICBpZiAocGFyZW50ICE9IGRvY3VtZW50LmJvZHkgJiZcbiAgICAgICAgICBwYXJlbnQgIT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmXG4gICAgICAgICAgcGFyZW50Q29tcHV0ZWRTdHlsZS5vdmVyZmxvdyAhPSAndmlzaWJsZScpIHtcbiAgICAgICAgcGFyZW50UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdChwYXJlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIGVpdGhlciBvZiB0aGUgYWJvdmUgY29uZGl0aW9uYWxzIHNldCBhIG5ldyBwYXJlbnRSZWN0LFxuICAgIC8vIGNhbGN1bGF0ZSBuZXcgaW50ZXJzZWN0aW9uIGRhdGEuXG4gICAgaWYgKHBhcmVudFJlY3QpIHtcbiAgICAgIGludGVyc2VjdGlvblJlY3QgPSBjb21wdXRlUmVjdEludGVyc2VjdGlvbihwYXJlbnRSZWN0LCBpbnRlcnNlY3Rpb25SZWN0KTtcblxuICAgICAgaWYgKCFpbnRlcnNlY3Rpb25SZWN0KSBicmVhaztcbiAgICB9XG4gICAgcGFyZW50ID0gZ2V0UGFyZW50Tm9kZShwYXJlbnQpO1xuICB9XG4gIHJldHVybiBpbnRlcnNlY3Rpb25SZWN0O1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHJvb3QgcmVjdCBhZnRlciBiZWluZyBleHBhbmRlZCBieSB0aGUgcm9vdE1hcmdpbiB2YWx1ZS5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV4cGFuZGVkIHJvb3QgcmVjdC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fZ2V0Um9vdFJlY3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJvb3RSZWN0O1xuICBpZiAodGhpcy5yb290KSB7XG4gICAgcm9vdFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QodGhpcy5yb290KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBVc2UgPGh0bWw+Lzxib2R5PiBpbnN0ZWFkIG9mIHdpbmRvdyBzaW5jZSBzY3JvbGwgYmFycyBhZmZlY3Qgc2l6ZS5cbiAgICB2YXIgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICB2YXIgYm9keSA9IGRvY3VtZW50LmJvZHk7XG4gICAgcm9vdFJlY3QgPSB7XG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgcmlnaHQ6IGh0bWwuY2xpZW50V2lkdGggfHwgYm9keS5jbGllbnRXaWR0aCxcbiAgICAgIHdpZHRoOiBodG1sLmNsaWVudFdpZHRoIHx8IGJvZHkuY2xpZW50V2lkdGgsXG4gICAgICBib3R0b206IGh0bWwuY2xpZW50SGVpZ2h0IHx8IGJvZHkuY2xpZW50SGVpZ2h0LFxuICAgICAgaGVpZ2h0OiBodG1sLmNsaWVudEhlaWdodCB8fCBib2R5LmNsaWVudEhlaWdodFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V4cGFuZFJlY3RCeVJvb3RNYXJnaW4ocm9vdFJlY3QpO1xufTtcblxuXG4vKipcbiAqIEFjY2VwdHMgYSByZWN0IGFuZCBleHBhbmRzIGl0IGJ5IHRoZSByb290TWFyZ2luIHZhbHVlLlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QgVGhlIHJlY3Qgb2JqZWN0IHRvIGV4cGFuZC5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV4cGFuZGVkIHJlY3QuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2V4cGFuZFJlY3RCeVJvb3RNYXJnaW4gPSBmdW5jdGlvbihyZWN0KSB7XG4gIHZhciBtYXJnaW5zID0gdGhpcy5fcm9vdE1hcmdpblZhbHVlcy5tYXAoZnVuY3Rpb24obWFyZ2luLCBpKSB7XG4gICAgcmV0dXJuIG1hcmdpbi51bml0ID09ICdweCcgPyBtYXJnaW4udmFsdWUgOlxuICAgICAgICBtYXJnaW4udmFsdWUgKiAoaSAlIDIgPyByZWN0LndpZHRoIDogcmVjdC5oZWlnaHQpIC8gMTAwO1xuICB9KTtcbiAgdmFyIG5ld1JlY3QgPSB7XG4gICAgdG9wOiByZWN0LnRvcCAtIG1hcmdpbnNbMF0sXG4gICAgcmlnaHQ6IHJlY3QucmlnaHQgKyBtYXJnaW5zWzFdLFxuICAgIGJvdHRvbTogcmVjdC5ib3R0b20gKyBtYXJnaW5zWzJdLFxuICAgIGxlZnQ6IHJlY3QubGVmdCAtIG1hcmdpbnNbM11cbiAgfTtcbiAgbmV3UmVjdC53aWR0aCA9IG5ld1JlY3QucmlnaHQgLSBuZXdSZWN0LmxlZnQ7XG4gIG5ld1JlY3QuaGVpZ2h0ID0gbmV3UmVjdC5ib3R0b20gLSBuZXdSZWN0LnRvcDtcblxuICByZXR1cm4gbmV3UmVjdDtcbn07XG5cblxuLyoqXG4gKiBBY2NlcHRzIGFuIG9sZCBhbmQgbmV3IGVudHJ5IGFuZCByZXR1cm5zIHRydWUgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZVxuICogdGhyZXNob2xkIHZhbHVlcyBoYXMgYmVlbiBjcm9zc2VkLlxuICogQHBhcmFtIHs/SW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeX0gb2xkRW50cnkgVGhlIHByZXZpb3VzIGVudHJ5IGZvciBhXG4gKiAgICBwYXJ0aWN1bGFyIHRhcmdldCBlbGVtZW50IG9yIG51bGwgaWYgbm8gcHJldmlvdXMgZW50cnkgZXhpc3RzLlxuICogQHBhcmFtIHtJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5fSBuZXdFbnRyeSBUaGUgY3VycmVudCBlbnRyeSBmb3IgYVxuICogICAgcGFydGljdWxhciB0YXJnZXQgZWxlbWVudC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiBhIGFueSB0aHJlc2hvbGQgaGFzIGJlZW4gY3Jvc3NlZC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5faGFzQ3Jvc3NlZFRocmVzaG9sZCA9XG4gICAgZnVuY3Rpb24ob2xkRW50cnksIG5ld0VudHJ5KSB7XG5cbiAgLy8gVG8gbWFrZSBjb21wYXJpbmcgZWFzaWVyLCBhbiBlbnRyeSB0aGF0IGhhcyBhIHJhdGlvIG9mIDBcbiAgLy8gYnV0IGRvZXMgbm90IGFjdHVhbGx5IGludGVyc2VjdCBpcyBnaXZlbiBhIHZhbHVlIG9mIC0xXG4gIHZhciBvbGRSYXRpbyA9IG9sZEVudHJ5ICYmIG9sZEVudHJ5LmlzSW50ZXJzZWN0aW5nID9cbiAgICAgIG9sZEVudHJ5LmludGVyc2VjdGlvblJhdGlvIHx8IDAgOiAtMTtcbiAgdmFyIG5ld1JhdGlvID0gbmV3RW50cnkuaXNJbnRlcnNlY3RpbmcgP1xuICAgICAgbmV3RW50cnkuaW50ZXJzZWN0aW9uUmF0aW8gfHwgMCA6IC0xO1xuXG4gIC8vIElnbm9yZSB1bmNoYW5nZWQgcmF0aW9zXG4gIGlmIChvbGRSYXRpbyA9PT0gbmV3UmF0aW8pIHJldHVybjtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudGhyZXNob2xkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0aHJlc2hvbGQgPSB0aGlzLnRocmVzaG9sZHNbaV07XG5cbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiBhbiBlbnRyeSBtYXRjaGVzIGEgdGhyZXNob2xkIG9yIGlmIHRoZSBuZXcgcmF0aW9cbiAgICAvLyBhbmQgdGhlIG9sZCByYXRpbyBhcmUgb24gdGhlIG9wcG9zaXRlIHNpZGVzIG9mIGEgdGhyZXNob2xkLlxuICAgIGlmICh0aHJlc2hvbGQgPT0gb2xkUmF0aW8gfHwgdGhyZXNob2xkID09IG5ld1JhdGlvIHx8XG4gICAgICAgIHRocmVzaG9sZCA8IG9sZFJhdGlvICE9PSB0aHJlc2hvbGQgPCBuZXdSYXRpbykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgcm9vdCBlbGVtZW50IGlzIGFuIGVsZW1lbnQgYW5kIGlzIGluIHRoZSBET00uXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSByb290IGVsZW1lbnQgaXMgYW4gZWxlbWVudCBhbmQgaXMgaW4gdGhlIERPTS5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcm9vdElzSW5Eb20gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLnJvb3QgfHwgY29udGFpbnNEZWVwKGRvY3VtZW50LCB0aGlzLnJvb3QpO1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2Ygcm9vdC5cbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IFRoZSB0YXJnZXQgZWxlbWVudCB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2Ygcm9vdC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcm9vdENvbnRhaW5zVGFyZ2V0ID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIHJldHVybiBjb250YWluc0RlZXAodGhpcy5yb290IHx8IGRvY3VtZW50LCB0YXJnZXQpO1xufTtcblxuXG4vKipcbiAqIEFkZHMgdGhlIGluc3RhbmNlIHRvIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgcmVnaXN0cnkgaWYgaXQgaXNuJ3RcbiAqIGFscmVhZHkgcHJlc2VudC5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fcmVnaXN0ZXJJbnN0YW5jZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAocmVnaXN0cnkuaW5kZXhPZih0aGlzKSA8IDApIHtcbiAgICByZWdpc3RyeS5wdXNoKHRoaXMpO1xuICB9XG59O1xuXG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgaW5zdGFuY2UgZnJvbSB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5LlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl91bnJlZ2lzdGVySW5zdGFuY2UgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGluZGV4ID0gcmVnaXN0cnkuaW5kZXhPZih0aGlzKTtcbiAgaWYgKGluZGV4ICE9IC0xKSByZWdpc3RyeS5zcGxpY2UoaW5kZXgsIDEpO1xufTtcblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgcGVyZm9ybWFuY2Uubm93KCkgbWV0aG9kIG9yIG51bGwgaW4gYnJvd3NlcnNcbiAqIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0aGUgQVBJLlxuICogQHJldHVybiB7bnVtYmVyfSBUaGUgZWxhcHNlZCB0aW1lIHNpbmNlIHRoZSBwYWdlIHdhcyByZXF1ZXN0ZWQuXG4gKi9cbmZ1bmN0aW9uIG5vdygpIHtcbiAgcmV0dXJuIHdpbmRvdy5wZXJmb3JtYW5jZSAmJiBwZXJmb3JtYW5jZS5ub3cgJiYgcGVyZm9ybWFuY2Uubm93KCk7XG59XG5cblxuLyoqXG4gKiBUaHJvdHRsZXMgYSBmdW5jdGlvbiBhbmQgZGVsYXlzIGl0cyBleGVjdXRpb24sIHNvIGl0J3Mgb25seSBjYWxsZWQgYXQgbW9zdFxuICogb25jZSB3aXRoaW4gYSBnaXZlbiB0aW1lIHBlcmlvZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB0aHJvdHRsZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0IFRoZSBhbW91bnQgb2YgdGltZSB0aGF0IG11c3QgcGFzcyBiZWZvcmUgdGhlXG4gKiAgICAgZnVuY3Rpb24gY2FuIGJlIGNhbGxlZCBhZ2Fpbi5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0aHJvdHRsZShmbiwgdGltZW91dCkge1xuICB2YXIgdGltZXIgPSBudWxsO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGltZXIpIHtcbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgZm4oKTtcbiAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxuICB9O1xufVxuXG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIGEgRE9NIG5vZGUgZW5zdXJpbmcgY3Jvc3MtYnJvd3NlciBjb21wYXRpYmlsaXR5LlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBET00gbm9kZSB0byBhZGQgdGhlIGV2ZW50IGhhbmRsZXIgdG8uXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZXZlbnQgaGFuZGxlciB0byBhZGQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdF91c2VDYXB0dXJlIE9wdGlvbmFsbHkgYWRkcyB0aGUgZXZlbiB0byB0aGUgY2FwdHVyZVxuICogICAgIHBoYXNlLiBOb3RlOiB0aGlzIG9ubHkgd29ya3MgaW4gbW9kZXJuIGJyb3dzZXJzLlxuICovXG5mdW5jdGlvbiBhZGRFdmVudChub2RlLCBldmVudCwgZm4sIG9wdF91c2VDYXB0dXJlKSB7XG4gIGlmICh0eXBlb2Ygbm9kZS5hZGRFdmVudExpc3RlbmVyID09ICdmdW5jdGlvbicpIHtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSB8fCBmYWxzZSk7XG4gIH1cbiAgZWxzZSBpZiAodHlwZW9mIG5vZGUuYXR0YWNoRXZlbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBmbik7XG4gIH1cbn1cblxuXG4vKipcbiAqIFJlbW92ZXMgYSBwcmV2aW91c2x5IGFkZGVkIGV2ZW50IGhhbmRsZXIgZnJvbSBhIERPTSBub2RlLlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBET00gbm9kZSB0byByZW1vdmUgdGhlIGV2ZW50IGhhbmRsZXIgZnJvbS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBldmVudCBoYW5kbGVyIHRvIHJlbW92ZS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0X3VzZUNhcHR1cmUgSWYgdGhlIGV2ZW50IGhhbmRsZXIgd2FzIGFkZGVkIHdpdGggdGhpc1xuICogICAgIGZsYWcgc2V0IHRvIHRydWUsIGl0IHNob3VsZCBiZSBzZXQgdG8gdHJ1ZSBoZXJlIGluIG9yZGVyIHRvIHJlbW92ZSBpdC5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRXZlbnQobm9kZSwgZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSkge1xuICBpZiAodHlwZW9mIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBub2RlLmRldGF0Y2hFdmVudCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgbm9kZS5kZXRhdGNoRXZlbnQoJ29uJyArIGV2ZW50LCBmbik7XG4gIH1cbn1cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIGludGVyc2VjdGlvbiBiZXR3ZWVuIHR3byByZWN0IG9iamVjdHMuXG4gKiBAcGFyYW0ge09iamVjdH0gcmVjdDEgVGhlIGZpcnN0IHJlY3QuXG4gKiBAcGFyYW0ge09iamVjdH0gcmVjdDIgVGhlIHNlY29uZCByZWN0LlxuICogQHJldHVybiB7P09iamVjdH0gVGhlIGludGVyc2VjdGlvbiByZWN0IG9yIHVuZGVmaW5lZCBpZiBubyBpbnRlcnNlY3Rpb25cbiAqICAgICBpcyBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZVJlY3RJbnRlcnNlY3Rpb24ocmVjdDEsIHJlY3QyKSB7XG4gIHZhciB0b3AgPSBNYXRoLm1heChyZWN0MS50b3AsIHJlY3QyLnRvcCk7XG4gIHZhciBib3R0b20gPSBNYXRoLm1pbihyZWN0MS5ib3R0b20sIHJlY3QyLmJvdHRvbSk7XG4gIHZhciBsZWZ0ID0gTWF0aC5tYXgocmVjdDEubGVmdCwgcmVjdDIubGVmdCk7XG4gIHZhciByaWdodCA9IE1hdGgubWluKHJlY3QxLnJpZ2h0LCByZWN0Mi5yaWdodCk7XG4gIHZhciB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcbiAgdmFyIGhlaWdodCA9IGJvdHRvbSAtIHRvcDtcblxuICByZXR1cm4gKHdpZHRoID49IDAgJiYgaGVpZ2h0ID49IDApICYmIHtcbiAgICB0b3A6IHRvcCxcbiAgICBib3R0b206IGJvdHRvbSxcbiAgICBsZWZ0OiBsZWZ0LFxuICAgIHJpZ2h0OiByaWdodCxcbiAgICB3aWR0aDogd2lkdGgsXG4gICAgaGVpZ2h0OiBoZWlnaHRcbiAgfTtcbn1cblxuXG4vKipcbiAqIFNoaW1zIHRoZSBuYXRpdmUgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGZvciBjb21wYXRpYmlsaXR5IHdpdGggb2xkZXIgSUUuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsIFRoZSBlbGVtZW50IHdob3NlIGJvdW5kaW5nIHJlY3QgdG8gZ2V0LlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgKHBvc3NpYmx5IHNoaW1tZWQpIHJlY3Qgb2YgdGhlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGdldEJvdW5kaW5nQ2xpZW50UmVjdChlbCkge1xuICB2YXIgcmVjdDtcblxuICB0cnkge1xuICAgIHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gSWdub3JlIFdpbmRvd3MgNyBJRTExIFwiVW5zcGVjaWZpZWQgZXJyb3JcIlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS93M2MvSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvcHVsbC8yMDVcbiAgfVxuXG4gIGlmICghcmVjdCkgcmV0dXJuIGdldEVtcHR5UmVjdCgpO1xuXG4gIC8vIE9sZGVyIElFXG4gIGlmICghKHJlY3Qud2lkdGggJiYgcmVjdC5oZWlnaHQpKSB7XG4gICAgcmVjdCA9IHtcbiAgICAgIHRvcDogcmVjdC50b3AsXG4gICAgICByaWdodDogcmVjdC5yaWdodCxcbiAgICAgIGJvdHRvbTogcmVjdC5ib3R0b20sXG4gICAgICBsZWZ0OiByZWN0LmxlZnQsXG4gICAgICB3aWR0aDogcmVjdC5yaWdodCAtIHJlY3QubGVmdCxcbiAgICAgIGhlaWdodDogcmVjdC5ib3R0b20gLSByZWN0LnRvcFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHJlY3Q7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGVtcHR5IHJlY3Qgb2JqZWN0LiBBbiBlbXB0eSByZWN0IGlzIHJldHVybmVkIHdoZW4gYW4gZWxlbWVudFxuICogaXMgbm90IGluIHRoZSBET00uXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBlbXB0eSByZWN0LlxuICovXG5mdW5jdGlvbiBnZXRFbXB0eVJlY3QoKSB7XG4gIHJldHVybiB7XG4gICAgdG9wOiAwLFxuICAgIGJvdHRvbTogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiAwLFxuICAgIHdpZHRoOiAwLFxuICAgIGhlaWdodDogMFxuICB9O1xufVxuXG4vKipcbiAqIENoZWNrcyB0byBzZWUgaWYgYSBwYXJlbnQgZWxlbWVudCBjb250YWlucyBhIGNoaWxkIGVsZW1lbnQgKGluY2x1ZGluZyBpbnNpZGVcbiAqIHNoYWRvdyBET00pLlxuICogQHBhcmFtIHtOb2RlfSBwYXJlbnQgVGhlIHBhcmVudCBlbGVtZW50LlxuICogQHBhcmFtIHtOb2RlfSBjaGlsZCBUaGUgY2hpbGQgZWxlbWVudC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBhcmVudCBub2RlIGNvbnRhaW5zIHRoZSBjaGlsZCBub2RlLlxuICovXG5mdW5jdGlvbiBjb250YWluc0RlZXAocGFyZW50LCBjaGlsZCkge1xuICB2YXIgbm9kZSA9IGNoaWxkO1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlID09IHBhcmVudCkgcmV0dXJuIHRydWU7XG5cbiAgICBub2RlID0gZ2V0UGFyZW50Tm9kZShub2RlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cblxuLyoqXG4gKiBHZXRzIHRoZSBwYXJlbnQgbm9kZSBvZiBhbiBlbGVtZW50IG9yIGl0cyBob3N0IGVsZW1lbnQgaWYgdGhlIHBhcmVudCBub2RlXG4gKiBpcyBhIHNoYWRvdyByb290LlxuICogQHBhcmFtIHtOb2RlfSBub2RlIFRoZSBub2RlIHdob3NlIHBhcmVudCB0byBnZXQuXG4gKiBAcmV0dXJuIHtOb2RlfG51bGx9IFRoZSBwYXJlbnQgbm9kZSBvciBudWxsIGlmIG5vIHBhcmVudCBleGlzdHMuXG4gKi9cbmZ1bmN0aW9uIGdldFBhcmVudE5vZGUobm9kZSkge1xuICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuXG4gIGlmIChwYXJlbnQgJiYgcGFyZW50Lm5vZGVUeXBlID09IDExICYmIHBhcmVudC5ob3N0KSB7XG4gICAgLy8gSWYgdGhlIHBhcmVudCBpcyBhIHNoYWRvdyByb290LCByZXR1cm4gdGhlIGhvc3QgZWxlbWVudC5cbiAgICByZXR1cm4gcGFyZW50Lmhvc3Q7XG4gIH1cbiAgcmV0dXJuIHBhcmVudDtcbn1cblxuXG4vLyBFeHBvc2VzIHRoZSBjb25zdHJ1Y3RvcnMgZ2xvYmFsbHkuXG53aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBJbnRlcnNlY3Rpb25PYnNlcnZlcjtcbndpbmRvdy5JbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5ID0gSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeTtcblxufSh3aW5kb3csIGRvY3VtZW50KSk7XG4iLCIoXG4gIC8qKlxuICAgKiBJbnRlcmZhY2UgZm9yIGV2ZW50IHN1YnNjcmlwdGlvbi5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogdmFyIE5hbm9FdmVudHMgPSByZXF1aXJlKCduYW5vZXZlbnRzJylcbiAgICpcbiAgICogY2xhc3MgVGlja2VyIHtcbiAgICogICBjb25zdHJ1Y3RvcigpIHtcbiAgICogICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKClcbiAgICogICB9XG4gICAqICAgb24oKSB7XG4gICAqICAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZXZlbnRzLCBhcmd1bWVudHMpXG4gICAqICAgfVxuICAgKiAgIHRpY2soKSB7XG4gICAqICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgndGljaycpXG4gICAqICAgfVxuICAgKiB9XG4gICAqXG4gICAqIEBhbGlhcyBOYW5vRXZlbnRzXG4gICAqIEBjbGFzc1xuICAgKi9cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBOYW5vRXZlbnRzICgpIHtcbiAgICAvKipcbiAgICAgKiBFdmVudCBuYW1lcyBpbiBrZXlzIGFuZCBhcnJheXMgd2l0aCBsaXN0ZW5lcnMgaW4gdmFsdWVzLlxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIE9iamVjdC5rZXlzKGVlLmV2ZW50cylcbiAgICAgKlxuICAgICAqIEBhbGlhcyBOYW5vRXZlbnRzI2V2ZW50c1xuICAgICAqL1xuICAgIHRoaXMuZXZlbnRzID0geyB9XG4gIH1cbikucHJvdG90eXBlID0ge1xuXG4gIC8qKlxuICAgKiBDYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0gey4uLip9IGFyZ3VtZW50cyBUaGUgYXJndW1lbnRzIGZvciBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogZWUuZW1pdCgndGljaycsIHRpY2tUeXBlLCB0aWNrRHVyYXRpb24pXG4gICAqXG4gICAqIEBhbGlhcyBOYW5vRXZlbnRzI2VtaXRcbiAgICogQG1ldGhvZFxuICAgKi9cbiAgZW1pdDogZnVuY3Rpb24gZW1pdCAoZXZlbnQpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgIC8vIEFycmF5LnByb3RvdHlwZS5jYWxsKCkgcmV0dXJucyBlbXB0eSBhcnJheSBpZiBjb250ZXh0IGlzIG5vdCBhcnJheS1saWtlXG4gICAgO1tdLnNsaWNlLmNhbGwodGhpcy5ldmVudHNbZXZlbnRdIHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24gKGkpIHtcbiAgICAgIGkuYXBwbHkodGhpcywgYXJncykgLy8gdGhpcyA9PT0gZ2xvYmFsIG9yIHdpbmRvd1xuICAgIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNiIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7ZnVuY3Rpb259IFVuYmluZCBsaXN0ZW5lciBmcm9tIGV2ZW50LlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBjb25zdCB1bmJpbmQgPSBlZS5vbigndGljaycsICh0aWNrVHlwZSwgdGlja0R1cmF0aW9uKSA9PiB7XG4gICAqICAgY291bnQgKz0gMVxuICAgKiB9KVxuICAgKlxuICAgKiBkaXNhYmxlICgpIHtcbiAgICogICB1bmJpbmQoKVxuICAgKiB9XG4gICAqXG4gICAqIEBhbGlhcyBOYW5vRXZlbnRzI29uXG4gICAqIEBtZXRob2RcbiAgICovXG4gIG9uOiBmdW5jdGlvbiBvbiAoZXZlbnQsIGNiKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgJiYgdHlwZW9mIGNiICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpXG4gICAgfVxuXG4gICAgKHRoaXMuZXZlbnRzW2V2ZW50XSA9IHRoaXMuZXZlbnRzW2V2ZW50XSB8fCBbXSkucHVzaChjYilcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmV2ZW50c1tldmVudF0gPSB0aGlzLmV2ZW50c1tldmVudF0uZmlsdGVyKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgIHJldHVybiBpICE9PSBjYlxuICAgICAgfSlcbiAgICB9LmJpbmQodGhpcylcbiAgfVxufVxuIiwiLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMuXG4gKlxuICogQHBhcmFtIHtOYW5vRXZlbnRzfSBlbWl0dGVyIE5hbm9FdmVudHMgaW5zdGFuY2UuXG4gKlxuICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAqXG4gKiBAZXhhbXBsZVxuICogdW5iaW5kQWxsKGVtaXR0ZXIpXG4gKi9cbmZ1bmN0aW9uIHVuYmluZEFsbCAoZW1pdHRlcikge1xuICBlbWl0dGVyLmV2ZW50cyA9IHsgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVuYmluZEFsbFxuIiwiaW1wb3J0IHtOYXZpZ2F0b3J9IGZyb20gJy4vbmF2aWdhdG9yJztcbmltcG9ydCB7UGFnaW5hdG9yfSBmcm9tICcuL3BhZ2luYXRvcic7XG5pbXBvcnQge1ZpZXdpbmF0b3J9IGZyb20gJy4vdmlld2luYXRvcic7XG5pbXBvcnQge1pvb21pbmF0b3J9IGZyb20gJy4vem9vbWluYXRvcic7XG5pbXBvcnQge1JvdGF0b3J9IGZyb20gJy4vcm90YXRvcic7XG5cbnZhciBDb250cm9sID0ge307XG5Db250cm9sLk5hdmlnYXRvciA9IE5hdmlnYXRvcjtcbkNvbnRyb2wuUGFnaW5hdG9yID0gUGFnaW5hdG9yO1xuQ29udHJvbC5WaWV3aW5hdG9yID0gVmlld2luYXRvcjtcbkNvbnRyb2wuWm9vbWluYXRvciA9IFpvb21pbmF0b3I7XG5Db250cm9sLlJvdGF0b3IgPSBSb3RhdG9yO1xuXG5leHBvcnQge0NvbnRyb2x9O1xuIiwiaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5cbmV4cG9ydCB2YXIgTmF2aWdhdG9yID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgLy8gdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgdGhpcy5pbnB1dCA9IG9wdGlvbnMuaW5wdXQ7XG4gICAgdGhpcy5vdXRwdXQgPSBvcHRpb25zLm91dHB1dDtcbiAgICB0aGlzLnJlYWRlciA9IG9wdGlvbnMucmVhZGVyO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKCk7XG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gIH1cblxuICBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZW1pdHRlciwgYXJndW1lbnRzKVxuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChldmVudCkgPT4ge1xuICAgICAgdGhpcy5yZW5kZXIoJ2N1cnJlbnQtc2VxJywgdGhpcy5pbnB1dC52YWx1ZSk7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgndXBkYXRlTG9jYXRpb24nLCB7IHNlcTogdGhpcy5pbnB1dC52YWx1ZSB9KTtcbiAgICB9KVxuXG4gICAgdGhpcy5yZWFkZXIub24oJ3JlbG9jYXRlZCcsIChwYXJhbXMpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyKCdjdXJyZW50LXNlcScsIHBhcmFtcy5zZXEpO1xuICAgICAgdGhpcy5pbnB1dC52YWx1ZSA9IHBhcmFtcy5zZXE7XG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlcihzbG90LCB2YWx1ZSkge1xuICAgIHZhciBzcGFuID0gdGhpcy5vdXRwdXQucXVlcnlTZWxlY3RvcihgW2RhdGEtc2xvdD1cIiR7c2xvdH1cIl1gKTtcbiAgICBzcGFuLmlubmVyVGV4dCA9IHZhbHVlO1xuICB9XG59XG4iLCJpbXBvcnQgTmFub0V2ZW50cyBmcm9tICduYW5vZXZlbnRzJztcblxuZXhwb3J0IHZhciBQYWdpbmF0b3IgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICAvLyB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcbiAgICB0aGlzLmlucHV0ID0gb3B0aW9ucy5pbnB1dDtcbiAgICB0aGlzLnJlYWRlciA9IG9wdGlvbnMucmVhZGVyO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKCk7XG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gIH1cblxuICBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZW1pdHRlciwgYXJndW1lbnRzKVxuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcbiAgICB0aGlzLmlucHV0LnF1ZXJ5U2VsZWN0b3IoJyNhY3Rpb24tZ28tbmV4dCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAvLyB0aGlzLmVtaXR0ZXIuZW1pdCgndXBkYXRlTG9jYXRpb24nLCB7IHNlcTogdGhpcy5pbnB1dC52YWx1ZSB9KTtcbiAgICAgIHRoaXMucmVhZGVyLm5leHQoKTtcbiAgICB9KVxuXG4gICAgdGhpcy5pbnB1dC5xdWVyeVNlbGVjdG9yKCcjYWN0aW9uLWdvLXByZXYnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgLy8gdGhpcy5lbWl0dGVyLmVtaXQoJ3VwZGF0ZUxvY2F0aW9uJywgeyBzZXE6IHRoaXMuaW5wdXQudmFsdWUgfSk7XG4gICAgICB0aGlzLnJlYWRlci5wcmV2KCk7XG4gICAgfSlcblxuICAgIHRoaXMuaW5wdXQucXVlcnlTZWxlY3RvcignI2FjdGlvbi1nby1maXJzdCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAvLyB0aGlzLmVtaXR0ZXIuZW1pdCgndXBkYXRlTG9jYXRpb24nLCB7IHNlcTogdGhpcy5pbnB1dC52YWx1ZSB9KTtcbiAgICAgIHRoaXMucmVhZGVyLmZpcnN0KCk7XG4gICAgfSlcblxuICAgIHRoaXMuaW5wdXQucXVlcnlTZWxlY3RvcignI2FjdGlvbi1nby1sYXN0JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgIC8vIHRoaXMuZW1pdHRlci5lbWl0KCd1cGRhdGVMb2NhdGlvbicsIHsgc2VxOiB0aGlzLmlucHV0LnZhbHVlIH0pO1xuICAgICAgdGhpcy5yZWFkZXIubGFzdCgpO1xuICAgIH0pXG5cbiAgfVxuXG4gIHJlbmRlcihzbG90LCB2YWx1ZSkge1xuICAgIHZhciBzcGFuID0gdGhpcy5vdXRwdXQucXVlcnlTZWxlY3RvcihgW2RhdGEtc2xvdD1cIiR7c2xvdH1cIl1gKTtcbiAgICBzcGFuLmlubmVyVGV4dCA9IHZhbHVlO1xuICB9XG59XG4iLCJpbXBvcnQgTmFub0V2ZW50cyBmcm9tICduYW5vZXZlbnRzJztcblxuZXhwb3J0IHZhciBSb3RhdG9yID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgLy8gdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgdGhpcy5zY2FsZSA9IHBhcnNlSW50KG9wdGlvbnMuc2NhbGUgfHwgMS4wLCAxMCk7XG4gICAgdGhpcy5pbnB1dCA9IG9wdGlvbnMuaW5wdXQ7XG4gICAgdGhpcy5yZWFkZXIgPSBvcHRpb25zLnJlYWRlcjtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmVtaXR0ZXIsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuaW5wdXQuY291bnRlcmNsb2Nrd2lzZSA9IHRoaXMuaW5wdXQucXVlcnlTZWxlY3RvcignI2FjdGlvbi1yb3RhdGUtY291bnRlcmNsb2Nrd2lzZScpO1xuICAgIHRoaXMuaW5wdXQuY291bnRlcmNsb2Nrd2lzZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzZWxmLmVtaXR0ZXIuZW1pdCgncm90YXRlJywgLTkwKTtcbiAgICB9KVxuXG4gICAgdGhpcy5pbnB1dC5jbG9ja3dpc2UgPSB0aGlzLmlucHV0LnF1ZXJ5U2VsZWN0b3IoJyNhY3Rpb24tcm90YXRlLWNsb2Nrd2lzZScpO1xuICAgIHRoaXMuaW5wdXQuY2xvY2t3aXNlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHNlbGYuZW1pdHRlci5lbWl0KCdyb3RhdGUnLCA5MCk7XG4gICAgfSlcblxuICAgIHRoaXMucmVhZGVyLm9uKCdjb25maWd1cmUnLCBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIGlmICggY29uZmlnLnJvdGF0ZSA9PT0gZmFsc2UgKSB7XG4gICAgICAgIHRoaXMuaW5wdXQuY291bnRlcmNsb2Nrd2lzZS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5wdXQuY2xvY2t3aXNlLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHZhciBpZHggPSB0aGlzLnBvc3NpYmxlcy5pbmRleE9mKHRoaXMuc2NhbGUpO1xuICAgICAgICB0aGlzLmlucHV0LmNvdW50ZXJjbG9ja3dpc2UuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbnB1dC5jbG9ja3dpc2UuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG59XG4iLCJpbXBvcnQgTmFub0V2ZW50cyBmcm9tICduYW5vZXZlbnRzJztcblxuZXhwb3J0IHZhciBWaWV3aW5hdG9yID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgLy8gdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgdGhpcy5pbnB1dCA9IG9wdGlvbnMuaW5wdXQ7XG4gICAgdGhpcy5yZWFkZXIgPSBvcHRpb25zLnJlYWRlcjtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmVtaXR0ZXIsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBidXR0b25zID0gdGhpcy5pbnB1dC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10YXJnZXRdJyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidXR0b25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgYnV0dG9uID0gYnV0dG9uc1tpXTtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLmRhdGFzZXQudGFyZ2V0O1xuICAgICAgICBzZWxmLnJlYWRlci5yZXN0YXJ0KHsgdmlldzogdGFyZ2V0IH0pO1xuICAgICAgfSlcbiAgICB9XG4gIH1cblxuXG4gIHJlbmRlcihzbG90LCB2YWx1ZSkge1xuICAgIHZhciBzcGFuID0gdGhpcy5vdXRwdXQucXVlcnlTZWxlY3RvcihgW2RhdGEtc2xvdD1cIiR7c2xvdH1cIl1gKTtcbiAgICBzcGFuLmlubmVyVGV4dCA9IHZhbHVlO1xuICB9XG59XG4iLCJpbXBvcnQgTmFub0V2ZW50cyBmcm9tICduYW5vZXZlbnRzJztcblxuZXhwb3J0IHZhciBab29taW5hdG9yID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgLy8gdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgdGhpcy5zY2FsZSA9IHBhcnNlSW50KG9wdGlvbnMuc2NhbGUgfHwgMS4wLCAxMCk7XG4gICAgdGhpcy5pbnB1dCA9IG9wdGlvbnMuaW5wdXQ7XG4gICAgdGhpcy5yZWFkZXIgPSBvcHRpb25zLnJlYWRlcjtcbiAgICAvLyB0aGlzLnBvc3NpYmxlcyA9IFsgMC41LCAwLjc1LCAxLjAsIDEuMjUsIDEuNSwgMS43NSwgMi4wLCAzLjAsIDQuMCBdO1xuICAgIHRoaXMucG9zc2libGVzID0gWyAwLjc1LCAxLjAsIDEuMjUsIDEuNSBdO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKCk7XG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gIH1cblxuICBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZW1pdHRlciwgYXJndW1lbnRzKVxuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5pbnB1dC56b29tX2luID0gdGhpcy5pbnB1dC5xdWVyeVNlbGVjdG9yKCcjYWN0aW9uLXpvb20taW4nKTtcbiAgICB0aGlzLmlucHV0Lnpvb21faW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGlkeCA9IHNlbGYucG9zc2libGVzLmluZGV4T2Yoc2VsZi5zY2FsZSk7XG4gICAgICBpZHggKz0gMTtcbiAgICAgIHNlbGYudXBkYXRlKGlkeCk7XG4gICAgfSlcblxuICAgIHRoaXMuaW5wdXQuem9vbV9vdXQgPSB0aGlzLmlucHV0LnF1ZXJ5U2VsZWN0b3IoJyNhY3Rpb24tem9vbS1vdXQnKTtcbiAgICB0aGlzLmlucHV0Lnpvb21fb3V0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBpZHggPSBzZWxmLnBvc3NpYmxlcy5pbmRleE9mKHNlbGYuc2NhbGUpO1xuICAgICAgaWR4IC09IDE7XG4gICAgICBzZWxmLnVwZGF0ZShpZHgpO1xuICAgIH0pXG5cbiAgICB0aGlzLnJlYWRlci5vbignY29uZmlndXJlJywgZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICBpZiAoIGNvbmZpZy56b29tID09PSBmYWxzZSApIHtcbiAgICAgICAgdGhpcy5pbnB1dC56b29tX2luLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pbnB1dC56b29tX291dC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaWR4ID0gdGhpcy5wb3NzaWJsZXMuaW5kZXhPZih0aGlzLnNjYWxlKTtcbiAgICAgICAgdGhpcy5pbnB1dC56b29tX2luLmRpc2FibGVkID0gKCBpZHggPT0gKCB0aGlzLnBvc3NpYmxlcy5sZW5ndGggLSAxICkgKTtcbiAgICAgICAgdGhpcy5pbnB1dC56b29tX291dC5kaXNhYmxlZCA9ICggaWR4ID09IDAgKTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG5cbiAgdXBkYXRlKGlkeCkge1xuICAgIHRoaXMuc2NhbGUgPSB0aGlzLnBvc3NpYmxlc1tpZHhdO1xuICAgIHRoaXMuaW5wdXQuem9vbV9pbi5kaXNhYmxlZCA9ICggaWR4ID09ICggdGhpcy5wb3NzaWJsZXMubGVuZ3RoIC0gMSApICk7XG4gICAgdGhpcy5pbnB1dC56b29tX291dC5kaXNhYmxlZCA9ICggaWR4ID09IDAgKTtcbiAgICB0aGlzLnJlYWRlci5yZXN0YXJ0KHsgc2NhbGU6IHRoaXMuc2NhbGUgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBOYW5vRXZlbnRzIGZyb20gJ25hbm9ldmVudHMnO1xuXG5leHBvcnQgdmFyIE1hbmlmZXN0ID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgdGhpcy50b3RhbFNlcSA9IHBhcnNlSW50KG9wdGlvbnMudG90YWxTZXEsIDEwKTtcbiAgICB0aGlzLmRlZmF1bHRTZXEgPSBwYXJzZUludChvcHRpb25zLmRlZmF1bHRTZXEsIDEwKTtcbiAgICB0aGlzLmZpcnN0U2VxID0gcGFyc2VJbnQob3B0aW9ucy5maXJzdFNlcSwgMTApO1xuICAgIHRoaXMuZGVmYXVsdEltYWdlID0ge1xuICAgICAgaGVpZ2h0OiBwYXJzZUludChvcHRpb25zLmRlZmF1bHRIZWlnaHQsIDEwKSxcbiAgICAgIHdpZHRoOiBwYXJzZUludChvcHRpb25zLmRlZmF1bHRXaWR0aCwgMTApLFxuICAgICAgcm90YXRpb246IDBcbiAgICB9O1xuICAgIHRoaXMuZmVhdHVyZUxpc3QgPSBvcHRpb25zLmZlYXR1cmVMaXN0O1xuICAgIHRoaXMuZmVhdHVyZU1hcCA9IHt9O1xuICAgIHRoaXMuZmVhdHVyZUxpc3QuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICB0aGlzLmZlYXR1cmVNYXBbaXRlbS5zZXFdID0gaXRlbTtcbiAgICB9LmJpbmQodGhpcykpXG5cbiAgICB0aGlzLm1hbmlmZXN0ID0ge307XG4gIH1cblxuICB1cGRhdGUoc2VxLCBtZXRhKSB7XG4gICAgaWYgKCBtZXRhLnJvdGF0aW9uICE9IG51bGwgJiYgbWV0YS53aWR0aCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgLy8ganVzdCB1cGRhdGluZyByb3RhdGlvblxuICAgICAgdGhpcy5tYW5pZmVzdFtzZXFdLnJvdGF0aW9uID0gbWV0YS5yb3RhdGlvbjtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gLi4uIHdoaWNoIHdpbGwgaGVscCB3aXRoIHN3aXRjaGluZyBsYW5lcyBhbmQgcm90YXRpbmdcbiAgICBpZiAoIHRoaXMubWFuaWZlc3Rbc2VxXSAmJiB0aGlzLm1hbmlmZXN0W3NlcV0ud2lkdGggKSB7IHJldHVybiA7IH1cbiAgICB2YXIgcmF0aW8gPSB0aGlzLmRlZmF1bHRJbWFnZS53aWR0aCAvIG1ldGEud2lkdGg7XG4gICAgdGhpcy5tYW5pZmVzdFtzZXFdID0ge1xuICAgICAgd2lkdGg6IHRoaXMuZGVmYXVsdEltYWdlLndpZHRoLFxuICAgICAgaGVpZ2h0OiBtZXRhLmhlaWdodCAqIHJhdGlvLFxuICAgICAgcm90YXRpb246IG1ldGEucm90YXRpb24gfHwgMFxuICAgIH1cbiAgfVxuXG4gIG1ldGEoc2VxKSB7XG4gICAgaWYgKCB0aGlzLm1hbmlmZXN0W3NlcV0gKSB7XG4gICAgICB2YXIgbWV0YSA9IHRoaXMubWFuaWZlc3Rbc2VxXTtcbiAgICAgIGlmICggbWV0YS5yb3RhdGlvbiAlIDE4MCAhPSAwICkge1xuICAgICAgICByZXR1cm4geyBoZWlnaHQ6IG1ldGEud2lkdGgsIHdpZHRoOiBtZXRhLmhlaWdodCwgcm90YXRpb246IG1ldGEucm90YXRpb24gfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtZXRhO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5kZWZhdWx0SW1hZ2U7XG4gIH1cblxuICByb3RhdGVCeShzZXEsIGRlbHRhKSB7XG4gICAgdmFyIHJvdGF0aW9uO1xuICAgIC8vIHRoaXMgc2hvdWxkbid0IGhhcHBlblxuICAgIGlmICggISB0aGlzLm1hbmlmZXN0W3NlcV0gKSB7IHJldHVybjsgfVxuICAgIHJvdGF0aW9uID0gdGhpcy5tYW5pZmVzdFtzZXFdLnJvdGF0aW9uO1xuICAgIGlmICggcm90YXRpb24gPT0gMCApIHsgcm90YXRpb24gPSAzNjA7IH1cbiAgICByb3RhdGlvbiArPSBkZWx0YTtcbiAgICByb3RhdGlvbiA9IHJvdGF0aW9uICUgMzYwO1xuICAgIHRoaXMubWFuaWZlc3Rbc2VxXS5yb3RhdGlvbiA9IHJvdGF0aW9uO1xuICB9XG59XG5cbmV4cG9ydCB2YXIgU2VydmljZSA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIHRoaXMubWFuaWZlc3QgPSBuZXcgTWFuaWZlc3Qob3B0aW9ucy5tYW5pZmVzdCk7XG4gICAgdGhpcy5pZGVudGlmaWVyID0gb3B0aW9ucy5pZGVudGlmaWVyO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKCk7XG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gIH1cblxuICB0aHVtYm5haWwob3B0aW9ucz17fSkge1xuICAgIHZhciB3aWR0aCA9IDI1MDsgLy8gb25lIHNpemUgZml0cyBhbGxcbiAgICB2YXIgbWV0YSA9IHRoaXMubWFuaWZlc3QubWV0YShvcHRpb25zLnNlcSk7XG4gICAgdmFyIHJvdGF0aW9uID0gbWV0YS5yb3RhdGlvbiB8fCAwO1xuICAgIHJldHVybiBgL2NnaS9pbWdzcnYvdGh1bWJuYWlsP2lkPSR7dGhpcy5pZGVudGlmaWVyfTtzZXE9JHtvcHRpb25zLnNlcX07d2lkdGg9JHt3aWR0aH07cm90YXRpb249JHtyb3RhdGlvbn1gO1xuICB9XG5cbiAgaW1hZ2Uob3B0aW9ucz17fSkge1xuICAgIHZhciBhY3Rpb24gPSAnaW1hZ2UnOyAvLyBvcHRpb25zLm1vZGUgPT0gJ3RodW1ibmFpbCcgPyAndGh1bWJuYWlsJyA6ICdpbWFnZSc7XG4gICAgdmFyIHBhcmFtID0gdGhpcy5iZXN0Rml0KG9wdGlvbnMpO1xuICAgIHZhciBtZXRhID0gdGhpcy5tYW5pZmVzdC5tZXRhKG9wdGlvbnMuc2VxKTtcbiAgICB2YXIgcm90YXRpb24gPSBtZXRhLnJvdGF0aW9uIHx8IDA7XG4gICAgcmV0dXJuIGAvY2dpL2ltZ3Nydi8ke2FjdGlvbn0/aWQ9JHt0aGlzLmlkZW50aWZpZXJ9O3NlcT0ke29wdGlvbnMuc2VxfTske3BhcmFtLnBhcmFtfT0ke3BhcmFtLnZhbHVlfTtyb3RhdGlvbj0ke3JvdGF0aW9ufWA7XG4gIH1cblxuICBodG1sKG9wdGlvbnM9e30pIHtcbiAgICByZXR1cm4gYC9jZ2kvaW1nc3J2L2h0bWw/aWQ9JHt0aGlzLmlkZW50aWZpZXJ9O3NlcT0ke29wdGlvbnMuc2VxfWA7XG4gIH1cblxuICBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZW1pdHRlciwgYXJndW1lbnRzKVxuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcblxuICB9XG5cbiAgYmVzdEZpdChwYXJhbXMpIHtcbiAgICB2YXIgcG9zc2libGVzID0gWzUwLCA3NSwgMTAwLCAxMjUsIDE1MCwgMTc1LCAyMDBdO1xuICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICBpZiAoIHBhcmFtcy53aWR0aCApIHtcbiAgICAgIHJldHZhbC5wYXJhbSA9ICdzaXplJztcbiAgICAgIHJldHZhbC52YWx1ZSA9IHBvc3NpYmxlcy5maW5kKGZ1bmN0aW9uKHBvc3NpYmxlKSB7XG4gICAgICAgIHZhciBjaGVjayA9IDY4MCAqICggcG9zc2libGUgLyAxMDAuMCApO1xuICAgICAgICByZXR1cm4gcGFyYW1zLndpZHRoIDw9IGNoZWNrO1xuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKCBwYXJhbXMuaGVpZ2h0ICkge1xuICAgICAgcmV0dmFsLnBhcmFtID0gJ2hlaWdodCc7XG4gICAgICByZXR2YWwudmFsdWUgPSBwYXJhbXMuaGVpZ2h0O1xuICAgIH1cbiAgICByZXR1cm4gcmV0dmFsO1xuICB9XG5cbn07XG4iLCJpbXBvcnQgTmFub0V2ZW50cyBmcm9tICduYW5vZXZlbnRzJztcbmltcG9ydCB1bmJpbmRBbGwgZnJvbSAnbmFub2V2ZW50cy91bmJpbmQtYWxsJztcblxuZXhwb3J0IHZhciBCYXNlID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgdGhpcy5zZXJ2aWNlID0gb3B0aW9ucy5zZXJ2aWNlO1xuICAgIHRoaXMucmVhZGVyID0gb3B0aW9ucy5yZWFkZXI7XG4gICAgdGhpcy5zY2FsZSA9IG9wdGlvbnMuc2NhbGUgfHwgMS4wO1xuICAgIHRoaXMubW9kZSA9ICdzY3JvbGwnO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBOYW5vRXZlbnRzKCk7XG4gICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLmlkID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgfVxuXG4gIGF0dGFjaFRvKGVsZW1lbnQsIGNiKSB7XG4gICAgdGhpcy5jb250YWluZXIgPSBlbGVtZW50O1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIHRoaXMucmVuZGVyKGNiKTtcbiAgfVxuXG4gIHJlbmRlcihjYikge1xuICAgIHZhciBtaW5XaWR0aCA9IHRoaXMubWluV2lkdGgoKTtcbiAgICB2YXIgc2NhbGUgPSB0aGlzLnNjYWxlO1xuICAgIGZvcih2YXIgc2VxID0gMTsgc2VxIDw9IHRoaXMuc2VydmljZS5tYW5pZmVzdC50b3RhbFNlcTsgc2VxKyspIHtcblxuICAgICAgdmFyIHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgdmFyIG1ldGEgPSB0aGlzLnNlcnZpY2UubWFuaWZlc3QubWV0YShzZXEpO1xuICAgICAgdmFyIHJhdGlvID0gbWV0YS5oZWlnaHQgLyBtZXRhLndpZHRoO1xuXG4gICAgICB2YXIgaCA9IG1pbldpZHRoICogcmF0aW8gKiBzY2FsZTtcbiAgICAgIHZhciB3ID0gbWluV2lkdGggKiBzY2FsZTtcbiAgICAgIC8vIGlmICggbWV0YS5yb3RhdGlvbiAlIDE4MCAhPSAwICkge1xuICAgICAgLy8gICB3ID0gbWluV2lkdGggKiByYXRpbyAqIHNjYWxlO1xuICAgICAgLy8gICBoID0gbWluV2lkdGggKiBzY2FsZTtcbiAgICAgIC8vIH1cblxuICAgICAgcGFnZS5zdHlsZS5oZWlnaHQgPSBgJHtofXB4YDtcbiAgICAgIHBhZ2Uuc3R5bGUud2lkdGggPSBgJHt3fXB4YDtcbiAgICAgIHBhZ2UuZGF0YXNldC5iZXN0Rml0ID0gKCBzY2FsZSA8PSAxICk7XG5cbiAgICAgIHBhZ2UuY2xhc3NMaXN0LmFkZCgncGFnZScpO1xuICAgICAgcGFnZS5kYXRhc2V0LnNlcSA9IHNlcTtcbiAgICAgIHBhZ2UuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJwYWdlLXRleHRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiaW5mb1wiPiR7c2VxfTwvZGl2PmA7XG4gICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICB9XG5cbiAgICB2YXIgcGFnZXMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5iaW5kUGFnZUV2ZW50cyhwYWdlc1tpXSk7XG4gICAgICAvLyBpZiAoIHRoaXMubW9kZSA9PSAnaW1hZ2UnICkge1xuICAgICAgLy8gICBwYWdlc1tpXS5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbiAgICAgIC8vICAgdGhpcy5vYnNlcnZlci5pbmFjdGl2ZSA9IHRydWU7XG4gICAgICAvLyB9IGVsc2Uge1xuICAgICAgLy8gICB0aGlzLm9ic2VydmVyLm9ic2VydmUocGFnZXNbaV0pO1xuICAgICAgLy8gfVxuICAgIH1cblxuICAgIHRoaXMuaXNfYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmxvYWRJbWFnZSh0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS1zZXE9XCIxXCJdJyksIHRydWUpO1xuICAgIGlmICggY2IgKSB7XG4gICAgICBjYigpO1xuICAgIH1cbiAgfVxuXG4gIHJlc2l6ZVBhZ2UocGFnZSkge1xuICAgIHZhciBjYW52YXMgPSBwYWdlLnF1ZXJ5U2VsZWN0b3IoJ2ltZycpO1xuICAgIGlmICggISBjYW52YXMgKSB7IHJldHVybiA7IH1cblxuICAgIGlmICggcGFnZS5kYXRhc2V0LmxvYWRpbmcgIT09ICdmYWxzZScgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciByZWN0ID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGlmICggY2FudmFzLmhlaWdodCA8IHBhcnNlSW50KHBhZ2Uuc3R5bGUuaGVpZ2h0LCAxMCkgKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIkFIT1kgc2hyaW5raW5nXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHBhZ2Uuc3R5bGUuaGVpZ2h0LCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gICAgcGFnZS5zdHlsZS5oZWlnaHQgPSBgJHtjYW52YXMuaGVpZ2h0fXB4YDtcbiAgICB2YXIgdXBkYXRlZF9yZWN0ID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wO1xuXG4gICAgdGhpcy5fcG9zdFJlc2l6ZVBhZ2UocmVjdCwgYm91bmRzKTtcbiAgfVxuXG4gIF9wb3N0UmVzaXplUGFnZShyZWN0LCBib3VuZHMpIHtcblxuICB9XG5cbiAgbG9hZEltYWdlKHBhZ2UsIGNoZWNrX3Njcm9sbCkge1xuICAgIGlmICggISB0aGlzLmlzX2FjdGl2ZSApIHsgcmV0dXJuIDsgfVxuICAgIHZhciBzZXEgPSBwYWdlLmRhdGFzZXQuc2VxO1xuICAgIHZhciByZWN0ID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiQUhPWSBMT0FESU5HXCIsIHNlcSk7XG5cbiAgICB2YXIgaW1hZ2VfdXJsID0gdGhpcy5pbWFnZVVybChwYWdlKTtcbiAgICB2YXIgaHRtbF91cmwgPSB0aGlzLnNlcnZpY2UuaHRtbCh7IHNlcTogc2VxIH0pO1xuXG4gICAgaWYgKCBwYWdlLnF1ZXJ5U2VsZWN0b3IoJ2ltZycpICkge1xuICAgICAgLy8gcHJlbG9hZEltYWdlcyhwYWdlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIHBhZ2UuZGF0YXNldC5sb2FkaW5nID09IFwidHJ1ZVwiICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBodG1sX3JlcXVlc3Q7XG4gICAgaWYgKCBmYWxzZSAmJiB0aGlzLmVtYmVkSHRtbCkge1xuICAgICAgaHRtbF9yZXF1ZXN0ID0gZmV0Y2goaHRtbF91cmwpO1xuICAgIH1cblxuICAgIHZhciBwYWdlX2hlaWdodCA9IHBhZ2Uub2Zmc2V0SGVpZ2h0O1xuICAgIHZhciBwYWdlX3dpZHRoID0gcGFnZS5vZmZzZXRXaWR0aDtcblxuICAgIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWcuYWx0ID0gYFBhZ2Ugc2NhbiBvZiBzZXF1ZW5jZSAke3NlcX1gO1xuXG4gICAgcGFnZS5kYXRhc2V0LmxvYWRpbmcgPSB0cnVlO1xuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gX2ltZ0hhbmRsZXIoKSB7XG4gICAgICBwYWdlLmRhdGFzZXQubG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICB0aGlzLnNlcnZpY2UubWFuaWZlc3QudXBkYXRlKHNlcSwgeyB3aWR0aDogaW1nLndpZHRoLCBoZWlnaHQ6IGltZy5oZWlnaHQgfSk7XG5cbiAgICAgIHZhciBpbWFnZUFzcGVjdFJhdGlvID0gaW1nLndpZHRoIC8gaW1nLmhlaWdodDtcbiAgICAgIGltZy5zdHlsZS53aWR0aCA9IHBhZ2Vfd2lkdGg7XG4gICAgICBpbWcuc3R5bGUuaGVpZ2h0ID0gcGFnZV93aWR0aCAvIGltYWdlQXNwZWN0UmF0aW87XG4gICAgICBwYWdlLmFwcGVuZENoaWxkKGltZyk7XG4gICAgICBwYWdlLmRhdGFzZXQubG9hZGVkID0gdHJ1ZTtcblxuICAgICAgaWYgKCBodG1sX3JlcXVlc3QgKSB7XG4gICAgICAgIGh0bWxfcmVxdWVzdFxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24odGV4dCkge1xuICAgICAgICAgICAgdmFyIHBhZ2VfdGV4dCA9IHBhZ2UucXVlcnlTZWxlY3RvcignLnBhZ2UtdGV4dCcpO1xuICAgICAgICAgICAgcGFnZV90ZXh0LmlubmVySFRNTCA9IHRleHQ7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICggY2hlY2tfc2Nyb2xsIHx8IHRoaXMubW9kZSA9PSAndGh1bWJuYWlsJyApIHsgdGhpcy5yZXNpemVQYWdlKHBhZ2UpOyB9XG4gICAgICBpbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIF9pbWdIYW5kbGVyLCB0cnVlKTtcbiAgICB9LmJpbmQodGhpcyksIHRydWUpXG5cbiAgICBpbWcuc3JjID0gaW1hZ2VfdXJsO1xuXG4gICAgaWYgKCAhIHBhZ2UuZGF0YXNldC5wcmVsb2FkZWQgKSB7XG4gICAgICB0aGlzLnByZWxvYWRJbWFnZXMocGFnZSk7XG4gICAgfVxuICB9XG5cbiAgcmVkcmF3UGFnZShwYWdlKSB7XG4gICAgaWYgKCB0eXBlb2YocGFnZSkgPT0gXCJudW1iZXJcIiB8fCB0eXBlb2YocGFnZSkgPT0gXCJzdHJpbmdcIiApIHtcbiAgICAgIHBhZ2UgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGBbZGF0YS1zZXE9XCIke3BhZ2V9XCJdYCk7XG4gICAgfVxuICAgIHZhciBpbWFnZV91cmwgPSB0aGlzLmltYWdlVXJsKHBhZ2UpO1xuICAgIHZhciBpbWcgPSBwYWdlLnF1ZXJ5U2VsZWN0b3IoJ2ltZycpO1xuICAgIHZhciBuZXdfaW1nID0gbmV3IEltYWdlKCk7XG4gICAgbmV3X2ltZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gX3JlZHJhd0hhbmRsZXIoKSB7XG4gICAgICBwYWdlLnJlcGxhY2VDaGlsZChuZXdfaW1nLCBpbWcpO1xuICAgICAgdGhpcy5yZXNpemVQYWdlKHBhZ2UpO1xuICAgICAgbmV3X2ltZy5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgX3JlZHJhd0hhbmRsZXIsIHRydWUpO1xuICAgIH0uYmluZCh0aGlzKSwgdHJ1ZSk7XG4gICAgbmV3X2ltZy5zcmMgPSBpbWFnZV91cmw7XG4gIH1cblxuICB1bmxvYWRJbWFnZShwYWdlKSB7XG4gICAgaWYgKCBwYWdlLmRhdGFzZXQucHJlbG9hZGVkID09IFwidHJ1ZVwiICkgeyByZXR1cm47IH1cbiAgICBpZiAoIHBhZ2UuZGF0YXNldC5sb2FkaW5nID09IFwidHJ1ZVwiICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIGNhbnZhcyA9IHBhZ2UucXVlcnlTZWxlY3RvcignaW1nJyk7XG4gICAgaWYgKCBjYW52YXMgKSB7XG4gICAgICBwYWdlLnJlbW92ZUNoaWxkKGNhbnZhcyk7XG4gICAgfVxuICAgIHZhciBwYWdlX3RleHQgPSBwYWdlLnF1ZXJ5U2VsZWN0b3IoJy5wYWdlLXRleHQnKTtcbiAgICBwYWdlX3RleHQuaW5uZXJIVE1MID0gJyc7XG4gICAgcGFnZS5kYXRhc2V0LnByZWxvYWRlZCA9IGZhbHNlO1xuICAgIHBhZ2UuZGF0YXNldC5sb2FkZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHByZWxvYWRJbWFnZXMocGFnZSkge1xuICAgIHZhciBzZXEgPSBwYXJzZUludChwYWdlLmRhdGFzZXQuc2VxLCAxMCk7XG4gICAgdmFyIGRlbHRhID0gMTtcbiAgICB3aGlsZSAoIGRlbHRhIDw9IDEgKSB7XG4gICAgICB2YXIgcHJldl9wYWdlID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcSAtIGRlbHRhfVwiXWApO1xuICAgICAgaWYgKCBwcmV2X3BhZ2UgKSB7XG4gICAgICAgIHByZXZfcGFnZS5kYXRhc2V0LnByZWxvYWRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMubG9hZEltYWdlKHByZXZfcGFnZSk7XG4gICAgICB9XG4gICAgICBkZWx0YSArPSAxO1xuICAgIH1cbiAgICBkZWx0YSA9IDE7XG4gICAgd2hpbGUgKCBkZWx0YSA8PSAxICkge1xuICAgICAgdmFyIG5leHRfcGFnZSA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYC5wYWdlW2RhdGEtc2VxPVwiJHtzZXEgKyBkZWx0YX1cIl1gKTtcbiAgICAgIGlmICggbmV4dF9wYWdlICkge1xuICAgICAgICBuZXh0X3BhZ2UuZGF0YXNldC5wcmVsb2FkZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmxvYWRJbWFnZShuZXh0X3BhZ2UpO1xuICAgICAgfVxuICAgICAgZGVsdGEgKz0gMTtcbiAgICB9XG4gIH1cblxuICBpbWFnZVVybChwYXJhbXMpIHtcbiAgICBpZiAoIHBhcmFtcyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICkge1xuICAgICAgdmFyIGVsZW1lbnQgPSBwYXJhbXM7IHBhcmFtcyA9IHt9O1xuICAgICAgcGFyYW1zLnNlcSA9IGVsZW1lbnQuZGF0YXNldC5zZXE7XG4gICAgICBwYXJhbXMud2lkdGggPSBlbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIH1cbiAgICAvLyBpZiAoIHRoaXMucmVhZGVyLnBhZ2VkZXRhaWxzLnJvdGF0ZVtwYXJhbXMuc2VxXSApIHtcbiAgICAvLyAgIHBhcmFtcy5yb3RhdGlvbiA9IHRoaXMucmVhZGVyLnBhZ2VkZXRhaWxzLnJvdGF0ZVtwYXJhbXMuc2VxXTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIHRoaXMuc2VydmljZS5pbWFnZShwYXJhbXMpO1xuICB9XG5cbiAgbWluV2lkdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLnBhcmVudE5vZGUub2Zmc2V0V2lkdGggKiAwLjgwO1xuICB9XG5cbiAgb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmVtaXR0ZXIsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gIH1cblxuICBiaW5kUGFnZUV2ZW50cyhwYWdlKSB7XG4gIH1cblxuICBjb25maWcoKSB7XG4gICAgLy8gdGhlIGVtcHR5IHNldCBzdXBwb3J0cyBldmVyeXRoaW5nXG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB1bmJpbmRBbGwodGhpcy5lbWl0dGVyKTtcbiAgfVxuXG59XG5cbiIsImltcG9ydCBOYW5vRXZlbnRzIGZyb20gJ25hbm9ldmVudHMnO1xuaW1wb3J0IHtCYXNlfSBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgdmFyIEZsaXAgPSBjbGFzcyBleHRlbmRzIEJhc2Uge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgc3VwZXIob3B0aW9ucyk7XG4gICAgdGhpcy5tb2RlID0gJ2ltYWdlJztcbiAgICB0aGlzLmVtYmVkSHRtbCA9IHRydWU7XG4gICAgdGhpcy5zZXR1cFNsaWNlcygpO1xuICAgIHRoaXMuaXNfYWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBzZXR1cFNsaWNlcygpIHtcbiAgICB0aGlzLnNlcTJzbGljZSA9IHt9O1xuICAgIHRoaXMuc2xpY2VzID0gW107XG4gICAgdGhpcy5zbGljZXMucHVzaChbIG51bGwsIDEgXSk7XG4gICAgdGhpcy5zZXEyc2xpY2VbMV0gPSAwO1xuICAgIGZvcih2YXIgc2VxID0gMjsgc2VxIDw9IHRoaXMuc2VydmljZS5tYW5pZmVzdC50b3RhbFNlcTsgc2VxICs9IDIpIHtcbiAgICAgIHZhciBuZXh0X3NlcSA9IHNlcSArIDE7XG4gICAgICBpZiAoIG5leHRfc2VxID4gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0LnRvdGFsU2VxICkge1xuICAgICAgICBuZXh0X3NlcSA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLnNsaWNlcy5wdXNoKFsgc2VxLCBuZXh0X3NlcSBdKTtcbiAgICAgIHRoaXMuc2VxMnNsaWNlW3NlcV0gPSB0aGlzLnNsaWNlcy5sZW5ndGggLSAxO1xuICAgICAgaWYgKCBuZXh0X3NlcSApIHsgdGhpcy5zZXEyc2xpY2VbbmV4dF9zZXFdID0gdGhpcy5zbGljZXMubGVuZ3RoIC0gMTsgfVxuICAgIH1cblxuICB9XG5cbiAgcmVuZGVyKGNiKSB7XG4gICAgdmFyIG1pbldpZHRoID0gdGhpcy5taW5XaWR0aCgpO1xuICAgIG1pbldpZHRoIC89IDI7XG5cbiAgICB2YXIgbWF4SGVpZ2h0ID0gdGhpcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0ICogMC45MDtcblxuICAgIHZhciBzY2FsZSA9IHRoaXMuc2NhbGU7XG5cbiAgICAvLyBncm91cCBpbnRvIHBhZ2VzXG4gICAgdmFyIHNsaWNlcyA9IHRoaXMuc2xpY2VzO1xuICAgIHZhciBtYXhfZWRnZV93aWR0aCA9IDUwO1xuXG4gICAgZm9yKHZhciBzbGljZV9pZHggPSAwOyBzbGljZV9pZHggPCBzbGljZXMubGVuZ3RoOyBzbGljZV9pZHgrKyApIHtcbiAgICAgIHZhciB0dXBsZSA9IHNsaWNlc1tzbGljZV9pZHhdO1xuXG4gICAgICB2YXIgc2xpY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHNsaWNlLmNsYXNzTGlzdC5hZGQoJ3NsaWNlJyk7XG5cbiAgICAgIHZhciBlZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBlZGdlLmNsYXNzTGlzdC5hZGQoJ2VkZ2UnLCAndmVyc28nKTtcbiAgICAgIGVkZ2Uuc3R5bGUud2lkdGggPSBgJHsoc2xpY2VfaWR4IC8gc2xpY2VzLmxlbmd0aCkgKiBtYXhfZWRnZV93aWR0aH1weGA7XG4gICAgICBzbGljZS5hcHBlbmRDaGlsZChlZGdlKTtcblxuICAgICAgdmFyIHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHBhZ2UuY2xhc3NMaXN0LmFkZCgncGFnZScpO1xuICAgICAgcGFnZS5jbGFzc0xpc3QuYWRkKCd2ZXJzbycpO1xuXG4gICAgICB2YXIgc2VxO1xuICAgICAgdmFyIHNsaWNlX3dpZHRoID0gMDtcbiAgICAgIHZhciBzbGljZV9oZWlnaHQgPSAwO1xuICAgICAgaWYgKCB0dXBsZVswXSApIHtcbiAgICAgICAgc2VxID0gdHVwbGVbMF07XG4gICAgICAgIHZhciBtZXRhID0gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0Lm1ldGEodHVwbGVbMF0pO1xuICAgICAgICB2YXIgcmF0aW8gPSBtZXRhLmhlaWdodCAvIG1ldGEud2lkdGg7XG4gICAgICAgIC8vIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7bWluV2lkdGggKiByYXRpbyAqIHNjYWxlfXB4YDtcbiAgICAgICAgLy8gcGFnZS5zdHlsZS53aWR0aCA9IGAke21pbldpZHRoICogc2NhbGV9cHhgO1xuXG4gICAgICAgIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7bWF4SGVpZ2h0ICogc2NhbGV9cHhgO1xuICAgICAgICBwYWdlLnN0eWxlLndpZHRoID0gYCR7bWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpb31weGA7XG5cbiAgICAgICAgc2xpY2VfaGVpZ2h0ID0gbWF4SGVpZ2h0ICogc2NhbGU7XG4gICAgICAgIHNsaWNlX3dpZHRoID0gbWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpbztcblxuICAgICAgICBwYWdlLmRhdGFzZXQuYmVzdEZpdCA9ICggc2NhbGUgPD0gMSApO1xuXG4gICAgICAgIHBhZ2UuZGF0YXNldC5zZXEgPSBzZXE7XG4gICAgICAgIHBhZ2UuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJwYWdlLXRleHRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiaW5mb1wiPiR7c2VxfTwvZGl2PmA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuc2VydmljZS5tYW5pZmVzdC5tZXRhKDEpO1xuICAgICAgICB2YXIgcmF0aW8gPSBtZXRhLmhlaWdodCAvIG1ldGEud2lkdGg7XG4gICAgICAgIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7bWF4SGVpZ2h0ICogc2NhbGV9cHhgO1xuICAgICAgICBwYWdlLnN0eWxlLndpZHRoID0gYCR7bWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpb31weGA7XG4gICAgICAgIHBhZ2UuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJwYWdlLXRleHRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiaW5mb1wiPk5JTDwvZGl2PmA7XG4gICAgICAgIHNsaWNlX3dpZHRoID0gbWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpbztcbiAgICAgIH1cbiAgICAgIHNsaWNlLmFwcGVuZENoaWxkKHBhZ2UpO1xuXG4gICAgICBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwYWdlLmNsYXNzTGlzdC5hZGQoJ3BhZ2UnKTtcbiAgICAgIHBhZ2UuY2xhc3NMaXN0LmFkZCgncmVjdG8nKTtcbiAgICAgIGlmICggdHVwbGVbMV0gKSB7XG4gICAgICAgIHNlcSA9IHR1cGxlWzFdO1xuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuc2VydmljZS5tYW5pZmVzdC5tZXRhKHR1cGxlWzFdKTtcbiAgICAgICAgdmFyIHJhdGlvID0gbWV0YS5oZWlnaHQgLyBtZXRhLndpZHRoO1xuICAgICAgICAvLyBwYWdlLnN0eWxlLmhlaWdodCA9IGAke21pbldpZHRoICogcmF0aW8gKiBzY2FsZX1weGA7XG4gICAgICAgIC8vIHBhZ2Uuc3R5bGUud2lkdGggPSBgJHttaW5XaWR0aCAqIHNjYWxlfXB4YDtcblxuICAgICAgICBwYWdlLnN0eWxlLmhlaWdodCA9IGAke21heEhlaWdodCAqIHNjYWxlfXB4YDtcbiAgICAgICAgcGFnZS5zdHlsZS53aWR0aCA9IGAke21heEhlaWdodCAqIHNjYWxlIC8gcmF0aW99cHhgO1xuICAgICAgICBwYWdlLmRhdGFzZXQuYmVzdEZpdCA9ICggc2NhbGUgPD0gMSApO1xuXG4gICAgICAgIHNsaWNlX2hlaWdodCA9IHNsaWNlX2hlaWdodCB8fCAoIG1heEhlaWdodCAqIHNjYWxlICk7XG4gICAgICAgIHNsaWNlX3dpZHRoICs9ICggbWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpbyApO1xuXG4gICAgICAgIHBhZ2UuZGF0YXNldC5zZXEgPSBzZXE7XG4gICAgICAgIHBhZ2UuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJwYWdlLXRleHRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiaW5mb1wiPiR7c2VxfTwvZGl2PmA7XG4gICAgICAgIHNsaWNlLmFwcGVuZENoaWxkKHBhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG1ldGEgPSB0aGlzLnNlcnZpY2UubWFuaWZlc3QubWV0YSgxKTtcbiAgICAgICAgdmFyIHJhdGlvID0gbWV0YS5oZWlnaHQgLyBtZXRhLndpZHRoO1xuICAgICAgICBwYWdlLnN0eWxlLmhlaWdodCA9IGAke21heEhlaWdodCAqIHNjYWxlfXB4YDtcbiAgICAgICAgcGFnZS5zdHlsZS53aWR0aCA9IGAke21heEhlaWdodCAqIHNjYWxlIC8gcmF0aW99cHhgO1xuXG4gICAgICAgIHNsaWNlX3dpZHRoICs9ICggbWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpbyApO1xuXG4gICAgICAgIHBhZ2UuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJwYWdlLXRleHRcIj48L2Rpdj48ZGl2IGNsYXNzPVwiaW5mb1wiPk5JTDwvZGl2PmA7XG4gICAgICB9XG4gICAgICBzbGljZS5hcHBlbmRDaGlsZChwYWdlKTtcblxuICAgICAgaWYgKCB0aGlzLnNjYWxlID4gMS4wICkge1xuICAgICAgICBzbGljZS5zdHlsZS5oZWlnaHQgPSBgJHtzbGljZV9oZWlnaHR9cHhgO1xuICAgICAgICBzbGljZS5zdHlsZS53aWR0aCA9IGAke3NsaWNlX3dpZHRoICogMS4yfXB4YDtcbiAgICAgIH1cblxuICAgICAgZWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZWRnZS5jbGFzc0xpc3QuYWRkKCdlZGdlJywgJ3JlY3RvJyk7XG4gICAgICBlZGdlLnN0eWxlLndpZHRoID0gYCR7KCggc2xpY2VzLmxlbmd0aCAtIHNsaWNlX2lkeCApIC8gc2xpY2VzLmxlbmd0aCkgKiBtYXhfZWRnZV93aWR0aH1weGA7XG5cbiAgICAgIGVkZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7c2xpY2VfaGVpZ2h0ICogMC45NX1weGA7IC8vIHRoaXMgaXMgY29tcGxpY2F0ZWRcblxuICAgICAgc2xpY2UuYXBwZW5kQ2hpbGQoZWRnZSk7XG4gICAgICBzbGljZS5xdWVyeVNlbGVjdG9yKCcuZWRnZS52ZXJzbycpLnN0eWxlLmhlaWdodCA9IGVkZ2Uuc3R5bGUuaGVpZ2h0O1xuXG4gICAgICBzbGljZS5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbiAgICAgIHNsaWNlLmRhdGFzZXQuc2xpY2UgPSBzbGljZV9pZHg7XG5cbiAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHNsaWNlKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzX2FjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5sb2FkU2xpY2UodGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignLnNsaWNlJykpO1xuICAgIGlmICggY2IgKSB7XG4gICAgICBjYigpO1xuICAgIH1cbiAgfVxuXG4gIGltYWdlVXJsKHBhcmFtcykge1xuICAgIGlmICggcGFyYW1zIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IHBhcmFtczsgcGFyYW1zID0ge307XG4gICAgICBwYXJhbXMuc2VxID0gZWxlbWVudC5kYXRhc2V0LnNlcTtcbiAgICAgIHBhcmFtcy5oZWlnaHQgPSBlbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2VydmljZS5pbWFnZShwYXJhbXMpO1xuICB9XG5cbiAgbG9hZFNsaWNlKHNsaWNlKSB7XG4gICAgdmFyIHBhZ2VzID0gc2xpY2UucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2VbZGF0YS1zZXFdJyk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmxvYWRJbWFnZShwYWdlc1tpXSwgdHJ1ZSk7XG4gICAgfVxuICAgIHNsaWNlLmRhdGFzZXQudmlzaWJsZSA9IHRydWU7XG4gIH1cblxuICB1bmxvYWRTbGljZShzbGljZSkge1xuXG4gIH1cblxuICBkaXNwbGF5KHNlcSkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnNsaWNlW2RhdGEtdmlzaWJsZT1cInRydWVcIl1gKTtcbiAgICB2YXIgc2xpY2VfaWR4ID0gdGhpcy5zZXEyc2xpY2Vbc2VxXTtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnNsaWNlW2RhdGEtc2xpY2U9XCIke3NsaWNlX2lkeH1cIl1gKTtcbiAgICAvLyB2YXIgdGFyZ2V0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcX1cIl1gKTtcbiAgICBpZiAoICEgdGFyZ2V0ICkgeyByZXR1cm47IH1cblxuICAgIGlmICggY3VycmVudCApIHtcbiAgICAgIGN1cnJlbnQuZGF0YXNldC52aXNpYmxlID0gZmFsc2U7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnVubG9hZFNsaWNlKGN1cnJlbnQpO1xuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIHRhcmdldC5kYXRhc2V0LnZpc2libGUgPSB0cnVlO1xuICAgIHRoaXMubG9hZFNsaWNlKHRhcmdldCk7XG4gICAgLy8gdGhpcy5sb2FkSW1hZ2UodGFyZ2V0LCB0cnVlKTtcbiAgICB0aGlzLnJlYWRlci5lbWl0KCdyZWxvY2F0ZWQnLCB7IHNlcTogdGhpcy5zbGljZTJzZXEoc2xpY2VfaWR4KSB9KTtcbiAgICB0aGlzLmN1cnJlbnRTZXEgPSBzZXE7XG4gIH1cblxuICBzbGljZTJzZXEoc2xpY2VfaWR4KSB7XG4gICAgdmFyIHR1cGxlID0gdGhpcy5zbGljZXNbc2xpY2VfaWR4XTtcbiAgICBpZiAoIHR1cGxlWzBdICkgeyByZXR1cm4gdHVwbGVbMF07IH1cbiAgICByZXR1cm4gdHVwbGVbMV07XG4gIH1cblxuICBjdXJyZW50TG9jYXRpb24oKSB7XG4gICAgcmV0dXJuIDE7XG4gICAgdmFyIGN1cnJlbnRfcGVyY2VudGFnZSA9IDA7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3A7XG4gICAgdmFyIHZpc2libGUgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZVtkYXRhLWxvYWRlZD1cInRydWVcIl0nKTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdmlzaWJsZS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhZ2UgPSB2aXNpYmxlW2ldO1xuICAgICAgdmFyIHBhZ2VfYm91bmRzID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmICggcGFnZS5vZmZzZXRUb3AgPiAoIHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSApIHsgY29udGludWU7IH1cbiAgICAgIGlmICggY3VycmVudF9wZXJjZW50YWdlIDwgMS4wICYmIHBhZ2Uub2Zmc2V0VG9wID49IHNjcm9sbFRvcCAmJiAocGFnZS5vZmZzZXRUb3AgKyBwYWdlX2JvdW5kcy5oZWlnaHQpIDw9IHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSB7XG4gICAgICAgIGN1cnJlbnRfcGVyY2VudGFnZSA9IDEuMDtcbiAgICAgICAgY3VycmVudCA9IHBhZ2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgeTEgPSBNYXRoLmFicyhzY3JvbGxUb3AgLSBwYWdlLm9mZnNldFRvcCk7XG4gICAgICB2YXIgeTIgPSBNYXRoLmFicyggKCBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkgLSAoIHBhZ2Uub2Zmc2V0VG9wICsgcGFnZV9ib3VuZHMuaGVpZ2h0ICkgKTtcbiAgICAgIHZhciBoID0gcGFnZV9ib3VuZHMuaGVpZ2h0IC0geTEgLSB5MjtcbiAgICAgIHZhciBwZXJjZW50YWdlID0gaCAvIGJvdW5kcy5oZWlnaHQ7XG4gICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAwICkgeyBjb250aW51ZTsgfVxuICAgICAgaWYgKCBwZXJjZW50YWdlID4gY3VycmVudF9wZXJjZW50YWdlICkge1xuICAgICAgICBjdXJyZW50X3BlcmNlbnRhZ2UgPSBwZXJjZW50YWdlO1xuICAgICAgICBjdXJyZW50ID0gcGFnZTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBjdXJyZW50TG9jYXRpb25cIiwgcGFnZS5kYXRhc2V0LnNlcSwgcGVyY2VudGFnZSk7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50LmRhdGFzZXQuc2VxO1xuICB9XG5cbiAgbmV4dCgpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgPSAwO1xuICAgIHZhciBkZWx0YSA9IHRoaXMuY3VycmVudFNlcSA9PSAxID8gMSA6IDI7XG4gICAgdGhpcy5kaXNwbGF5KHRoaXMuY3VycmVudFNlcSArIGRlbHRhKTtcbiAgfVxuXG4gIHByZXYoKSB7XG4gICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMDtcbiAgICB2YXIgZGVsdGEgPSAyOyAvLyB0aGlzLmN1cnJlbnRTZXEgPT0gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0LnRvdGFsU2VxID8gMSA6IDI7XG4gICAgdmFyIHNlcSA9IHRoaXMuY3VycmVudFNlcSAtIGRlbHRhO1xuICAgIGlmICggc2VxIDw9IDAgKSB7IHNlcSA9IDE7IH1cbiAgICB0aGlzLmRpc3BsYXkoc2VxKTtcbiAgfVxuXG4gIF9wb3N0UmVzaXplUGFnZShib3VuZHMsIHJlY3QpIHtcbiAgICBpZiAoIHJlY3QuYm90dG9tIDw9IGJvdW5kcy5ib3R0b20gJiYgcmVjdC50b3AgPCAwICkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgZGVsdGEgPSB1cGRhdGVkX3JlY3QuaGVpZ2h0IC0gcmVjdC5oZWlnaHQ7XG4gICAgICAgIGlmICggdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID09IHNjcm9sbFRvcCApIHtcbiAgICAgICAgICAvLyBkZWx0YSAvPSB0aGlzLnNldHRpbmdzLnNjYWxlO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQUhPWSBhZnRlclJlc2l6ZWRcIiwgdmlldy5pbmRleCwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wLCB2aWV3LmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0LCByZWN0LmhlaWdodCwgZGVsdGEgLyB0aGlzLnNldHRpbmdzLnNjYWxlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgKz0gTWF0aC5jZWlsKGRlbHRhKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgYWZ0ZXJSZXNpemVkXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHNjcm9sbFRvcCwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wLCBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIGRvbm90UmVzaXplZFwiLCBwYWdlLmRhdGFzZXQuc2VxLCBzY3JvbGxUb3AsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgZGVsdGEpO1xuICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcyksIDUwMCk7XG4gICAgfVxuICB9XG5cbiAgbWluV2lkdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLm9mZnNldFdpZHRoO1xuICB9XG5cbiAgcHJlbG9hZEltYWdlcyhwYWdlKSB7XG4gICAgdmFyIHNlcSA9IHBhcnNlSW50KHBhZ2UuZGF0YXNldC5zZXEsIDEwKTtcbiAgICB2YXIgZGVsdGEgPSAxO1xuICAgIHdoaWxlICggZGVsdGEgPD0gMiApIHtcbiAgICAgIHZhciBwcmV2X3BhZ2UgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7c2VxIC0gZGVsdGF9XCJdYCk7XG4gICAgICBpZiAoIHByZXZfcGFnZSApIHtcbiAgICAgICAgcHJldl9wYWdlLmRhdGFzZXQucHJlbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sb2FkSW1hZ2UocHJldl9wYWdlLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIGRlbHRhICs9IDE7XG4gICAgfVxuICAgIGRlbHRhID0gMTtcbiAgICB3aGlsZSAoIGRlbHRhIDw9IDIgKSB7XG4gICAgICB2YXIgbmV4dF9wYWdlID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcSArIGRlbHRhfVwiXWApO1xuICAgICAgaWYgKCBuZXh0X3BhZ2UgKSB7XG4gICAgICAgIG5leHRfcGFnZS5kYXRhc2V0LnByZWxvYWRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMubG9hZEltYWdlKG5leHRfcGFnZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICBkZWx0YSArPSAxO1xuICAgIH1cbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgc3VwZXIuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgYmluZFBhZ2VFdmVudHMocGFnZSkge1xuICAgIHBhZ2UucGFyZW50RWxlbWVudC5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgc3VwZXIuZGVzdHJveSgpO1xuICAgIHZhciBwYWdlcyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zbGljZScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQocGFnZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbmZpZygpIHtcbiAgICB2YXIgcmV0dmFsID0gc3VwZXIuY29uZmlnKCk7XG4gICAgcmV0dmFsLnJvdGF0ZSA9IGZhbHNlO1xuICAgIHJldHVybiByZXR2YWw7XG4gIH1cblxufTtcbiIsImltcG9ydCBOYW5vRXZlbnRzIGZyb20gJ25hbm9ldmVudHMnO1xuaW1wb3J0IHtCYXNlfSBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgdmFyIFNpbmdsZSA9IGNsYXNzIGV4dGVuZHMgQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgICB0aGlzLm1vZGUgPSAnaW1hZ2UnO1xuICAgIHRoaXMuZW1iZWRIdG1sID0gdHJ1ZTtcbiAgfVxuXG4gIGRpc3BsYXkoc2VxKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXZpc2libGU9XCJ0cnVlXCJdYCk7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYC5wYWdlW2RhdGEtc2VxPVwiJHtzZXF9XCJdYCk7XG4gICAgaWYgKCAhIHRhcmdldCApIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAoIGN1cnJlbnQgKSB7XG4gICAgICBjdXJyZW50LmRhdGFzZXQudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51bmxvYWRJbWFnZShjdXJyZW50KTtcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9XG5cbiAgICB0YXJnZXQuZGF0YXNldC52aXNpYmxlID0gdHJ1ZTtcbiAgICB0aGlzLmxvYWRJbWFnZSh0YXJnZXQsIHRydWUpO1xuICAgIHRoaXMucmVhZGVyLmVtaXQoJ3JlbG9jYXRlZCcsIHsgc2VxOiB0YXJnZXQuZGF0YXNldC5zZXEgfSk7XG4gICAgdGhpcy5jdXJyZW50U2VxID0gc2VxO1xuICB9XG5cbiAgY3VycmVudExvY2F0aW9uKCkge1xuICAgIHZhciBjdXJyZW50X3BlcmNlbnRhZ2UgPSAwO1xuICAgIHZhciBjdXJyZW50O1xuICAgIHZhciBib3VuZHMgPSB0aGlzLmNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wO1xuICAgIHZhciB2aXNpYmxlID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2VbZGF0YS1sb2FkZWQ9XCJ0cnVlXCJdJyk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHZpc2libGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwYWdlID0gdmlzaWJsZVtpXTtcbiAgICAgIHZhciBwYWdlX2JvdW5kcyA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBpZiAoIHBhZ2Uub2Zmc2V0VG9wID4gKCBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkgKSB7IGNvbnRpbnVlOyB9XG4gICAgICBpZiAoIGN1cnJlbnRfcGVyY2VudGFnZSA8IDEuMCAmJiBwYWdlLm9mZnNldFRvcCA+PSBzY3JvbGxUb3AgJiYgKHBhZ2Uub2Zmc2V0VG9wICsgcGFnZV9ib3VuZHMuaGVpZ2h0KSA8PSBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkge1xuICAgICAgICBjdXJyZW50X3BlcmNlbnRhZ2UgPSAxLjA7XG4gICAgICAgIGN1cnJlbnQgPSBwYWdlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHkxID0gTWF0aC5hYnMoc2Nyb2xsVG9wIC0gcGFnZS5vZmZzZXRUb3ApO1xuICAgICAgdmFyIHkyID0gTWF0aC5hYnMoICggc2Nyb2xsVG9wICsgYm91bmRzLmhlaWdodCApIC0gKCBwYWdlLm9mZnNldFRvcCArIHBhZ2VfYm91bmRzLmhlaWdodCApICk7XG4gICAgICB2YXIgaCA9IHBhZ2VfYm91bmRzLmhlaWdodCAtIHkxIC0geTI7XG4gICAgICB2YXIgcGVyY2VudGFnZSA9IGggLyBib3VuZHMuaGVpZ2h0O1xuICAgICAgaWYgKCBwZXJjZW50YWdlIDwgMCApIHsgY29udGludWU7IH1cbiAgICAgIGlmICggcGVyY2VudGFnZSA+IGN1cnJlbnRfcGVyY2VudGFnZSApIHtcbiAgICAgICAgY3VycmVudF9wZXJjZW50YWdlID0gcGVyY2VudGFnZTtcbiAgICAgICAgY3VycmVudCA9IHBhZ2U7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhcIkFIT1kgY3VycmVudExvY2F0aW9uXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHBlcmNlbnRhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudC5kYXRhc2V0LnNlcTtcbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMDtcbiAgICB0aGlzLmRpc3BsYXkodGhpcy5jdXJyZW50U2VxICsgMSk7XG4gICAgLy8gdmFyIGN1cnJlbnQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7dGhpcy5jdXJyZW50U2VxfVwiXWApO1xuICAgIC8vIHZhciBuZXh0ID0gY3VycmVudC5uZXh0U2libGluZ0VsZW1lbnQ7XG4gICAgLy8gaWYgKCBuZXh0ICkge1xuICAgIC8vICAgdGhpcy5kaXNwbGF5KG5leHQpO1xuICAgIC8vIH1cbiAgfVxuXG4gIHByZXYoKSB7XG4gICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMDtcbiAgICB0aGlzLmRpc3BsYXkodGhpcy5jdXJyZW50U2VxIC0gMSk7XG4gIH1cblxuICBfcG9zdFJlc2l6ZVBhZ2UoYm91bmRzLCByZWN0KSB7XG4gICAgaWYgKCByZWN0LmJvdHRvbSA8PSBib3VuZHMuYm90dG9tICYmIHJlY3QudG9wIDwgMCApIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlbHRhID0gdXBkYXRlZF9yZWN0LmhlaWdodCAtIHJlY3QuaGVpZ2h0O1xuICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCA9PSBzY3JvbGxUb3AgKSB7XG4gICAgICAgICAgLy8gZGVsdGEgLz0gdGhpcy5zZXR0aW5ncy5zY2FsZTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgYWZ0ZXJSZXNpemVkXCIsIHZpZXcuaW5kZXgsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgdmlldy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCwgcmVjdC5oZWlnaHQsIGRlbHRhIC8gdGhpcy5zZXR0aW5ncy5zY2FsZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wICs9IE1hdGguY2VpbChkZWx0YSk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIGFmdGVyUmVzaXplZFwiLCBwYWdlLmRhdGFzZXQuc2VxLCBzY3JvbGxUb3AsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgZGVsdGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBkb25vdFJlc2l6ZWRcIiwgcGFnZS5kYXRhc2V0LnNlcSwgc2Nyb2xsVG9wLCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AsIGRlbHRhKTtcbiAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpLCA1MDApO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVBhZ2VSb3RhdGlvbih0YXJnZXQsIHJvdGF0ZSkge1xuICAgIHZhciBtYXJnaW4gPSAoIHJvdGF0ZSAlIDE4MCA9PSAwICkgPyAwIDogKCB0YXJnZXQub2Zmc2V0SGVpZ2h0IC0gdGFyZ2V0Lm9mZnNldFdpZHRoICkgLyAyO1xuICAgIHRhcmdldC5kYXRhc2V0LnJvdGF0ZSA9IHJvdGF0ZTtcbiAgICB0YXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJy0tcm90YXRlJywgYCR7cm90YXRlfWRlZ2ApO1xuICAgIHRhcmdldC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1yb3RhdGUtbWFyZ2luJywgYC0ke21hcmdpbn1weGApO1xuICAgIHRoaXMucmVhZGVyLnBhZ2VkZXRhaWxzLnJvdGF0ZVt0YXJnZXQuZGF0YXNldC5zZXFdID0gcm90YXRlO1xuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcbiAgICBzdXBlci5iaW5kRXZlbnRzKCk7XG4gICAgdGhpcy5faGFuZGxlcnMucm90YXRlID0gdGhpcy5yZWFkZXIub24oJ3JvdGF0ZScsIGZ1bmN0aW9uKGRlbHRhKSB7XG4gICAgICB2YXIgc2VxID0gc2VsZi5jdXJyZW50TG9jYXRpb24oKTtcbiAgICAgIHZhciB0YXJnZXQgPSBzZWxmLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7c2VxfVwiXWApO1xuICAgICAgdmFyIHJvdGF0ZSA9IHBhcnNlSW50KHRhcmdldC5kYXRhc2V0LnJvdGF0ZSB8fCAwLCAxMCk7XG4gICAgICByb3RhdGUgKz0gZGVsdGE7XG4gICAgICByb3RhdGUgPSByb3RhdGUgJSAzNjA7XG4gICAgICBzZWxmLnVwZGF0ZVBhZ2VSb3RhdGlvbih0YXJnZXQsIHJvdGF0ZSk7XG4gICAgfSk7XG4gIH1cblxuICBiaW5kUGFnZUV2ZW50cyhwYWdlKSB7XG4gICAgcGFnZS5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbiAgICBpZiAoIHRoaXMucmVhZGVyLnBhZ2VkZXRhaWxzLnJvdGF0ZVtwYWdlLmRhdGFzZXQuc2VxXSApIHtcbiAgICAgIHBhZ2UuZGF0YXNldC5yb3RhdGUgPSB0aGlzLnJlYWRlci5wYWdlZGV0YWlscy5yb3RhdGVbcGFnZS5kYXRhc2V0LnNlcV07XG4gICAgICB0aGlzLnVwZGF0ZVBhZ2VSb3RhdGlvbihwYWdlLCBwYWdlLmRhdGFzZXQucm90YXRlKTtcbiAgICB9XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9oYW5kbGVycy5yb3RhdGUoKTtcbiAgICB2YXIgcGFnZXMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQocGFnZXNbaV0pO1xuICAgIH1cbiAgfVxuXG59OyIsImltcG9ydCB7U2Nyb2xsfSBmcm9tICcuL3Njcm9sbCc7XG5pbXBvcnQge1RodW1ibmFpbH0gZnJvbSAnLi90aHVtYm5haWwnO1xuaW1wb3J0IHtTaW5nbGV9IGZyb20gXCIuL2ltYWdlXCI7XG5pbXBvcnQge0ZsaXB9IGZyb20gJy4vZmxpcCc7XG5cbnZhciBWaWV3ID0ge307XG5WaWV3LlNjcm9sbCA9IFNjcm9sbDtcblZpZXcuVGh1bWJuYWlsID0gVGh1bWJuYWlsO1xuVmlldy5TaW5nbGUgPSBTaW5nbGU7XG5WaWV3LkZsaXAgPSBGbGlwO1xuXG5WaWV3LmZvciA9IGZ1bmN0aW9uKHZpZXcpIHtcbiAgaWYgKCB2aWV3ID09ICcxdXAnICkgeyByZXR1cm4gU2Nyb2xsOyB9XG4gIGVsc2UgaWYgKCB2aWV3ID09ICd0aHVtYicgKSB7IHJldHVybiBUaHVtYm5haWw7IH1cbiAgZWxzZSBpZiAoIHZpZXcgPT0gJ2ltYWdlJyApIHsgcmV0dXJuIFNpbmdsZTsgfVxuICBlbHNlIGlmICggdmlldyA9PSAnMnVwJyApIHsgcmV0dXJuIEZsaXA7IH1cbn1cblxuZXhwb3J0IHtWaWV3fTtcbiIsImltcG9ydCBOYW5vRXZlbnRzIGZyb20gJ25hbm9ldmVudHMnO1xuaW1wb3J0IHtCYXNlfSBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgdmFyIFNjcm9sbCA9IGNsYXNzIGV4dGVuZHMgQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgICB0aGlzLm1vZGUgPSAnc2Nyb2xsJztcbiAgICB0aGlzLnBhZ2VPcHRpb25zID0ge307XG4gICAgdGhpcy5lbWJlZEh0bWwgPSB0cnVlO1xuICB9XG5cbiAgZGlzcGxheShzZXEpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcX1cIl1gKTtcbiAgICBpZiAoICEgdGFyZ2V0ICkgeyByZXR1cm47IH1cbiAgICB0YXJnZXQuZGF0YXNldC52aXNpYmxlID0gdHJ1ZTtcbiAgICB0YXJnZXQucGFyZW50Tm9kZS5zY3JvbGxUb3AgPSB0YXJnZXQub2Zmc2V0VG9wIC0gdGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0VG9wO1xuICB9XG5cbiAgaGFuZGxlT2JzZXJ2ZXIoZW50cmllcywgb2JzZXJ2ZXIpIHtcbiAgICB2YXIgY3VycmVudCA9IHsgcGFnZTogbnVsbCwgcmF0aW86IDAgfTtcbiAgICBlbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgdmFyIGRpdiA9IGVudHJ5LnRhcmdldDtcbiAgICAgIHZhciBzZXEgPSBkaXYuZGF0YXNldC5zZXE7XG4gICAgICB2YXIgdmlld2VkID0gZGl2LnF1ZXJ5U2VsZWN0b3IoJ2ltZycpO1xuICAgICAgaWYgKCBlbnRyeS5pc0ludGVyc2VjdGluZyAmJiBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyA+IDAuMCAgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBPQlNFUlZJTkdcIiwgZW50cmllcy5sZW5ndGgsIHNlcSwgJ29uRW50ZXInLCBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyk7XG4gICAgICAgIGlmICggZW50cnkuaW50ZXJzZWN0aW9uUmF0aW8gPiBjdXJyZW50LnJhdGlvICkge1xuICAgICAgICAgIGN1cnJlbnQucmF0aW8gPSBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbztcbiAgICAgICAgICBjdXJyZW50LnBhZ2UgPSBkaXY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAhIHZpZXdlZCApIHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWSU5HXCIsIGVudHJpZXMubGVuZ3RoLCBzZXEsICdvbkVudGVyJyk7XG4gICAgICAgICAgdGhpcy5sb2FkSW1hZ2UoZGl2LCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIGlmICggIGRpdi5kYXRhc2V0LnByZWxvYWRlZCApIHtcbiAgICAgICAgICBkaXYuZGF0YXNldC5wcmVsb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnJlc2l6ZVBhZ2UoZGl2KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICggdmlld2VkICYmICEgZGl2LmRhdGFzZXQucHJlbG9hZGVkICkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWSU5HXCIsIGVudHJpZXMubGVuZ3RoLCBzZXEsICdvbkV4aXQnKTtcbiAgICAgICAgdGhpcy51bmxvYWRJbWFnZShkaXYpO1xuICAgICAgfVxuICAgIH0pXG4gICAgaWYgKCBjdXJyZW50LnBhZ2UgKSB7XG4gICAgICB0aGlzLnJlYWRlci5lbWl0KCdyZWxvY2F0ZWQnLCB7IHNlcTogY3VycmVudC5wYWdlLmRhdGFzZXQuc2VxIH0pO1xuICAgIH1cbiAgfTtcblxuICBjdXJyZW50TG9jYXRpb24oKSB7XG4gICAgdmFyIGN1cnJlbnRfcGVyY2VudGFnZSA9IDA7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3A7XG4gICAgdmFyIHZpc2libGUgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZVtkYXRhLWxvYWRlZD1cInRydWVcIl0nKTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdmlzaWJsZS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhZ2UgPSB2aXNpYmxlW2ldO1xuICAgICAgdmFyIHBhZ2VfYm91bmRzID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmICggcGFnZS5vZmZzZXRUb3AgPiAoIHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSApIHsgY29udGludWU7IH1cbiAgICAgIGlmICggY3VycmVudF9wZXJjZW50YWdlIDwgMS4wICYmIHBhZ2Uub2Zmc2V0VG9wID49IHNjcm9sbFRvcCAmJiAocGFnZS5vZmZzZXRUb3AgKyBwYWdlX2JvdW5kcy5oZWlnaHQpIDw9IHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSB7XG4gICAgICAgIGN1cnJlbnRfcGVyY2VudGFnZSA9IDEuMDtcbiAgICAgICAgY3VycmVudCA9IHBhZ2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgeTEgPSBNYXRoLmFicyhzY3JvbGxUb3AgLSBwYWdlLm9mZnNldFRvcCk7XG4gICAgICB2YXIgeTIgPSBNYXRoLmFicyggKCBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkgLSAoIHBhZ2Uub2Zmc2V0VG9wICsgcGFnZV9ib3VuZHMuaGVpZ2h0ICkgKTtcbiAgICAgIHZhciBoID0gcGFnZV9ib3VuZHMuaGVpZ2h0IC0geTEgLSB5MjtcbiAgICAgIHZhciBwZXJjZW50YWdlID0gaCAvIGJvdW5kcy5oZWlnaHQ7XG4gICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAwICkgeyBjb250aW51ZTsgfVxuICAgICAgaWYgKCBwZXJjZW50YWdlID4gY3VycmVudF9wZXJjZW50YWdlICkge1xuICAgICAgICBjdXJyZW50X3BlcmNlbnRhZ2UgPSBwZXJjZW50YWdlO1xuICAgICAgICBjdXJyZW50ID0gcGFnZTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBjdXJyZW50TG9jYXRpb25cIiwgcGFnZS5kYXRhc2V0LnNlcSwgcGVyY2VudGFnZSk7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50LmRhdGFzZXQuc2VxO1xuICB9XG5cbiAgbmV4dCgpIHtcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wO1xuICAgIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCArPSB0aGlzLmNvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XG4gIH1cblxuICBwcmV2KCkge1xuICAgIGlmICggdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID09IDAgKSB7IHJldHVybiA7IH1cbiAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgLT0gdGhpcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0O1xuICB9XG5cbiAgX3Bvc3RSZXNpemVQYWdlKGJvdW5kcywgcmVjdCkge1xuICAgIGlmICggcmVjdC5ib3R0b20gPD0gYm91bmRzLmJvdHRvbSAmJiByZWN0LnRvcCA8IDAgKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWx0YSA9IHVwZGF0ZWRfcmVjdC5oZWlnaHQgLSByZWN0LmhlaWdodDtcbiAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgPT0gc2Nyb2xsVG9wICkge1xuICAgICAgICAgIC8vIGRlbHRhIC89IHRoaXMuc2V0dGluZ3Muc2NhbGU7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJBSE9ZIGFmdGVyUmVzaXplZFwiLCB2aWV3LmluZGV4LCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AsIHZpZXcuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQsIHJlY3QuaGVpZ2h0LCBkZWx0YSAvIHRoaXMuc2V0dGluZ3Muc2NhbGUpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCArPSBNYXRoLmNlaWwoZGVsdGEpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBhZnRlclJlc2l6ZWRcIiwgcGFnZS5kYXRhc2V0LnNlcSwgc2Nyb2xsVG9wLCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AsIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgZG9ub3RSZXNpemVkXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHNjcm9sbFRvcCwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wLCBkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSwgNTAwKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVQYWdlUm90YXRpb24odGFyZ2V0LCByb3RhdGUpIHtcbiAgICAvLyB2YXIgbWFyZ2luID0gKCByb3RhdGUgJSAxODAgPT0gMCApID8gMCA6ICggdGFyZ2V0Lm9mZnNldEhlaWdodCAtIHRhcmdldC5vZmZzZXRXaWR0aCApIC8gMjtcbiAgICAvLyB0YXJnZXQuZGF0YXNldC5yb3RhdGUgPSByb3RhdGU7XG4gICAgLy8gdGFyZ2V0LnN0eWxlLnNldFByb3BlcnR5KCctLXJvdGF0ZScsIGAke3JvdGF0ZX1kZWdgKTtcbiAgICAvLyB0YXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJy0tcm90YXRlLW1hcmdpbicsIGAtJHttYXJnaW59cHggJHttYXJnaW59cHhgKTtcbiAgICB0aGlzLnJlYWRlci5wYWdlZGV0YWlscy5yb3RhdGVbdGFyZ2V0LmRhdGFzZXQuc2VxXSA9IHJvdGF0ZTtcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc3VwZXIuYmluZEV2ZW50cygpO1xuICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIodGhpcy5oYW5kbGVPYnNlcnZlci5iaW5kKHRoaXMpLCB7XG4gICAgICAgIHJvb3Q6IHRoaXMuY29udGFpbmVyLFxuICAgICAgICByb290TWFyZ2luOiAnMHB4JyxcbiAgICAgICAgdGhyZXNob2xkOiBbMCwgMC4xLCAwLjIsIDAuMywgMC40LCAwLjUsIDAuNiwgMC43LCAwLjgsIDAuOSwgMV1cbiAgICB9KTtcblxuICAgIHRoaXMuX2hhbmRsZXJzLnJvdGF0ZSA9IHRoaXMucmVhZGVyLm9uKCdyb3RhdGUnLCBmdW5jdGlvbihkZWx0YSkge1xuICAgICAgdmFyIHNlcSA9IHNlbGYuY3VycmVudExvY2F0aW9uKCk7XG4gICAgICBzZWxmLnNlcnZpY2UubWFuaWZlc3Qucm90YXRlQnkoc2VxLCBkZWx0YSk7XG4gICAgICBzZWxmLnJlZHJhd1BhZ2Uoc2VxKTtcbiAgICB9KTtcbiAgfVxuXG4gIGJpbmRQYWdlRXZlbnRzKHBhZ2UpIHtcbiAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUocGFnZSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9oYW5kbGVycy5yb3RhdGUoKTtcbiAgICB2YXIgcGFnZXMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5vYnNlcnZlci51bm9ic2VydmUocGFnZXNbaV0pO1xuICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQocGFnZXNbaV0pO1xuICAgIH1cbiAgICB0aGlzLm9ic2VydmVyID0gbnVsbDtcbiAgfVxuXG59O1xuIiwiaW1wb3J0IHtTY3JvbGx9IGZyb20gJy4vc2Nyb2xsJztcblxuZXhwb3J0IHZhciBUaHVtYm5haWwgPSBjbGFzcyBleHRlbmRzIFNjcm9sbCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgICB0aGlzLm1vZGUgPSAndGh1bWJuYWlsJztcbiAgICAvLyB0aGlzLnNjYWxlID0gMC4yNTtcbiAgICB0aGlzLnNjYWxlID0gMS4wO1xuICAgIHRoaXMuZW1iZWRIdG1sID0gZmFsc2U7XG4gIH1cblxuICBpbWFnZVVybChwYXJhbXMpIHtcbiAgICBpZiAoIHBhcmFtcyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICkge1xuICAgICAgdmFyIGVsZW1lbnQgPSBwYXJhbXM7IHBhcmFtcyA9IHt9O1xuICAgICAgcGFyYW1zLnNlcSA9IGVsZW1lbnQuZGF0YXNldC5zZXE7XG4gICAgICBwYXJhbXMud2lkdGggPSBlbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnRodW1ibmFpbChwYXJhbXMpO1xuICB9XG5cbiAgbWluV2lkdGgoKSB7XG4gICAgLy8gYmVzdCBndWVzc1xuICAgIHJldHVybiAxNjA7XG4gIH1cblxuICBiaW5kUGFnZUV2ZW50cyhwYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHN1cGVyLmJpbmRQYWdlRXZlbnRzKHBhZ2UpO1xuICAgIHBhZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgY29uc29sZS5sb2coXCJBSE9ZIENMSUNLXCIsIHRoaXMuZGF0YXNldC5zZXEpO1xuICAgICAgc2VsZi5yZWFkZXIucmVzdGFydCh7IHZpZXc6ICcxdXAnLCBzZXE6IHRoaXMuZGF0YXNldC5zZXEgfSk7XG4gICAgfSlcbiAgfVxuXG4gIGNvbmZpZygpIHtcbiAgICB2YXIgcmV0dmFsID0gc3VwZXIuY29uZmlnKCk7XG4gICAgcmV0dmFsLnpvb20gPSBmYWxzZTtcbiAgICByZXR2YWwucm90YXRlID0gZmFsc2U7XG4gICAgcmV0dXJuIHJldHZhbDtcbiAgfVxuXG59OyIsIlxuaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5pbXBvcnQge0NvbnRyb2x9IGZyb20gJy4vY29tcG9uZW50cy9jb250cm9scyc7XG5pbXBvcnQge1NlcnZpY2V9IGZyb20gJy4vY29tcG9uZW50cy9pbWdzcnYnO1xuaW1wb3J0IHtWaWV3fSBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MnO1xuXG52YXIgSFQgPSB3aW5kb3cuSFQgfHwge307IHdpbmRvdy5IVCA9IEhUO1xudmFyICRtYWluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpO1xudmFyICR2aWV3ZXIgPSAkbWFpbi5xdWVyeVNlbGVjdG9yKCcudmlld2VyJyk7XG52YXIgJGlubmVyID0gJHZpZXdlci5xdWVyeVNlbGVjdG9yKCcudmlld2VyLWlubmVyJyk7XG5cbnZhciAkdG9vbGJhciA9ICRtYWluLnF1ZXJ5U2VsZWN0b3IoJyN0b29sYmFyLXZlcnRpY2FsJyk7XG5cbnZhciBtaW5faGVpZ2h0ID0gJHZpZXdlci5vZmZzZXRIZWlnaHQ7XG52YXIgbWluX3dpZHRoID0gJHZpZXdlci5vZmZzZXRXaWR0aCAqIDAuODA7XG5cbi8vIGlmICggJG1haW4uZGF0YXNldC52aWV3ID09ICd0aHVtYm5haWwnICkge1xuLy8gICBzY2FsZSA9IDAuMjU7XG4vLyB9XG5cbnZhciBSZWFkZXIgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHsgc2NhbGU6IDEuMCB9LCBvcHRpb25zKTtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuY29udHJvbHMgPSB7fTtcbiAgICB0aGlzLnBhZ2VkZXRhaWxzID0geyByb3RhdGU6IHt9LCBzY2FsZToge30gfTtcbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgfVxuXG4gIHN0YXJ0KHBhcmFtcywgY2IpIHtcbiAgICBpZiAoIGNiID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBjYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZpZXcuZGlzcGxheShwYXJhbXMuc2VxIHx8IDEpO1xuICAgICAgfS5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBpZiAoIHBhcmFtcy52aWV3ICkge1xuICAgICAgJG1haW4uZGF0YXNldC52aWV3ID0gcGFyYW1zLnZpZXc7XG4gICAgfVxuICAgIGlmICggcGFyYW1zLnNjYWxlICkgeyB0aGlzLm9wdGlvbnMuc2NhbGUgPSBwYXJhbXMuc2NhbGU7IH1cbiAgICB0aGlzLnNldFZpZXcoeyB2aWV3OiAkbWFpbi5kYXRhc2V0LnZpZXcgfSk7XG4gICAgdGhpcy52aWV3LmF0dGFjaFRvKCRpbm5lciwgY2IpO1xuICB9XG5cbiAgcmVzdGFydChwYXJhbXMpIHtcbiAgICB2YXIgY3VycmVudCA9IHBhcmFtcy5zZXEgfHwgdGhpcy52aWV3LmN1cnJlbnRMb2NhdGlvbigpO1xuICAgIGlmICggdGhpcy52aWV3ICkgeyB0aGlzLnZpZXcuZGVzdHJveSgpOyB0aGlzLnZpZXcgPSBudWxsOyB9XG4gICAgdGhpcy5zdGFydChwYXJhbXMsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy52aWV3LmRpc3BsYXkoY3VycmVudCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHNldFZpZXcocGFyYW1zKSB7XG4gICAgdmFyIGNscyA9IFZpZXcuZm9yKHBhcmFtcy52aWV3KTtcbiAgICB0aGlzLnZpZXcgPSBuZXcgY2xzKHsgcmVhZGVyOiB0aGlzLCBzZXJ2aWNlOiB0aGlzLnNlcnZpY2UsIHNjYWxlOiB0aGlzLm9wdGlvbnMuc2NhbGUgfSk7XG4gICAgdGhpcy5lbWl0KCdjb25maWd1cmUnLCB0aGlzLnZpZXcuY29uZmlnKCkpO1xuICB9XG5cbiAgbmV4dCgpIHtcbiAgICB0aGlzLnZpZXcubmV4dCgpO1xuICB9XG5cbiAgcHJldigpIHtcbiAgICB0aGlzLnZpZXcucHJldigpO1xuICB9XG5cbiAgZmlyc3QoKSB7XG4gICAgdGhpcy52aWV3LmRpc3BsYXkoMSk7XG4gIH1cblxuICBsYXN0KCkge1xuICAgIHRoaXMudmlldy5kaXNwbGF5KHRoaXMuc2VydmljZS5tYW5pZmVzdC50b3RhbFNlcSk7XG4gIH1cblxuICBvbigpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uLmFwcGx5KHRoaXMuZW1pdHRlciwgYXJndW1lbnRzKVxuICB9XG5cbiAgZW1pdChldmVudCwgcGFyYW1zPXt9KSB7XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoZXZlbnQsIHBhcmFtcyk7XG4gIH1cblxuICBiaW5kRXZlbnRzKCkge1xuICAgIC8qIE5PT1AgKi9cbiAgfVxuXG59XG5cbnZhciBzZXJ2aWNlID0gbmV3IFNlcnZpY2Uoe1xuICBtYW5pZmVzdDoge1xuICAgIHRvdGFsU2VxOiAkbWFpbi5kYXRhc2V0LnRvdGFsU2VxLFxuICAgIGRlZmF1bHRTZXE6ICRtYWluLmRhdGFzZXQuZGVmYXVsdFNlcSxcbiAgICBmaXJzdFNlcTogJG1haW4uZGF0YXNldC5maXJzdFNlcSxcbiAgICBkZWZhdWx0SGVpZ2h0OiAkbWFpbi5kYXRhc2V0LmRlZmF1bHRIZWlnaHQsXG4gICAgZGVmYXVsdFdpZHRoOiAkbWFpbi5kYXRhc2V0LmRlZmF1bHRXaWR0aCxcbiAgICBmZWF0dXJlTGlzdDogSlNPTi5wYXJzZSgkbWFpbi5kYXRhc2V0LmZlYXR1cmVMaXN0KVxuICB9LFxuICBpZGVudGlmaWVyOiBIVC5wYXJhbXMuaWRcbn0pXG5IVC5zZXJ2aWNlID0gc2VydmljZTtcblxudmFyIHJlYWRlciA9IG5ldyBSZWFkZXIoeyBpZGVudGlmaWVyOiBIVC5wYXJhbXMuaWQgfSk7XG5yZWFkZXIuc2VydmljZSA9IHNlcnZpY2U7XG5IVC5yZWFkZXIgPSByZWFkZXI7XG5IVC5WaWV3ID0gVmlldztcblxudmFyIGlzX2FjdGl2ZSA9IGZhbHNlO1xudmFyIHNjYWxlID0gMC43NTtcbnZhciBpbWFnZV93aWR0aCA9IDY4MDtcblxucmVhZGVyLmNvbnRyb2xzLm5hdmlnYXRvciA9IG5ldyBDb250cm9sLk5hdmlnYXRvcih7XG4gIGlucHV0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwicmFuZ2VcIl0nKSxcbiAgb3V0cHV0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2aWdhdG9yIC5vdXRwdXQnKSxcbiAgcmVhZGVyOiByZWFkZXJcbn0pXG5cbnJlYWRlci5jb250cm9scy5wYWdpbmF0b3IgPSBuZXcgQ29udHJvbC5QYWdpbmF0b3Ioe1xuICBpbnB1dDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Rvb2xiYXItaG9yaXpvbnRhbCcpLFxuICByZWFkZXI6IHJlYWRlclxufSk7XG5cbnJlYWRlci5jb250cm9scy52aWV3aW5hdG9yID0gbmV3IENvbnRyb2wuVmlld2luYXRvcih7XG4gIGlucHV0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWN0aW9uLXZpZXdzJyksXG4gIHJlYWRlcjogcmVhZGVyXG59KTtcblxucmVhZGVyLmNvbnRyb2xzLm5hdmlnYXRvci5vbigndXBkYXRlTG9jYXRpb24nLCAocGFyYW1zKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSB1cGRhdGVMb2NhdGlvblwiLCBwYXJhbXMuc2VxKTtcbiAgcmVhZGVyLnZpZXcuZGlzcGxheShwYXJhbXMuc2VxKTtcbn0pXG5cbnJlYWRlci5jb250cm9scy56b29taW5hdG9yID0gbmV3IENvbnRyb2wuWm9vbWluYXRvcih7XG4gIGlucHV0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWN0aW9uLXpvb20nKSxcbiAgcmVhZGVyOiByZWFkZXJcbn0pXG5cbnJlYWRlci5jb250cm9scy5yb3RhdG9yID0gbmV3IENvbnRyb2wuUm90YXRvcih7XG4gIGlucHV0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWN0aW9uLXJvdGF0ZScpLFxuICByZWFkZXI6IHJlYWRlclxufSlcbnJlYWRlci5jb250cm9scy5yb3RhdG9yLm9uKCdyb3RhdGUnLCBmdW5jdGlvbihkZWx0YSkge1xuICAvLyB2YXIgc2VxID0gdGhpcy52aWV3LmN1cnJlbnRMb2NhdGlvbigpO1xuICAvLyB2YXIgcm90YXRlID0gdGhpcy5wYWdlZGV0YWlscy5yb3RhdGVbc2VxXSB8fCAwO1xuICAvLyByb3RhdGUgPSAoIHJvdGF0ZSArIGRlbHRhICkgJSAzNjA7XG4gIC8vIHRoaXMucGFnZWRldGFpbHMucm90YXRlW3NlcV0gPSByb3RhdGU7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBjb250cm9scy5yb3RhdG9yXCIsIGRlbHRhKTtcbiAgdGhpcy5lbWl0KCdyb3RhdGUnLCBkZWx0YSk7XG59LmJpbmQocmVhZGVyKSlcblxucmVhZGVyLnN0YXJ0KHsgdmlldzogJzF1cCcsIHNlcTogMTAgfSk7XG5cblxuXG5cbiJdLCJzb3VyY2VSb290IjoiIn0=