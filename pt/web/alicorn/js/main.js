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

/***/ "./node_modules/lodash/_Symbol.js":
/*!****************************************!*\
  !*** ./node_modules/lodash/_Symbol.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(/*! ./_root */ "./node_modules/lodash/_root.js");

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;


/***/ }),

/***/ "./node_modules/lodash/_baseGetTag.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_baseGetTag.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Symbol = __webpack_require__(/*! ./_Symbol */ "./node_modules/lodash/_Symbol.js"),
    getRawTag = __webpack_require__(/*! ./_getRawTag */ "./node_modules/lodash/_getRawTag.js"),
    objectToString = __webpack_require__(/*! ./_objectToString */ "./node_modules/lodash/_objectToString.js");

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;


/***/ }),

/***/ "./node_modules/lodash/_freeGlobal.js":
/*!********************************************!*\
  !*** ./node_modules/lodash/_freeGlobal.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/lodash/_getRawTag.js":
/*!*******************************************!*\
  !*** ./node_modules/lodash/_getRawTag.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var Symbol = __webpack_require__(/*! ./_Symbol */ "./node_modules/lodash/_Symbol.js");

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;


/***/ }),

/***/ "./node_modules/lodash/_objectToString.js":
/*!************************************************!*\
  !*** ./node_modules/lodash/_objectToString.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;


/***/ }),

/***/ "./node_modules/lodash/_root.js":
/*!**************************************!*\
  !*** ./node_modules/lodash/_root.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var freeGlobal = __webpack_require__(/*! ./_freeGlobal */ "./node_modules/lodash/_freeGlobal.js");

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;


/***/ }),

/***/ "./node_modules/lodash/debounce.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/debounce.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(/*! ./isObject */ "./node_modules/lodash/isObject.js"),
    now = __webpack_require__(/*! ./now */ "./node_modules/lodash/now.js"),
    toNumber = __webpack_require__(/*! ./toNumber */ "./node_modules/lodash/toNumber.js");

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = debounce;


/***/ }),

/***/ "./node_modules/lodash/isObject.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/isObject.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;


/***/ }),

/***/ "./node_modules/lodash/isObjectLike.js":
/*!*********************************************!*\
  !*** ./node_modules/lodash/isObjectLike.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;


/***/ }),

/***/ "./node_modules/lodash/isSymbol.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/isSymbol.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var baseGetTag = __webpack_require__(/*! ./_baseGetTag */ "./node_modules/lodash/_baseGetTag.js"),
    isObjectLike = __webpack_require__(/*! ./isObjectLike */ "./node_modules/lodash/isObjectLike.js");

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;


/***/ }),

/***/ "./node_modules/lodash/now.js":
/*!************************************!*\
  !*** ./node_modules/lodash/now.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var root = __webpack_require__(/*! ./_root */ "./node_modules/lodash/_root.js");

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

module.exports = now;


/***/ }),

/***/ "./node_modules/lodash/toNumber.js":
/*!*****************************************!*\
  !*** ./node_modules/lodash/toNumber.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(/*! ./isObject */ "./node_modules/lodash/isObject.js"),
    isSymbol = __webpack_require__(/*! ./isSymbol */ "./node_modules/lodash/isSymbol.js");

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;


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

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


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
/* harmony import */ var lodash_debounce__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash/debounce */ "./node_modules/lodash/debounce.js");
/* harmony import */ var lodash_debounce__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash_debounce__WEBPACK_IMPORTED_MODULE_2__);





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

    // return;

    var maxHeight = this.container.offsetHeight * 0.95;
    console.log("AHOY AHOY", maxHeight);
    this.container.style.setProperty('--page-height', `${maxHeight * this.scale}px`);
    this.container.style.setProperty('--slice-width', `${this.container.offsetWidth * this.scale}px`);

    var max_edge_width = 0;
    var max_slice_width = 0;

    var scale = this.scale;

    // group into pages
    var slices = this.slices;

    for(var slice_idx = 0; slice_idx < slices.length; slice_idx++ ) {
      var tuple = slices[slice_idx];

      var slice = document.createElement('div');
      slice.classList.add('slice');

      var edge = document.createElement('div');
      edge.classList.add('edge', 'verso');
      edge.style.setProperty('--fraction', slice_idx / slices.length);
      // edge.style.width = `${(slice_idx / slices.length) * max_edge_width}px`;
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

        page.style.setProperty('--page-ratio', meta.width / meta.height);
        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;

        slice_height = maxHeight * scale;
        slice_width = maxHeight * scale / ratio;

        page.dataset.bestFit = ( scale <= 1 );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;
        page.style.setProperty('--page-ratio', meta.width / meta.height);

        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;

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

        page.style.setProperty('--page-ratio', meta.width / meta.height);

        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;
        page.dataset.bestFit = ( scale <= 1 );

        slice_height = slice_height || ( maxHeight * scale );
        slice_width += ( maxHeight * scale / ratio );

        page.dataset.seq = seq;
        page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
        slice.appendChild(page);
      } else {
        var meta = this.service.manifest.meta(1);
        var ratio = meta.height / meta.width;

        page.style.setProperty('--page-ratio', meta.width / meta.height);

        // page.style.height = `${maxHeight * scale}px`;
        // page.style.width = `${maxHeight * scale / ratio}px`;

        slice_width += ( maxHeight * scale / ratio );

        page.innerHTML = `<div class="page-text"></div><div class="info">NIL</div>`;
      }
      slice.appendChild(page);

      if ( this.scale > 1.0 ) {
        // slice.style.height = `${slice_height}px`;
        // slice.style.width = `${slice_width * 1.2}px`;
        // slice.style.width = `${this.`
      }

      if ( max_slice_width < slice_width ) {
        max_slice_width = slice_width;
      }

      edge = document.createElement('div');
      edge.classList.add('edge', 'recto');
      edge.style.setProperty('--fraction', (( slices.length - slice_idx ) / slices.length));

      // edge.style.width = `${(( slices.length - slice_idx ) / slices.length) * max_edge_width}px`;
      // edge.style.height = `${slice_height * 0.95}px`; // this is complicated

      slice.appendChild(edge);
      // slice.querySelector('.edge.verso').style.height = edge.style.height;

      slice.dataset.visible = false;
      slice.dataset.slice = slice_idx;

      this.container.appendChild(slice);
    }

    var max_edge_width = ( ( this.container.offsetWidth - ( max_slice_width / this.scale ) ) * 0.85 ) / 2;
    var page_factor = 10;
    var edge_width = 3 * Math.ceil(this.service.manifest.totalSeq / page_factor);
    if ( edge_width > max_edge_width ) { edge_width = max_edge_width; }
    this.container.style.setProperty('--edge-width', `${edge_width}px`);

    this.is_active = true;
    this.loadSlice(this.container.querySelector('.slice'));
    if ( cb ) {
      cb();
    }

    console.log("AHOY AHOY RENDER", this.container.offsetHeight);
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

  resizePage(page) {
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
    var slice = this.container.querySelector('.slice[data-visible="true"]');
    var page = slice.querySelector('.page[data-seq]');
    return page.dataset.seq;
  }

  currentLocationXX() {
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
    var self = this;

    super.bindEvents();

    this._resizer = lodash_debounce__WEBPACK_IMPORTED_MODULE_2___default()(function() {
      self.container.style.setProperty('--page-height', `${self.container.offsetHeight * 0.95 * self.scale}px`);
      self.container.style.setProperty('--slice-width', `${self.container.offsetWidth * self.scale}px`)
      console.log("AHOY flip.resize", self.container.style.getPropertyValue('--page-height'));
    }, 50);

    window.addEventListener('resize', this._resizer);

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
    window.removeEventListener('resize', this._resizer);
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
console.log("AHOY AHOY $inner", $inner.offsetHeight);

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
      console.log("AHOY AHOY $inner.view", $inner.offsetHeight);
      setTimeout(function() {
        console.log("AHOY AHOY $inner.view later", $inner.offsetHeight);
      }, 2000);
    }
    if ( params.scale ) { this.options.scale = params.scale; }
    this.setView({ view: $main.dataset.view });
    setTimeout(function() {
      console.log("AHOY AHOY $inner.view timeout", $inner.offsetHeight);
      this.view.attachTo($inner, cb);
    }.bind(this), 0);
  }

  restart(params) {
    var current = params.seq || this.view.currentLocation();
    if ( this.view ) { this.view.destroy(); this.view = null; }
    this.start(params, function() {
      console.log("AHOY TRYING TO GO TO", current);
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

reader.start({ view: '2up', seq: 10 });






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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2ludGVyc2VjdGlvbi1vYnNlcnZlci9pbnRlcnNlY3Rpb24tb2JzZXJ2ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Jhc2VHZXRUYWcuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fZnJlZUdsb2JhbC5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbG9kYXNoL19nZXRSYXdUYWcuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fb2JqZWN0VG9TdHJpbmcuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fcm9vdC5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbG9kYXNoL2RlYm91bmNlLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9sb2Rhc2gvaXNPYmplY3QuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdExpa2UuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc1N5bWJvbC5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbG9kYXNoL25vdy5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbG9kYXNoL3RvTnVtYmVyLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9uYW5vZXZlbnRzL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9uYW5vZXZlbnRzL3VuYmluZC1hbGwuanMiLCJ3ZWJwYWNrOi8vLyh3ZWJwYWNrKS9idWlsZGluL2dsb2JhbC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy9jb250cm9scy9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy9jb250cm9scy9uYXZpZ2F0b3IuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvY29udHJvbHMvcGFnaW5hdG9yLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL2NvbnRyb2xzL3JvdGF0b3IuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvY29udHJvbHMvdmlld2luYXRvci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy9jb250cm9scy96b29taW5hdG9yLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL2ltZ3Nydi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvY29tcG9uZW50cy92aWV3cy9iYXNlLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL3ZpZXdzL2ZsaXAuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvdmlld3MvaW1hZ2UuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvdmlld3MvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2pzL2NvbXBvbmVudHMvdmlld3Mvc2Nyb2xsLmpzIiwid2VicGFjazovLy8uL3NyYy9qcy9jb21wb25lbnRzL3ZpZXdzL3RodW1ibmFpbC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvanMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxrREFBMEMsZ0NBQWdDO0FBQzFFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsZ0VBQXdELGtCQUFrQjtBQUMxRTtBQUNBLHlEQUFpRCxjQUFjO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLFdBQVcsT0FBTztBQUNsQjtBQUNBLFlBQVksUUFBUTtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0EsWUFBWSxPQUFPO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFlBQVksT0FBTztBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLDJCQUEyQjtBQUN0QztBQUNBLFdBQVcsMEJBQTBCO0FBQ3JDO0FBQ0EsWUFBWSxRQUFRO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztB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LENBQUM7O0FBRUQsOEJBQThCLDREQUFPO0FBQ3JDO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVELGNBQWMsdUJBQXVCIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG4iLCIvKipcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFczQyBTT0ZUV0FSRSBBTkQgRE9DVU1FTlQgTk9USUNFIEFORCBMSUNFTlNFLlxuICpcbiAqICBodHRwczovL3d3dy53My5vcmcvQ29uc29ydGl1bS9MZWdhbC8yMDE1L2NvcHlyaWdodC1zb2Z0d2FyZS1hbmQtZG9jdW1lbnRcbiAqXG4gKi9cblxuKGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpIHtcbid1c2Ugc3RyaWN0JztcblxuXG4vLyBFeGl0cyBlYXJseSBpZiBhbGwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgYW5kIEludGVyc2VjdGlvbk9ic2VydmVyRW50cnlcbi8vIGZlYXR1cmVzIGFyZSBuYXRpdmVseSBzdXBwb3J0ZWQuXG5pZiAoJ0ludGVyc2VjdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cgJiZcbiAgICAnSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeScgaW4gd2luZG93ICYmXG4gICAgJ2ludGVyc2VjdGlvblJhdGlvJyBpbiB3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeS5wcm90b3R5cGUpIHtcblxuICAvLyBNaW5pbWFsIHBvbHlmaWxsIGZvciBFZGdlIDE1J3MgbGFjayBvZiBgaXNJbnRlcnNlY3RpbmdgXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3czYy9JbnRlcnNlY3Rpb25PYnNlcnZlci9pc3N1ZXMvMjExXG4gIGlmICghKCdpc0ludGVyc2VjdGluZycgaW4gd2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyRW50cnkucHJvdG90eXBlKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeS5wcm90b3R5cGUsXG4gICAgICAnaXNJbnRlcnNlY3RpbmcnLCB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJzZWN0aW9uUmF0aW8gPiAwO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybjtcbn1cblxuXG4vKipcbiAqIEFuIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5LiBUaGlzIHJlZ2lzdHJ5IGV4aXN0cyB0byBob2xkIGEgc3Ryb25nXG4gKiByZWZlcmVuY2UgdG8gSW50ZXJzZWN0aW9uT2JzZXJ2ZXIgaW5zdGFuY2VzIGN1cnJlbnRseSBvYnNlcnZpbmcgYSB0YXJnZXRcbiAqIGVsZW1lbnQuIFdpdGhvdXQgdGhpcyByZWdpc3RyeSwgaW5zdGFuY2VzIHdpdGhvdXQgYW5vdGhlciByZWZlcmVuY2UgbWF5IGJlXG4gKiBnYXJiYWdlIGNvbGxlY3RlZC5cbiAqL1xudmFyIHJlZ2lzdHJ5ID0gW107XG5cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBnbG9iYWwgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeSBjb25zdHJ1Y3Rvci5cbiAqIGh0dHBzOi8vdzNjLmdpdGh1Yi5pby9JbnRlcnNlY3Rpb25PYnNlcnZlci8jaW50ZXJzZWN0aW9uLW9ic2VydmVyLWVudHJ5XG4gKiBAcGFyYW0ge09iamVjdH0gZW50cnkgQSBkaWN0aW9uYXJ5IG9mIGluc3RhbmNlIHByb3BlcnRpZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeShlbnRyeSkge1xuICB0aGlzLnRpbWUgPSBlbnRyeS50aW1lO1xuICB0aGlzLnRhcmdldCA9IGVudHJ5LnRhcmdldDtcbiAgdGhpcy5yb290Qm91bmRzID0gZW50cnkucm9vdEJvdW5kcztcbiAgdGhpcy5ib3VuZGluZ0NsaWVudFJlY3QgPSBlbnRyeS5ib3VuZGluZ0NsaWVudFJlY3Q7XG4gIHRoaXMuaW50ZXJzZWN0aW9uUmVjdCA9IGVudHJ5LmludGVyc2VjdGlvblJlY3QgfHwgZ2V0RW1wdHlSZWN0KCk7XG4gIHRoaXMuaXNJbnRlcnNlY3RpbmcgPSAhIWVudHJ5LmludGVyc2VjdGlvblJlY3Q7XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgaW50ZXJzZWN0aW9uIHJhdGlvLlxuICB2YXIgdGFyZ2V0UmVjdCA9IHRoaXMuYm91bmRpbmdDbGllbnRSZWN0O1xuICB2YXIgdGFyZ2V0QXJlYSA9IHRhcmdldFJlY3Qud2lkdGggKiB0YXJnZXRSZWN0LmhlaWdodDtcbiAgdmFyIGludGVyc2VjdGlvblJlY3QgPSB0aGlzLmludGVyc2VjdGlvblJlY3Q7XG4gIHZhciBpbnRlcnNlY3Rpb25BcmVhID0gaW50ZXJzZWN0aW9uUmVjdC53aWR0aCAqIGludGVyc2VjdGlvblJlY3QuaGVpZ2h0O1xuXG4gIC8vIFNldHMgaW50ZXJzZWN0aW9uIHJhdGlvLlxuICBpZiAodGFyZ2V0QXJlYSkge1xuICAgIC8vIFJvdW5kIHRoZSBpbnRlcnNlY3Rpb24gcmF0aW8gdG8gYXZvaWQgZmxvYXRpbmcgcG9pbnQgbWF0aCBpc3N1ZXM6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3czYy9JbnRlcnNlY3Rpb25PYnNlcnZlci9pc3N1ZXMvMzI0XG4gICAgdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA9IE51bWJlcigoaW50ZXJzZWN0aW9uQXJlYSAvIHRhcmdldEFyZWEpLnRvRml4ZWQoNCkpO1xuICB9IGVsc2Uge1xuICAgIC8vIElmIGFyZWEgaXMgemVybyBhbmQgaXMgaW50ZXJzZWN0aW5nLCBzZXRzIHRvIDEsIG90aGVyd2lzZSB0byAwXG4gICAgdGhpcy5pbnRlcnNlY3Rpb25SYXRpbyA9IHRoaXMuaXNJbnRlcnNlY3RpbmcgPyAxIDogMDtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIGNvbnN0cnVjdG9yLlxuICogaHR0cHM6Ly93M2MuZ2l0aHViLmlvL0ludGVyc2VjdGlvbk9ic2VydmVyLyNpbnRlcnNlY3Rpb24tb2JzZXJ2ZXItaW50ZXJmYWNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBhZnRlciBpbnRlcnNlY3Rpb25cbiAqICAgICBjaGFuZ2VzIGhhdmUgcXVldWVkLiBUaGUgZnVuY3Rpb24gaXMgbm90IGludm9rZWQgaWYgdGhlIHF1ZXVlIGhhc1xuICogICAgIGJlZW4gZW1wdGllZCBieSBjYWxsaW5nIHRoZSBgdGFrZVJlY29yZHNgIG1ldGhvZC5cbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0X29wdGlvbnMgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEludGVyc2VjdGlvbk9ic2VydmVyKGNhbGxiYWNrLCBvcHRfb3B0aW9ucykge1xuXG4gIHZhciBvcHRpb25zID0gb3B0X29wdGlvbnMgfHwge307XG5cbiAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnJvb3QgJiYgb3B0aW9ucy5yb290Lm5vZGVUeXBlICE9IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Jvb3QgbXVzdCBiZSBhbiBFbGVtZW50Jyk7XG4gIH1cblxuICAvLyBCaW5kcyBhbmQgdGhyb3R0bGVzIGB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnNgLlxuICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMgPSB0aHJvdHRsZShcbiAgICAgIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucy5iaW5kKHRoaXMpLCB0aGlzLlRIUk9UVExFX1RJTUVPVVQpO1xuXG4gIC8vIFByaXZhdGUgcHJvcGVydGllcy5cbiAgdGhpcy5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID0gW107XG4gIHRoaXMuX3F1ZXVlZEVudHJpZXMgPSBbXTtcbiAgdGhpcy5fcm9vdE1hcmdpblZhbHVlcyA9IHRoaXMuX3BhcnNlUm9vdE1hcmdpbihvcHRpb25zLnJvb3RNYXJnaW4pO1xuXG4gIC8vIFB1YmxpYyBwcm9wZXJ0aWVzLlxuICB0aGlzLnRocmVzaG9sZHMgPSB0aGlzLl9pbml0VGhyZXNob2xkcyhvcHRpb25zLnRocmVzaG9sZCk7XG4gIHRoaXMucm9vdCA9IG9wdGlvbnMucm9vdCB8fCBudWxsO1xuICB0aGlzLnJvb3RNYXJnaW4gPSB0aGlzLl9yb290TWFyZ2luVmFsdWVzLm1hcChmdW5jdGlvbihtYXJnaW4pIHtcbiAgICByZXR1cm4gbWFyZ2luLnZhbHVlICsgbWFyZ2luLnVuaXQ7XG4gIH0pLmpvaW4oJyAnKTtcbn1cblxuXG4vKipcbiAqIFRoZSBtaW5pbXVtIGludGVydmFsIHdpdGhpbiB3aGljaCB0aGUgZG9jdW1lbnQgd2lsbCBiZSBjaGVja2VkIGZvclxuICogaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5USFJPVFRMRV9USU1FT1VUID0gMTAwO1xuXG5cbi8qKlxuICogVGhlIGZyZXF1ZW5jeSBpbiB3aGljaCB0aGUgcG9seWZpbGwgcG9sbHMgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICogdGhpcyBjYW4gYmUgdXBkYXRlZCBvbiBhIHBlciBpbnN0YW5jZSBiYXNpcyBhbmQgbXVzdCBiZSBzZXQgcHJpb3IgdG9cbiAqIGNhbGxpbmcgYG9ic2VydmVgIG9uIHRoZSBmaXJzdCB0YXJnZXQuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5QT0xMX0lOVEVSVkFMID0gbnVsbDtcblxuLyoqXG4gKiBVc2UgYSBtdXRhdGlvbiBvYnNlcnZlciBvbiB0aGUgcm9vdCBlbGVtZW50XG4gKiB0byBkZXRlY3QgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5VU0VfTVVUQVRJT05fT0JTRVJWRVIgPSB0cnVlO1xuXG5cbi8qKlxuICogU3RhcnRzIG9ic2VydmluZyBhIHRhcmdldCBlbGVtZW50IGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcyBiYXNlZCBvblxuICogdGhlIHRocmVzaG9sZHMgdmFsdWVzLlxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgVGhlIERPTSBlbGVtZW50IHRvIG9ic2VydmUuXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5vYnNlcnZlID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gIHZhciBpc1RhcmdldEFscmVhZHlPYnNlcnZlZCA9IHRoaXMuX29ic2VydmF0aW9uVGFyZ2V0cy5zb21lKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICByZXR1cm4gaXRlbS5lbGVtZW50ID09IHRhcmdldDtcbiAgfSk7XG5cbiAgaWYgKGlzVGFyZ2V0QWxyZWFkeU9ic2VydmVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCEodGFyZ2V0ICYmIHRhcmdldC5ub2RlVHlwZSA9PSAxKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IG11c3QgYmUgYW4gRWxlbWVudCcpO1xuICB9XG5cbiAgdGhpcy5fcmVnaXN0ZXJJbnN0YW5jZSgpO1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMucHVzaCh7ZWxlbWVudDogdGFyZ2V0LCBlbnRyeTogbnVsbH0pO1xuICB0aGlzLl9tb25pdG9ySW50ZXJzZWN0aW9ucygpO1xuICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMoKTtcbn07XG5cblxuLyoqXG4gKiBTdG9wcyBvYnNlcnZpbmcgYSB0YXJnZXQgZWxlbWVudCBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgRE9NIGVsZW1lbnQgdG8gb2JzZXJ2ZS5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLnVub2JzZXJ2ZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMgPVxuICAgICAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG5cbiAgICByZXR1cm4gaXRlbS5lbGVtZW50ICE9IHRhcmdldDtcbiAgfSk7XG4gIGlmICghdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzLmxlbmd0aCkge1xuICAgIHRoaXMuX3VubW9uaXRvckludGVyc2VjdGlvbnMoKTtcbiAgICB0aGlzLl91bnJlZ2lzdGVySW5zdGFuY2UoKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIFN0b3BzIG9ic2VydmluZyBhbGwgdGFyZ2V0IGVsZW1lbnRzIGZvciBpbnRlcnNlY3Rpb24gY2hhbmdlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fb2JzZXJ2YXRpb25UYXJnZXRzID0gW107XG4gIHRoaXMuX3VubW9uaXRvckludGVyc2VjdGlvbnMoKTtcbiAgdGhpcy5fdW5yZWdpc3Rlckluc3RhbmNlKCk7XG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBhbnkgcXVldWUgZW50cmllcyB0aGF0IGhhdmUgbm90IHlldCBiZWVuIHJlcG9ydGVkIHRvIHRoZVxuICogY2FsbGJhY2sgYW5kIGNsZWFycyB0aGUgcXVldWUuIFRoaXMgY2FuIGJlIHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGVcbiAqIGNhbGxiYWNrIHRvIG9idGFpbiB0aGUgYWJzb2x1dGUgbW9zdCB1cC10by1kYXRlIGludGVyc2VjdGlvbiBpbmZvcm1hdGlvbi5cbiAqIEByZXR1cm4ge0FycmF5fSBUaGUgY3VycmVudGx5IHF1ZXVlZCBlbnRyaWVzLlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUudGFrZVJlY29yZHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJlY29yZHMgPSB0aGlzLl9xdWV1ZWRFbnRyaWVzLnNsaWNlKCk7XG4gIHRoaXMuX3F1ZXVlZEVudHJpZXMgPSBbXTtcbiAgcmV0dXJuIHJlY29yZHM7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyB0aGUgdGhyZXNob2xkIHZhbHVlIGZyb20gdGhlIHVzZXIgY29uZmlndXJhdGlvbiBvYmplY3QgYW5kXG4gKiByZXR1cm5zIGEgc29ydGVkIGFycmF5IG9mIHVuaXF1ZSB0aHJlc2hvbGQgdmFsdWVzLiBJZiBhIHZhbHVlIGlzIG5vdFxuICogYmV0d2VlbiAwIGFuZCAxIGFuZCBlcnJvciBpcyB0aHJvd24uXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxudW1iZXI9fSBvcHRfdGhyZXNob2xkIEFuIG9wdGlvbmFsIHRocmVzaG9sZCB2YWx1ZSBvclxuICogICAgIGEgbGlzdCBvZiB0aHJlc2hvbGQgdmFsdWVzLCBkZWZhdWx0aW5nIHRvIFswXS5cbiAqIEByZXR1cm4ge0FycmF5fSBBIHNvcnRlZCBsaXN0IG9mIHVuaXF1ZSBhbmQgdmFsaWQgdGhyZXNob2xkIHZhbHVlcy5cbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9pbml0VGhyZXNob2xkcyA9IGZ1bmN0aW9uKG9wdF90aHJlc2hvbGQpIHtcbiAgdmFyIHRocmVzaG9sZCA9IG9wdF90aHJlc2hvbGQgfHwgWzBdO1xuICBpZiAoIUFycmF5LmlzQXJyYXkodGhyZXNob2xkKSkgdGhyZXNob2xkID0gW3RocmVzaG9sZF07XG5cbiAgcmV0dXJuIHRocmVzaG9sZC5zb3J0KCkuZmlsdGVyKGZ1bmN0aW9uKHQsIGksIGEpIHtcbiAgICBpZiAodHlwZW9mIHQgIT0gJ251bWJlcicgfHwgaXNOYU4odCkgfHwgdCA8IDAgfHwgdCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhyZXNob2xkIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIGluY2x1c2l2ZWx5Jyk7XG4gICAgfVxuICAgIHJldHVybiB0ICE9PSBhW2kgLSAxXTtcbiAgfSk7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyB0aGUgcm9vdE1hcmdpbiB2YWx1ZSBmcm9tIHRoZSB1c2VyIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgZm91ciBtYXJnaW4gdmFsdWVzIGFzIGFuIG9iamVjdCBjb250YWluaW5nXG4gKiB0aGUgdmFsdWUgYW5kIHVuaXQgcHJvcGVydGllcy4gSWYgYW55IG9mIHRoZSB2YWx1ZXMgYXJlIG5vdCBwcm9wZXJseVxuICogZm9ybWF0dGVkIG9yIHVzZSBhIHVuaXQgb3RoZXIgdGhhbiBweCBvciAlLCBhbmQgZXJyb3IgaXMgdGhyb3duLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nPX0gb3B0X3Jvb3RNYXJnaW4gQW4gb3B0aW9uYWwgcm9vdE1hcmdpbiB2YWx1ZSxcbiAqICAgICBkZWZhdWx0aW5nIHRvICcwcHgnLlxuICogQHJldHVybiB7QXJyYXk8T2JqZWN0Pn0gQW4gYXJyYXkgb2YgbWFyZ2luIG9iamVjdHMgd2l0aCB0aGUga2V5c1xuICogICAgIHZhbHVlIGFuZCB1bml0LlxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3BhcnNlUm9vdE1hcmdpbiA9IGZ1bmN0aW9uKG9wdF9yb290TWFyZ2luKSB7XG4gIHZhciBtYXJnaW5TdHJpbmcgPSBvcHRfcm9vdE1hcmdpbiB8fCAnMHB4JztcbiAgdmFyIG1hcmdpbnMgPSBtYXJnaW5TdHJpbmcuc3BsaXQoL1xccysvKS5tYXAoZnVuY3Rpb24obWFyZ2luKSB7XG4gICAgdmFyIHBhcnRzID0gL14oLT9cXGQqXFwuP1xcZCspKHB4fCUpJC8uZXhlYyhtYXJnaW4pO1xuICAgIGlmICghcGFydHMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigncm9vdE1hcmdpbiBtdXN0IGJlIHNwZWNpZmllZCBpbiBwaXhlbHMgb3IgcGVyY2VudCcpO1xuICAgIH1cbiAgICByZXR1cm4ge3ZhbHVlOiBwYXJzZUZsb2F0KHBhcnRzWzFdKSwgdW5pdDogcGFydHNbMl19O1xuICB9KTtcblxuICAvLyBIYW5kbGVzIHNob3J0aGFuZC5cbiAgbWFyZ2luc1sxXSA9IG1hcmdpbnNbMV0gfHwgbWFyZ2luc1swXTtcbiAgbWFyZ2luc1syXSA9IG1hcmdpbnNbMl0gfHwgbWFyZ2luc1swXTtcbiAgbWFyZ2luc1szXSA9IG1hcmdpbnNbM10gfHwgbWFyZ2luc1sxXTtcblxuICByZXR1cm4gbWFyZ2lucztcbn07XG5cblxuLyoqXG4gKiBTdGFydHMgcG9sbGluZyBmb3IgaW50ZXJzZWN0aW9uIGNoYW5nZXMgaWYgdGhlIHBvbGxpbmcgaXMgbm90IGFscmVhZHlcbiAqIGhhcHBlbmluZywgYW5kIGlmIHRoZSBwYWdlJ3MgdmlzaWJpbGl0eSBzdGF0ZSBpcyB2aXNpYmxlLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9tb25pdG9ySW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zKSB7XG4gICAgdGhpcy5fbW9uaXRvcmluZ0ludGVyc2VjdGlvbnMgPSB0cnVlO1xuXG4gICAgLy8gSWYgYSBwb2xsIGludGVydmFsIGlzIHNldCwgdXNlIHBvbGxpbmcgaW5zdGVhZCBvZiBsaXN0ZW5pbmcgdG9cbiAgICAvLyByZXNpemUgYW5kIHNjcm9sbCBldmVudHMgb3IgRE9NIG11dGF0aW9ucy5cbiAgICBpZiAodGhpcy5QT0xMX0lOVEVSVkFMKSB7XG4gICAgICB0aGlzLl9tb25pdG9yaW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChcbiAgICAgICAgICB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRoaXMuUE9MTF9JTlRFUlZBTCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYWRkRXZlbnQod2luZG93LCAncmVzaXplJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcbiAgICAgIGFkZEV2ZW50KGRvY3VtZW50LCAnc2Nyb2xsJywgdGhpcy5fY2hlY2tGb3JJbnRlcnNlY3Rpb25zLCB0cnVlKTtcblxuICAgICAgaWYgKHRoaXMuVVNFX01VVEFUSU9OX09CU0VSVkVSICYmICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcbiAgICAgICAgdGhpcy5fZG9tT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMpO1xuICAgICAgICB0aGlzLl9kb21PYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LCB7XG4gICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG4vKipcbiAqIFN0b3BzIHBvbGxpbmcgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl91bm1vbml0b3JJbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLl9tb25pdG9yaW5nSW50ZXJzZWN0aW9ucykge1xuICAgIHRoaXMuX21vbml0b3JpbmdJbnRlcnNlY3Rpb25zID0gZmFsc2U7XG5cbiAgICBjbGVhckludGVydmFsKHRoaXMuX21vbml0b3JpbmdJbnRlcnZhbCk7XG4gICAgdGhpcy5fbW9uaXRvcmluZ0ludGVydmFsID0gbnVsbDtcblxuICAgIHJlbW92ZUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScsIHRoaXMuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucywgdHJ1ZSk7XG4gICAgcmVtb3ZlRXZlbnQoZG9jdW1lbnQsICdzY3JvbGwnLCB0aGlzLl9jaGVja0ZvckludGVyc2VjdGlvbnMsIHRydWUpO1xuXG4gICAgaWYgKHRoaXMuX2RvbU9ic2VydmVyKSB7XG4gICAgICB0aGlzLl9kb21PYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICB0aGlzLl9kb21PYnNlcnZlciA9IG51bGw7XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogU2NhbnMgZWFjaCBvYnNlcnZhdGlvbiB0YXJnZXQgZm9yIGludGVyc2VjdGlvbiBjaGFuZ2VzIGFuZCBhZGRzIHRoZW1cbiAqIHRvIHRoZSBpbnRlcm5hbCBlbnRyaWVzIHF1ZXVlLiBJZiBuZXcgZW50cmllcyBhcmUgZm91bmQsIGl0XG4gKiBzY2hlZHVsZXMgdGhlIGNhbGxiYWNrIHRvIGJlIGludm9rZWQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2NoZWNrRm9ySW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcm9vdElzSW5Eb20gPSB0aGlzLl9yb290SXNJbkRvbSgpO1xuICB2YXIgcm9vdFJlY3QgPSByb290SXNJbkRvbSA/IHRoaXMuX2dldFJvb3RSZWN0KCkgOiBnZXRFbXB0eVJlY3QoKTtcblxuICB0aGlzLl9vYnNlcnZhdGlvblRhcmdldHMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgdmFyIHRhcmdldCA9IGl0ZW0uZWxlbWVudDtcbiAgICB2YXIgdGFyZ2V0UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0YXJnZXQpO1xuICAgIHZhciByb290Q29udGFpbnNUYXJnZXQgPSB0aGlzLl9yb290Q29udGFpbnNUYXJnZXQodGFyZ2V0KTtcbiAgICB2YXIgb2xkRW50cnkgPSBpdGVtLmVudHJ5O1xuICAgIHZhciBpbnRlcnNlY3Rpb25SZWN0ID0gcm9vdElzSW5Eb20gJiYgcm9vdENvbnRhaW5zVGFyZ2V0ICYmXG4gICAgICAgIHRoaXMuX2NvbXB1dGVUYXJnZXRBbmRSb290SW50ZXJzZWN0aW9uKHRhcmdldCwgcm9vdFJlY3QpO1xuXG4gICAgdmFyIG5ld0VudHJ5ID0gaXRlbS5lbnRyeSA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlckVudHJ5KHtcbiAgICAgIHRpbWU6IG5vdygpLFxuICAgICAgdGFyZ2V0OiB0YXJnZXQsXG4gICAgICBib3VuZGluZ0NsaWVudFJlY3Q6IHRhcmdldFJlY3QsXG4gICAgICByb290Qm91bmRzOiByb290UmVjdCxcbiAgICAgIGludGVyc2VjdGlvblJlY3Q6IGludGVyc2VjdGlvblJlY3RcbiAgICB9KTtcblxuICAgIGlmICghb2xkRW50cnkpIHtcbiAgICAgIHRoaXMuX3F1ZXVlZEVudHJpZXMucHVzaChuZXdFbnRyeSk7XG4gICAgfSBlbHNlIGlmIChyb290SXNJbkRvbSAmJiByb290Q29udGFpbnNUYXJnZXQpIHtcbiAgICAgIC8vIElmIHRoZSBuZXcgZW50cnkgaW50ZXJzZWN0aW9uIHJhdGlvIGhhcyBjcm9zc2VkIGFueSBvZiB0aGVcbiAgICAgIC8vIHRocmVzaG9sZHMsIGFkZCBhIG5ldyBlbnRyeS5cbiAgICAgIGlmICh0aGlzLl9oYXNDcm9zc2VkVGhyZXNob2xkKG9sZEVudHJ5LCBuZXdFbnRyeSkpIHtcbiAgICAgICAgdGhpcy5fcXVldWVkRW50cmllcy5wdXNoKG5ld0VudHJ5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlIHJvb3QgaXMgbm90IGluIHRoZSBET00gb3IgdGFyZ2V0IGlzIG5vdCBjb250YWluZWQgd2l0aGluXG4gICAgICAvLyByb290IGJ1dCB0aGUgcHJldmlvdXMgZW50cnkgZm9yIHRoaXMgdGFyZ2V0IGhhZCBhbiBpbnRlcnNlY3Rpb24sXG4gICAgICAvLyBhZGQgYSBuZXcgcmVjb3JkIGluZGljYXRpbmcgcmVtb3ZhbC5cbiAgICAgIGlmIChvbGRFbnRyeSAmJiBvbGRFbnRyeS5pc0ludGVyc2VjdGluZykge1xuICAgICAgICB0aGlzLl9xdWV1ZWRFbnRyaWVzLnB1c2gobmV3RW50cnkpO1xuICAgICAgfVxuICAgIH1cbiAgfSwgdGhpcyk7XG5cbiAgaWYgKHRoaXMuX3F1ZXVlZEVudHJpZXMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2sodGhpcy50YWtlUmVjb3JkcygpLCB0aGlzKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIEFjY2VwdHMgYSB0YXJnZXQgYW5kIHJvb3QgcmVjdCBjb21wdXRlcyB0aGUgaW50ZXJzZWN0aW9uIGJldHdlZW4gdGhlblxuICogZm9sbG93aW5nIHRoZSBhbGdvcml0aG0gaW4gdGhlIHNwZWMuXG4gKiBUT0RPKHBoaWxpcHdhbHRvbik6IGF0IHRoaXMgdGltZSBjbGlwLXBhdGggaXMgbm90IGNvbnNpZGVyZWQuXG4gKiBodHRwczovL3czYy5naXRodWIuaW8vSW50ZXJzZWN0aW9uT2JzZXJ2ZXIvI2NhbGN1bGF0ZS1pbnRlcnNlY3Rpb24tcmVjdC1hbGdvXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgdGFyZ2V0IERPTSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gcm9vdFJlY3QgVGhlIGJvdW5kaW5nIHJlY3Qgb2YgdGhlIHJvb3QgYWZ0ZXIgYmVpbmdcbiAqICAgICBleHBhbmRlZCBieSB0aGUgcm9vdE1hcmdpbiB2YWx1ZS5cbiAqIEByZXR1cm4gez9PYmplY3R9IFRoZSBmaW5hbCBpbnRlcnNlY3Rpb24gcmVjdCBvYmplY3Qgb3IgdW5kZWZpbmVkIGlmIG5vXG4gKiAgICAgaW50ZXJzZWN0aW9uIGlzIGZvdW5kLlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9jb21wdXRlVGFyZ2V0QW5kUm9vdEludGVyc2VjdGlvbiA9XG4gICAgZnVuY3Rpb24odGFyZ2V0LCByb290UmVjdCkge1xuXG4gIC8vIElmIHRoZSBlbGVtZW50IGlzbid0IGRpc3BsYXllZCwgYW4gaW50ZXJzZWN0aW9uIGNhbid0IGhhcHBlbi5cbiAgaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCkuZGlzcGxheSA9PSAnbm9uZScpIHJldHVybjtcblxuICB2YXIgdGFyZ2V0UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdCh0YXJnZXQpO1xuICB2YXIgaW50ZXJzZWN0aW9uUmVjdCA9IHRhcmdldFJlY3Q7XG4gIHZhciBwYXJlbnQgPSBnZXRQYXJlbnROb2RlKHRhcmdldCk7XG4gIHZhciBhdFJvb3QgPSBmYWxzZTtcblxuICB3aGlsZSAoIWF0Um9vdCkge1xuICAgIHZhciBwYXJlbnRSZWN0ID0gbnVsbDtcbiAgICB2YXIgcGFyZW50Q29tcHV0ZWRTdHlsZSA9IHBhcmVudC5ub2RlVHlwZSA9PSAxID9cbiAgICAgICAgd2luZG93LmdldENvbXB1dGVkU3R5bGUocGFyZW50KSA6IHt9O1xuXG4gICAgLy8gSWYgdGhlIHBhcmVudCBpc24ndCBkaXNwbGF5ZWQsIGFuIGludGVyc2VjdGlvbiBjYW4ndCBoYXBwZW4uXG4gICAgaWYgKHBhcmVudENvbXB1dGVkU3R5bGUuZGlzcGxheSA9PSAnbm9uZScpIHJldHVybjtcblxuICAgIGlmIChwYXJlbnQgPT0gdGhpcy5yb290IHx8IHBhcmVudCA9PSBkb2N1bWVudCkge1xuICAgICAgYXRSb290ID0gdHJ1ZTtcbiAgICAgIHBhcmVudFJlY3QgPSByb290UmVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaGFzIGEgbm9uLXZpc2libGUgb3ZlcmZsb3csIGFuZCBpdCdzIG5vdCB0aGUgPGJvZHk+XG4gICAgICAvLyBvciA8aHRtbD4gZWxlbWVudCwgdXBkYXRlIHRoZSBpbnRlcnNlY3Rpb24gcmVjdC5cbiAgICAgIC8vIE5vdGU6IDxib2R5PiBhbmQgPGh0bWw+IGNhbm5vdCBiZSBjbGlwcGVkIHRvIGEgcmVjdCB0aGF0J3Mgbm90IGFsc29cbiAgICAgIC8vIHRoZSBkb2N1bWVudCByZWN0LCBzbyBubyBuZWVkIHRvIGNvbXB1dGUgYSBuZXcgaW50ZXJzZWN0aW9uLlxuICAgICAgaWYgKHBhcmVudCAhPSBkb2N1bWVudC5ib2R5ICYmXG4gICAgICAgICAgcGFyZW50ICE9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJlxuICAgICAgICAgIHBhcmVudENvbXB1dGVkU3R5bGUub3ZlcmZsb3cgIT0gJ3Zpc2libGUnKSB7XG4gICAgICAgIHBhcmVudFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QocGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBlaXRoZXIgb2YgdGhlIGFib3ZlIGNvbmRpdGlvbmFscyBzZXQgYSBuZXcgcGFyZW50UmVjdCxcbiAgICAvLyBjYWxjdWxhdGUgbmV3IGludGVyc2VjdGlvbiBkYXRhLlxuICAgIGlmIChwYXJlbnRSZWN0KSB7XG4gICAgICBpbnRlcnNlY3Rpb25SZWN0ID0gY29tcHV0ZVJlY3RJbnRlcnNlY3Rpb24ocGFyZW50UmVjdCwgaW50ZXJzZWN0aW9uUmVjdCk7XG5cbiAgICAgIGlmICghaW50ZXJzZWN0aW9uUmVjdCkgYnJlYWs7XG4gICAgfVxuICAgIHBhcmVudCA9IGdldFBhcmVudE5vZGUocGFyZW50KTtcbiAgfVxuICByZXR1cm4gaW50ZXJzZWN0aW9uUmVjdDtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByb290IHJlY3QgYWZ0ZXIgYmVpbmcgZXhwYW5kZWQgYnkgdGhlIHJvb3RNYXJnaW4gdmFsdWUuXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBleHBhbmRlZCByb290IHJlY3QuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2dldFJvb3RSZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciByb290UmVjdDtcbiAgaWYgKHRoaXMucm9vdCkge1xuICAgIHJvb3RSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMucm9vdCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVXNlIDxodG1sPi88Ym9keT4gaW5zdGVhZCBvZiB3aW5kb3cgc2luY2Ugc2Nyb2xsIGJhcnMgYWZmZWN0IHNpemUuXG4gICAgdmFyIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgIHJvb3RSZWN0ID0ge1xuICAgICAgdG9wOiAwLFxuICAgICAgbGVmdDogMCxcbiAgICAgIHJpZ2h0OiBodG1sLmNsaWVudFdpZHRoIHx8IGJvZHkuY2xpZW50V2lkdGgsXG4gICAgICB3aWR0aDogaHRtbC5jbGllbnRXaWR0aCB8fCBib2R5LmNsaWVudFdpZHRoLFxuICAgICAgYm90dG9tOiBodG1sLmNsaWVudEhlaWdodCB8fCBib2R5LmNsaWVudEhlaWdodCxcbiAgICAgIGhlaWdodDogaHRtbC5jbGllbnRIZWlnaHQgfHwgYm9keS5jbGllbnRIZWlnaHRcbiAgICB9O1xuICB9XG4gIHJldHVybiB0aGlzLl9leHBhbmRSZWN0QnlSb290TWFyZ2luKHJvb3RSZWN0KTtcbn07XG5cblxuLyoqXG4gKiBBY2NlcHRzIGEgcmVjdCBhbmQgZXhwYW5kcyBpdCBieSB0aGUgcm9vdE1hcmdpbiB2YWx1ZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSByZWN0IFRoZSByZWN0IG9iamVjdCB0byBleHBhbmQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBleHBhbmRlZCByZWN0LlxuICogQHByaXZhdGVcbiAqL1xuSW50ZXJzZWN0aW9uT2JzZXJ2ZXIucHJvdG90eXBlLl9leHBhbmRSZWN0QnlSb290TWFyZ2luID0gZnVuY3Rpb24ocmVjdCkge1xuICB2YXIgbWFyZ2lucyA9IHRoaXMuX3Jvb3RNYXJnaW5WYWx1ZXMubWFwKGZ1bmN0aW9uKG1hcmdpbiwgaSkge1xuICAgIHJldHVybiBtYXJnaW4udW5pdCA9PSAncHgnID8gbWFyZ2luLnZhbHVlIDpcbiAgICAgICAgbWFyZ2luLnZhbHVlICogKGkgJSAyID8gcmVjdC53aWR0aCA6IHJlY3QuaGVpZ2h0KSAvIDEwMDtcbiAgfSk7XG4gIHZhciBuZXdSZWN0ID0ge1xuICAgIHRvcDogcmVjdC50b3AgLSBtYXJnaW5zWzBdLFxuICAgIHJpZ2h0OiByZWN0LnJpZ2h0ICsgbWFyZ2luc1sxXSxcbiAgICBib3R0b206IHJlY3QuYm90dG9tICsgbWFyZ2luc1syXSxcbiAgICBsZWZ0OiByZWN0LmxlZnQgLSBtYXJnaW5zWzNdXG4gIH07XG4gIG5ld1JlY3Qud2lkdGggPSBuZXdSZWN0LnJpZ2h0IC0gbmV3UmVjdC5sZWZ0O1xuICBuZXdSZWN0LmhlaWdodCA9IG5ld1JlY3QuYm90dG9tIC0gbmV3UmVjdC50b3A7XG5cbiAgcmV0dXJuIG5ld1JlY3Q7XG59O1xuXG5cbi8qKlxuICogQWNjZXB0cyBhbiBvbGQgYW5kIG5ldyBlbnRyeSBhbmQgcmV0dXJucyB0cnVlIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGVcbiAqIHRocmVzaG9sZCB2YWx1ZXMgaGFzIGJlZW4gY3Jvc3NlZC5cbiAqIEBwYXJhbSB7P0ludGVyc2VjdGlvbk9ic2VydmVyRW50cnl9IG9sZEVudHJ5IFRoZSBwcmV2aW91cyBlbnRyeSBmb3IgYVxuICogICAgcGFydGljdWxhciB0YXJnZXQgZWxlbWVudCBvciBudWxsIGlmIG5vIHByZXZpb3VzIGVudHJ5IGV4aXN0cy5cbiAqIEBwYXJhbSB7SW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeX0gbmV3RW50cnkgVGhlIGN1cnJlbnQgZW50cnkgZm9yIGFcbiAqICAgIHBhcnRpY3VsYXIgdGFyZ2V0IGVsZW1lbnQuXG4gKiBAcmV0dXJuIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgYSBhbnkgdGhyZXNob2xkIGhhcyBiZWVuIGNyb3NzZWQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX2hhc0Nyb3NzZWRUaHJlc2hvbGQgPVxuICAgIGZ1bmN0aW9uKG9sZEVudHJ5LCBuZXdFbnRyeSkge1xuXG4gIC8vIFRvIG1ha2UgY29tcGFyaW5nIGVhc2llciwgYW4gZW50cnkgdGhhdCBoYXMgYSByYXRpbyBvZiAwXG4gIC8vIGJ1dCBkb2VzIG5vdCBhY3R1YWxseSBpbnRlcnNlY3QgaXMgZ2l2ZW4gYSB2YWx1ZSBvZiAtMVxuICB2YXIgb2xkUmF0aW8gPSBvbGRFbnRyeSAmJiBvbGRFbnRyeS5pc0ludGVyc2VjdGluZyA/XG4gICAgICBvbGRFbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyB8fCAwIDogLTE7XG4gIHZhciBuZXdSYXRpbyA9IG5ld0VudHJ5LmlzSW50ZXJzZWN0aW5nID9cbiAgICAgIG5ld0VudHJ5LmludGVyc2VjdGlvblJhdGlvIHx8IDAgOiAtMTtcblxuICAvLyBJZ25vcmUgdW5jaGFuZ2VkIHJhdGlvc1xuICBpZiAob2xkUmF0aW8gPT09IG5ld1JhdGlvKSByZXR1cm47XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRocmVzaG9sZHMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdGhyZXNob2xkID0gdGhpcy50aHJlc2hvbGRzW2ldO1xuXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgYW4gZW50cnkgbWF0Y2hlcyBhIHRocmVzaG9sZCBvciBpZiB0aGUgbmV3IHJhdGlvXG4gICAgLy8gYW5kIHRoZSBvbGQgcmF0aW8gYXJlIG9uIHRoZSBvcHBvc2l0ZSBzaWRlcyBvZiBhIHRocmVzaG9sZC5cbiAgICBpZiAodGhyZXNob2xkID09IG9sZFJhdGlvIHx8IHRocmVzaG9sZCA9PSBuZXdSYXRpbyB8fFxuICAgICAgICB0aHJlc2hvbGQgPCBvbGRSYXRpbyAhPT0gdGhyZXNob2xkIDwgbmV3UmF0aW8pIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxufTtcblxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHJvb3QgZWxlbWVudCBpcyBhbiBlbGVtZW50IGFuZCBpcyBpbiB0aGUgRE9NLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgcm9vdCBlbGVtZW50IGlzIGFuIGVsZW1lbnQgYW5kIGlzIGluIHRoZSBET00uXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3Jvb3RJc0luRG9tID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5yb290IHx8IGNvbnRhaW5zRGVlcChkb2N1bWVudCwgdGhpcy5yb290KTtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIHJvb3QuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBUaGUgdGFyZ2V0IGVsZW1lbnQgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIHJvb3QuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3Jvb3RDb250YWluc1RhcmdldCA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICByZXR1cm4gY29udGFpbnNEZWVwKHRoaXMucm9vdCB8fCBkb2N1bWVudCwgdGFyZ2V0KTtcbn07XG5cblxuLyoqXG4gKiBBZGRzIHRoZSBpbnN0YW5jZSB0byB0aGUgZ2xvYmFsIEludGVyc2VjdGlvbk9ic2VydmVyIHJlZ2lzdHJ5IGlmIGl0IGlzbid0XG4gKiBhbHJlYWR5IHByZXNlbnQuXG4gKiBAcHJpdmF0ZVxuICovXG5JbnRlcnNlY3Rpb25PYnNlcnZlci5wcm90b3R5cGUuX3JlZ2lzdGVySW5zdGFuY2UgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHJlZ2lzdHJ5LmluZGV4T2YodGhpcykgPCAwKSB7XG4gICAgcmVnaXN0cnkucHVzaCh0aGlzKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIFJlbW92ZXMgdGhlIGluc3RhbmNlIGZyb20gdGhlIGdsb2JhbCBJbnRlcnNlY3Rpb25PYnNlcnZlciByZWdpc3RyeS5cbiAqIEBwcml2YXRlXG4gKi9cbkludGVyc2VjdGlvbk9ic2VydmVyLnByb3RvdHlwZS5fdW5yZWdpc3Rlckluc3RhbmNlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBpbmRleCA9IHJlZ2lzdHJ5LmluZGV4T2YodGhpcyk7XG4gIGlmIChpbmRleCAhPSAtMSkgcmVnaXN0cnkuc3BsaWNlKGluZGV4LCAxKTtcbn07XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIHBlcmZvcm1hbmNlLm5vdygpIG1ldGhvZCBvciBudWxsIGluIGJyb3dzZXJzXG4gKiB0aGF0IGRvbid0IHN1cHBvcnQgdGhlIEFQSS5cbiAqIEByZXR1cm4ge251bWJlcn0gVGhlIGVsYXBzZWQgdGltZSBzaW5jZSB0aGUgcGFnZSB3YXMgcmVxdWVzdGVkLlxuICovXG5mdW5jdGlvbiBub3coKSB7XG4gIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2UgJiYgcGVyZm9ybWFuY2Uubm93ICYmIHBlcmZvcm1hbmNlLm5vdygpO1xufVxuXG5cbi8qKlxuICogVGhyb3R0bGVzIGEgZnVuY3Rpb24gYW5kIGRlbGF5cyBpdHMgZXhlY3V0aW9uLCBzbyBpdCdzIG9ubHkgY2FsbGVkIGF0IG1vc3RcbiAqIG9uY2Ugd2l0aGluIGEgZ2l2ZW4gdGltZSBwZXJpb2QuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gdGltZW91dCBUaGUgYW1vdW50IG9mIHRpbWUgdGhhdCBtdXN0IHBhc3MgYmVmb3JlIHRoZVxuICogICAgIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWQgYWdhaW4uXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIHRocm90dGxlZCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gdGhyb3R0bGUoZm4sIHRpbWVvdXQpIHtcbiAgdmFyIHRpbWVyID0gbnVsbDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRpbWVyKSB7XG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGZuKCk7XG4gICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgfTtcbn1cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byBhIERPTSBub2RlIGVuc3VyaW5nIGNyb3NzLWJyb3dzZXIgY29tcGF0aWJpbGl0eS5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gYWRkIHRoZSBldmVudCBoYW5kbGVyIHRvLlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGV2ZW50IGhhbmRsZXIgdG8gYWRkLlxuICogQHBhcmFtIHtib29sZWFufSBvcHRfdXNlQ2FwdHVyZSBPcHRpb25hbGx5IGFkZHMgdGhlIGV2ZW4gdG8gdGhlIGNhcHR1cmVcbiAqICAgICBwaGFzZS4gTm90ZTogdGhpcyBvbmx5IHdvcmtzIGluIG1vZGVybiBicm93c2Vycy5cbiAqL1xuZnVuY3Rpb24gYWRkRXZlbnQobm9kZSwgZXZlbnQsIGZuLCBvcHRfdXNlQ2FwdHVyZSkge1xuICBpZiAodHlwZW9mIG5vZGUuYWRkRXZlbnRMaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUgfHwgZmFsc2UpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBub2RlLmF0dGFjaEV2ZW50ID09ICdmdW5jdGlvbicpIHtcbiAgICBub2RlLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZm4pO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCBldmVudCBoYW5kbGVyIGZyb20gYSBET00gbm9kZS5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgRE9NIG5vZGUgdG8gcmVtb3ZlIHRoZSBldmVudCBoYW5kbGVyIGZyb20uXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZXZlbnQgaGFuZGxlciB0byByZW1vdmUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdF91c2VDYXB0dXJlIElmIHRoZSBldmVudCBoYW5kbGVyIHdhcyBhZGRlZCB3aXRoIHRoaXNcbiAqICAgICBmbGFnIHNldCB0byB0cnVlLCBpdCBzaG91bGQgYmUgc2V0IHRvIHRydWUgaGVyZSBpbiBvcmRlciB0byByZW1vdmUgaXQuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50KG5vZGUsIGV2ZW50LCBmbiwgb3B0X3VzZUNhcHR1cmUpIHtcbiAgaWYgKHR5cGVvZiBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sIG9wdF91c2VDYXB0dXJlIHx8IGZhbHNlKTtcbiAgfVxuICBlbHNlIGlmICh0eXBlb2Ygbm9kZS5kZXRhdGNoRXZlbnQgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG5vZGUuZGV0YXRjaEV2ZW50KCdvbicgKyBldmVudCwgZm4pO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnRlcnNlY3Rpb24gYmV0d2VlbiB0d28gcmVjdCBvYmplY3RzLlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QxIFRoZSBmaXJzdCByZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHJlY3QyIFRoZSBzZWNvbmQgcmVjdC5cbiAqIEByZXR1cm4gez9PYmplY3R9IFRoZSBpbnRlcnNlY3Rpb24gcmVjdCBvciB1bmRlZmluZWQgaWYgbm8gaW50ZXJzZWN0aW9uXG4gKiAgICAgaXMgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVSZWN0SW50ZXJzZWN0aW9uKHJlY3QxLCByZWN0Mikge1xuICB2YXIgdG9wID0gTWF0aC5tYXgocmVjdDEudG9wLCByZWN0Mi50b3ApO1xuICB2YXIgYm90dG9tID0gTWF0aC5taW4ocmVjdDEuYm90dG9tLCByZWN0Mi5ib3R0b20pO1xuICB2YXIgbGVmdCA9IE1hdGgubWF4KHJlY3QxLmxlZnQsIHJlY3QyLmxlZnQpO1xuICB2YXIgcmlnaHQgPSBNYXRoLm1pbihyZWN0MS5yaWdodCwgcmVjdDIucmlnaHQpO1xuICB2YXIgd2lkdGggPSByaWdodCAtIGxlZnQ7XG4gIHZhciBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG5cbiAgcmV0dXJuICh3aWR0aCA+PSAwICYmIGhlaWdodCA+PSAwKSAmJiB7XG4gICAgdG9wOiB0b3AsXG4gICAgYm90dG9tOiBib3R0b20sXG4gICAgbGVmdDogbGVmdCxcbiAgICByaWdodDogcmlnaHQsXG4gICAgd2lkdGg6IHdpZHRoLFxuICAgIGhlaWdodDogaGVpZ2h0XG4gIH07XG59XG5cblxuLyoqXG4gKiBTaGltcyB0aGUgbmF0aXZlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG9sZGVyIElFLlxuICogQHBhcmFtIHtFbGVtZW50fSBlbCBUaGUgZWxlbWVudCB3aG9zZSBib3VuZGluZyByZWN0IHRvIGdldC5cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIChwb3NzaWJseSBzaGltbWVkKSByZWN0IG9mIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZWwpIHtcbiAgdmFyIHJlY3Q7XG5cbiAgdHJ5IHtcbiAgICByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIElnbm9yZSBXaW5kb3dzIDcgSUUxMSBcIlVuc3BlY2lmaWVkIGVycm9yXCJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdzNjL0ludGVyc2VjdGlvbk9ic2VydmVyL3B1bGwvMjA1XG4gIH1cblxuICBpZiAoIXJlY3QpIHJldHVybiBnZXRFbXB0eVJlY3QoKTtcblxuICAvLyBPbGRlciBJRVxuICBpZiAoIShyZWN0LndpZHRoICYmIHJlY3QuaGVpZ2h0KSkge1xuICAgIHJlY3QgPSB7XG4gICAgICB0b3A6IHJlY3QudG9wLFxuICAgICAgcmlnaHQ6IHJlY3QucmlnaHQsXG4gICAgICBib3R0b206IHJlY3QuYm90dG9tLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0LFxuICAgICAgd2lkdGg6IHJlY3QucmlnaHQgLSByZWN0LmxlZnQsXG4gICAgICBoZWlnaHQ6IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcbiAgICB9O1xuICB9XG4gIHJldHVybiByZWN0O1xufVxuXG5cbi8qKlxuICogUmV0dXJucyBhbiBlbXB0eSByZWN0IG9iamVjdC4gQW4gZW1wdHkgcmVjdCBpcyByZXR1cm5lZCB3aGVuIGFuIGVsZW1lbnRcbiAqIGlzIG5vdCBpbiB0aGUgRE9NLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZW1wdHkgcmVjdC5cbiAqL1xuZnVuY3Rpb24gZ2V0RW1wdHlSZWN0KCkge1xuICByZXR1cm4ge1xuICAgIHRvcDogMCxcbiAgICBib3R0b206IDAsXG4gICAgbGVmdDogMCxcbiAgICByaWdodDogMCxcbiAgICB3aWR0aDogMCxcbiAgICBoZWlnaHQ6IDBcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIGEgcGFyZW50IGVsZW1lbnQgY29udGFpbnMgYSBjaGlsZCBlbGVtZW50IChpbmNsdWRpbmcgaW5zaWRlXG4gKiBzaGFkb3cgRE9NKS5cbiAqIEBwYXJhbSB7Tm9kZX0gcGFyZW50IFRoZSBwYXJlbnQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Tm9kZX0gY2hpbGQgVGhlIGNoaWxkIGVsZW1lbnQuXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBwYXJlbnQgbm9kZSBjb250YWlucyB0aGUgY2hpbGQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gY29udGFpbnNEZWVwKHBhcmVudCwgY2hpbGQpIHtcbiAgdmFyIG5vZGUgPSBjaGlsZDtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHJldHVybiB0cnVlO1xuXG4gICAgbm9kZSA9IGdldFBhcmVudE5vZGUobm9kZSk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5cbi8qKlxuICogR2V0cyB0aGUgcGFyZW50IG5vZGUgb2YgYW4gZWxlbWVudCBvciBpdHMgaG9zdCBlbGVtZW50IGlmIHRoZSBwYXJlbnQgbm9kZVxuICogaXMgYSBzaGFkb3cgcm9vdC5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBUaGUgbm9kZSB3aG9zZSBwYXJlbnQgdG8gZ2V0LlxuICogQHJldHVybiB7Tm9kZXxudWxsfSBUaGUgcGFyZW50IG5vZGUgb3IgbnVsbCBpZiBubyBwYXJlbnQgZXhpc3RzLlxuICovXG5mdW5jdGlvbiBnZXRQYXJlbnROb2RlKG5vZGUpIHtcbiAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcblxuICBpZiAocGFyZW50ICYmIHBhcmVudC5ub2RlVHlwZSA9PSAxMSAmJiBwYXJlbnQuaG9zdCkge1xuICAgIC8vIElmIHRoZSBwYXJlbnQgaXMgYSBzaGFkb3cgcm9vdCwgcmV0dXJuIHRoZSBob3N0IGVsZW1lbnQuXG4gICAgcmV0dXJuIHBhcmVudC5ob3N0O1xuICB9XG4gIHJldHVybiBwYXJlbnQ7XG59XG5cblxuLy8gRXhwb3NlcyB0aGUgY29uc3RydWN0b3JzIGdsb2JhbGx5Llxud2luZG93LkludGVyc2VjdGlvbk9ic2VydmVyID0gSW50ZXJzZWN0aW9uT2JzZXJ2ZXI7XG53aW5kb3cuSW50ZXJzZWN0aW9uT2JzZXJ2ZXJFbnRyeSA9IEludGVyc2VjdGlvbk9ic2VydmVyRW50cnk7XG5cbn0od2luZG93LCBkb2N1bWVudCkpO1xuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbDtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKSxcbiAgICBnZXRSYXdUYWcgPSByZXF1aXJlKCcuL19nZXRSYXdUYWcnKSxcbiAgICBvYmplY3RUb1N0cmluZyA9IHJlcXVpcmUoJy4vX29iamVjdFRvU3RyaW5nJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBudWxsVGFnID0gJ1tvYmplY3QgTnVsbF0nLFxuICAgIHVuZGVmaW5lZFRhZyA9ICdbb2JqZWN0IFVuZGVmaW5lZF0nO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1Ub1N0cmluZ1RhZyA9IFN5bWJvbCA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgZ2V0VGFnYCB3aXRob3V0IGZhbGxiYWNrcyBmb3IgYnVnZ3kgZW52aXJvbm1lbnRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGB0b1N0cmluZ1RhZ2AuXG4gKi9cbmZ1bmN0aW9uIGJhc2VHZXRUYWcodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZFRhZyA6IG51bGxUYWc7XG4gIH1cbiAgcmV0dXJuIChzeW1Ub1N0cmluZ1RhZyAmJiBzeW1Ub1N0cmluZ1RhZyBpbiBPYmplY3QodmFsdWUpKVxuICAgID8gZ2V0UmF3VGFnKHZhbHVlKVxuICAgIDogb2JqZWN0VG9TdHJpbmcodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VHZXRUYWc7XG4iLCIvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCAmJiBnbG9iYWwuT2JqZWN0ID09PSBPYmplY3QgJiYgZ2xvYmFsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZyZWVHbG9iYWw7XG4iLCJ2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyk7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBuYXRpdmVPYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1Ub1N0cmluZ1RhZyA9IFN5bWJvbCA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VHZXRUYWdgIHdoaWNoIGlnbm9yZXMgYFN5bWJvbC50b1N0cmluZ1RhZ2AgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHJhdyBgdG9TdHJpbmdUYWdgLlxuICovXG5mdW5jdGlvbiBnZXRSYXdUYWcodmFsdWUpIHtcbiAgdmFyIGlzT3duID0gaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgc3ltVG9TdHJpbmdUYWcpLFxuICAgICAgdGFnID0gdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuXG4gIHRyeSB7XG4gICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdW5kZWZpbmVkO1xuICAgIHZhciB1bm1hc2tlZCA9IHRydWU7XG4gIH0gY2F0Y2ggKGUpIHt9XG5cbiAgdmFyIHJlc3VsdCA9IG5hdGl2ZU9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICBpZiAodW5tYXNrZWQpIHtcbiAgICBpZiAoaXNPd24pIHtcbiAgICAgIHZhbHVlW3N5bVRvU3RyaW5nVGFnXSA9IHRhZztcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIHZhbHVlW3N5bVRvU3RyaW5nVGFnXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRSYXdUYWc7XG4iLCIvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgbmF0aXZlT2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nIHVzaW5nIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiBuYXRpdmVPYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RUb1N0cmluZztcbiIsInZhciBmcmVlR2xvYmFsID0gcmVxdWlyZSgnLi9fZnJlZUdsb2JhbCcpO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHNlbGZgLiAqL1xudmFyIGZyZWVTZWxmID0gdHlwZW9mIHNlbGYgPT0gJ29iamVjdCcgJiYgc2VsZiAmJiBzZWxmLk9iamVjdCA9PT0gT2JqZWN0ICYmIHNlbGY7XG5cbi8qKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8IGZyZWVTZWxmIHx8IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gcm9vdDtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBub3cgPSByZXF1aXJlKCcuL25vdycpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpO1xuXG4vKiogRXJyb3IgbWVzc2FnZSBjb25zdGFudHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXG4gICAgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXG4gKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcbiAqIGludm9rZWQuIFRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgIG1ldGhvZCB0byBjYW5jZWxcbiAqIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLlxuICogUHJvdmlkZSBgb3B0aW9uc2AgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb24gdGhlXG4gKiBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkXG4gKiB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50XG4gKiBjYWxscyB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYFxuICogaW52b2NhdGlvbi5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzXG4gKiBpbnZva2VkIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIGRlYm91bmNlZCBmdW5jdGlvblxuICogaXMgaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIElmIGB3YWl0YCBpcyBgMGAgYW5kIGBsZWFkaW5nYCBpcyBgZmFsc2VgLCBgZnVuY2AgaW52b2NhdGlvbiBpcyBkZWZlcnJlZFxuICogdW50aWwgdG8gdGhlIG5leHQgdGljaywgc2ltaWxhciB0byBgc2V0VGltZW91dGAgd2l0aCBhIHRpbWVvdXQgb2YgYDBgLlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwczovL2Nzcy10cmlja3MuY29tL2RlYm91bmNpbmctdGhyb3R0bGluZy1leHBsYWluZWQtZXhhbXBsZXMvKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy5kZWJvdW5jZWAgYW5kIGBfLnRocm90dGxlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdXG4gKiAgVGhlIG1heGltdW0gdGltZSBgZnVuY2AgaXMgYWxsb3dlZCB0byBiZSBkZWxheWVkIGJlZm9yZSBpdCdzIGludm9rZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGRlYm91bmNlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQXZvaWQgY29zdGx5IGNhbGN1bGF0aW9ucyB3aGlsZSB0aGUgd2luZG93IHNpemUgaXMgaW4gZmx1eC5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUnLCBfLmRlYm91bmNlKGNhbGN1bGF0ZUxheW91dCwgMTUwKSk7XG4gKlxuICogLy8gSW52b2tlIGBzZW5kTWFpbGAgd2hlbiBjbGlja2VkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHMuXG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBFbnN1cmUgYGJhdGNoTG9nYCBpcyBpbnZva2VkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzLlxuICogdmFyIGRlYm91bmNlZCA9IF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwgeyAnbWF4V2FpdCc6IDEwMDAgfSk7XG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIGRlYm91bmNlZCk7XG4gKlxuICogLy8gQ2FuY2VsIHRoZSB0cmFpbGluZyBkZWJvdW5jZWQgaW52b2NhdGlvbi5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGRlYm91bmNlZC5jYW5jZWwpO1xuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsYXN0QXJncyxcbiAgICAgIGxhc3RUaGlzLFxuICAgICAgbWF4V2FpdCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHRpbWVySWQsXG4gICAgICBsYXN0Q2FsbFRpbWUsXG4gICAgICBsYXN0SW52b2tlVGltZSA9IDAsXG4gICAgICBsZWFkaW5nID0gZmFsc2UsXG4gICAgICBtYXhpbmcgPSBmYWxzZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICB3YWl0ID0gdG9OdW1iZXIod2FpdCkgfHwgMDtcbiAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xuICAgIG1heGluZyA9ICdtYXhXYWl0JyBpbiBvcHRpb25zO1xuICAgIG1heFdhaXQgPSBtYXhpbmcgPyBuYXRpdmVNYXgodG9OdW1iZXIob3B0aW9ucy5tYXhXYWl0KSB8fCAwLCB3YWl0KSA6IG1heFdhaXQ7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZUZ1bmModGltZSkge1xuICAgIHZhciBhcmdzID0gbGFzdEFyZ3MsXG4gICAgICAgIHRoaXNBcmcgPSBsYXN0VGhpcztcblxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxlYWRpbmdFZGdlKHRpbWUpIHtcbiAgICAvLyBSZXNldCBhbnkgYG1heFdhaXRgIHRpbWVyLlxuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICAvLyBTdGFydCB0aGUgdGltZXIgZm9yIHRoZSB0cmFpbGluZyBlZGdlLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgLy8gSW52b2tlIHRoZSBsZWFkaW5nIGVkZ2UuXG4gICAgcmV0dXJuIGxlYWRpbmcgPyBpbnZva2VGdW5jKHRpbWUpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtYWluaW5nV2FpdCh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZSxcbiAgICAgICAgdGltZVdhaXRpbmcgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nXG4gICAgICA/IG5hdGl2ZU1pbih0aW1lV2FpdGluZywgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpXG4gICAgICA6IHRpbWVXYWl0aW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGlmICh0aW1lcklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICB9XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgICAgIHJldHVybiBpbnZva2VGdW5jKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZGVib3VuY2VkLmNhbmNlbCA9IGNhbmNlbDtcbiAgZGVib3VuY2VkLmZsdXNoID0gZmx1c2g7XG4gIHJldHVybiBkZWJvdW5jZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZGVib3VuY2U7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZVxuICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICogb2YgYE9iamVjdGAuIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc09iamVjdDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0TGlrZTtcbiIsInZhciBiYXNlR2V0VGFnID0gcmVxdWlyZSgnLi9fYmFzZUdldFRhZycpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHN5bWJvbCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgYmFzZUdldFRhZyh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1N5bWJvbDtcbiIsInZhciByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKipcbiAqIEdldHMgdGhlIHRpbWVzdGFtcCBvZiB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZVxuICogdGhlIFVuaXggZXBvY2ggKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IERhdGVcbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIHRpbWVzdGFtcC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xuICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xuICogfSwgXy5ub3coKSk7XG4gKiAvLyA9PiBMb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBpbnZvY2F0aW9uLlxuICovXG52YXIgbm93ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiByb290LkRhdGUubm93KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vdztcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UuICovXG52YXIgcmVUcmltID0gL15cXHMrfFxccyskL2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IHR5cGVvZiB2YWx1ZS52YWx1ZU9mID09ICdmdW5jdGlvbicgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UocmVUcmltLCAnJyk7XG4gIHZhciBpc0JpbmFyeSA9IHJlSXNCaW5hcnkudGVzdCh2YWx1ZSk7XG4gIHJldHVybiAoaXNCaW5hcnkgfHwgcmVJc09jdGFsLnRlc3QodmFsdWUpKVxuICAgID8gZnJlZVBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCBpc0JpbmFyeSA/IDIgOiA4KVxuICAgIDogKHJlSXNCYWRIZXgudGVzdCh2YWx1ZSkgPyBOQU4gOiArdmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvTnVtYmVyO1xuIiwiKFxuICAvKipcbiAgICogSW50ZXJmYWNlIGZvciBldmVudCBzdWJzY3JpcHRpb24uXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIHZhciBOYW5vRXZlbnRzID0gcmVxdWlyZSgnbmFub2V2ZW50cycpXG4gICAqXG4gICAqIGNsYXNzIFRpY2tlciB7XG4gICAqICAgY29uc3RydWN0b3IoKSB7XG4gICAqICAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpXG4gICAqICAgfVxuICAgKiAgIG9uKCkge1xuICAgKiAgICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmV2ZW50cywgYXJndW1lbnRzKVxuICAgKiAgIH1cbiAgICogICB0aWNrKCkge1xuICAgKiAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3RpY2snKVxuICAgKiAgIH1cbiAgICogfVxuICAgKlxuICAgKiBAYWxpYXMgTmFub0V2ZW50c1xuICAgKiBAY2xhc3NcbiAgICovXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gTmFub0V2ZW50cyAoKSB7XG4gICAgLyoqXG4gICAgICogRXZlbnQgbmFtZXMgaW4ga2V5cyBhbmQgYXJyYXlzIHdpdGggbGlzdGVuZXJzIGluIHZhbHVlcy5cbiAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBPYmplY3Qua2V5cyhlZS5ldmVudHMpXG4gICAgICpcbiAgICAgKiBAYWxpYXMgTmFub0V2ZW50cyNldmVudHNcbiAgICAgKi9cbiAgICB0aGlzLmV2ZW50cyA9IHsgfVxuICB9XG4pLnByb3RvdHlwZSA9IHtcblxuICAvKipcbiAgICogQ2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAgICogQHBhcmFtIHsuLi4qfSBhcmd1bWVudHMgVGhlIGFyZ3VtZW50cyBmb3IgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGVlLmVtaXQoJ3RpY2snLCB0aWNrVHlwZSwgdGlja0R1cmF0aW9uKVxuICAgKlxuICAgKiBAYWxpYXMgTmFub0V2ZW50cyNlbWl0XG4gICAqIEBtZXRob2RcbiAgICovXG4gIGVtaXQ6IGZ1bmN0aW9uIGVtaXQgKGV2ZW50KSB7XG4gICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICAvLyBBcnJheS5wcm90b3R5cGUuY2FsbCgpIHJldHVybnMgZW1wdHkgYXJyYXkgaWYgY29udGV4dCBpcyBub3QgYXJyYXktbGlrZVxuICAgIDtbXS5zbGljZS5jYWxsKHRoaXMuZXZlbnRzW2V2ZW50XSB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uIChpKSB7XG4gICAgICBpLmFwcGx5KHRoaXMsIGFyZ3MpIC8vIHRoaXMgPT09IGdsb2JhbCBvciB3aW5kb3dcbiAgICB9KVxuICB9LFxuXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9ufSBVbmJpbmQgbGlzdGVuZXIgZnJvbSBldmVudC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogY29uc3QgdW5iaW5kID0gZWUub24oJ3RpY2snLCAodGlja1R5cGUsIHRpY2tEdXJhdGlvbikgPT4ge1xuICAgKiAgIGNvdW50ICs9IDFcbiAgICogfSlcbiAgICpcbiAgICogZGlzYWJsZSAoKSB7XG4gICAqICAgdW5iaW5kKClcbiAgICogfVxuICAgKlxuICAgKiBAYWxpYXMgTmFub0V2ZW50cyNvblxuICAgKiBAbWV0aG9kXG4gICAqL1xuICBvbjogZnVuY3Rpb24gb24gKGV2ZW50LCBjYikge1xuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nICYmIHR5cGVvZiBjYiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKVxuICAgIH1cblxuICAgICh0aGlzLmV2ZW50c1tldmVudF0gPSB0aGlzLmV2ZW50c1tldmVudF0gfHwgW10pLnB1c2goY2IpXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0gdGhpcy5ldmVudHNbZXZlbnRdLmZpbHRlcihmdW5jdGlvbiAoaSkge1xuICAgICAgICByZXR1cm4gaSAhPT0gY2JcbiAgICAgIH0pXG4gICAgfS5iaW5kKHRoaXMpXG4gIH1cbn1cbiIsIi8qKlxuICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzLlxuICpcbiAqIEBwYXJhbSB7TmFub0V2ZW50c30gZW1pdHRlciBOYW5vRXZlbnRzIGluc3RhbmNlLlxuICpcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gKlxuICogQGV4YW1wbGVcbiAqIHVuYmluZEFsbChlbWl0dGVyKVxuICovXG5mdW5jdGlvbiB1bmJpbmRBbGwgKGVtaXR0ZXIpIHtcbiAgZW1pdHRlci5ldmVudHMgPSB7IH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1bmJpbmRBbGxcbiIsInZhciBnO1xuXG4vLyBUaGlzIHdvcmtzIGluIG5vbi1zdHJpY3QgbW9kZVxuZyA9IChmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXM7XG59KSgpO1xuXG50cnkge1xuXHQvLyBUaGlzIHdvcmtzIGlmIGV2YWwgaXMgYWxsb3dlZCAoc2VlIENTUClcblx0ZyA9IGcgfHwgbmV3IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKTtcbn0gY2F0Y2ggKGUpIHtcblx0Ly8gVGhpcyB3b3JrcyBpZiB0aGUgd2luZG93IHJlZmVyZW5jZSBpcyBhdmFpbGFibGVcblx0aWYgKHR5cGVvZiB3aW5kb3cgPT09IFwib2JqZWN0XCIpIGcgPSB3aW5kb3c7XG59XG5cbi8vIGcgY2FuIHN0aWxsIGJlIHVuZGVmaW5lZCwgYnV0IG5vdGhpbmcgdG8gZG8gYWJvdXQgaXQuLi5cbi8vIFdlIHJldHVybiB1bmRlZmluZWQsIGluc3RlYWQgb2Ygbm90aGluZyBoZXJlLCBzbyBpdCdzXG4vLyBlYXNpZXIgdG8gaGFuZGxlIHRoaXMgY2FzZS4gaWYoIWdsb2JhbCkgeyAuLi59XG5cbm1vZHVsZS5leHBvcnRzID0gZztcbiIsImltcG9ydCB7TmF2aWdhdG9yfSBmcm9tICcuL25hdmlnYXRvcic7XG5pbXBvcnQge1BhZ2luYXRvcn0gZnJvbSAnLi9wYWdpbmF0b3InO1xuaW1wb3J0IHtWaWV3aW5hdG9yfSBmcm9tICcuL3ZpZXdpbmF0b3InO1xuaW1wb3J0IHtab29taW5hdG9yfSBmcm9tICcuL3pvb21pbmF0b3InO1xuaW1wb3J0IHtSb3RhdG9yfSBmcm9tICcuL3JvdGF0b3InO1xuXG52YXIgQ29udHJvbCA9IHt9O1xuQ29udHJvbC5OYXZpZ2F0b3IgPSBOYXZpZ2F0b3I7XG5Db250cm9sLlBhZ2luYXRvciA9IFBhZ2luYXRvcjtcbkNvbnRyb2wuVmlld2luYXRvciA9IFZpZXdpbmF0b3I7XG5Db250cm9sLlpvb21pbmF0b3IgPSBab29taW5hdG9yO1xuQ29udHJvbC5Sb3RhdG9yID0gUm90YXRvcjtcblxuZXhwb3J0IHtDb250cm9sfTtcbiIsImltcG9ydCBOYW5vRXZlbnRzIGZyb20gJ25hbm9ldmVudHMnO1xuXG5leHBvcnQgdmFyIE5hdmlnYXRvciA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIC8vIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgIHRoaXMuaW5wdXQgPSBvcHRpb25zLmlucHV0O1xuICAgIHRoaXMub3V0cHV0ID0gb3B0aW9ucy5vdXRwdXQ7XG4gICAgdGhpcy5yZWFkZXIgPSBvcHRpb25zLnJlYWRlcjtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmVtaXR0ZXIsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyKCdjdXJyZW50LXNlcScsIHRoaXMuaW5wdXQudmFsdWUpO1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3VwZGF0ZUxvY2F0aW9uJywgeyBzZXE6IHRoaXMuaW5wdXQudmFsdWUgfSk7XG4gICAgfSlcblxuICAgIHRoaXMucmVhZGVyLm9uKCdyZWxvY2F0ZWQnLCAocGFyYW1zKSA9PiB7XG4gICAgICB0aGlzLnJlbmRlcignY3VycmVudC1zZXEnLCBwYXJhbXMuc2VxKTtcbiAgICAgIHRoaXMuaW5wdXQudmFsdWUgPSBwYXJhbXMuc2VxO1xuICAgIH0pXG4gIH1cblxuICByZW5kZXIoc2xvdCwgdmFsdWUpIHtcbiAgICB2YXIgc3BhbiA9IHRoaXMub3V0cHV0LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXNsb3Q9XCIke3Nsb3R9XCJdYCk7XG4gICAgc3Bhbi5pbm5lclRleHQgPSB2YWx1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5cbmV4cG9ydCB2YXIgUGFnaW5hdG9yID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihvcHRpb25zPXt9KSB7XG4gICAgLy8gdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyk7XG4gICAgdGhpcy5pbnB1dCA9IG9wdGlvbnMuaW5wdXQ7XG4gICAgdGhpcy5yZWFkZXIgPSBvcHRpb25zLnJlYWRlcjtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmVtaXR0ZXIsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdGhpcy5pbnB1dC5xdWVyeVNlbGVjdG9yKCcjYWN0aW9uLWdvLW5leHQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgLy8gdGhpcy5lbWl0dGVyLmVtaXQoJ3VwZGF0ZUxvY2F0aW9uJywgeyBzZXE6IHRoaXMuaW5wdXQudmFsdWUgfSk7XG4gICAgICB0aGlzLnJlYWRlci5uZXh0KCk7XG4gICAgfSlcblxuICAgIHRoaXMuaW5wdXQucXVlcnlTZWxlY3RvcignI2FjdGlvbi1nby1wcmV2JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgIC8vIHRoaXMuZW1pdHRlci5lbWl0KCd1cGRhdGVMb2NhdGlvbicsIHsgc2VxOiB0aGlzLmlucHV0LnZhbHVlIH0pO1xuICAgICAgdGhpcy5yZWFkZXIucHJldigpO1xuICAgIH0pXG5cbiAgICB0aGlzLmlucHV0LnF1ZXJ5U2VsZWN0b3IoJyNhY3Rpb24tZ28tZmlyc3QnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgLy8gdGhpcy5lbWl0dGVyLmVtaXQoJ3VwZGF0ZUxvY2F0aW9uJywgeyBzZXE6IHRoaXMuaW5wdXQudmFsdWUgfSk7XG4gICAgICB0aGlzLnJlYWRlci5maXJzdCgpO1xuICAgIH0pXG5cbiAgICB0aGlzLmlucHV0LnF1ZXJ5U2VsZWN0b3IoJyNhY3Rpb24tZ28tbGFzdCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAvLyB0aGlzLmVtaXR0ZXIuZW1pdCgndXBkYXRlTG9jYXRpb24nLCB7IHNlcTogdGhpcy5pbnB1dC52YWx1ZSB9KTtcbiAgICAgIHRoaXMucmVhZGVyLmxhc3QoKTtcbiAgICB9KVxuXG4gIH1cblxuICByZW5kZXIoc2xvdCwgdmFsdWUpIHtcbiAgICB2YXIgc3BhbiA9IHRoaXMub3V0cHV0LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXNsb3Q9XCIke3Nsb3R9XCJdYCk7XG4gICAgc3Bhbi5pbm5lclRleHQgPSB2YWx1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5cbmV4cG9ydCB2YXIgUm90YXRvciA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIC8vIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgIHRoaXMuc2NhbGUgPSBwYXJzZUludChvcHRpb25zLnNjYWxlIHx8IDEuMCwgMTApO1xuICAgIHRoaXMuaW5wdXQgPSBvcHRpb25zLmlucHV0O1xuICAgIHRoaXMucmVhZGVyID0gb3B0aW9ucy5yZWFkZXI7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IE5hbm9FdmVudHMoKTtcbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgfVxuXG4gIG9uKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24uYXBwbHkodGhpcy5lbWl0dGVyLCBhcmd1bWVudHMpXG4gIH1cblxuICBiaW5kRXZlbnRzKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmlucHV0LmNvdW50ZXJjbG9ja3dpc2UgPSB0aGlzLmlucHV0LnF1ZXJ5U2VsZWN0b3IoJyNhY3Rpb24tcm90YXRlLWNvdW50ZXJjbG9ja3dpc2UnKTtcbiAgICB0aGlzLmlucHV0LmNvdW50ZXJjbG9ja3dpc2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgc2VsZi5lbWl0dGVyLmVtaXQoJ3JvdGF0ZScsIC05MCk7XG4gICAgfSlcblxuICAgIHRoaXMuaW5wdXQuY2xvY2t3aXNlID0gdGhpcy5pbnB1dC5xdWVyeVNlbGVjdG9yKCcjYWN0aW9uLXJvdGF0ZS1jbG9ja3dpc2UnKTtcbiAgICB0aGlzLmlucHV0LmNsb2Nrd2lzZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzZWxmLmVtaXR0ZXIuZW1pdCgncm90YXRlJywgOTApO1xuICAgIH0pXG5cbiAgICB0aGlzLnJlYWRlci5vbignY29uZmlndXJlJywgZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICBpZiAoIGNvbmZpZy5yb3RhdGUgPT09IGZhbHNlICkge1xuICAgICAgICB0aGlzLmlucHV0LmNvdW50ZXJjbG9ja3dpc2UuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmlucHV0LmNsb2Nrd2lzZS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyB2YXIgaWR4ID0gdGhpcy5wb3NzaWJsZXMuaW5kZXhPZih0aGlzLnNjYWxlKTtcbiAgICAgICAgdGhpcy5pbnB1dC5jb3VudGVyY2xvY2t3aXNlLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW5wdXQuY2xvY2t3aXNlLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxufVxuIiwiaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5cbmV4cG9ydCB2YXIgVmlld2luYXRvciA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIC8vIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgIHRoaXMuaW5wdXQgPSBvcHRpb25zLmlucHV0O1xuICAgIHRoaXMucmVhZGVyID0gb3B0aW9ucy5yZWFkZXI7XG4gICAgdGhpcy5lbWl0dGVyID0gbmV3IE5hbm9FdmVudHMoKTtcbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgfVxuXG4gIG9uKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24uYXBwbHkodGhpcy5lbWl0dGVyLCBhcmd1bWVudHMpXG4gIH1cblxuICBiaW5kRXZlbnRzKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYnV0dG9ucyA9IHRoaXMuaW5wdXQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdGFyZ2V0XScpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnV0dG9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGJ1dHRvbiA9IGJ1dHRvbnNbaV07XG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5kYXRhc2V0LnRhcmdldDtcbiAgICAgICAgc2VsZi5yZWFkZXIucmVzdGFydCh7IHZpZXc6IHRhcmdldCB9KTtcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cblxuICByZW5kZXIoc2xvdCwgdmFsdWUpIHtcbiAgICB2YXIgc3BhbiA9IHRoaXMub3V0cHV0LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXNsb3Q9XCIke3Nsb3R9XCJdYCk7XG4gICAgc3Bhbi5pbm5lclRleHQgPSB2YWx1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5cbmV4cG9ydCB2YXIgWm9vbWluYXRvciA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIC8vIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgIHRoaXMuc2NhbGUgPSBwYXJzZUludChvcHRpb25zLnNjYWxlIHx8IDEuMCwgMTApO1xuICAgIHRoaXMuaW5wdXQgPSBvcHRpb25zLmlucHV0O1xuICAgIHRoaXMucmVhZGVyID0gb3B0aW9ucy5yZWFkZXI7XG4gICAgLy8gdGhpcy5wb3NzaWJsZXMgPSBbIDAuNSwgMC43NSwgMS4wLCAxLjI1LCAxLjUsIDEuNzUsIDIuMCwgMy4wLCA0LjAgXTtcbiAgICB0aGlzLnBvc3NpYmxlcyA9IFsgMC43NSwgMS4wLCAxLjI1LCAxLjUgXTtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmVtaXR0ZXIsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuaW5wdXQuem9vbV9pbiA9IHRoaXMuaW5wdXQucXVlcnlTZWxlY3RvcignI2FjdGlvbi16b29tLWluJyk7XG4gICAgdGhpcy5pbnB1dC56b29tX2luLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBpZHggPSBzZWxmLnBvc3NpYmxlcy5pbmRleE9mKHNlbGYuc2NhbGUpO1xuICAgICAgaWR4ICs9IDE7XG4gICAgICBzZWxmLnVwZGF0ZShpZHgpO1xuICAgIH0pXG5cbiAgICB0aGlzLmlucHV0Lnpvb21fb3V0ID0gdGhpcy5pbnB1dC5xdWVyeVNlbGVjdG9yKCcjYWN0aW9uLXpvb20tb3V0Jyk7XG4gICAgdGhpcy5pbnB1dC56b29tX291dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB2YXIgaWR4ID0gc2VsZi5wb3NzaWJsZXMuaW5kZXhPZihzZWxmLnNjYWxlKTtcbiAgICAgIGlkeCAtPSAxO1xuICAgICAgc2VsZi51cGRhdGUoaWR4KTtcbiAgICB9KVxuXG4gICAgdGhpcy5yZWFkZXIub24oJ2NvbmZpZ3VyZScsIGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgaWYgKCBjb25maWcuem9vbSA9PT0gZmFsc2UgKSB7XG4gICAgICAgIHRoaXMuaW5wdXQuem9vbV9pbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5wdXQuem9vbV9vdXQuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGlkeCA9IHRoaXMucG9zc2libGVzLmluZGV4T2YodGhpcy5zY2FsZSk7XG4gICAgICAgIHRoaXMuaW5wdXQuem9vbV9pbi5kaXNhYmxlZCA9ICggaWR4ID09ICggdGhpcy5wb3NzaWJsZXMubGVuZ3RoIC0gMSApICk7XG4gICAgICAgIHRoaXMuaW5wdXQuem9vbV9vdXQuZGlzYWJsZWQgPSAoIGlkeCA9PSAwICk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHVwZGF0ZShpZHgpIHtcbiAgICB0aGlzLnNjYWxlID0gdGhpcy5wb3NzaWJsZXNbaWR4XTtcbiAgICB0aGlzLmlucHV0Lnpvb21faW4uZGlzYWJsZWQgPSAoIGlkeCA9PSAoIHRoaXMucG9zc2libGVzLmxlbmd0aCAtIDEgKSApO1xuICAgIHRoaXMuaW5wdXQuem9vbV9vdXQuZGlzYWJsZWQgPSAoIGlkeCA9PSAwICk7XG4gICAgdGhpcy5yZWFkZXIucmVzdGFydCh7IHNjYWxlOiB0aGlzLnNjYWxlIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgTmFub0V2ZW50cyBmcm9tICduYW5vZXZlbnRzJztcblxuZXhwb3J0IHZhciBNYW5pZmVzdCA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpO1xuICAgIHRoaXMudG90YWxTZXEgPSBwYXJzZUludChvcHRpb25zLnRvdGFsU2VxLCAxMCk7XG4gICAgdGhpcy5kZWZhdWx0U2VxID0gcGFyc2VJbnQob3B0aW9ucy5kZWZhdWx0U2VxLCAxMCk7XG4gICAgdGhpcy5maXJzdFNlcSA9IHBhcnNlSW50KG9wdGlvbnMuZmlyc3RTZXEsIDEwKTtcbiAgICB0aGlzLmRlZmF1bHRJbWFnZSA9IHtcbiAgICAgIGhlaWdodDogcGFyc2VJbnQob3B0aW9ucy5kZWZhdWx0SGVpZ2h0LCAxMCksXG4gICAgICB3aWR0aDogcGFyc2VJbnQob3B0aW9ucy5kZWZhdWx0V2lkdGgsIDEwKSxcbiAgICAgIHJvdGF0aW9uOiAwXG4gICAgfTtcbiAgICB0aGlzLmZlYXR1cmVMaXN0ID0gb3B0aW9ucy5mZWF0dXJlTGlzdDtcbiAgICB0aGlzLmZlYXR1cmVNYXAgPSB7fTtcbiAgICB0aGlzLmZlYXR1cmVMaXN0LmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdGhpcy5mZWF0dXJlTWFwW2l0ZW0uc2VxXSA9IGl0ZW07XG4gICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgdGhpcy5tYW5pZmVzdCA9IHt9O1xuICB9XG5cbiAgdXBkYXRlKHNlcSwgbWV0YSkge1xuICAgIGlmICggbWV0YS5yb3RhdGlvbiAhPSBudWxsICYmIG1ldGEud2lkdGggPT09IHVuZGVmaW5lZCApIHtcbiAgICAgIC8vIGp1c3QgdXBkYXRpbmcgcm90YXRpb25cbiAgICAgIHRoaXMubWFuaWZlc3Rbc2VxXS5yb3RhdGlvbiA9IG1ldGEucm90YXRpb247XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIC4uLiB3aGljaCB3aWxsIGhlbHAgd2l0aCBzd2l0Y2hpbmcgbGFuZXMgYW5kIHJvdGF0aW5nXG4gICAgaWYgKCB0aGlzLm1hbmlmZXN0W3NlcV0gJiYgdGhpcy5tYW5pZmVzdFtzZXFdLndpZHRoICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIHJhdGlvID0gdGhpcy5kZWZhdWx0SW1hZ2Uud2lkdGggLyBtZXRhLndpZHRoO1xuICAgIHRoaXMubWFuaWZlc3Rbc2VxXSA9IHtcbiAgICAgIHdpZHRoOiB0aGlzLmRlZmF1bHRJbWFnZS53aWR0aCxcbiAgICAgIGhlaWdodDogbWV0YS5oZWlnaHQgKiByYXRpbyxcbiAgICAgIHJvdGF0aW9uOiBtZXRhLnJvdGF0aW9uIHx8IDBcbiAgICB9XG4gIH1cblxuICBtZXRhKHNlcSkge1xuICAgIGlmICggdGhpcy5tYW5pZmVzdFtzZXFdICkge1xuICAgICAgdmFyIG1ldGEgPSB0aGlzLm1hbmlmZXN0W3NlcV07XG4gICAgICBpZiAoIG1ldGEucm90YXRpb24gJSAxODAgIT0gMCApIHtcbiAgICAgICAgcmV0dXJuIHsgaGVpZ2h0OiBtZXRhLndpZHRoLCB3aWR0aDogbWV0YS5oZWlnaHQsIHJvdGF0aW9uOiBtZXRhLnJvdGF0aW9uIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWV0YTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVmYXVsdEltYWdlO1xuICB9XG5cbiAgcm90YXRlQnkoc2VxLCBkZWx0YSkge1xuICAgIHZhciByb3RhdGlvbjtcbiAgICAvLyB0aGlzIHNob3VsZG4ndCBoYXBwZW5cbiAgICBpZiAoICEgdGhpcy5tYW5pZmVzdFtzZXFdICkgeyByZXR1cm47IH1cbiAgICByb3RhdGlvbiA9IHRoaXMubWFuaWZlc3Rbc2VxXS5yb3RhdGlvbjtcbiAgICBpZiAoIHJvdGF0aW9uID09IDAgKSB7IHJvdGF0aW9uID0gMzYwOyB9XG4gICAgcm90YXRpb24gKz0gZGVsdGE7XG4gICAgcm90YXRpb24gPSByb3RhdGlvbiAlIDM2MDtcbiAgICB0aGlzLm1hbmlmZXN0W3NlcV0ucm90YXRpb24gPSByb3RhdGlvbjtcbiAgfVxufVxuXG5leHBvcnQgdmFyIFNlcnZpY2UgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICB0aGlzLm1hbmlmZXN0ID0gbmV3IE1hbmlmZXN0KG9wdGlvbnMubWFuaWZlc3QpO1xuICAgIHRoaXMuaWRlbnRpZmllciA9IG9wdGlvbnMuaWRlbnRpZmllcjtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICB9XG5cbiAgdGh1bWJuYWlsKG9wdGlvbnM9e30pIHtcbiAgICB2YXIgd2lkdGggPSAyNTA7IC8vIG9uZSBzaXplIGZpdHMgYWxsXG4gICAgdmFyIG1ldGEgPSB0aGlzLm1hbmlmZXN0Lm1ldGEob3B0aW9ucy5zZXEpO1xuICAgIHZhciByb3RhdGlvbiA9IG1ldGEucm90YXRpb24gfHwgMDtcbiAgICByZXR1cm4gYC9jZ2kvaW1nc3J2L3RodW1ibmFpbD9pZD0ke3RoaXMuaWRlbnRpZmllcn07c2VxPSR7b3B0aW9ucy5zZXF9O3dpZHRoPSR7d2lkdGh9O3JvdGF0aW9uPSR7cm90YXRpb259YDtcbiAgfVxuXG4gIGltYWdlKG9wdGlvbnM9e30pIHtcbiAgICB2YXIgYWN0aW9uID0gJ2ltYWdlJzsgLy8gb3B0aW9ucy5tb2RlID09ICd0aHVtYm5haWwnID8gJ3RodW1ibmFpbCcgOiAnaW1hZ2UnO1xuICAgIHZhciBwYXJhbSA9IHRoaXMuYmVzdEZpdChvcHRpb25zKTtcbiAgICB2YXIgbWV0YSA9IHRoaXMubWFuaWZlc3QubWV0YShvcHRpb25zLnNlcSk7XG4gICAgdmFyIHJvdGF0aW9uID0gbWV0YS5yb3RhdGlvbiB8fCAwO1xuICAgIHJldHVybiBgL2NnaS9pbWdzcnYvJHthY3Rpb259P2lkPSR7dGhpcy5pZGVudGlmaWVyfTtzZXE9JHtvcHRpb25zLnNlcX07JHtwYXJhbS5wYXJhbX09JHtwYXJhbS52YWx1ZX07cm90YXRpb249JHtyb3RhdGlvbn1gO1xuICB9XG5cbiAgaHRtbChvcHRpb25zPXt9KSB7XG4gICAgcmV0dXJuIGAvY2dpL2ltZ3Nydi9odG1sP2lkPSR7dGhpcy5pZGVudGlmaWVyfTtzZXE9JHtvcHRpb25zLnNlcX1gO1xuICB9XG5cbiAgb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbi5hcHBseSh0aGlzLmVtaXR0ZXIsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG5cbiAgfVxuXG4gIGJlc3RGaXQocGFyYW1zKSB7XG4gICAgdmFyIHBvc3NpYmxlcyA9IFs1MCwgNzUsIDEwMCwgMTI1LCAxNTAsIDE3NSwgMjAwXTtcbiAgICB2YXIgcmV0dmFsID0ge307XG4gICAgaWYgKCBwYXJhbXMud2lkdGggKSB7XG4gICAgICByZXR2YWwucGFyYW0gPSAnc2l6ZSc7XG4gICAgICByZXR2YWwudmFsdWUgPSBwb3NzaWJsZXMuZmluZChmdW5jdGlvbihwb3NzaWJsZSkge1xuICAgICAgICB2YXIgY2hlY2sgPSA2ODAgKiAoIHBvc3NpYmxlIC8gMTAwLjAgKTtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy53aWR0aCA8PSBjaGVjaztcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmICggcGFyYW1zLmhlaWdodCApIHtcbiAgICAgIHJldHZhbC5wYXJhbSA9ICdoZWlnaHQnO1xuICAgICAgcmV0dmFsLnZhbHVlID0gcGFyYW1zLmhlaWdodDtcbiAgICB9XG4gICAgcmV0dXJuIHJldHZhbDtcbiAgfVxuXG59O1xuIiwiaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5pbXBvcnQgdW5iaW5kQWxsIGZyb20gJ25hbm9ldmVudHMvdW5iaW5kLWFsbCc7XG5cbmV4cG9ydCB2YXIgQmFzZSA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucz17fSkge1xuICAgIHRoaXMuc2VydmljZSA9IG9wdGlvbnMuc2VydmljZTtcbiAgICB0aGlzLnJlYWRlciA9IG9wdGlvbnMucmVhZGVyO1xuICAgIHRoaXMuc2NhbGUgPSBvcHRpb25zLnNjYWxlIHx8IDEuMDtcbiAgICB0aGlzLm1vZGUgPSAnc2Nyb2xsJztcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuX2hhbmRsZXJzID0ge307XG4gICAgdGhpcy5pZCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gIH1cblxuICBhdHRhY2hUbyhlbGVtZW50LCBjYikge1xuICAgIHRoaXMuY29udGFpbmVyID0gZWxlbWVudDtcbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB0aGlzLnJlbmRlcihjYik7XG4gIH1cblxuICByZW5kZXIoY2IpIHtcbiAgICB2YXIgbWluV2lkdGggPSB0aGlzLm1pbldpZHRoKCk7XG4gICAgdmFyIHNjYWxlID0gdGhpcy5zY2FsZTtcbiAgICBmb3IodmFyIHNlcSA9IDE7IHNlcSA8PSB0aGlzLnNlcnZpY2UubWFuaWZlc3QudG90YWxTZXE7IHNlcSsrKSB7XG5cbiAgICAgIHZhciBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgIHZhciBtZXRhID0gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0Lm1ldGEoc2VxKTtcbiAgICAgIHZhciByYXRpbyA9IG1ldGEuaGVpZ2h0IC8gbWV0YS53aWR0aDtcblxuICAgICAgdmFyIGggPSBtaW5XaWR0aCAqIHJhdGlvICogc2NhbGU7XG4gICAgICB2YXIgdyA9IG1pbldpZHRoICogc2NhbGU7XG4gICAgICAvLyBpZiAoIG1ldGEucm90YXRpb24gJSAxODAgIT0gMCApIHtcbiAgICAgIC8vICAgdyA9IG1pbldpZHRoICogcmF0aW8gKiBzY2FsZTtcbiAgICAgIC8vICAgaCA9IG1pbldpZHRoICogc2NhbGU7XG4gICAgICAvLyB9XG5cbiAgICAgIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7aH1weGA7XG4gICAgICBwYWdlLnN0eWxlLndpZHRoID0gYCR7d31weGA7XG4gICAgICBwYWdlLmRhdGFzZXQuYmVzdEZpdCA9ICggc2NhbGUgPD0gMSApO1xuXG4gICAgICBwYWdlLmNsYXNzTGlzdC5hZGQoJ3BhZ2UnKTtcbiAgICAgIHBhZ2UuZGF0YXNldC5zZXEgPSBzZXE7XG4gICAgICBwYWdlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicGFnZS10ZXh0XCI+PC9kaXY+PGRpdiBjbGFzcz1cImluZm9cIj4ke3NlcX08L2Rpdj5gO1xuICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQocGFnZSk7XG4gICAgfVxuXG4gICAgdmFyIHBhZ2VzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2UnKTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgcGFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuYmluZFBhZ2VFdmVudHMocGFnZXNbaV0pO1xuICAgICAgLy8gaWYgKCB0aGlzLm1vZGUgPT0gJ2ltYWdlJyApIHtcbiAgICAgIC8vICAgcGFnZXNbaV0uZGF0YXNldC52aXNpYmxlID0gZmFsc2U7XG4gICAgICAvLyAgIHRoaXMub2JzZXJ2ZXIuaW5hY3RpdmUgPSB0cnVlO1xuICAgICAgLy8gfSBlbHNlIHtcbiAgICAgIC8vICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKHBhZ2VzW2ldKTtcbiAgICAgIC8vIH1cbiAgICB9XG5cbiAgICB0aGlzLmlzX2FjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5sb2FkSW1hZ2UodGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtc2VxPVwiMVwiXScpLCB0cnVlKTtcbiAgICBpZiAoIGNiICkge1xuICAgICAgY2IoKTtcbiAgICB9XG4gIH1cblxuICByZXNpemVQYWdlKHBhZ2UpIHtcbiAgICB2YXIgY2FudmFzID0gcGFnZS5xdWVyeVNlbGVjdG9yKCdpbWcnKTtcbiAgICBpZiAoICEgY2FudmFzICkgeyByZXR1cm4gOyB9XG5cbiAgICBpZiAoIHBhZ2UuZGF0YXNldC5sb2FkaW5nICE9PSAnZmFsc2UnICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBib3VuZHMgPSB0aGlzLmNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgcmVjdCA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBpZiAoIGNhbnZhcy5oZWlnaHQgPCBwYXJzZUludChwYWdlLnN0eWxlLmhlaWdodCwgMTApICkge1xuICAgICAgY29uc29sZS5sb2coXCJBSE9ZIHNocmlua2luZ1wiLCBwYWdlLmRhdGFzZXQuc2VxLCBwYWdlLnN0eWxlLmhlaWdodCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICAgIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7Y2FudmFzLmhlaWdodH1weGA7XG4gICAgdmFyIHVwZGF0ZWRfcmVjdCA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHNjcm9sbFRvcCA9IHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcDtcblxuICAgIHRoaXMuX3Bvc3RSZXNpemVQYWdlKHJlY3QsIGJvdW5kcyk7XG4gIH1cblxuICBfcG9zdFJlc2l6ZVBhZ2UocmVjdCwgYm91bmRzKSB7XG5cbiAgfVxuXG4gIGxvYWRJbWFnZShwYWdlLCBjaGVja19zY3JvbGwpIHtcbiAgICBpZiAoICEgdGhpcy5pc19hY3RpdmUgKSB7IHJldHVybiA7IH1cbiAgICB2YXIgc2VxID0gcGFnZS5kYXRhc2V0LnNlcTtcbiAgICB2YXIgcmVjdCA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIkFIT1kgTE9BRElOR1wiLCBzZXEpO1xuXG4gICAgdmFyIGltYWdlX3VybCA9IHRoaXMuaW1hZ2VVcmwocGFnZSk7XG4gICAgdmFyIGh0bWxfdXJsID0gdGhpcy5zZXJ2aWNlLmh0bWwoeyBzZXE6IHNlcSB9KTtcblxuICAgIGlmICggcGFnZS5xdWVyeVNlbGVjdG9yKCdpbWcnKSApIHtcbiAgICAgIC8vIHByZWxvYWRJbWFnZXMocGFnZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCBwYWdlLmRhdGFzZXQubG9hZGluZyA9PSBcInRydWVcIiApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaHRtbF9yZXF1ZXN0O1xuICAgIGlmICggZmFsc2UgJiYgdGhpcy5lbWJlZEh0bWwpIHtcbiAgICAgIGh0bWxfcmVxdWVzdCA9IGZldGNoKGh0bWxfdXJsKTtcbiAgICB9XG5cbiAgICB2YXIgcGFnZV9oZWlnaHQgPSBwYWdlLm9mZnNldEhlaWdodDtcbiAgICB2YXIgcGFnZV93aWR0aCA9IHBhZ2Uub2Zmc2V0V2lkdGg7XG5cbiAgICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgaW1nLmFsdCA9IGBQYWdlIHNjYW4gb2Ygc2VxdWVuY2UgJHtzZXF9YDtcblxuICAgIHBhZ2UuZGF0YXNldC5sb2FkaW5nID0gdHJ1ZTtcbiAgICBpbWcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIF9pbWdIYW5kbGVyKCkge1xuICAgICAgcGFnZS5kYXRhc2V0LmxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgdGhpcy5zZXJ2aWNlLm1hbmlmZXN0LnVwZGF0ZShzZXEsIHsgd2lkdGg6IGltZy53aWR0aCwgaGVpZ2h0OiBpbWcuaGVpZ2h0IH0pO1xuXG4gICAgICB2YXIgaW1hZ2VBc3BlY3RSYXRpbyA9IGltZy53aWR0aCAvIGltZy5oZWlnaHQ7XG4gICAgICBpbWcuc3R5bGUud2lkdGggPSBwYWdlX3dpZHRoO1xuICAgICAgaW1nLnN0eWxlLmhlaWdodCA9IHBhZ2Vfd2lkdGggLyBpbWFnZUFzcGVjdFJhdGlvO1xuICAgICAgcGFnZS5hcHBlbmRDaGlsZChpbWcpO1xuICAgICAgcGFnZS5kYXRhc2V0LmxvYWRlZCA9IHRydWU7XG5cbiAgICAgIGlmICggaHRtbF9yZXF1ZXN0ICkge1xuICAgICAgICBodG1sX3JlcXVlc3RcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgICAgIHZhciBwYWdlX3RleHQgPSBwYWdlLnF1ZXJ5U2VsZWN0b3IoJy5wYWdlLXRleHQnKTtcbiAgICAgICAgICAgIHBhZ2VfdGV4dC5pbm5lckhUTUwgPSB0ZXh0O1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIGNoZWNrX3Njcm9sbCB8fCB0aGlzLm1vZGUgPT0gJ3RodW1ibmFpbCcgKSB7IHRoaXMucmVzaXplUGFnZShwYWdlKTsgfVxuICAgICAgaW1nLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBfaW1nSGFuZGxlciwgdHJ1ZSk7XG4gICAgfS5iaW5kKHRoaXMpLCB0cnVlKVxuXG4gICAgaW1nLnNyYyA9IGltYWdlX3VybDtcblxuICAgIGlmICggISBwYWdlLmRhdGFzZXQucHJlbG9hZGVkICkge1xuICAgICAgdGhpcy5wcmVsb2FkSW1hZ2VzKHBhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIHJlZHJhd1BhZ2UocGFnZSkge1xuICAgIGlmICggdHlwZW9mKHBhZ2UpID09IFwibnVtYmVyXCIgfHwgdHlwZW9mKHBhZ2UpID09IFwic3RyaW5nXCIgKSB7XG4gICAgICBwYWdlID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgW2RhdGEtc2VxPVwiJHtwYWdlfVwiXWApO1xuICAgIH1cbiAgICB2YXIgaW1hZ2VfdXJsID0gdGhpcy5pbWFnZVVybChwYWdlKTtcbiAgICB2YXIgaW1nID0gcGFnZS5xdWVyeVNlbGVjdG9yKCdpbWcnKTtcbiAgICB2YXIgbmV3X2ltZyA9IG5ldyBJbWFnZSgpO1xuICAgIG5ld19pbWcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIF9yZWRyYXdIYW5kbGVyKCkge1xuICAgICAgcGFnZS5yZXBsYWNlQ2hpbGQobmV3X2ltZywgaW1nKTtcbiAgICAgIHRoaXMucmVzaXplUGFnZShwYWdlKTtcbiAgICAgIG5ld19pbWcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIF9yZWRyYXdIYW5kbGVyLCB0cnVlKTtcbiAgICB9LmJpbmQodGhpcyksIHRydWUpO1xuICAgIG5ld19pbWcuc3JjID0gaW1hZ2VfdXJsO1xuICB9XG5cbiAgdW5sb2FkSW1hZ2UocGFnZSkge1xuICAgIGlmICggcGFnZS5kYXRhc2V0LnByZWxvYWRlZCA9PSBcInRydWVcIiApIHsgcmV0dXJuOyB9XG4gICAgaWYgKCBwYWdlLmRhdGFzZXQubG9hZGluZyA9PSBcInRydWVcIiApIHsgcmV0dXJuIDsgfVxuICAgIHZhciBjYW52YXMgPSBwYWdlLnF1ZXJ5U2VsZWN0b3IoJ2ltZycpO1xuICAgIGlmICggY2FudmFzICkge1xuICAgICAgcGFnZS5yZW1vdmVDaGlsZChjYW52YXMpO1xuICAgIH1cbiAgICB2YXIgcGFnZV90ZXh0ID0gcGFnZS5xdWVyeVNlbGVjdG9yKCcucGFnZS10ZXh0Jyk7XG4gICAgcGFnZV90ZXh0LmlubmVySFRNTCA9ICcnO1xuICAgIHBhZ2UuZGF0YXNldC5wcmVsb2FkZWQgPSBmYWxzZTtcbiAgICBwYWdlLmRhdGFzZXQubG9hZGVkID0gZmFsc2U7XG4gIH1cblxuICBwcmVsb2FkSW1hZ2VzKHBhZ2UpIHtcbiAgICB2YXIgc2VxID0gcGFyc2VJbnQocGFnZS5kYXRhc2V0LnNlcSwgMTApO1xuICAgIHZhciBkZWx0YSA9IDE7XG4gICAgd2hpbGUgKCBkZWx0YSA8PSAxICkge1xuICAgICAgdmFyIHByZXZfcGFnZSA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYC5wYWdlW2RhdGEtc2VxPVwiJHtzZXEgLSBkZWx0YX1cIl1gKTtcbiAgICAgIGlmICggcHJldl9wYWdlICkge1xuICAgICAgICBwcmV2X3BhZ2UuZGF0YXNldC5wcmVsb2FkZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmxvYWRJbWFnZShwcmV2X3BhZ2UpO1xuICAgICAgfVxuICAgICAgZGVsdGEgKz0gMTtcbiAgICB9XG4gICAgZGVsdGEgPSAxO1xuICAgIHdoaWxlICggZGVsdGEgPD0gMSApIHtcbiAgICAgIHZhciBuZXh0X3BhZ2UgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7c2VxICsgZGVsdGF9XCJdYCk7XG4gICAgICBpZiAoIG5leHRfcGFnZSApIHtcbiAgICAgICAgbmV4dF9wYWdlLmRhdGFzZXQucHJlbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sb2FkSW1hZ2UobmV4dF9wYWdlKTtcbiAgICAgIH1cbiAgICAgIGRlbHRhICs9IDE7XG4gICAgfVxuICB9XG5cbiAgaW1hZ2VVcmwocGFyYW1zKSB7XG4gICAgaWYgKCBwYXJhbXMgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCApIHtcbiAgICAgIHZhciBlbGVtZW50ID0gcGFyYW1zOyBwYXJhbXMgPSB7fTtcbiAgICAgIHBhcmFtcy5zZXEgPSBlbGVtZW50LmRhdGFzZXQuc2VxO1xuICAgICAgcGFyYW1zLndpZHRoID0gZWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICB9XG4gICAgLy8gaWYgKCB0aGlzLnJlYWRlci5wYWdlZGV0YWlscy5yb3RhdGVbcGFyYW1zLnNlcV0gKSB7XG4gICAgLy8gICBwYXJhbXMucm90YXRpb24gPSB0aGlzLnJlYWRlci5wYWdlZGV0YWlscy5yb3RhdGVbcGFyYW1zLnNlcV07XG4gICAgLy8gfVxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuaW1hZ2UocGFyYW1zKTtcbiAgfVxuXG4gIG1pbldpZHRoKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5wYXJlbnROb2RlLm9mZnNldFdpZHRoICogMC44MDtcbiAgfVxuXG4gIG9uKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24uYXBwbHkodGhpcy5lbWl0dGVyLCBhcmd1bWVudHMpXG4gIH1cblxuICBiaW5kRXZlbnRzKCkge1xuICB9XG5cbiAgYmluZFBhZ2VFdmVudHMocGFnZSkge1xuICB9XG5cbiAgY29uZmlnKCkge1xuICAgIC8vIHRoZSBlbXB0eSBzZXQgc3VwcG9ydHMgZXZlcnl0aGluZ1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgdW5iaW5kQWxsKHRoaXMuZW1pdHRlcik7XG4gIH1cblxufVxuXG4iLCJpbXBvcnQgTmFub0V2ZW50cyBmcm9tICduYW5vZXZlbnRzJztcbmltcG9ydCB7QmFzZX0gZnJvbSAnLi9iYXNlJztcblxuaW1wb3J0IGRlYm91bmNlIGZyb20gJ2xvZGFzaC9kZWJvdW5jZSc7XG5cbmV4cG9ydCB2YXIgRmxpcCA9IGNsYXNzIGV4dGVuZHMgQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgICB0aGlzLm1vZGUgPSAnaW1hZ2UnO1xuICAgIHRoaXMuZW1iZWRIdG1sID0gdHJ1ZTtcbiAgICB0aGlzLnNldHVwU2xpY2VzKCk7XG4gICAgdGhpcy5pc19hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIHNldHVwU2xpY2VzKCkge1xuICAgIHRoaXMuc2VxMnNsaWNlID0ge307XG4gICAgdGhpcy5zbGljZXMgPSBbXTtcbiAgICB0aGlzLnNsaWNlcy5wdXNoKFsgbnVsbCwgMSBdKTtcbiAgICB0aGlzLnNlcTJzbGljZVsxXSA9IDA7XG4gICAgZm9yKHZhciBzZXEgPSAyOyBzZXEgPD0gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0LnRvdGFsU2VxOyBzZXEgKz0gMikge1xuICAgICAgdmFyIG5leHRfc2VxID0gc2VxICsgMTtcbiAgICAgIGlmICggbmV4dF9zZXEgPiB0aGlzLnNlcnZpY2UubWFuaWZlc3QudG90YWxTZXEgKSB7XG4gICAgICAgIG5leHRfc2VxID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2xpY2VzLnB1c2goWyBzZXEsIG5leHRfc2VxIF0pO1xuICAgICAgdGhpcy5zZXEyc2xpY2Vbc2VxXSA9IHRoaXMuc2xpY2VzLmxlbmd0aCAtIDE7XG4gICAgICBpZiAoIG5leHRfc2VxICkgeyB0aGlzLnNlcTJzbGljZVtuZXh0X3NlcV0gPSB0aGlzLnNsaWNlcy5sZW5ndGggLSAxOyB9XG4gICAgfVxuXG4gIH1cblxuICByZW5kZXIoY2IpIHtcbiAgICB2YXIgbWluV2lkdGggPSB0aGlzLm1pbldpZHRoKCk7XG4gICAgbWluV2lkdGggLz0gMjtcblxuICAgIC8vIHJldHVybjtcblxuICAgIHZhciBtYXhIZWlnaHQgPSB0aGlzLmNvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiAwLjk1O1xuICAgIGNvbnNvbGUubG9nKFwiQUhPWSBBSE9ZXCIsIG1heEhlaWdodCk7XG4gICAgdGhpcy5jb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoJy0tcGFnZS1oZWlnaHQnLCBgJHttYXhIZWlnaHQgKiB0aGlzLnNjYWxlfXB4YCk7XG4gICAgdGhpcy5jb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoJy0tc2xpY2Utd2lkdGgnLCBgJHt0aGlzLmNvbnRhaW5lci5vZmZzZXRXaWR0aCAqIHRoaXMuc2NhbGV9cHhgKTtcblxuICAgIHZhciBtYXhfZWRnZV93aWR0aCA9IDA7XG4gICAgdmFyIG1heF9zbGljZV93aWR0aCA9IDA7XG5cbiAgICB2YXIgc2NhbGUgPSB0aGlzLnNjYWxlO1xuXG4gICAgLy8gZ3JvdXAgaW50byBwYWdlc1xuICAgIHZhciBzbGljZXMgPSB0aGlzLnNsaWNlcztcblxuICAgIGZvcih2YXIgc2xpY2VfaWR4ID0gMDsgc2xpY2VfaWR4IDwgc2xpY2VzLmxlbmd0aDsgc2xpY2VfaWR4KysgKSB7XG4gICAgICB2YXIgdHVwbGUgPSBzbGljZXNbc2xpY2VfaWR4XTtcblxuICAgICAgdmFyIHNsaWNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBzbGljZS5jbGFzc0xpc3QuYWRkKCdzbGljZScpO1xuXG4gICAgICB2YXIgZWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZWRnZS5jbGFzc0xpc3QuYWRkKCdlZGdlJywgJ3ZlcnNvJyk7XG4gICAgICBlZGdlLnN0eWxlLnNldFByb3BlcnR5KCctLWZyYWN0aW9uJywgc2xpY2VfaWR4IC8gc2xpY2VzLmxlbmd0aCk7XG4gICAgICAvLyBlZGdlLnN0eWxlLndpZHRoID0gYCR7KHNsaWNlX2lkeCAvIHNsaWNlcy5sZW5ndGgpICogbWF4X2VkZ2Vfd2lkdGh9cHhgO1xuICAgICAgc2xpY2UuYXBwZW5kQ2hpbGQoZWRnZSk7XG5cbiAgICAgIHZhciBwYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBwYWdlLmNsYXNzTGlzdC5hZGQoJ3BhZ2UnKTtcbiAgICAgIHBhZ2UuY2xhc3NMaXN0LmFkZCgndmVyc28nKTtcblxuICAgICAgdmFyIHNlcTtcbiAgICAgIHZhciBzbGljZV93aWR0aCA9IDA7XG4gICAgICB2YXIgc2xpY2VfaGVpZ2h0ID0gMDtcbiAgICAgIGlmICggdHVwbGVbMF0gKSB7XG4gICAgICAgIHNlcSA9IHR1cGxlWzBdO1xuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuc2VydmljZS5tYW5pZmVzdC5tZXRhKHR1cGxlWzBdKTtcbiAgICAgICAgdmFyIHJhdGlvID0gbWV0YS5oZWlnaHQgLyBtZXRhLndpZHRoO1xuICAgICAgICAvLyBwYWdlLnN0eWxlLmhlaWdodCA9IGAke21pbldpZHRoICogcmF0aW8gKiBzY2FsZX1weGA7XG4gICAgICAgIC8vIHBhZ2Uuc3R5bGUud2lkdGggPSBgJHttaW5XaWR0aCAqIHNjYWxlfXB4YDtcblxuICAgICAgICBwYWdlLnN0eWxlLnNldFByb3BlcnR5KCctLXBhZ2UtcmF0aW8nLCBtZXRhLndpZHRoIC8gbWV0YS5oZWlnaHQpO1xuICAgICAgICAvLyBwYWdlLnN0eWxlLmhlaWdodCA9IGAke21heEhlaWdodCAqIHNjYWxlfXB4YDtcbiAgICAgICAgLy8gcGFnZS5zdHlsZS53aWR0aCA9IGAke21heEhlaWdodCAqIHNjYWxlIC8gcmF0aW99cHhgO1xuXG4gICAgICAgIHNsaWNlX2hlaWdodCA9IG1heEhlaWdodCAqIHNjYWxlO1xuICAgICAgICBzbGljZV93aWR0aCA9IG1heEhlaWdodCAqIHNjYWxlIC8gcmF0aW87XG5cbiAgICAgICAgcGFnZS5kYXRhc2V0LmJlc3RGaXQgPSAoIHNjYWxlIDw9IDEgKTtcblxuICAgICAgICBwYWdlLmRhdGFzZXQuc2VxID0gc2VxO1xuICAgICAgICBwYWdlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicGFnZS10ZXh0XCI+PC9kaXY+PGRpdiBjbGFzcz1cImluZm9cIj4ke3NlcX08L2Rpdj5gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG1ldGEgPSB0aGlzLnNlcnZpY2UubWFuaWZlc3QubWV0YSgxKTtcbiAgICAgICAgdmFyIHJhdGlvID0gbWV0YS5oZWlnaHQgLyBtZXRhLndpZHRoO1xuICAgICAgICBwYWdlLnN0eWxlLnNldFByb3BlcnR5KCctLXBhZ2UtcmF0aW8nLCBtZXRhLndpZHRoIC8gbWV0YS5oZWlnaHQpO1xuXG4gICAgICAgIC8vIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7bWF4SGVpZ2h0ICogc2NhbGV9cHhgO1xuICAgICAgICAvLyBwYWdlLnN0eWxlLndpZHRoID0gYCR7bWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpb31weGA7XG5cbiAgICAgICAgcGFnZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInBhZ2UtdGV4dFwiPjwvZGl2PjxkaXYgY2xhc3M9XCJpbmZvXCI+TklMPC9kaXY+YDtcbiAgICAgICAgc2xpY2Vfd2lkdGggPSBtYXhIZWlnaHQgKiBzY2FsZSAvIHJhdGlvO1xuICAgICAgfVxuICAgICAgc2xpY2UuYXBwZW5kQ2hpbGQocGFnZSk7XG5cbiAgICAgIHBhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHBhZ2UuY2xhc3NMaXN0LmFkZCgncGFnZScpO1xuICAgICAgcGFnZS5jbGFzc0xpc3QuYWRkKCdyZWN0bycpO1xuICAgICAgaWYgKCB0dXBsZVsxXSApIHtcbiAgICAgICAgc2VxID0gdHVwbGVbMV07XG4gICAgICAgIHZhciBtZXRhID0gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0Lm1ldGEodHVwbGVbMV0pO1xuICAgICAgICB2YXIgcmF0aW8gPSBtZXRhLmhlaWdodCAvIG1ldGEud2lkdGg7XG4gICAgICAgIC8vIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7bWluV2lkdGggKiByYXRpbyAqIHNjYWxlfXB4YDtcbiAgICAgICAgLy8gcGFnZS5zdHlsZS53aWR0aCA9IGAke21pbldpZHRoICogc2NhbGV9cHhgO1xuXG4gICAgICAgIHBhZ2Uuc3R5bGUuc2V0UHJvcGVydHkoJy0tcGFnZS1yYXRpbycsIG1ldGEud2lkdGggLyBtZXRhLmhlaWdodCk7XG5cbiAgICAgICAgLy8gcGFnZS5zdHlsZS5oZWlnaHQgPSBgJHttYXhIZWlnaHQgKiBzY2FsZX1weGA7XG4gICAgICAgIC8vIHBhZ2Uuc3R5bGUud2lkdGggPSBgJHttYXhIZWlnaHQgKiBzY2FsZSAvIHJhdGlvfXB4YDtcbiAgICAgICAgcGFnZS5kYXRhc2V0LmJlc3RGaXQgPSAoIHNjYWxlIDw9IDEgKTtcblxuICAgICAgICBzbGljZV9oZWlnaHQgPSBzbGljZV9oZWlnaHQgfHwgKCBtYXhIZWlnaHQgKiBzY2FsZSApO1xuICAgICAgICBzbGljZV93aWR0aCArPSAoIG1heEhlaWdodCAqIHNjYWxlIC8gcmF0aW8gKTtcblxuICAgICAgICBwYWdlLmRhdGFzZXQuc2VxID0gc2VxO1xuICAgICAgICBwYWdlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicGFnZS10ZXh0XCI+PC9kaXY+PGRpdiBjbGFzcz1cImluZm9cIj4ke3NlcX08L2Rpdj5gO1xuICAgICAgICBzbGljZS5hcHBlbmRDaGlsZChwYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtZXRhID0gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0Lm1ldGEoMSk7XG4gICAgICAgIHZhciByYXRpbyA9IG1ldGEuaGVpZ2h0IC8gbWV0YS53aWR0aDtcblxuICAgICAgICBwYWdlLnN0eWxlLnNldFByb3BlcnR5KCctLXBhZ2UtcmF0aW8nLCBtZXRhLndpZHRoIC8gbWV0YS5oZWlnaHQpO1xuXG4gICAgICAgIC8vIHBhZ2Uuc3R5bGUuaGVpZ2h0ID0gYCR7bWF4SGVpZ2h0ICogc2NhbGV9cHhgO1xuICAgICAgICAvLyBwYWdlLnN0eWxlLndpZHRoID0gYCR7bWF4SGVpZ2h0ICogc2NhbGUgLyByYXRpb31weGA7XG5cbiAgICAgICAgc2xpY2Vfd2lkdGggKz0gKCBtYXhIZWlnaHQgKiBzY2FsZSAvIHJhdGlvICk7XG5cbiAgICAgICAgcGFnZS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInBhZ2UtdGV4dFwiPjwvZGl2PjxkaXYgY2xhc3M9XCJpbmZvXCI+TklMPC9kaXY+YDtcbiAgICAgIH1cbiAgICAgIHNsaWNlLmFwcGVuZENoaWxkKHBhZ2UpO1xuXG4gICAgICBpZiAoIHRoaXMuc2NhbGUgPiAxLjAgKSB7XG4gICAgICAgIC8vIHNsaWNlLnN0eWxlLmhlaWdodCA9IGAke3NsaWNlX2hlaWdodH1weGA7XG4gICAgICAgIC8vIHNsaWNlLnN0eWxlLndpZHRoID0gYCR7c2xpY2Vfd2lkdGggKiAxLjJ9cHhgO1xuICAgICAgICAvLyBzbGljZS5zdHlsZS53aWR0aCA9IGAke3RoaXMuYFxuICAgICAgfVxuXG4gICAgICBpZiAoIG1heF9zbGljZV93aWR0aCA8IHNsaWNlX3dpZHRoICkge1xuICAgICAgICBtYXhfc2xpY2Vfd2lkdGggPSBzbGljZV93aWR0aDtcbiAgICAgIH1cblxuICAgICAgZWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZWRnZS5jbGFzc0xpc3QuYWRkKCdlZGdlJywgJ3JlY3RvJyk7XG4gICAgICBlZGdlLnN0eWxlLnNldFByb3BlcnR5KCctLWZyYWN0aW9uJywgKCggc2xpY2VzLmxlbmd0aCAtIHNsaWNlX2lkeCApIC8gc2xpY2VzLmxlbmd0aCkpO1xuXG4gICAgICAvLyBlZGdlLnN0eWxlLndpZHRoID0gYCR7KCggc2xpY2VzLmxlbmd0aCAtIHNsaWNlX2lkeCApIC8gc2xpY2VzLmxlbmd0aCkgKiBtYXhfZWRnZV93aWR0aH1weGA7XG4gICAgICAvLyBlZGdlLnN0eWxlLmhlaWdodCA9IGAke3NsaWNlX2hlaWdodCAqIDAuOTV9cHhgOyAvLyB0aGlzIGlzIGNvbXBsaWNhdGVkXG5cbiAgICAgIHNsaWNlLmFwcGVuZENoaWxkKGVkZ2UpO1xuICAgICAgLy8gc2xpY2UucXVlcnlTZWxlY3RvcignLmVkZ2UudmVyc28nKS5zdHlsZS5oZWlnaHQgPSBlZGdlLnN0eWxlLmhlaWdodDtcblxuICAgICAgc2xpY2UuZGF0YXNldC52aXNpYmxlID0gZmFsc2U7XG4gICAgICBzbGljZS5kYXRhc2V0LnNsaWNlID0gc2xpY2VfaWR4O1xuXG4gICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChzbGljZSk7XG4gICAgfVxuXG4gICAgdmFyIG1heF9lZGdlX3dpZHRoID0gKCAoIHRoaXMuY29udGFpbmVyLm9mZnNldFdpZHRoIC0gKCBtYXhfc2xpY2Vfd2lkdGggLyB0aGlzLnNjYWxlICkgKSAqIDAuODUgKSAvIDI7XG4gICAgdmFyIHBhZ2VfZmFjdG9yID0gMTA7XG4gICAgdmFyIGVkZ2Vfd2lkdGggPSAzICogTWF0aC5jZWlsKHRoaXMuc2VydmljZS5tYW5pZmVzdC50b3RhbFNlcSAvIHBhZ2VfZmFjdG9yKTtcbiAgICBpZiAoIGVkZ2Vfd2lkdGggPiBtYXhfZWRnZV93aWR0aCApIHsgZWRnZV93aWR0aCA9IG1heF9lZGdlX3dpZHRoOyB9XG4gICAgdGhpcy5jb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoJy0tZWRnZS13aWR0aCcsIGAke2VkZ2Vfd2lkdGh9cHhgKTtcblxuICAgIHRoaXMuaXNfYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmxvYWRTbGljZSh0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuc2xpY2UnKSk7XG4gICAgaWYgKCBjYiApIHtcbiAgICAgIGNiKCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXCJBSE9ZIEFIT1kgUkVOREVSXCIsIHRoaXMuY29udGFpbmVyLm9mZnNldEhlaWdodCk7XG4gIH1cblxuICBpbWFnZVVybChwYXJhbXMpIHtcbiAgICBpZiAoIHBhcmFtcyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICkge1xuICAgICAgdmFyIGVsZW1lbnQgPSBwYXJhbXM7IHBhcmFtcyA9IHt9O1xuICAgICAgcGFyYW1zLnNlcSA9IGVsZW1lbnQuZGF0YXNldC5zZXE7XG4gICAgICBwYXJhbXMuaGVpZ2h0ID0gZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNlcnZpY2UuaW1hZ2UocGFyYW1zKTtcbiAgfVxuXG4gIGxvYWRTbGljZShzbGljZSkge1xuICAgIHZhciBwYWdlcyA9IHNsaWNlLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYWdlW2RhdGEtc2VxXScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5sb2FkSW1hZ2UocGFnZXNbaV0sIHRydWUpO1xuICAgIH1cbiAgICBzbGljZS5kYXRhc2V0LnZpc2libGUgPSB0cnVlO1xuICB9XG5cbiAgdW5sb2FkU2xpY2Uoc2xpY2UpIHtcblxuICB9XG5cbiAgcmVzaXplUGFnZShwYWdlKSB7XG4gIH1cblxuICBkaXNwbGF5KHNlcSkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnNsaWNlW2RhdGEtdmlzaWJsZT1cInRydWVcIl1gKTtcbiAgICB2YXIgc2xpY2VfaWR4ID0gdGhpcy5zZXEyc2xpY2Vbc2VxXTtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnNsaWNlW2RhdGEtc2xpY2U9XCIke3NsaWNlX2lkeH1cIl1gKTtcbiAgICAvLyB2YXIgdGFyZ2V0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcX1cIl1gKTtcbiAgICBpZiAoICEgdGFyZ2V0ICkgeyByZXR1cm47IH1cblxuICAgIGlmICggY3VycmVudCApIHtcbiAgICAgIGN1cnJlbnQuZGF0YXNldC52aXNpYmxlID0gZmFsc2U7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnVubG9hZFNsaWNlKGN1cnJlbnQpO1xuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIHRhcmdldC5kYXRhc2V0LnZpc2libGUgPSB0cnVlO1xuICAgIHRoaXMubG9hZFNsaWNlKHRhcmdldCk7XG4gICAgLy8gdGhpcy5sb2FkSW1hZ2UodGFyZ2V0LCB0cnVlKTtcbiAgICB0aGlzLnJlYWRlci5lbWl0KCdyZWxvY2F0ZWQnLCB7IHNlcTogdGhpcy5zbGljZTJzZXEoc2xpY2VfaWR4KSB9KTtcbiAgICB0aGlzLmN1cnJlbnRTZXEgPSBzZXE7XG4gIH1cblxuICBzbGljZTJzZXEoc2xpY2VfaWR4KSB7XG4gICAgdmFyIHR1cGxlID0gdGhpcy5zbGljZXNbc2xpY2VfaWR4XTtcbiAgICBpZiAoIHR1cGxlWzBdICkgeyByZXR1cm4gdHVwbGVbMF07IH1cbiAgICByZXR1cm4gdHVwbGVbMV07XG4gIH1cblxuICBjdXJyZW50TG9jYXRpb24oKSB7XG4gICAgdmFyIHNsaWNlID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignLnNsaWNlW2RhdGEtdmlzaWJsZT1cInRydWVcIl0nKTtcbiAgICB2YXIgcGFnZSA9IHNsaWNlLnF1ZXJ5U2VsZWN0b3IoJy5wYWdlW2RhdGEtc2VxXScpO1xuICAgIHJldHVybiBwYWdlLmRhdGFzZXQuc2VxO1xuICB9XG5cbiAgY3VycmVudExvY2F0aW9uWFgoKSB7XG4gICAgcmV0dXJuIDE7XG4gICAgdmFyIGN1cnJlbnRfcGVyY2VudGFnZSA9IDA7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3A7XG4gICAgdmFyIHZpc2libGUgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZVtkYXRhLWxvYWRlZD1cInRydWVcIl0nKTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdmlzaWJsZS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhZ2UgPSB2aXNpYmxlW2ldO1xuICAgICAgdmFyIHBhZ2VfYm91bmRzID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmICggcGFnZS5vZmZzZXRUb3AgPiAoIHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSApIHsgY29udGludWU7IH1cbiAgICAgIGlmICggY3VycmVudF9wZXJjZW50YWdlIDwgMS4wICYmIHBhZ2Uub2Zmc2V0VG9wID49IHNjcm9sbFRvcCAmJiAocGFnZS5vZmZzZXRUb3AgKyBwYWdlX2JvdW5kcy5oZWlnaHQpIDw9IHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSB7XG4gICAgICAgIGN1cnJlbnRfcGVyY2VudGFnZSA9IDEuMDtcbiAgICAgICAgY3VycmVudCA9IHBhZ2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgeTEgPSBNYXRoLmFicyhzY3JvbGxUb3AgLSBwYWdlLm9mZnNldFRvcCk7XG4gICAgICB2YXIgeTIgPSBNYXRoLmFicyggKCBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkgLSAoIHBhZ2Uub2Zmc2V0VG9wICsgcGFnZV9ib3VuZHMuaGVpZ2h0ICkgKTtcbiAgICAgIHZhciBoID0gcGFnZV9ib3VuZHMuaGVpZ2h0IC0geTEgLSB5MjtcbiAgICAgIHZhciBwZXJjZW50YWdlID0gaCAvIGJvdW5kcy5oZWlnaHQ7XG4gICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAwICkgeyBjb250aW51ZTsgfVxuICAgICAgaWYgKCBwZXJjZW50YWdlID4gY3VycmVudF9wZXJjZW50YWdlICkge1xuICAgICAgICBjdXJyZW50X3BlcmNlbnRhZ2UgPSBwZXJjZW50YWdlO1xuICAgICAgICBjdXJyZW50ID0gcGFnZTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBjdXJyZW50TG9jYXRpb25cIiwgcGFnZS5kYXRhc2V0LnNlcSwgcGVyY2VudGFnZSk7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50LmRhdGFzZXQuc2VxO1xuICB9XG5cbiAgbmV4dCgpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgPSAwO1xuICAgIHZhciBkZWx0YSA9IHRoaXMuY3VycmVudFNlcSA9PSAxID8gMSA6IDI7XG4gICAgdGhpcy5kaXNwbGF5KHRoaXMuY3VycmVudFNlcSArIGRlbHRhKTtcbiAgfVxuXG4gIHByZXYoKSB7XG4gICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMDtcbiAgICB2YXIgZGVsdGEgPSAyOyAvLyB0aGlzLmN1cnJlbnRTZXEgPT0gdGhpcy5zZXJ2aWNlLm1hbmlmZXN0LnRvdGFsU2VxID8gMSA6IDI7XG4gICAgdmFyIHNlcSA9IHRoaXMuY3VycmVudFNlcSAtIGRlbHRhO1xuICAgIGlmICggc2VxIDw9IDAgKSB7IHNlcSA9IDE7IH1cbiAgICB0aGlzLmRpc3BsYXkoc2VxKTtcbiAgfVxuXG4gIF9wb3N0UmVzaXplUGFnZShib3VuZHMsIHJlY3QpIHtcbiAgICBpZiAoIHJlY3QuYm90dG9tIDw9IGJvdW5kcy5ib3R0b20gJiYgcmVjdC50b3AgPCAwICkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgZGVsdGEgPSB1cGRhdGVkX3JlY3QuaGVpZ2h0IC0gcmVjdC5oZWlnaHQ7XG4gICAgICAgIGlmICggdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID09IHNjcm9sbFRvcCApIHtcbiAgICAgICAgICAvLyBkZWx0YSAvPSB0aGlzLnNldHRpbmdzLnNjYWxlO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQUhPWSBhZnRlclJlc2l6ZWRcIiwgdmlldy5pbmRleCwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wLCB2aWV3LmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0LCByZWN0LmhlaWdodCwgZGVsdGEgLyB0aGlzLnNldHRpbmdzLnNjYWxlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgKz0gTWF0aC5jZWlsKGRlbHRhKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgYWZ0ZXJSZXNpemVkXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHNjcm9sbFRvcCwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wLCBkZWx0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIGRvbm90UmVzaXplZFwiLCBwYWdlLmRhdGFzZXQuc2VxLCBzY3JvbGxUb3AsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgZGVsdGEpO1xuICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcyksIDUwMCk7XG4gICAgfVxuICB9XG5cbiAgbWluV2lkdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLm9mZnNldFdpZHRoO1xuICB9XG5cbiAgcHJlbG9hZEltYWdlcyhwYWdlKSB7XG4gICAgdmFyIHNlcSA9IHBhcnNlSW50KHBhZ2UuZGF0YXNldC5zZXEsIDEwKTtcbiAgICB2YXIgZGVsdGEgPSAxO1xuICAgIHdoaWxlICggZGVsdGEgPD0gMiApIHtcbiAgICAgIHZhciBwcmV2X3BhZ2UgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7c2VxIC0gZGVsdGF9XCJdYCk7XG4gICAgICBpZiAoIHByZXZfcGFnZSApIHtcbiAgICAgICAgcHJldl9wYWdlLmRhdGFzZXQucHJlbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sb2FkSW1hZ2UocHJldl9wYWdlLCB0cnVlKTtcbiAgICAgIH1cbiAgICAgIGRlbHRhICs9IDE7XG4gICAgfVxuICAgIGRlbHRhID0gMTtcbiAgICB3aGlsZSAoIGRlbHRhIDw9IDIgKSB7XG4gICAgICB2YXIgbmV4dF9wYWdlID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcSArIGRlbHRhfVwiXWApO1xuICAgICAgaWYgKCBuZXh0X3BhZ2UgKSB7XG4gICAgICAgIG5leHRfcGFnZS5kYXRhc2V0LnByZWxvYWRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMubG9hZEltYWdlKG5leHRfcGFnZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICBkZWx0YSArPSAxO1xuICAgIH1cbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc3VwZXIuYmluZEV2ZW50cygpO1xuXG4gICAgdGhpcy5fcmVzaXplciA9IGRlYm91bmNlKGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5jb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoJy0tcGFnZS1oZWlnaHQnLCBgJHtzZWxmLmNvbnRhaW5lci5vZmZzZXRIZWlnaHQgKiAwLjk1ICogc2VsZi5zY2FsZX1weGApO1xuICAgICAgc2VsZi5jb250YWluZXIuc3R5bGUuc2V0UHJvcGVydHkoJy0tc2xpY2Utd2lkdGgnLCBgJHtzZWxmLmNvbnRhaW5lci5vZmZzZXRXaWR0aCAqIHNlbGYuc2NhbGV9cHhgKVxuICAgICAgY29uc29sZS5sb2coXCJBSE9ZIGZsaXAucmVzaXplXCIsIHNlbGYuY29udGFpbmVyLnN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy0tcGFnZS1oZWlnaHQnKSk7XG4gICAgfSwgNTApO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuX3Jlc2l6ZXIpO1xuXG4gIH1cblxuICBiaW5kUGFnZUV2ZW50cyhwYWdlKSB7XG4gICAgcGFnZS5wYXJlbnRFbGVtZW50LmRhdGFzZXQudmlzaWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgdmFyIHBhZ2VzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLnNsaWNlJyk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHBhZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZChwYWdlc1tpXSk7XG4gICAgfVxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLl9yZXNpemVyKTtcbiAgfVxuXG4gIGNvbmZpZygpIHtcbiAgICB2YXIgcmV0dmFsID0gc3VwZXIuY29uZmlnKCk7XG4gICAgcmV0dmFsLnJvdGF0ZSA9IGZhbHNlO1xuICAgIHJldHVybiByZXR2YWw7XG4gIH1cblxufTtcbiIsImltcG9ydCBOYW5vRXZlbnRzIGZyb20gJ25hbm9ldmVudHMnO1xuaW1wb3J0IHtCYXNlfSBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgdmFyIFNpbmdsZSA9IGNsYXNzIGV4dGVuZHMgQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgICB0aGlzLm1vZGUgPSAnaW1hZ2UnO1xuICAgIHRoaXMuZW1iZWRIdG1sID0gdHJ1ZTtcbiAgfVxuXG4gIGRpc3BsYXkoc2VxKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXZpc2libGU9XCJ0cnVlXCJdYCk7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoYC5wYWdlW2RhdGEtc2VxPVwiJHtzZXF9XCJdYCk7XG4gICAgaWYgKCAhIHRhcmdldCApIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAoIGN1cnJlbnQgKSB7XG4gICAgICBjdXJyZW50LmRhdGFzZXQudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51bmxvYWRJbWFnZShjdXJyZW50KTtcbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9XG5cbiAgICB0YXJnZXQuZGF0YXNldC52aXNpYmxlID0gdHJ1ZTtcbiAgICB0aGlzLmxvYWRJbWFnZSh0YXJnZXQsIHRydWUpO1xuICAgIHRoaXMucmVhZGVyLmVtaXQoJ3JlbG9jYXRlZCcsIHsgc2VxOiB0YXJnZXQuZGF0YXNldC5zZXEgfSk7XG4gICAgdGhpcy5jdXJyZW50U2VxID0gc2VxO1xuICB9XG5cbiAgY3VycmVudExvY2F0aW9uKCkge1xuICAgIHZhciBjdXJyZW50X3BlcmNlbnRhZ2UgPSAwO1xuICAgIHZhciBjdXJyZW50O1xuICAgIHZhciBib3VuZHMgPSB0aGlzLmNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wO1xuICAgIHZhciB2aXNpYmxlID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLnBhZ2VbZGF0YS1sb2FkZWQ9XCJ0cnVlXCJdJyk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHZpc2libGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwYWdlID0gdmlzaWJsZVtpXTtcbiAgICAgIHZhciBwYWdlX2JvdW5kcyA9IHBhZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBpZiAoIHBhZ2Uub2Zmc2V0VG9wID4gKCBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkgKSB7IGNvbnRpbnVlOyB9XG4gICAgICBpZiAoIGN1cnJlbnRfcGVyY2VudGFnZSA8IDEuMCAmJiBwYWdlLm9mZnNldFRvcCA+PSBzY3JvbGxUb3AgJiYgKHBhZ2Uub2Zmc2V0VG9wICsgcGFnZV9ib3VuZHMuaGVpZ2h0KSA8PSBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkge1xuICAgICAgICBjdXJyZW50X3BlcmNlbnRhZ2UgPSAxLjA7XG4gICAgICAgIGN1cnJlbnQgPSBwYWdlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHkxID0gTWF0aC5hYnMoc2Nyb2xsVG9wIC0gcGFnZS5vZmZzZXRUb3ApO1xuICAgICAgdmFyIHkyID0gTWF0aC5hYnMoICggc2Nyb2xsVG9wICsgYm91bmRzLmhlaWdodCApIC0gKCBwYWdlLm9mZnNldFRvcCArIHBhZ2VfYm91bmRzLmhlaWdodCApICk7XG4gICAgICB2YXIgaCA9IHBhZ2VfYm91bmRzLmhlaWdodCAtIHkxIC0geTI7XG4gICAgICB2YXIgcGVyY2VudGFnZSA9IGggLyBib3VuZHMuaGVpZ2h0O1xuICAgICAgaWYgKCBwZXJjZW50YWdlIDwgMCApIHsgY29udGludWU7IH1cbiAgICAgIGlmICggcGVyY2VudGFnZSA+IGN1cnJlbnRfcGVyY2VudGFnZSApIHtcbiAgICAgICAgY3VycmVudF9wZXJjZW50YWdlID0gcGVyY2VudGFnZTtcbiAgICAgICAgY3VycmVudCA9IHBhZ2U7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhcIkFIT1kgY3VycmVudExvY2F0aW9uXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHBlcmNlbnRhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudC5kYXRhc2V0LnNlcTtcbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMDtcbiAgICB0aGlzLmRpc3BsYXkodGhpcy5jdXJyZW50U2VxICsgMSk7XG4gICAgLy8gdmFyIGN1cnJlbnQgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7dGhpcy5jdXJyZW50U2VxfVwiXWApO1xuICAgIC8vIHZhciBuZXh0ID0gY3VycmVudC5uZXh0U2libGluZ0VsZW1lbnQ7XG4gICAgLy8gaWYgKCBuZXh0ICkge1xuICAgIC8vICAgdGhpcy5kaXNwbGF5KG5leHQpO1xuICAgIC8vIH1cbiAgfVxuXG4gIHByZXYoKSB7XG4gICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID0gMDtcbiAgICB0aGlzLmRpc3BsYXkodGhpcy5jdXJyZW50U2VxIC0gMSk7XG4gIH1cblxuICBfcG9zdFJlc2l6ZVBhZ2UoYm91bmRzLCByZWN0KSB7XG4gICAgaWYgKCByZWN0LmJvdHRvbSA8PSBib3VuZHMuYm90dG9tICYmIHJlY3QudG9wIDwgMCApIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlbHRhID0gdXBkYXRlZF9yZWN0LmhlaWdodCAtIHJlY3QuaGVpZ2h0O1xuICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCA9PSBzY3JvbGxUb3AgKSB7XG4gICAgICAgICAgLy8gZGVsdGEgLz0gdGhpcy5zZXR0aW5ncy5zY2FsZTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgYWZ0ZXJSZXNpemVkXCIsIHZpZXcuaW5kZXgsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgdmlldy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCwgcmVjdC5oZWlnaHQsIGRlbHRhIC8gdGhpcy5zZXR0aW5ncy5zY2FsZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wICs9IE1hdGguY2VpbChkZWx0YSk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIGFmdGVyUmVzaXplZFwiLCBwYWdlLmRhdGFzZXQuc2VxLCBzY3JvbGxUb3AsIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCwgZGVsdGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBkb25vdFJlc2l6ZWRcIiwgcGFnZS5kYXRhc2V0LnNlcSwgc2Nyb2xsVG9wLCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AsIGRlbHRhKTtcbiAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpLCA1MDApO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVBhZ2VSb3RhdGlvbih0YXJnZXQsIHJvdGF0ZSkge1xuICAgIHZhciBtYXJnaW4gPSAoIHJvdGF0ZSAlIDE4MCA9PSAwICkgPyAwIDogKCB0YXJnZXQub2Zmc2V0SGVpZ2h0IC0gdGFyZ2V0Lm9mZnNldFdpZHRoICkgLyAyO1xuICAgIHRhcmdldC5kYXRhc2V0LnJvdGF0ZSA9IHJvdGF0ZTtcbiAgICB0YXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJy0tcm90YXRlJywgYCR7cm90YXRlfWRlZ2ApO1xuICAgIHRhcmdldC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1yb3RhdGUtbWFyZ2luJywgYC0ke21hcmdpbn1weGApO1xuICAgIHRoaXMucmVhZGVyLnBhZ2VkZXRhaWxzLnJvdGF0ZVt0YXJnZXQuZGF0YXNldC5zZXFdID0gcm90YXRlO1xuICB9XG5cbiAgYmluZEV2ZW50cygpIHtcbiAgICBzdXBlci5iaW5kRXZlbnRzKCk7XG4gICAgdGhpcy5faGFuZGxlcnMucm90YXRlID0gdGhpcy5yZWFkZXIub24oJ3JvdGF0ZScsIGZ1bmN0aW9uKGRlbHRhKSB7XG4gICAgICB2YXIgc2VxID0gc2VsZi5jdXJyZW50TG9jYXRpb24oKTtcbiAgICAgIHZhciB0YXJnZXQgPSBzZWxmLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGAucGFnZVtkYXRhLXNlcT1cIiR7c2VxfVwiXWApO1xuICAgICAgdmFyIHJvdGF0ZSA9IHBhcnNlSW50KHRhcmdldC5kYXRhc2V0LnJvdGF0ZSB8fCAwLCAxMCk7XG4gICAgICByb3RhdGUgKz0gZGVsdGE7XG4gICAgICByb3RhdGUgPSByb3RhdGUgJSAzNjA7XG4gICAgICBzZWxmLnVwZGF0ZVBhZ2VSb3RhdGlvbih0YXJnZXQsIHJvdGF0ZSk7XG4gICAgfSk7XG4gIH1cblxuICBiaW5kUGFnZUV2ZW50cyhwYWdlKSB7XG4gICAgcGFnZS5kYXRhc2V0LnZpc2libGUgPSBmYWxzZTtcbiAgICBpZiAoIHRoaXMucmVhZGVyLnBhZ2VkZXRhaWxzLnJvdGF0ZVtwYWdlLmRhdGFzZXQuc2VxXSApIHtcbiAgICAgIHBhZ2UuZGF0YXNldC5yb3RhdGUgPSB0aGlzLnJlYWRlci5wYWdlZGV0YWlscy5yb3RhdGVbcGFnZS5kYXRhc2V0LnNlcV07XG4gICAgICB0aGlzLnVwZGF0ZVBhZ2VSb3RhdGlvbihwYWdlLCBwYWdlLmRhdGFzZXQucm90YXRlKTtcbiAgICB9XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9oYW5kbGVycy5yb3RhdGUoKTtcbiAgICB2YXIgcGFnZXMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQocGFnZXNbaV0pO1xuICAgIH1cbiAgfVxuXG59OyIsImltcG9ydCB7U2Nyb2xsfSBmcm9tICcuL3Njcm9sbCc7XG5pbXBvcnQge1RodW1ibmFpbH0gZnJvbSAnLi90aHVtYm5haWwnO1xuaW1wb3J0IHtTaW5nbGV9IGZyb20gXCIuL2ltYWdlXCI7XG5pbXBvcnQge0ZsaXB9IGZyb20gJy4vZmxpcCc7XG5cbnZhciBWaWV3ID0ge307XG5WaWV3LlNjcm9sbCA9IFNjcm9sbDtcblZpZXcuVGh1bWJuYWlsID0gVGh1bWJuYWlsO1xuVmlldy5TaW5nbGUgPSBTaW5nbGU7XG5WaWV3LkZsaXAgPSBGbGlwO1xuXG5WaWV3LmZvciA9IGZ1bmN0aW9uKHZpZXcpIHtcbiAgaWYgKCB2aWV3ID09ICcxdXAnICkgeyByZXR1cm4gU2Nyb2xsOyB9XG4gIGVsc2UgaWYgKCB2aWV3ID09ICd0aHVtYicgKSB7IHJldHVybiBUaHVtYm5haWw7IH1cbiAgZWxzZSBpZiAoIHZpZXcgPT0gJ2ltYWdlJyApIHsgcmV0dXJuIFNpbmdsZTsgfVxuICBlbHNlIGlmICggdmlldyA9PSAnMnVwJyApIHsgcmV0dXJuIEZsaXA7IH1cbn1cblxuZXhwb3J0IHtWaWV3fTtcbiIsImltcG9ydCBOYW5vRXZlbnRzIGZyb20gJ25hbm9ldmVudHMnO1xuaW1wb3J0IHtCYXNlfSBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgdmFyIFNjcm9sbCA9IGNsYXNzIGV4dGVuZHMgQmFzZSB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgICB0aGlzLm1vZGUgPSAnc2Nyb2xsJztcbiAgICB0aGlzLnBhZ2VPcHRpb25zID0ge307XG4gICAgdGhpcy5lbWJlZEh0bWwgPSB0cnVlO1xuICB9XG5cbiAgZGlzcGxheShzZXEpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihgLnBhZ2VbZGF0YS1zZXE9XCIke3NlcX1cIl1gKTtcbiAgICBpZiAoICEgdGFyZ2V0ICkgeyByZXR1cm47IH1cbiAgICB0YXJnZXQuZGF0YXNldC52aXNpYmxlID0gdHJ1ZTtcbiAgICB0YXJnZXQucGFyZW50Tm9kZS5zY3JvbGxUb3AgPSB0YXJnZXQub2Zmc2V0VG9wIC0gdGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0VG9wO1xuICB9XG5cbiAgaGFuZGxlT2JzZXJ2ZXIoZW50cmllcywgb2JzZXJ2ZXIpIHtcbiAgICB2YXIgY3VycmVudCA9IHsgcGFnZTogbnVsbCwgcmF0aW86IDAgfTtcbiAgICBlbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgdmFyIGRpdiA9IGVudHJ5LnRhcmdldDtcbiAgICAgIHZhciBzZXEgPSBkaXYuZGF0YXNldC5zZXE7XG4gICAgICB2YXIgdmlld2VkID0gZGl2LnF1ZXJ5U2VsZWN0b3IoJ2ltZycpO1xuICAgICAgaWYgKCBlbnRyeS5pc0ludGVyc2VjdGluZyAmJiBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyA+IDAuMCAgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBPQlNFUlZJTkdcIiwgZW50cmllcy5sZW5ndGgsIHNlcSwgJ29uRW50ZXInLCBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbyk7XG4gICAgICAgIGlmICggZW50cnkuaW50ZXJzZWN0aW9uUmF0aW8gPiBjdXJyZW50LnJhdGlvICkge1xuICAgICAgICAgIGN1cnJlbnQucmF0aW8gPSBlbnRyeS5pbnRlcnNlY3Rpb25SYXRpbztcbiAgICAgICAgICBjdXJyZW50LnBhZ2UgPSBkaXY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCAhIHZpZXdlZCApIHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWSU5HXCIsIGVudHJpZXMubGVuZ3RoLCBzZXEsICdvbkVudGVyJyk7XG4gICAgICAgICAgdGhpcy5sb2FkSW1hZ2UoZGl2LCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIGlmICggIGRpdi5kYXRhc2V0LnByZWxvYWRlZCApIHtcbiAgICAgICAgICBkaXYuZGF0YXNldC5wcmVsb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnJlc2l6ZVBhZ2UoZGl2KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICggdmlld2VkICYmICEgZGl2LmRhdGFzZXQucHJlbG9hZGVkICkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWSU5HXCIsIGVudHJpZXMubGVuZ3RoLCBzZXEsICdvbkV4aXQnKTtcbiAgICAgICAgdGhpcy51bmxvYWRJbWFnZShkaXYpO1xuICAgICAgfVxuICAgIH0pXG4gICAgaWYgKCBjdXJyZW50LnBhZ2UgKSB7XG4gICAgICB0aGlzLnJlYWRlci5lbWl0KCdyZWxvY2F0ZWQnLCB7IHNlcTogY3VycmVudC5wYWdlLmRhdGFzZXQuc2VxIH0pO1xuICAgIH1cbiAgfTtcblxuICBjdXJyZW50TG9jYXRpb24oKSB7XG4gICAgdmFyIGN1cnJlbnRfcGVyY2VudGFnZSA9IDA7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHZhciBzY3JvbGxUb3AgPSB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3A7XG4gICAgdmFyIHZpc2libGUgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZVtkYXRhLWxvYWRlZD1cInRydWVcIl0nKTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdmlzaWJsZS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhZ2UgPSB2aXNpYmxlW2ldO1xuICAgICAgdmFyIHBhZ2VfYm91bmRzID0gcGFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmICggcGFnZS5vZmZzZXRUb3AgPiAoIHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSApIHsgY29udGludWU7IH1cbiAgICAgIGlmICggY3VycmVudF9wZXJjZW50YWdlIDwgMS4wICYmIHBhZ2Uub2Zmc2V0VG9wID49IHNjcm9sbFRvcCAmJiAocGFnZS5vZmZzZXRUb3AgKyBwYWdlX2JvdW5kcy5oZWlnaHQpIDw9IHNjcm9sbFRvcCArIGJvdW5kcy5oZWlnaHQgKSB7XG4gICAgICAgIGN1cnJlbnRfcGVyY2VudGFnZSA9IDEuMDtcbiAgICAgICAgY3VycmVudCA9IHBhZ2U7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgeTEgPSBNYXRoLmFicyhzY3JvbGxUb3AgLSBwYWdlLm9mZnNldFRvcCk7XG4gICAgICB2YXIgeTIgPSBNYXRoLmFicyggKCBzY3JvbGxUb3AgKyBib3VuZHMuaGVpZ2h0ICkgLSAoIHBhZ2Uub2Zmc2V0VG9wICsgcGFnZV9ib3VuZHMuaGVpZ2h0ICkgKTtcbiAgICAgIHZhciBoID0gcGFnZV9ib3VuZHMuaGVpZ2h0IC0geTEgLSB5MjtcbiAgICAgIHZhciBwZXJjZW50YWdlID0gaCAvIGJvdW5kcy5oZWlnaHQ7XG4gICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAwICkgeyBjb250aW51ZTsgfVxuICAgICAgaWYgKCBwZXJjZW50YWdlID4gY3VycmVudF9wZXJjZW50YWdlICkge1xuICAgICAgICBjdXJyZW50X3BlcmNlbnRhZ2UgPSBwZXJjZW50YWdlO1xuICAgICAgICBjdXJyZW50ID0gcGFnZTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBjdXJyZW50TG9jYXRpb25cIiwgcGFnZS5kYXRhc2V0LnNlcSwgcGVyY2VudGFnZSk7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50LmRhdGFzZXQuc2VxO1xuICB9XG5cbiAgbmV4dCgpIHtcbiAgICB2YXIgc2Nyb2xsVG9wID0gdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wO1xuICAgIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCArPSB0aGlzLmNvbnRhaW5lci5vZmZzZXRIZWlnaHQ7XG4gIH1cblxuICBwcmV2KCkge1xuICAgIGlmICggdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wID09IDAgKSB7IHJldHVybiA7IH1cbiAgICB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgLT0gdGhpcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0O1xuICB9XG5cbiAgX3Bvc3RSZXNpemVQYWdlKGJvdW5kcywgcmVjdCkge1xuICAgIGlmICggcmVjdC5ib3R0b20gPD0gYm91bmRzLmJvdHRvbSAmJiByZWN0LnRvcCA8IDAgKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWx0YSA9IHVwZGF0ZWRfcmVjdC5oZWlnaHQgLSByZWN0LmhlaWdodDtcbiAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AgPT0gc2Nyb2xsVG9wICkge1xuICAgICAgICAgIC8vIGRlbHRhIC89IHRoaXMuc2V0dGluZ3Muc2NhbGU7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJBSE9ZIGFmdGVyUmVzaXplZFwiLCB2aWV3LmluZGV4LCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AsIHZpZXcuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQsIHJlY3QuaGVpZ2h0LCBkZWx0YSAvIHRoaXMuc2V0dGluZ3Muc2NhbGUpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCArPSBNYXRoLmNlaWwoZGVsdGEpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBhZnRlclJlc2l6ZWRcIiwgcGFnZS5kYXRhc2V0LnNlcSwgc2Nyb2xsVG9wLCB0aGlzLmNvbnRhaW5lci5zY3JvbGxUb3AsIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgZG9ub3RSZXNpemVkXCIsIHBhZ2UuZGF0YXNldC5zZXEsIHNjcm9sbFRvcCwgdGhpcy5jb250YWluZXIuc2Nyb2xsVG9wLCBkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSwgNTAwKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVQYWdlUm90YXRpb24odGFyZ2V0LCByb3RhdGUpIHtcbiAgICAvLyB2YXIgbWFyZ2luID0gKCByb3RhdGUgJSAxODAgPT0gMCApID8gMCA6ICggdGFyZ2V0Lm9mZnNldEhlaWdodCAtIHRhcmdldC5vZmZzZXRXaWR0aCApIC8gMjtcbiAgICAvLyB0YXJnZXQuZGF0YXNldC5yb3RhdGUgPSByb3RhdGU7XG4gICAgLy8gdGFyZ2V0LnN0eWxlLnNldFByb3BlcnR5KCctLXJvdGF0ZScsIGAke3JvdGF0ZX1kZWdgKTtcbiAgICAvLyB0YXJnZXQuc3R5bGUuc2V0UHJvcGVydHkoJy0tcm90YXRlLW1hcmdpbicsIGAtJHttYXJnaW59cHggJHttYXJnaW59cHhgKTtcbiAgICB0aGlzLnJlYWRlci5wYWdlZGV0YWlscy5yb3RhdGVbdGFyZ2V0LmRhdGFzZXQuc2VxXSA9IHJvdGF0ZTtcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc3VwZXIuYmluZEV2ZW50cygpO1xuICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIodGhpcy5oYW5kbGVPYnNlcnZlci5iaW5kKHRoaXMpLCB7XG4gICAgICAgIHJvb3Q6IHRoaXMuY29udGFpbmVyLFxuICAgICAgICByb290TWFyZ2luOiAnMHB4JyxcbiAgICAgICAgdGhyZXNob2xkOiBbMCwgMC4xLCAwLjIsIDAuMywgMC40LCAwLjUsIDAuNiwgMC43LCAwLjgsIDAuOSwgMV1cbiAgICB9KTtcblxuICAgIHRoaXMuX2hhbmRsZXJzLnJvdGF0ZSA9IHRoaXMucmVhZGVyLm9uKCdyb3RhdGUnLCBmdW5jdGlvbihkZWx0YSkge1xuICAgICAgdmFyIHNlcSA9IHNlbGYuY3VycmVudExvY2F0aW9uKCk7XG4gICAgICBzZWxmLnNlcnZpY2UubWFuaWZlc3Qucm90YXRlQnkoc2VxLCBkZWx0YSk7XG4gICAgICBzZWxmLnJlZHJhd1BhZ2Uoc2VxKTtcbiAgICB9KTtcbiAgfVxuXG4gIGJpbmRQYWdlRXZlbnRzKHBhZ2UpIHtcbiAgICB0aGlzLm9ic2VydmVyLm9ic2VydmUocGFnZSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB0aGlzLl9oYW5kbGVycy5yb3RhdGUoKTtcbiAgICB2YXIgcGFnZXMgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcucGFnZScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5vYnNlcnZlci51bm9ic2VydmUocGFnZXNbaV0pO1xuICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQocGFnZXNbaV0pO1xuICAgIH1cbiAgICB0aGlzLm9ic2VydmVyID0gbnVsbDtcbiAgfVxuXG59O1xuIiwiaW1wb3J0IHtTY3JvbGx9IGZyb20gJy4vc2Nyb2xsJztcblxuZXhwb3J0IHZhciBUaHVtYm5haWwgPSBjbGFzcyBleHRlbmRzIFNjcm9sbCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgICB0aGlzLm1vZGUgPSAndGh1bWJuYWlsJztcbiAgICAvLyB0aGlzLnNjYWxlID0gMC4yNTtcbiAgICB0aGlzLnNjYWxlID0gMS4wO1xuICAgIHRoaXMuZW1iZWRIdG1sID0gZmFsc2U7XG4gIH1cblxuICBpbWFnZVVybChwYXJhbXMpIHtcbiAgICBpZiAoIHBhcmFtcyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICkge1xuICAgICAgdmFyIGVsZW1lbnQgPSBwYXJhbXM7IHBhcmFtcyA9IHt9O1xuICAgICAgcGFyYW1zLnNlcSA9IGVsZW1lbnQuZGF0YXNldC5zZXE7XG4gICAgICBwYXJhbXMud2lkdGggPSBlbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zZXJ2aWNlLnRodW1ibmFpbChwYXJhbXMpO1xuICB9XG5cbiAgbWluV2lkdGgoKSB7XG4gICAgLy8gYmVzdCBndWVzc1xuICAgIHJldHVybiAxNjA7XG4gIH1cblxuICBiaW5kUGFnZUV2ZW50cyhwYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHN1cGVyLmJpbmRQYWdlRXZlbnRzKHBhZ2UpO1xuICAgIHBhZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgY29uc29sZS5sb2coXCJBSE9ZIENMSUNLXCIsIHRoaXMuZGF0YXNldC5zZXEpO1xuICAgICAgc2VsZi5yZWFkZXIucmVzdGFydCh7IHZpZXc6ICcxdXAnLCBzZXE6IHRoaXMuZGF0YXNldC5zZXEgfSk7XG4gICAgfSlcbiAgfVxuXG4gIGNvbmZpZygpIHtcbiAgICB2YXIgcmV0dmFsID0gc3VwZXIuY29uZmlnKCk7XG4gICAgcmV0dmFsLnpvb20gPSBmYWxzZTtcbiAgICByZXR2YWwucm90YXRlID0gZmFsc2U7XG4gICAgcmV0dXJuIHJldHZhbDtcbiAgfVxuXG59OyIsIlxuaW1wb3J0IE5hbm9FdmVudHMgZnJvbSAnbmFub2V2ZW50cyc7XG5pbXBvcnQge0NvbnRyb2x9IGZyb20gJy4vY29tcG9uZW50cy9jb250cm9scyc7XG5pbXBvcnQge1NlcnZpY2V9IGZyb20gJy4vY29tcG9uZW50cy9pbWdzcnYnO1xuaW1wb3J0IHtWaWV3fSBmcm9tICcuL2NvbXBvbmVudHMvdmlld3MnO1xuXG52YXIgSFQgPSB3aW5kb3cuSFQgfHwge307IHdpbmRvdy5IVCA9IEhUO1xudmFyICRtYWluID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpO1xudmFyICR2aWV3ZXIgPSAkbWFpbi5xdWVyeVNlbGVjdG9yKCcudmlld2VyJyk7XG52YXIgJGlubmVyID0gJHZpZXdlci5xdWVyeVNlbGVjdG9yKCcudmlld2VyLWlubmVyJyk7XG5jb25zb2xlLmxvZyhcIkFIT1kgQUhPWSAkaW5uZXJcIiwgJGlubmVyLm9mZnNldEhlaWdodCk7XG5cbnZhciAkdG9vbGJhciA9ICRtYWluLnF1ZXJ5U2VsZWN0b3IoJyN0b29sYmFyLXZlcnRpY2FsJyk7XG5cbnZhciBtaW5faGVpZ2h0ID0gJHZpZXdlci5vZmZzZXRIZWlnaHQ7XG52YXIgbWluX3dpZHRoID0gJHZpZXdlci5vZmZzZXRXaWR0aCAqIDAuODA7XG5cbi8vIGlmICggJG1haW4uZGF0YXNldC52aWV3ID09ICd0aHVtYm5haWwnICkge1xuLy8gICBzY2FsZSA9IDAuMjU7XG4vLyB9XG5cbnZhciBSZWFkZXIgPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM9e30pIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHsgc2NhbGU6IDEuMCB9LCBvcHRpb25zKTtcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgTmFub0V2ZW50cygpO1xuICAgIHRoaXMuY29udHJvbHMgPSB7fTtcbiAgICB0aGlzLnBhZ2VkZXRhaWxzID0geyByb3RhdGU6IHt9LCBzY2FsZToge30gfTtcbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgfVxuXG4gIHN0YXJ0KHBhcmFtcywgY2IpIHtcbiAgICBpZiAoIGNiID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBjYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnZpZXcuZGlzcGxheShwYXJhbXMuc2VxIHx8IDEpO1xuICAgICAgfS5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBpZiAoIHBhcmFtcy52aWV3ICkge1xuICAgICAgJG1haW4uZGF0YXNldC52aWV3ID0gcGFyYW1zLnZpZXc7XG4gICAgICBjb25zb2xlLmxvZyhcIkFIT1kgQUhPWSAkaW5uZXIudmlld1wiLCAkaW5uZXIub2Zmc2V0SGVpZ2h0KTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBBSE9ZICRpbm5lci52aWV3IGxhdGVyXCIsICRpbm5lci5vZmZzZXRIZWlnaHQpO1xuICAgICAgfSwgMjAwMCk7XG4gICAgfVxuICAgIGlmICggcGFyYW1zLnNjYWxlICkgeyB0aGlzLm9wdGlvbnMuc2NhbGUgPSBwYXJhbXMuc2NhbGU7IH1cbiAgICB0aGlzLnNldFZpZXcoeyB2aWV3OiAkbWFpbi5kYXRhc2V0LnZpZXcgfSk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBBSE9ZICRpbm5lci52aWV3IHRpbWVvdXRcIiwgJGlubmVyLm9mZnNldEhlaWdodCk7XG4gICAgICB0aGlzLnZpZXcuYXR0YWNoVG8oJGlubmVyLCBjYik7XG4gICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgfVxuXG4gIHJlc3RhcnQocGFyYW1zKSB7XG4gICAgdmFyIGN1cnJlbnQgPSBwYXJhbXMuc2VxIHx8IHRoaXMudmlldy5jdXJyZW50TG9jYXRpb24oKTtcbiAgICBpZiAoIHRoaXMudmlldyApIHsgdGhpcy52aWV3LmRlc3Ryb3koKTsgdGhpcy52aWV3ID0gbnVsbDsgfVxuICAgIHRoaXMuc3RhcnQocGFyYW1zLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBUUllJTkcgVE8gR08gVE9cIiwgY3VycmVudCk7XG4gICAgICB0aGlzLnZpZXcuZGlzcGxheShjdXJyZW50KTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG5cbiAgc2V0VmlldyhwYXJhbXMpIHtcbiAgICB2YXIgY2xzID0gVmlldy5mb3IocGFyYW1zLnZpZXcpO1xuICAgIHRoaXMudmlldyA9IG5ldyBjbHMoeyByZWFkZXI6IHRoaXMsIHNlcnZpY2U6IHRoaXMuc2VydmljZSwgc2NhbGU6IHRoaXMub3B0aW9ucy5zY2FsZSB9KTtcbiAgICB0aGlzLmVtaXQoJ2NvbmZpZ3VyZScsIHRoaXMudmlldy5jb25maWcoKSk7XG4gIH1cblxuICBuZXh0KCkge1xuICAgIHRoaXMudmlldy5uZXh0KCk7XG4gIH1cblxuICBwcmV2KCkge1xuICAgIHRoaXMudmlldy5wcmV2KCk7XG4gIH1cblxuICBmaXJzdCgpIHtcbiAgICB0aGlzLnZpZXcuZGlzcGxheSgxKTtcbiAgfVxuXG4gIGxhc3QoKSB7XG4gICAgdGhpcy52aWV3LmRpc3BsYXkodGhpcy5zZXJ2aWNlLm1hbmlmZXN0LnRvdGFsU2VxKTtcbiAgfVxuXG4gIG9uKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24uYXBwbHkodGhpcy5lbWl0dGVyLCBhcmd1bWVudHMpXG4gIH1cblxuICBlbWl0KGV2ZW50LCBwYXJhbXM9e30pIHtcbiAgICB0aGlzLmVtaXR0ZXIuZW1pdChldmVudCwgcGFyYW1zKTtcbiAgfVxuXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgLyogTk9PUCAqL1xuICB9XG5cbn1cblxudmFyIHNlcnZpY2UgPSBuZXcgU2VydmljZSh7XG4gIG1hbmlmZXN0OiB7XG4gICAgdG90YWxTZXE6ICRtYWluLmRhdGFzZXQudG90YWxTZXEsXG4gICAgZGVmYXVsdFNlcTogJG1haW4uZGF0YXNldC5kZWZhdWx0U2VxLFxuICAgIGZpcnN0U2VxOiAkbWFpbi5kYXRhc2V0LmZpcnN0U2VxLFxuICAgIGRlZmF1bHRIZWlnaHQ6ICRtYWluLmRhdGFzZXQuZGVmYXVsdEhlaWdodCxcbiAgICBkZWZhdWx0V2lkdGg6ICRtYWluLmRhdGFzZXQuZGVmYXVsdFdpZHRoLFxuICAgIGZlYXR1cmVMaXN0OiBKU09OLnBhcnNlKCRtYWluLmRhdGFzZXQuZmVhdHVyZUxpc3QpXG4gIH0sXG4gIGlkZW50aWZpZXI6IEhULnBhcmFtcy5pZFxufSlcbkhULnNlcnZpY2UgPSBzZXJ2aWNlO1xuXG52YXIgcmVhZGVyID0gbmV3IFJlYWRlcih7IGlkZW50aWZpZXI6IEhULnBhcmFtcy5pZCB9KTtcbnJlYWRlci5zZXJ2aWNlID0gc2VydmljZTtcbkhULnJlYWRlciA9IHJlYWRlcjtcbkhULlZpZXcgPSBWaWV3O1xuXG52YXIgaXNfYWN0aXZlID0gZmFsc2U7XG52YXIgc2NhbGUgPSAwLjc1O1xudmFyIGltYWdlX3dpZHRoID0gNjgwO1xuXG5yZWFkZXIuY29udHJvbHMubmF2aWdhdG9yID0gbmV3IENvbnRyb2wuTmF2aWdhdG9yKHtcbiAgaW5wdXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJyYW5nZVwiXScpLFxuICBvdXRwdXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXZpZ2F0b3IgLm91dHB1dCcpLFxuICByZWFkZXI6IHJlYWRlclxufSlcblxucmVhZGVyLmNvbnRyb2xzLnBhZ2luYXRvciA9IG5ldyBDb250cm9sLlBhZ2luYXRvcih7XG4gIGlucHV0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdG9vbGJhci1ob3Jpem9udGFsJyksXG4gIHJlYWRlcjogcmVhZGVyXG59KTtcblxucmVhZGVyLmNvbnRyb2xzLnZpZXdpbmF0b3IgPSBuZXcgQ29udHJvbC5WaWV3aW5hdG9yKHtcbiAgaW5wdXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3Rpb24tdmlld3MnKSxcbiAgcmVhZGVyOiByZWFkZXJcbn0pO1xuXG5yZWFkZXIuY29udHJvbHMubmF2aWdhdG9yLm9uKCd1cGRhdGVMb2NhdGlvbicsIChwYXJhbXMpID0+IHtcbiAgY29uc29sZS5sb2coXCJBSE9ZIHVwZGF0ZUxvY2F0aW9uXCIsIHBhcmFtcy5zZXEpO1xuICByZWFkZXIudmlldy5kaXNwbGF5KHBhcmFtcy5zZXEpO1xufSlcblxucmVhZGVyLmNvbnRyb2xzLnpvb21pbmF0b3IgPSBuZXcgQ29udHJvbC5ab29taW5hdG9yKHtcbiAgaW5wdXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3Rpb24tem9vbScpLFxuICByZWFkZXI6IHJlYWRlclxufSlcblxucmVhZGVyLmNvbnRyb2xzLnJvdGF0b3IgPSBuZXcgQ29udHJvbC5Sb3RhdG9yKHtcbiAgaW5wdXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3Rpb24tcm90YXRlJyksXG4gIHJlYWRlcjogcmVhZGVyXG59KVxucmVhZGVyLmNvbnRyb2xzLnJvdGF0b3Iub24oJ3JvdGF0ZScsIGZ1bmN0aW9uKGRlbHRhKSB7XG4gIC8vIHZhciBzZXEgPSB0aGlzLnZpZXcuY3VycmVudExvY2F0aW9uKCk7XG4gIC8vIHZhciByb3RhdGUgPSB0aGlzLnBhZ2VkZXRhaWxzLnJvdGF0ZVtzZXFdIHx8IDA7XG4gIC8vIHJvdGF0ZSA9ICggcm90YXRlICsgZGVsdGEgKSAlIDM2MDtcbiAgLy8gdGhpcy5wYWdlZGV0YWlscy5yb3RhdGVbc2VxXSA9IHJvdGF0ZTtcbiAgY29uc29sZS5sb2coXCJBSE9ZIGNvbnRyb2xzLnJvdGF0b3JcIiwgZGVsdGEpO1xuICB0aGlzLmVtaXQoJ3JvdGF0ZScsIGRlbHRhKTtcbn0uYmluZChyZWFkZXIpKVxuXG5yZWFkZXIuc3RhcnQoeyB2aWV3OiAnMnVwJywgc2VxOiAxMCB9KTtcblxuXG5cblxuIl0sInNvdXJjZVJvb3QiOiIifQ==