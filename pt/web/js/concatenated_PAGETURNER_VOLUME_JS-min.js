/*! nanoScrollerJS - v0.7.2
* http://jamesflorentino.github.com/nanoScrollerJS/
* Copyright (c) 2013 James Florentino; Licensed MIT */


(function($, window, document) {
  "use strict";

  var BROWSER_IS_IE7, BROWSER_SCROLLBAR_WIDTH, DOMSCROLL, DOWN, DRAG, KEYDOWN, KEYUP, MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSEWHEEL, NanoScroll, PANEDOWN, RESIZE, SCROLL, SCROLLBAR, TOUCHMOVE, UP, WHEEL, defaults, getBrowserScrollbarWidth;
  defaults = {
    /**
      a classname for the pane element.
      @property paneClass
      @type String
      @default 'pane'
    */

    paneClass: 'pane',
    /**
      a classname for the slider element.
      @property sliderClass
      @type String
      @default 'slider'
    */

    sliderClass: 'slider',
    /**
      a classname for the content element.
      @property contentClass
      @type String
      @default 'content'
    */

    contentClass: 'content',
    /**
      a setting to enable native scrolling in iOS devices.
      @property iOSNativeScrolling
      @type Boolean
      @default false
    */

    iOSNativeScrolling: false,
    /**
      a setting to prevent the rest of the page being
      scrolled when user scrolls the `.content` element.
      @property preventPageScrolling
      @type Boolean
      @default false
    */

    preventPageScrolling: false,
    /**
      a setting to disable binding to the resize event.
      @property disableResize
      @type Boolean
      @default false
    */

    disableResize: false,
    /**
      a setting to make the scrollbar always visible.
      @property alwaysVisible
      @type Boolean
      @default false
    */

    alwaysVisible: false,
    /**
      a default timeout for the `flash()` method.
      @property flashDelay
      @type Number
      @default 1500
    */

    flashDelay: 1500,
    /**
      a minimum height for the `.slider` element.
      @property sliderMinHeight
      @type Number
      @default 20
    */

    sliderMinHeight: 20,
    /**
      a maximum height for the `.slider` element.
      @property sliderMaxHeight
      @type Number
      @default null
    */

    sliderMaxHeight: null
  };
  /**
    @property SCROLLBAR
    @type String
    @static
    @final
    @private
  */

  SCROLLBAR = 'scrollbar';
  /**
    @property SCROLL
    @type String
    @static
    @final
    @private
  */

  SCROLL = 'scroll';
  /**
    @property MOUSEDOWN
    @type String
    @final
    @private
  */

  MOUSEDOWN = 'mousedown';
  /**
    @property MOUSEMOVE
    @type String
    @static
    @final
    @private
  */

  MOUSEMOVE = 'mousemove';
  /**
    @property MOUSEWHEEL
    @type String
    @final
    @private
  */

  MOUSEWHEEL = 'mousewheel';
  /**
    @property MOUSEUP
    @type String
    @static
    @final
    @private
  */

  MOUSEUP = 'mouseup';
  /**
    @property RESIZE
    @type String
    @final
    @private
  */

  RESIZE = 'resize';
  /**
    @property DRAG
    @type String
    @static
    @final
    @private
  */

  DRAG = 'drag';
  /**
    @property UP
    @type String
    @static
    @final
    @private
  */

  UP = 'up';
  /**
    @property PANEDOWN
    @type String
    @static
    @final
    @private
  */

  PANEDOWN = 'panedown';
  /**
    @property DOMSCROLL
    @type String
    @static
    @final
    @private
  */

  DOMSCROLL = 'DOMMouseScroll';
  /**
    @property DOWN
    @type String
    @static
    @final
    @private
  */

  DOWN = 'down';
  /**
    @property WHEEL
    @type String
    @static
    @final
    @private
  */

  WHEEL = 'wheel';
  /**
    @property KEYDOWN
    @type String
    @static
    @final
    @private
  */

  KEYDOWN = 'keydown';
  /**
    @property KEYUP
    @type String
    @static
    @final
    @private
  */

  KEYUP = 'keyup';
  /**
    @property TOUCHMOVE
    @type String
    @static
    @final
    @private
  */

  TOUCHMOVE = 'touchmove';
  /**
    @property BROWSER_IS_IE7
    @type Boolean
    @static
    @final
    @private
  */

  BROWSER_IS_IE7 = window.navigator.appName === 'Microsoft Internet Explorer' && /msie 7./i.test(window.navigator.appVersion) && window.ActiveXObject;
  /**
    @property BROWSER_SCROLLBAR_WIDTH
    @type Number
    @static
    @default null
    @private
  */

  BROWSER_SCROLLBAR_WIDTH = null;
  /**
    Returns browser's native scrollbar width
    @method getBrowserScrollbarWidth
    @return {Number} the scrollbar width in pixels
    @static
    @private
  */

  getBrowserScrollbarWidth = function() {
    var outer, outerStyle, scrollbarWidth;
    outer = document.createElement('div');
    outerStyle = outer.style;
    outerStyle.position = 'absolute';
    outerStyle.width = '100px';
    outerStyle.height = '100px';
    outerStyle.overflow = SCROLL;
    outerStyle.top = '-9999px';
    document.body.appendChild(outer);
    scrollbarWidth = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);
    return scrollbarWidth;
  };
  /**
    @class NanoScroll
    @param element {HTMLElement|Node} the main element
    @param options {Object} nanoScroller's options
    @constructor
  */

  NanoScroll = (function() {

    function NanoScroll(el, options) {
      this.el = el;
      this.options = options;
      BROWSER_SCROLLBAR_WIDTH || (BROWSER_SCROLLBAR_WIDTH = getBrowserScrollbarWidth());
      this.$el = $(this.el);
      this.doc = $(document);
      this.win = $(window);
      this.$content = this.$el.children("." + options.contentClass);
      this.$content.attr('tabindex', 0);
      this.content = this.$content[0];
      if (this.options.iOSNativeScrolling && (this.el.style.WebkitOverflowScrolling != null)) {
        this.nativeScrolling();
      } else {
        this.generate();
      }
      this.createEvents();
      this.addEvents();
      this.reset();
    }

    /**
      Prevents the rest of the page being scrolled
      when user scrolls the `.content` element.
      @method preventScrolling
      @param event {Event}
      @param direction {String} Scroll direction (up or down)
      @private
    */


    NanoScroll.prototype.preventScrolling = function(e, direction) {
      if (!this.isActive) {
        return;
      }
      if (e.type === DOMSCROLL) {
        if (direction === DOWN && e.originalEvent.detail > 0 || direction === UP && e.originalEvent.detail < 0) {
          e.preventDefault();
        }
      } else if (e.type === MOUSEWHEEL) {
        if (!e.originalEvent || !e.originalEvent.wheelDelta) {
          return;
        }
        if (direction === DOWN && e.originalEvent.wheelDelta < 0 || direction === UP && e.originalEvent.wheelDelta > 0) {
          e.preventDefault();
        }
      }
    };

    /**
      Enable iOS native scrolling
    */


    NanoScroll.prototype.nativeScrolling = function() {
      this.$content.css({
        WebkitOverflowScrolling: 'touch'
      });
      this.iOSNativeScrolling = true;
      this.isActive = true;
    };

    /**
      Updates those nanoScroller properties that
      are related to current scrollbar position.
      @method updateScrollValues
      @private
    */


    NanoScroll.prototype.updateScrollValues = function() {
      var content;
      content = this.content;
      this.maxScrollTop = content.scrollHeight - content.clientHeight;
      this.contentScrollTop = content.scrollTop;
      if (!this.iOSNativeScrolling) {
        this.maxSliderTop = this.paneHeight - this.sliderHeight;
        this.sliderTop = this.contentScrollTop * this.maxSliderTop / this.maxScrollTop;
      }
    };

    /**
      Creates event related methods
      @method createEvents
      @private
    */


    NanoScroll.prototype.createEvents = function() {
      var _this = this;
      this.events = {
        down: function(e) {
          _this.isBeingDragged = true;
          _this.offsetY = e.pageY - _this.slider.offset().top;
          _this.pane.addClass('active');
          _this.doc.bind(MOUSEMOVE, _this.events[DRAG]).bind(MOUSEUP, _this.events[UP]);
          return false;
        },
        drag: function(e) {
          _this.sliderY = e.pageY - _this.$el.offset().top - _this.offsetY;
          _this.scroll();
          _this.updateScrollValues();
          if (_this.contentScrollTop >= _this.maxScrollTop) {
            _this.$el.trigger('scrollend');
          } else if (_this.contentScrollTop === 0) {
            _this.$el.trigger('scrolltop');
          }
          return false;
        },
        up: function(e) {
          _this.isBeingDragged = false;
          _this.pane.removeClass('active');
          _this.doc.unbind(MOUSEMOVE, _this.events[DRAG]).unbind(MOUSEUP, _this.events[UP]);
          return false;
        },
        resize: function(e) {
          _this.reset();
        },
        panedown: function(e) {
          _this.sliderY = (e.offsetY || e.originalEvent.layerY) - (_this.sliderHeight * 0.5);
          _this.scroll();
          _this.events.down(e);
          return false;
        },
        scroll: function(e) {
          if (_this.isBeingDragged) {
            return;
          }
          _this.updateScrollValues();
          if (!_this.iOSNativeScrolling) {
            _this.sliderY = _this.sliderTop;
            _this.slider.css({
              top: _this.sliderTop
            });
          }
          if (e == null) {
            return;
          }
          if (_this.contentScrollTop >= _this.maxScrollTop) {
            if (_this.options.preventPageScrolling) {
              _this.preventScrolling(e, DOWN);
            }
            _this.$el.trigger('scrollend');
          } else if (_this.contentScrollTop === 0) {
            if (_this.options.preventPageScrolling) {
              _this.preventScrolling(e, UP);
            }
            _this.$el.trigger('scrolltop');
          }
        },
        wheel: function(e) {
          if (e == null) {
            return;
          }
          _this.sliderY += -e.wheelDeltaY || -e.delta;
          _this.scroll();
          return false;
        }
      };
    };

    /**
      Adds event listeners with jQuery.
      @method addEvents
      @private
    */


    NanoScroll.prototype.addEvents = function() {
      var events;
      this.removeEvents();
      events = this.events;
      if (!this.options.disableResize) {
        this.win.bind(RESIZE, events[RESIZE]);
      }
      if (!this.iOSNativeScrolling) {
        this.slider.bind(MOUSEDOWN, events[DOWN]);
        this.pane.bind(MOUSEDOWN, events[PANEDOWN]).bind("" + MOUSEWHEEL + " " + DOMSCROLL, events[WHEEL]);
      }
      this.$content.bind("" + SCROLL + " " + MOUSEWHEEL + " " + DOMSCROLL + " " + TOUCHMOVE, events[SCROLL]);
    };

    /**
      Removes event listeners with jQuery.
      @method removeEvents
      @private
    */


    NanoScroll.prototype.removeEvents = function() {
      var events;
      events = this.events;
      this.win.unbind(RESIZE, events[RESIZE]);
      if (!this.iOSNativeScrolling) {
        this.slider.unbind();
        this.pane.unbind();
      }
      this.$content.unbind("" + SCROLL + " " + MOUSEWHEEL + " " + DOMSCROLL + " " + TOUCHMOVE, events[SCROLL]);
    };

    /**
      Generates nanoScroller's scrollbar and elements for it.
      @method generate
      @chainable
      @private
    */


    NanoScroll.prototype.generate = function() {
      var contentClass, cssRule, options, paneClass, sliderClass;
      options = this.options;
      paneClass = options.paneClass, sliderClass = options.sliderClass, contentClass = options.contentClass;
      if (!this.$el.find("" + paneClass).length && !this.$el.find("" + sliderClass).length) {
        this.$el.append("<div class=\"" + paneClass + "\"><div class=\"" + sliderClass + "\" /></div>");
      }
      this.pane = this.$el.children("." + paneClass);
      this.slider = this.pane.find("." + sliderClass);
      if (BROWSER_SCROLLBAR_WIDTH) {
        cssRule = this.$el.css('direction') === 'rtl' ? {
          left: -BROWSER_SCROLLBAR_WIDTH
        } : {
          right: -BROWSER_SCROLLBAR_WIDTH
        };
        this.$el.addClass('has-scrollbar');
      }
      if (cssRule != null) {
        this.$content.css(cssRule);
      }
      return this;
    };

    /**
      @method restore
      @private
    */


    NanoScroll.prototype.restore = function() {
      this.stopped = false;
      this.pane.show();
      this.addEvents();
    };

    /**
      Resets nanoScroller's scrollbar.
      @method reset
      @chainable
      @example
          $(".nano").nanoScroller();
    */


    NanoScroll.prototype.reset = function() {
      var content, contentHeight, contentStyle, contentStyleOverflowY, paneBottom, paneHeight, paneOuterHeight, paneTop, sliderHeight;
      if (this.iOSNativeScrolling) {
        this.contentHeight = this.content.scrollHeight;
        return;
      }
      if (!this.$el.find("." + this.options.paneClass).length) {
        this.generate().stop();
      }
      if (this.stopped) {
        this.restore();
      }
      content = this.content;
      contentStyle = content.style;
      contentStyleOverflowY = contentStyle.overflowY;
      if (BROWSER_IS_IE7) {
        this.$content.css({
          height: this.$content.height()
        });
      }
      contentHeight = content.scrollHeight + BROWSER_SCROLLBAR_WIDTH;
      paneHeight = this.pane.outerHeight();
      paneTop = parseInt(this.pane.css('top'), 10);
      paneBottom = parseInt(this.pane.css('bottom'), 10);
      paneOuterHeight = paneHeight + paneTop + paneBottom;
      sliderHeight = Math.round(paneOuterHeight / contentHeight * paneOuterHeight);
      if (sliderHeight < this.options.sliderMinHeight) {
        sliderHeight = this.options.sliderMinHeight;
      } else if ((this.options.sliderMaxHeight != null) && sliderHeight > this.options.sliderMaxHeight) {
        sliderHeight = this.options.sliderMaxHeight;
      }
      if (contentStyleOverflowY === SCROLL && contentStyle.overflowX !== SCROLL) {
        sliderHeight += BROWSER_SCROLLBAR_WIDTH;
      }
      this.maxSliderTop = paneOuterHeight - sliderHeight;
      this.contentHeight = contentHeight;
      this.paneHeight = paneHeight;
      this.paneOuterHeight = paneOuterHeight;
      this.sliderHeight = sliderHeight;
      this.slider.height(sliderHeight);
      this.events.scroll();
      this.pane.show();
      this.isActive = true;
      if ((content.scrollHeight === content.clientHeight) || (this.pane.outerHeight(true) >= content.scrollHeight && contentStyleOverflowY !== SCROLL)) {
        this.pane.hide();
        this.isActive = false;
      } else if (this.el.clientHeight === content.scrollHeight && contentStyleOverflowY === SCROLL) {
        this.slider.hide();
      } else {
        this.slider.show();
      }
      this.pane.css({
        // opacity: (this.options.alwaysVisible ? ( this. : ''),
        visibility: (this.options.alwaysVisible ? 'visible' : '')
      });
      return this;
    };

    /**
      @method scroll
      @private
      @example
          $(".nano").nanoScroller({ scroll: 'top' });
    */


    NanoScroll.prototype.scroll = function() {
      if (!this.isActive) {
        return;
      }
      this.sliderY = Math.max(0, this.sliderY);
      this.sliderY = Math.min(this.maxSliderTop, this.sliderY);
      this.$content.scrollTop((this.paneHeight - this.contentHeight + BROWSER_SCROLLBAR_WIDTH) * this.sliderY / this.maxSliderTop * -1);
      if (!this.iOSNativeScrolling) {
        this.slider.css({
          top: this.sliderY
        });
      }
      return this;
    };

    /**
      Scroll at the bottom with an offset value
      @method scrollBottom
      @param offsetY {Number}
      @chainable
      @example
          $(".nano").nanoScroller({ scrollBottom: value });
    */


    NanoScroll.prototype.scrollBottom = function(offsetY) {
      if (!this.isActive) {
        return;
      }
      this.reset();
      this.$content.scrollTop(this.contentHeight - this.$content.height() - offsetY).trigger(MOUSEWHEEL);
      return this;
    };

    /**
      Scroll at the top with an offset value
      @method scrollTop
      @param offsetY {Number}
      @chainable
      @example
          $(".nano").nanoScroller({ scrollTop: value });
    */


    NanoScroll.prototype.scrollTop = function(offsetY) {
      if (!this.isActive) {
        return;
      }
      this.reset();
      this.$content.scrollTop(+offsetY).trigger(MOUSEWHEEL);
      return this;
    };

    /**
      Scroll to an element
      @method scrollTo
      @param node {Node} A node to scroll to.
      @chainable
      @example
          $(".nano").nanoScroller({ scrollTo: $('#a_node') });
    */


    NanoScroll.prototype.scrollTo = function(node) {
      if (!this.isActive) {
        return;
      }
      this.reset();
      this.scrollTop($(node).get(0).offsetTop);
      return this;
    };

    /**
      To stop the operation.
      This option will tell the plugin to disable all event bindings and hide the gadget scrollbar from the UI.
      @method stop
      @chainable
      @example
          $(".nano").nanoScroller({ stop: true });
    */


    NanoScroll.prototype.stop = function() {
      this.stopped = true;
      this.removeEvents();
      this.pane.hide();
      return this;
    };

    /**
      To flash the scrollbar gadget for an amount of time defined in plugin settings (defaults to 1,5s).
      Useful if you want to show the user (e.g. on pageload) that there is more content waiting for him.
      @method flash
      @chainable
      @example
          $(".nano").nanoScroller({ flash: true });
    */


    NanoScroll.prototype.flash = function() {
      var _this = this;
      if (!this.isActive) {
        return;
      }
      this.reset();
      this.pane.addClass('flashed');
      setTimeout(function() {
        _this.pane.removeClass('flashed');
      }, this.options.flashDelay);
      return this;
    };

    return NanoScroll;

  })();
  $.fn.nanoScroller = function(settings) {
    return this.each(function() {
      var options, scrollbar;
      if (!(scrollbar = this.nanoscroller)) {
        options = $.extend({}, defaults, settings);
        this.nanoscroller = scrollbar = new NanoScroll(this, options);
      }
      if (settings && typeof settings === "object") {
        $.extend(scrollbar.options, settings);
        if (settings.scrollBottom) {
          return scrollbar.scrollBottom(settings.scrollBottom);
        }
        if (settings.scrollTop) {
          return scrollbar.scrollTop(settings.scrollTop);
        }
        if (settings.scrollTo) {
          return scrollbar.scrollTo(settings.scrollTo);
        }
        if (settings.scroll === 'bottom') {
          return scrollbar.scrollBottom(0);
        }
        if (settings.scroll === 'top') {
          return scrollbar.scrollTop(0);
        }
        if (settings.scroll && settings.scroll instanceof $) {
          return scrollbar.scrollTo(settings.scroll);
        }
        if (settings.stop) {
          return scrollbar.stop();
        }
        if (settings.flash) {
          return scrollbar.flash();
        }
      }
      return scrollbar.reset();
    });
  };
})(jQuery, window, document);

/* /htapps/roger.babel/pt/web/vendor/nanoscroller/jquery.nanoscroller.js */
/*! jQuery.fracs %BUILD_VERSION% - //larsjung.de/fracs - MIT License */

(function (window, document, $) {
	'use strict';

		// Some often used references.
	var $window = $(window),
		$document = $(document),
		extend = $.extend,
		isFn = $.isFunction,
		slice = [].slice,
		mathMax = Math.max,
		mathMin = Math.min,
		mathRound = Math.round,
		isTypeOf = function (obj, type) {

			return typeof obj === type;
		},
		isInstanceOf = function (obj, type) {

			return obj instanceof type;
		},
		isHTMLElement = function (obj) {

			return obj && obj.nodeType;
		},
		getHTMLElement = function (obj) {

			return isHTMLElement(obj) ? obj : (isInstanceOf(obj, $) ? obj[0] : undefined);
		},
		reduce = function (elements, fn, current) {

			$.each(elements, function (idx, element) {

				current = fn.call(element, current, idx, element);
			});
			return current;
		},
		getId = (function () {

			var ids = {},
				nextId = 1;

			return function (element) {

				if (!element) {
					return 0;
				}
				if (!ids[element]) {
					ids[element] = nextId;
					nextId += 1;
				}
				return ids[element];
			};
		}()),
		equal = function (obj1, obj2, props) {

			var i, l, prop;

			if (obj1 === obj2) {
				return true;
			}
			if (!obj1 || !obj2 || obj1.constructor !== obj2.constructor) {
				return false;
			}
			for (i = 0, l = props.length; i < l; i += 1) {
				prop = props[i];
				if (obj1[prop] && isFn(obj1[prop].equals) && !obj1[prop].equals(obj2[prop])) {
					return false;
				}
				if (obj1[prop] !== obj2[prop]) {
					return false;
				}
			}
			return true;
		};





	// Objects
	// =======

	// Rect
	// ----
	// Holds the position and dimensions of a rectangle. The position might be
	// relative to document, viewport or element space.
	var Rect = function (left, top, width, height) {

		// Top left corner of the rectangle rounded to integers.
		this.left = mathRound(left);
		this.top = mathRound(top);

		// Dimensions rounded to integers.
		this.width = mathRound(width);
		this.height = mathRound(height);

		// Bottom right corner of the rectangle.
		this.right = this.left + this.width;
		this.bottom = this.top + this.height;
	};

	// ### Prototype
	extend(Rect.prototype, {

		// Checks if this instance equals `that` in position and dimensions.
		equals: function (that) {

			return equal(this, that, ['left', 'top', 'width', 'height']);
		},

		// Returns the area of this rectangle.
		area: function () {

			return this.width * this.height;
		},

		// Returns a new `Rect` representig this rect relative to `rect`.
		relativeTo: function (rect) {

			return new Rect(this.left - rect.left, this.top - rect.top, this.width, this.height);
		},

		// Returns a new rectangle representing the intersection of this
		// instance and `rect`. If there is no intersection the return value
		// is `null`.
		intersection: function (rect) {

			if (!isInstanceOf(rect, Rect)) {
				return null;
			}

			var left = mathMax(this.left, rect.left),
				right = mathMin(this.right, rect.right),
				top = mathMax(this.top, rect.top),
				bottom = mathMin(this.bottom, rect.bottom),
				width = right - left,
				height = bottom - top;

			return (width >= 0 && height >= 0) ? new Rect(left, top, width, height) : null;
		},

		// Returns a new rectangle representing the smallest rectangle
		// containing this instance and `rect`.
		envelope: function (rect) {

			if (!isInstanceOf(rect, Rect)) {
				return this;
			}

			var left = mathMin(this.left, rect.left),
				right = mathMax(this.right, rect.right),
				top = mathMin(this.top, rect.top),
				bottom = mathMax(this.bottom, rect.bottom),
				width = right - left,
				height = bottom - top;

			return new Rect(left, top, width, height);
		}
	});

	// ### Static methods
	extend(Rect, {

		// Returns a new instance of `Rect` representing the content of the
		// specified element. Since the coordinates are in content space the
		// `left` and `top` values are always set to `0`. If `inDocSpace` is
		// `true` the rect gets returned in document space.
		ofContent: function (element, inContentSpace) {

			if (!element || element === document || element === window) {
				return new Rect(0, 0, $document.width(), $document.height());
			}

			if (inContentSpace) {
				return new Rect(0, 0, element.scrollWidth, element.scrollHeight);
			} else {
				return new Rect(element.offsetLeft - element.scrollLeft, element.offsetTop - element.scrollTop, element.scrollWidth, element.scrollHeight);
			}
		},

		// Returns a new instance of `Rect` representing the viewport of the
		// specified element. If `inDocSpace` is `true` the rect gets returned
		// in document space instead of content space.
		ofViewport: function (element, inContentSpace) {

			if (!element || element === document || element === window) {
				return new Rect($window.scrollLeft(), $window.scrollTop(), $window.width(), $window.height());
			}

			if (inContentSpace) {
				return new Rect(element.scrollLeft, element.scrollTop, element.clientWidth, element.clientHeight);
			} else {
				return new Rect(element.offsetLeft, element.offsetTop, element.clientWidth, element.clientHeight);
			}
		},

		// Returns a new instance of `Rect` representing a given
		// `HTMLElement`. The dimensions respect padding and border widths. If
		// the element is invisible (as determined by jQuery) the return value
		// is null.
		ofElement: function (element) {

			var $element = $(element);
			if (!$element.is(':visible')) {
				return null;
			}

			var offset = $element.offset();
			return new Rect(offset.left, offset.top, $element.outerWidth(), $element.outerHeight());
		}
	});



	// Fractions
	// ---------
	// The heart of the library. Creates and holds the
	// fractions data for the two specified rects. `viewport` defaults to
	// `Rect.ofViewport()`.
	var Fractions = function (visible, viewport, possible, rects) {

		this.visible = visible || 0;
		this.viewport = viewport || 0;
		this.possible = possible || 0;
		this.rects = (rects && extend({}, rects)) || null;
	};

	// ### Prototype
	extend(Fractions.prototype, {

		// Checks if this instance equals `that` in all attributes.
		equals: function (that) {

			return this.fracsEqual(that) && this.rectsEqual(that);
		},

		// Checks if this instance equals `that` in all fraction attributes.
		fracsEqual: function (that) {

			return equal(this, that, ['visible', 'viewport', 'possible']);
		},

		// Checks if this instance equals `that` in all rectangle attributes.
		rectsEqual: function (that) {

			return equal(this.rects, that.rects, ['document', 'element', 'viewport']);
		}
	});

	// ### Static methods
	extend(Fractions, {

		of: function (rect, viewport) {

			var intersection, intersectionArea, possibleArea;

			rect = (isHTMLElement(rect) && Rect.ofElement(rect)) || rect;
			viewport = (isHTMLElement(viewport) && Rect.ofViewport(viewport)) || viewport || Rect.ofViewport();

			intersection = rect.intersection(viewport);
			if (!intersection) {
				return new Fractions();
			}

			intersectionArea = intersection.area();
			possibleArea = mathMin(rect.width, viewport.width) * mathMin(rect.height, viewport.height);
			return new Fractions(
				intersectionArea / rect.area(),
				intersectionArea / viewport.area(),
				intersectionArea / possibleArea,
				{
					document: intersection,
					element: intersection.relativeTo(rect),
					viewport: intersection.relativeTo(viewport)
				}
			);
		}
	});



	// Group
	// -----
	var Group = function (elements, viewport) {

		this.els = elements;
		this.viewport = viewport;
	};

	// ### Helpers

		// Accepted values for `property` parameters below.
	var rectProps = ['width', 'height', 'left', 'right', 'top', 'bottom'],
		fracsProps = ['possible', 'visible', 'viewport'],

		// Returns the specified `property` for `HTMLElement element` or `0`
		// if `property` is invalid.
		getValue = function (element, viewport, property) {

			var obj;

			if ($.inArray(property, rectProps) >= 0) {
				obj = Rect.ofElement(element);
			} else if ($.inArray(property, fracsProps) >= 0) {
				obj = Fractions.of(element, viewport);
			}
			return obj ? obj[property] : 0;
		},

		// Sorting functions.
		sortAscending = function (entry1, entry2) {

			return entry1.val - entry2.val;
		},
		sortDescending = function (entry1, entry2) {

			return entry2.val - entry1.val;
		};

	// ### Prototype
	extend(Group.prototype, {

		// Returns a sorted list of objects `{el: HTMLElement, val: Number}`
		// for the specified `property`. `descending` defaults to `false`.
		sorted: function (property, descending) {

			var viewport = this.viewport;

			return $.map(this.els, function (element) {

						return {
							el: element,
							val: getValue(element, viewport, property)
						};
					})
					.sort(descending ? sortDescending : sortAscending);
		},

		// Returns the first element of the sorted list returned by `sorted` above,
		// or `null` if this list is empty.
		best: function (property, descending) {

			return this.els.length ? this.sorted(property, descending)[0] : null;
		}
	});



	// ScrollState
	// -----------
	var ScrollState = function (element) {

		var content = Rect.ofContent(element, true),
			viewport = Rect.ofViewport(element, true),
			w = content.width - viewport.width,
			h = content.height - viewport.height;

		this.content = content;
		this.viewport = viewport;
		this.width = w <= 0 ? null : viewport.left / w;
		this.height = h <= 0 ? null : viewport.top / h;
		this.left = viewport.left;
		this.top = viewport.top;
		this.right = content.right - viewport.right;
		this.bottom = content.bottom - viewport.bottom;
	};

	// ### Prototype
	extend(ScrollState.prototype, {

		// Checks if this instance equals `that`.
		equals: function (that) {

			return equal(this, that, ['width', 'height', 'left', 'top', 'right', 'bottom', 'content', 'viewport']);
		}
	});



	// Viewport
	// --------
	var Viewport = function (element) {

		this.el = element || window;
	};

	// ### Prototype
	extend(Viewport.prototype, {

		// Checks if this instance equals `that`.
		equals: function (that) {

			return equal(this, that, ['el']);
		},

		scrollState: function () {

			return new ScrollState(this.el);
		},

		scrollTo: function (left, top, duration) {

			var $el = this.el === window ? $('html,body') : $(this.el);

			left = left || 0;
			top = top || 0;
			duration = isNaN(duration) ? 1000 : duration;

			$el.stop(true).animate({scrollLeft: left, scrollTop: top}, duration);
		},

		scroll: function (left, top, duration) {

			var $el = this.el === window ? $window : $(this.el);

			left = left || 0;
			top = top || 0;

			this.scrollTo($el.scrollLeft() + left, $el.scrollTop() + top, duration);
		},

		scrollToRect: function (rect, paddingLeft, paddingTop, duration) {

			paddingLeft = paddingLeft || 0;
			paddingTop = paddingTop || 0;

			this.scrollTo(rect.left - paddingLeft, rect.top - paddingTop, duration);
		},

		scrollToElement: function (element, paddingLeft, paddingTop, duration) {

			var rect = Rect.ofElement(element).relativeTo(Rect.ofContent(this.el));

			this.scrollToRect(rect, paddingLeft, paddingTop, duration);
		}
	});





	// Callbacks
	// =========

	// callbacks mix-in
	// ----------------
	// Expects `context: HTMLElement` and `updatedValue: function`.
	var callbacksMixIn = {

		// Initial setup.
		init: function () {

			this.callbacks = $.Callbacks('memory unique');
			this.currVal = null;
			this.prevVal = null;

			// A proxy to make `check` bindable to events.
			this.checkProxy = $.proxy(this.check, this);

			this.autoCheck();
		},

		// Adds a new callback function.
		bind: function (callback) {

			this.callbacks.add(callback);
		},

		// Removes a previously added callback function.
		unbind: function (callback) {

			if (callback) {
				this.callbacks.remove(callback);
			} else {
				this.callbacks.empty();
			}
		},

		// Triggers all callbacks with the current values.
		trigger: function () {

			this.callbacks.fireWith(this.context, [this.currVal, this.prevVal]);
		},

		// Checks if value changed, updates attributes `currVal` and
		// `prevVal` accordingly and triggers the callbacks. Returns
		// `true` if value changed, otherwise `false`.
		check: function (event) {

			var value = this.updatedValue(event);

			if (value === undefined) {
				return false;
			}

			this.prevVal = this.currVal;
			this.currVal = value;
			this.trigger();
			return true;
		},

		// Auto-check configuration.
		$autoTarget: $window,
		autoEvents: 'load resize scroll',

		// Enables/disables automated checking for changes on the specified `window`
		// events.
		autoCheck: function (on) {

			this.$autoTarget[on === false ? 'off' : 'on'](this.autoEvents, this.checkProxy);
		}
	};



	// FracsCallbacks
	// --------------
	var FracsCallbacks = function (element, viewport) {

		this.context = element;
		this.viewport = viewport;
		this.init();
	};

	// ### Prototype
	extend(FracsCallbacks.prototype, callbacksMixIn, {
		updatedValue: function () {

			var value = Fractions.of(this.context, this.viewport);

			if (!this.currVal || !this.currVal.equals(value)) {
				return value;
			}
		}
	});



	// GroupCallbacks
	// --------------
	var GroupCallbacks = function (elements, viewport, property, descending) {

		this.context = new Group(elements, viewport);
		this.property = property;
		this.descending = descending;
		this.init();
	};

	// ### Prototype
	extend(GroupCallbacks.prototype, callbacksMixIn, {
		updatedValue: function () {

			var best = this.context.best(this.property, this.descending);

			if (best) {
				best = best.val > 0 ? best.el : null;
				if (this.currVal !== best) {
					return best;
				}
			}
		}
	});



	// ScrollStateCallbacks
	// --------------------
	var ScrollStateCallbacks = function (element) {

		if (!element || element === window || element === document) {
			this.context = window;
		} else {
			this.context = element;
			this.$autoTarget = $(element);
		}
		this.init();
	};

	// ### Prototype
	extend(ScrollStateCallbacks.prototype, callbacksMixIn, {
		updatedValue: function () {

			var value = new ScrollState(this.context);

			if (!this.currVal || !this.currVal.equals(value)) {
				return value;
			}
		}
	});





	// modplug 0.7
	// ===========

	// Use <http://larsjung.de/modplug> to attach the plug-in to jQuery.
	var modplug = function (namespace, options) {

			// Save the initial settings.
		var settings = extend({}, options),

			// Helper function to apply default methods.
			applyMethod = function (obj, args, methodName, methods) {

				// If `methodName` is a function apply it to get the actual
				// method name.
				methodName = isFn(methodName) ? methodName.apply(obj, args) : methodName;

				// If method exists then apply it and return the result ...
				if (isFn(methods[methodName])) {
					return methods[methodName].apply(obj, args);
				}

				// ... otherwise raise an error.
				$.error('Method "' + methodName + '" does not exist on jQuery.' + namespace);
			},

			// This function gets exposed as `$.<namespace>`.
			statics = function () {

				// Try to apply a default method.
				return applyMethod(this, slice.call(arguments), settings.defaultStatic, statics);
			},

			// This function gets exposed as `$(selector).<namespace>`.
			methods = function (method) {

				// If `method` exists then apply it ...
				if (isFn(methods[method])) {
					return methods[method].apply(this, slice.call(arguments, 1));
				}

				// ... otherwise try to apply a default method.
				return applyMethod(this, slice.call(arguments), settings.defaultMethod, methods);
			},

			// Adds/overwrites plug-in methods. This function gets exposed as
			// `$.<namespace>.modplug` to make the plug-in extendable.
			plug = function (options) {

				if (options) {
					extend(statics, options.statics);
					extend(methods, options.methods);
				}

				// Make sure that `$.<namespace>.modplug` points to this
				// function after adding new methods.
				statics.modplug = plug;
			};

		// Save objects or methods previously registered to the desired
		// namespace. They are available via `$.<namespace>.modplug.prev`.
		plug.prev = {
			statics: $[namespace],
			methods: $.fn[namespace]
		};

		// Init the plug-in by adding the specified statics and methods.
		plug(options);

		// Register the plug-in.
		$[namespace] = statics;
		$.fn[namespace] = methods;
	};





	// Register the plug-in
	// ===================

		// The namespace used to register the plug-in and to attach data to
		// elements.
	var namespace = 'fracs';

	// The methods are sorted in alphabetical order. All methods that do not
	// provide a return value will return `this` to enable method chaining.
	modplug(namespace, {

		// Static methods
		// --------------
		// These methods are accessible via `$.fracs.<methodname>`.
		statics: {

			// Build version.
			version: '%BUILD_VERSION%',

			// Publish object constructors (for testing).
			Rect: Rect,
			Fractions: Fractions,
			Group: Group,
			ScrollState: ScrollState,
			Viewport: Viewport,
			FracsCallbacks: FracsCallbacks,
			GroupCallbacks: GroupCallbacks,
			ScrollStateCallbacks: ScrollStateCallbacks,

			// ### fracs
			// This is the **default method**. So instead of calling
			// `$.fracs.fracs(...)` simply call `$.fracs(...)`.
			//
			// Returns the fractions for a given `Rect` and `viewport`,
			// viewport defaults to `$.fracs.viewport()`.
			//
			//      $.fracs(rect: Rect, [viewport: Rect]): Fractions
			fracs: function (rect, viewport) {

				return Fractions.of(rect, viewport);
			}
		},

		// Instance methods
		// ----------------
		// These methods are accessible via `$(selector).fracs('<methodname>', ...)`.
		methods: {

			// ### 'content'
			// Returns the content rect of the first selected element in content space.
			// If no element is selected it returns the document rect.
			//
			//      .fracs('content'): Rect
			content: function (inContentSpace) {

				return this.length ? Rect.ofContent(this[0], inContentSpace) : null;
			},

			// ### 'envelope'
			// Returns the smallest rectangle that containes all selected elements.
			//
			//      .fracs('envelope'): Rect
			envelope: function () {

				return reduce(this, function (current) {

					var rect = Rect.ofElement(this);
					return current ? current.envelope(rect) : rect;
				});
			},

			// ### 'fracs'
			// This is the **default method**. So the first parameter `'fracs'`
			// can be omitted.
			//
			// Returns the fractions for the first selected element.
			//
			//      .fracs(): Fractions
			//
			// Binds a callback function that will be invoked if fractions have changed
			// after a `window resize` or `window scroll` event.
			//
			//      .fracs(callback(fracs: Fractions, prevFracs: Fractions)): jQuery
			//
			// Unbinds the specified callback function.
			//
			//      .fracs('unbind', callback): jQuery
			//
			// Unbinds all callback functions.
			//
			//      .fracs('unbind'): jQuery
			//
			// Checks if fractions changed and if so invokes all bound callback functions.
			//
			//      .fracs('check'): jQuery
			fracs: function (action, callback, viewport) {

				if (!isTypeOf(action, 'string')) {
					viewport = callback;
					callback = action;
					action = null;
				}
				if (!isFn(callback)) {
					viewport = callback;
					callback = null;
				}
				viewport = getHTMLElement(viewport);

				var ns = namespace + '.fracs.' + getId(viewport);

				if (action === 'unbind') {
					return this.each(function () {

						var cbs = $(this).data(ns);

						if (cbs) {
							cbs.unbind(callback);
						}
					});
				} else if (action === 'check') {
					return this.each(function () {

						var cbs = $(this).data(ns);

						if (cbs) {
							cbs.check();
						}
					});
				} else if (isFn(callback)) {
					return this.each(function () {

						var $this = $(this),
							cbs = $this.data(ns);

						if (!cbs) {
							cbs = new FracsCallbacks(this, viewport);
							$this.data(ns, cbs);
						}
						cbs.bind(callback);
					});
				}

				return this.length ? Fractions.of(this[0], viewport) : null;
			},

			// ### 'intersection'
			// Returns the greatest rectangle that is contained in all selected elements.
			//
			//      .fracs('intersection'): Rect
			intersection: function () {

				return reduce(this, function (current) {

					var rect = Rect.ofElement(this);
					return current ? current.intersection(rect) : rect;
				});
			},

			// ### 'max'
			// Reduces the set of selected elements to those with the maximum value
			// of the specified property.
			// Valid values for property are `possible`, `visible`, `viewport`,
			// `width`, `height`, `left`, `right`, `top`, `bottom`.
			//
			//      .fracs('max', property: String): jQuery
			//
			// Binds a callback function to the set of selected elements that gets
			// triggert whenever the element with the highest value of the specified
			// property changes.
			//
			//      .fracs('max', property: String, callback(best: Element, prevBest: Element)): jQuery
			max: function (property, callback, viewport) {

				if (!isFn(callback)) {
					viewport = callback;
					callback = null;
				}
				viewport = getHTMLElement(viewport);

				if (callback) {
					new GroupCallbacks(this, viewport, property, true).bind(callback);
					return this;
				}

				return this.pushStack(new Group(this, viewport).best(property, true).el);
			},

			// ### 'min'
			// Reduces the set of selected elements to those with the minimum value
			// of the specified property.
			// Valid values for property are `possible`, `visible`, `viewport`,
			// `width`, `height`, `left`, `right`, `top`, `bottom`.
			//
			//      .fracs('min', property: String): jQuery
			//
			// Binds a callback function to the set of selected elements that gets
			// triggert whenever the element with the lowest value of the specified
			// property changes.
			//
			//      .fracs('min', property: String, callback(best: Element, prevBest: Element)): jQuery
			min: function (property, callback, viewport) {

				if (!isFn(callback)) {
					viewport = callback;
					callback = null;
				}
				viewport = getHTMLElement(viewport);

				if (callback) {
					new GroupCallbacks(this, viewport, property).bind(callback);
					return this;
				}

				return this.pushStack(new Group(this, viewport).best(property).el);
			},

			// ### 'rect'
			// Returns the dimensions for the first selected element in document space.
			//
			//      .fracs('rect'): Rect
			rect: function () {

				return this.length ? Rect.ofElement(this[0]) : null;
			},

			// ### 'scrollState'
			// Returns the current scroll state for the first selected element.
			//
			//      .fracs('scrollState'): ScrollState
			//
			// Binds a callback function that will be invoked if scroll state has changed
			// after a `resize` or `scroll` event.
			//
			//      .fracs('scrollState', callback(scrollState: scrollState, prevScrollState: scrollState)): jQuery
			//
			// Unbinds the specified callback function.
			//
			//      .fracs('scrollState', 'unbind', callback): jQuery
			//
			// Unbinds all callback functions.
			//
			//      .fracs('scrollState', 'unbind'): jQuery
			//
			// Checks if scroll state changed and if so invokes all bound callback functions.
			//
			//      .fracs('scrollState', 'check'): jQuery
			scrollState: function (action, callback) {

				var ns = namespace + '.scrollState';

				if (!isTypeOf(action, 'string')) {
					callback = action;
					action = null;
				}

				if (action === 'unbind') {
					return this.each(function () {

						var cbs = $(this).data(ns);

						if (cbs) {
							cbs.unbind(callback);
						}
					});
				} else if (action === 'check') {
					return this.each(function () {

						var cbs = $(this).data(ns);

						if (cbs) {
							cbs.check();
						}
					});
				} else if (isFn(callback)) {
					return this.each(function () {

						var $this = $(this),
							cbs = $this.data(ns);

						if (!cbs) {
							cbs = new ScrollStateCallbacks(this);
							$this.data(ns, cbs);
						}
						cbs.bind(callback);
					});
				}

				return this.length ? new ScrollState(this[0]) : null;
			},

			// ### 'scroll'
			// Scrolls the selected elements relative to its current position,
			// `padding` defaults to `0`, `duration` to `1000`.
			//
			//      .fracs('scroll', element: HTMLElement/jQuery, [paddingLeft: int,] [paddingTop: int,] [duration: int]): jQuery
			scroll: function (left, top, duration) {

				return this.each(function () {

					new Viewport(this).scroll(left, top, duration);
				});
			},

			// ### 'scrollTo'
			// Scrolls the selected elements to the specified element or an absolute position,
			// `padding` defaults to `0`, `duration` to `1000`.
			//
			//      .fracs('scrollTo', element: HTMLElement/jQuery, [paddingLeft: int,] [paddingTop: int,] [duration: int]): jQuery
			//      .fracs('scrollTo', [left: int,] [top: int,] [duration: int]): jQuery
			scrollTo: function (element, paddingLeft, paddingTop, duration) {

				if ($.isNumeric(element)) {
					duration = paddingTop;
					paddingTop = paddingLeft;
					paddingLeft = element;
					element = null;
				}

				element = getHTMLElement(element);

				return this.each(function () {

					if (element) {
						new Viewport(this).scrollToElement(element, paddingLeft, paddingTop, duration);
					} else {
						new Viewport(this).scrollTo(paddingLeft, paddingTop, duration);
					}
				});
			},

			// ### 'scrollToThis'
			// Scrolls the viewport (window) to the first selected element in the specified time,
			// `padding` defaults to `0`, `duration` to `1000`.
			//
			//      .fracs('scrollToThis', [paddingLeft: int,] [paddingTop: int,] [duration: int,] [viewport: HTMLElement/jQuery]): jQuery
			scrollToThis: function (paddingLeft, paddingTop, duration, viewport) {

				viewport = new Viewport(getHTMLElement(viewport));

				viewport.scrollToElement(this[0], paddingLeft, paddingTop, duration);
				return this;
			},

			// ### 'softLink'
			// Converts all selected page intern links `<a href="#...">` into soft links.
			// Uses `scrollTo` to scroll to the location.
			//
			//      .fracs('softLink', [paddingLeft: int,] [paddingTop: int,] [duration: int,] [viewport: HTMLElement/jQuery]): jQuery
			softLink: function (paddingLeft, paddingTop, duration, viewport) {

				viewport = new Viewport(getHTMLElement(viewport));

				return this.filter('a[href^=#]').each(function () {
					var $a = $(this);
					$a.on('click', function () {
						viewport.scrollToElement($($a.attr('href'))[0], paddingLeft, paddingTop, duration);
					});
				});
			},

			// ### 'sort'
			// Sorts the set of selected elements by the specified property.
			// Valid values for property are `possible`, `visible`, `viewport`,
			// `width`, `height`, `left`, `right`, `top`, `bottom`. The default
			// sort order is descending.
			//
			//      .fracs('sort', property: String, [ascending: boolean]): jQuery
			sort: function (property, ascending, viewport) {

				if (!isTypeOf(ascending, 'boolean')) {
					viewport = ascending;
					ascending = null;
				}
				viewport = getHTMLElement(viewport);

				return this.pushStack($.map(new Group(this, viewport).sorted(property, !ascending), function (entry) {
					return entry.el;
				}));
			},

			// ### 'viewport'
			// Returns the current viewport of the first selected element in content space.
			// If no element is selected it returns the document's viewport.
			//
			//      .fracs('viewport'): Rect
			viewport: function (inContentSpace) {

				return this.length ? Rect.ofViewport(this[0], inContentSpace) : null;
			}
		},

		// Defaults
		// --------
		defaultStatic: 'fracs',
		defaultMethod: 'fracs'
	});

}(window, document, jQuery));

/* /htapps/roger.babel/pt/web/vendor/jquery.fracs.js */
/*
 * Viewport - jQuery selectors for finding elements in viewport
 *
 * Copyright (c) 2008-2009 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *  http://www.appelsiini.net/projects/viewport
 *
 */
(function($) {
    
    $.belowthefold = function(element, settings) {
        var fold = $(window).height() + $(window).scrollTop();
        return fold <= $(element).offset().top - settings.threshold;
    };

    $.abovethetop = function(element, settings) {
        var top = $(window).scrollTop();
        return top >= $(element).offset().top + $(element).height() - settings.threshold;
    };
    
    $.rightofscreen = function(element, settings) {
        var fold = $(window).width() + $(window).scrollLeft();
        return fold <= $(element).offset().left - settings.threshold;
    };
    
    $.leftofscreen = function(element, settings) {
        var left = $(window).scrollLeft();
        return left >= $(element).offset().left + $(element).width() - settings.threshold;
    };
    
    $.inviewport = function(element, settings) {
        return !$.rightofscreen(element, settings) && !$.leftofscreen(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings);
    };
    
    $.extend($.expr[':'], {
        "below-the-fold": function(a, i, m) {
            return $.belowthefold(a, {threshold : 0});
        },
        "above-the-top": function(a, i, m) {
            return $.abovethetop(a, {threshold : 0});
        },
        "left-of-screen": function(a, i, m) {
            return $.leftofscreen(a, {threshold : 0});
        },
        "right-of-screen": function(a, i, m) {
            return $.rightofscreen(a, {threshold : 0});
        },
        "in-viewport": function(a, i, m) {
            return $.inviewport(a, {threshold : 0});
        }
    });

    
})(jQuery);

/* /htapps/roger.babel/pt/web/vendor/jquery.viewport.js */
// Generated by CoffeeScript 1.7.1

/**
@license Sticky-kit v1.1.1 | WTFPL | Leaf Corcoran 2014 | http://leafo.net
 */

(function() {
  var $, win;

  $ = this.jQuery || window.jQuery;

  win = $(window);

  $.fn.stick_in_parent = function(opts) {
    var elm, enable_bottoming, inner_scrolling, manual_spacer, offset_top, parent_selector, recalc_every, sticky_class, _fn, _i, _len;
    if (opts == null) {
      opts = {};
    }
    sticky_class = opts.sticky_class, inner_scrolling = opts.inner_scrolling, recalc_every = opts.recalc_every, parent_selector = opts.parent, offset_top = opts.offset_top, manual_spacer = opts.spacer, enable_bottoming = opts.bottoming;
    if (offset_top == null) {
      offset_top = 0;
    }
    if (parent_selector == null) {
      parent_selector = void 0;
    }
    if (inner_scrolling == null) {
      inner_scrolling = true;
    }
    if (sticky_class == null) {
      sticky_class = "is_stuck";
    }
    if (enable_bottoming == null) {
      enable_bottoming = true;
    }
    _fn = function(elm, padding_bottom, parent_top, parent_height, top, height, el_float, detached) {
      var bottomed, detach, fixed, last_pos, offset, parent, recalc, recalc_and_tick, recalc_counter, spacer, tick;
      if (elm.data("sticky_kit")) {
        return;
      }
      elm.data("sticky_kit", true);
      parent = elm.parent();
      if (parent_selector != null) {
        parent = parent.closest(parent_selector);
      }
      if (!parent.length) {
        throw "failed to find stick parent";
      }
      fixed = false;
      bottomed = false;
      spacer = manual_spacer != null ? manual_spacer && elm.closest(manual_spacer) : $("<div />");
      if (spacer) {
        spacer.css('position', elm.css('position'));
      }
      recalc = function() {
        var border_top, padding_top, restore;
        if (detached) {
          return;
        }
        border_top = parseInt(parent.css("border-top-width"), 10);
        padding_top = parseInt(parent.css("padding-top"), 10);
        padding_bottom = parseInt(parent.css("padding-bottom"), 10);
        parent_top = parent.offset().top + border_top + padding_top;
        parent_height = parent.height();
        if (fixed) {
          fixed = false;
          bottomed = false;
          if (manual_spacer == null) {
            elm.insertAfter(spacer);
            spacer.detach();
          }
          elm.css({
            position: "",
            top: "",
            width: "",
            bottom: ""
          }).removeClass(sticky_class);
          restore = true;
        }
        top = elm.offset().top - parseInt(elm.css("margin-top"), 10) - offset_top;
        height = elm.outerHeight(true);
        el_float = elm.css("float");
        if (spacer) {
          spacer.css({
            width: elm.outerWidth(true),
            height: height,
            display: elm.css("display"),
            "vertical-align": elm.css("vertical-align"),
            "float": el_float
          });
        }
        if (restore) {
          return tick();
        }
      };
      recalc();
      if (height === parent_height) {
        return;
      }
      last_pos = void 0;
      offset = offset_top;
      recalc_counter = recalc_every;
      tick = function() {
        var css, delta, scroll, will_bottom, win_height;
        if (detached) {
          return;
        }
        if (recalc_counter != null) {
          recalc_counter -= 1;
          if (recalc_counter <= 0) {
            recalc_counter = recalc_every;
            recalc();
          }
        }
        scroll = win.scrollTop();
        if (last_pos != null) {
          delta = scroll - last_pos;
        }
        last_pos = scroll;
        if (fixed) {
          if (enable_bottoming) {
            will_bottom = scroll + height + offset > parent_height + parent_top;
            if (bottomed && !will_bottom) {
              bottomed = false;
              elm.css({
                position: "fixed",
                bottom: "",
                top: offset
              }).trigger("sticky_kit:unbottom");
            }
          }
          if (scroll < top) {
            fixed = false;
            offset = offset_top;
            if (manual_spacer == null) {
              if (el_float === "left" || el_float === "right") {
                elm.insertAfter(spacer);
              }
              spacer.detach();
            }
            css = {
              position: "",
              width: "",
              top: ""
            };
            elm.css(css).removeClass(sticky_class).trigger("sticky_kit:unstick");
          }
          if (inner_scrolling) {
            win_height = win.height();
            if (height + offset_top > win_height) {
              if (!bottomed) {
                offset -= delta;
                offset = Math.max(win_height - height, offset);
                offset = Math.min(offset_top, offset);
                if (fixed) {
                  elm.css({
                    top: offset + "px"
                  });
                }
              }
            }
          }
        } else {
          if (scroll > top) {
            fixed = true;
            css = {
              position: "fixed",
              top: offset
            };
            css.width = elm.css("box-sizing") === "border-box" ? elm.outerWidth() + "px" : elm.width() + "px";
            elm.css(css).addClass(sticky_class);
            if (manual_spacer == null) {
              elm.after(spacer);
              if (el_float === "left" || el_float === "right") {
                spacer.append(elm);
              }
            }
            elm.trigger("sticky_kit:stick");
          }
        }
        if (fixed && enable_bottoming) {
          if (will_bottom == null) {
            will_bottom = scroll + height + offset > parent_height + parent_top;
          }
          if (!bottomed && will_bottom) {
            bottomed = true;
            if (parent.css("position") === "static") {
              parent.css({
                position: "relative"
              });
            }
            return elm.css({
              position: "absolute",
              bottom: padding_bottom,
              top: "auto"
            }).trigger("sticky_kit:bottom");
          }
        }
      };
      recalc_and_tick = function() {
        recalc();
        return tick();
      };
      detach = function() {
        detached = true;
        win.off("touchmove", tick);
        win.off("scroll", tick);
        win.off("resize", recalc_and_tick);
        $(document.body).off("sticky_kit:recalc", recalc_and_tick);
        elm.off("sticky_kit:detach", detach);
        elm.removeData("sticky_kit");
        elm.css({
          position: "",
          bottom: "",
          top: "",
          width: ""
        });
        parent.position("position", "");
        if (fixed) {
          if (manual_spacer == null) {
            if (el_float === "left" || el_float === "right") {
              elm.insertAfter(spacer);
            }
            spacer.remove();
          }
          return elm.removeClass(sticky_class);
        }
      };
      win.on("touchmove", tick);
      win.on("scroll", tick);
      win.on("resize", recalc_and_tick);
      $(document.body).on("sticky_kit:recalc", recalc_and_tick);
      elm.on("sticky_kit:detach", detach);
      return setTimeout(tick, 0);
    };
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      elm = this[_i];
      _fn($(elm));
    }
    return this;
  };

}).call(this);

/* /htapps/roger.babel/pt/web/vendor/jquery.sticky-kit.js */
(function($, window, documentElement, height, width) {

    // browser detection code courtesy of quirksmode, http://www.quirksmode.org/js/detect.html
    // slightly simplified, as well as minor changes for readability purposes

    var BrowserDetect = {
        init: function () {
            this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
            this.version = this.searchVersion(navigator.userAgent)
                || this.searchVersion(navigator.appVersion)
                || "an unknown version";
            this.OS = this.searchString(this.dataOS) || "an unknown OS";
        },

        searchString: function (data) {
            for (var i=0;i<data.length;i++)    {
                var dataString = data[i].string;
                var dataProp = data[i].prop;
                this.versionSearchString = data[i].versionSearch || data[i].identity;
                if (dataString) {
                    if (dataString.indexOf(data[i].subString) != -1)
                        return data[i].identity;
                }
                else if (dataProp)
                    return data[i].identity;
            }
        },

        searchVersion: function (dataString) {
            var index = dataString.indexOf(this.versionSearchString);
            if (index == -1) return;
            return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
        },

        dataBrowser: [
            { string: navigator.userAgent, subString: "Chrome",  identity: "Chrome"                            },
            { string: navigator.vendor,    subString: "Apple",   identity: "Safari",  versionSearch: "Version" },
            { prop: window.opera,                                identity: "Opera",   versionSearch: "Version" },
            { string: navigator.userAgent, subString: "Firefox", identity: "Firefox"                           },
            { string: navigator.userAgent, subString: "MSIE",    identity: "Explorer", versionSearch: "MSIE"   }
        ],

        dataOS : [
            { string: navigator.platform,  subString: "Win",    identity: "Windows"     },
            { string: navigator.platform,  subString: "Mac",    identity: "Mac"         },
            { string: navigator.platform,  subString: "Linux",  identity: "Linux"       }
        ]

    };

    BrowserDetect.init();
    // Browser name: BrowserDetect.browser
    // Browser version: BrowserDetect.version
    // OS name: BrowserDetect.OS

    // here are major browsers' keyboard mapping for triggering fullscreen on/off
    var keys = {
        "MSIE": {
            "Windows": { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               }
        },
        "Explorer": {
            "Windows": { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               }
        },
        "Firefox": {
            "Windows": { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               },
            "Linux":   { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               },
            "Mac":     { ctrlKey: false, altKey: false, metaKey: true,  shiftKey: true,  which:  70, string: "&#x21E7;&#x2318;F", alt: "Shift+Command+F"   }
        },
        "Chrome": {
            "Windows": { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               },
            "Linux":   { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               },
            "Mac":     { ctrlKey: false, altKey: false, metaKey: true,  shiftKey: true,  which:  70, string: "&#x21E7;&#x2318;F", alt: "Shift+Command+F"   }
        },
        "Safari": { // still missing Safari on Windows... help!
            "Mac":     { ctrlKey: true,  altKey: false, metaKey: false, shiftKey: true,  which:  70, string: "^&#x2318;F",        alt: "Control+Command+F" }
        },
        "Opera": {
            "Windows": { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               },
            "Linux":   { ctrlKey: false, altKey: false, metaKey: false, shiftKey: false, which: 122, string: "F11",               alt: "F11"               },
            "Mac":     { ctrlKey: false, altKey: false, metaKey: true,  shiftKey: true,  which:  70, string: "&#x21E7;&#x2318;F", alt: "Shift+Command+F"   }
        },

    };

    var
        isFullScreen = function() {
            return (documentElement.clientHeight == height && documentElement.clientWidth == width) ||
                window.fullScreen ||
                (window.outerHeight == height && window.outerWidth == width) ||
                (BrowserDetect.browser == "Safari" && window.outerHeight == (height - 40) && window.outerWidth == width)
            ;
        }
        ,$window = $(window)
    ;

    if ( keys[BrowserDetect.browser] == null ) {
        return;
    }
    var thisKeys = keys[BrowserDetect.browser][BrowserDetect.OS];
    var shortcut = thisKeys ? { shortcut: thisKeys.string, longform: thisKeys.alt } : {};

    $window
        .data('fullscreen-state', isFullScreen())
        .data('fullscreen-key',   shortcut)
        .resize(function() {
            var fullscreenState = isFullScreen();

            if ($window.data('fullscreen-state') && !fullscreenState) {
                $window
                    .data('fullscreen-state', fullscreenState)
                    .trigger('fullscreen-toggle', [false])
                    .trigger('fullscreen-off')
                ;
            }
            else if (!$window.data('fullscreen-state') && fullscreenState) {
                $window
                    .data('fullscreen-state', fullscreenState)
                    .trigger('fullscreen-toggle', [true])
                    .trigger('fullscreen-on')
                ;
            }
        })
        .keydown(function(e) {
            if (thisKeys && e.ctrlKey == thisKeys.ctrlKey && e.altKey == thisKeys.altKey && e.metaKey == thisKeys.metaKey && e.shiftKey == thisKeys.shiftKey && e.which == thisKeys.which)
                $window.trigger('fullscreen-key', [thisKeys.string, thisKeys.alt]);
        })
    ;

})(jQuery, this, document.documentElement, screen.height, screen.width);

/* /htapps/roger.babel/pt/web/vendor/jquery.fullscreen.js */
/*
* jquery.animate.clip.js
*
* jQuery css clip animation support -- Joshua Poehls
* version 0.1.4

* forked from Jim Palmer's plugin http://www.overset.com/2008/08/07/jquery-css-clip-animation-plugin/
* idea spawned from jquery.color.js by John Resig
* Released under the MIT license.
*/
(function (jQuery) {

    function getStyle(elem, name) {
        return (elem.currentStyle && elem.currentStyle[name]) || elem.style[name];
    }

    function getClip(elem) {
        var cssClip = $(elem).css('clip') || '';

        if (!cssClip) {
            // Try to get the clip rect another way for IE8.
            // This is a workaround for jQuery's css('clip') returning undefined
            // when the clip is defined in an external stylesheet in IE8. -JPOEHLS
            var pieces = {
                top: getStyle(elem, 'clipTop'),
                right: getStyle(elem, 'clipRight'),
                bottom: getStyle(elem, 'clipBottom'),
                left: getStyle(elem, 'clipLeft')
            };

            if (pieces.top && pieces.right && pieces.bottom && pieces.left) {
                cssClip = 'rect(' + pieces.top + ' ' + pieces.right + ' ' + pieces.bottom + ' ' + pieces.left + ')';
            }
        }

        // Strip commas and return.
        return cssClip.replace(/,/g, ' ');
    }

    jQuery.fx.step.clip = function (fx) {
        if (fx.pos === 0) {
            var cRE = /rect\(([0-9\.]{1,})(px|em)[,]?\s+([0-9\.]{1,})(px|em)[,]?\s+([0-9\.]{1,})(px|em)[,]?\s+([0-9\.]{1,})(px|em)\)/;

            fx.start = cRE.exec(getClip(fx.elem));
            if (typeof fx.end === 'string') {
                fx.end = cRE.exec(fx.end.replace(/,/g, ' '));
            }
        }
        if (fx.start && fx.end) {
            var sarr = new Array(), earr = new Array(), spos = fx.start.length, epos = fx.end.length,
                emOffset = fx.start[ss + 1] == 'em' ? (parseInt($(fx.elem).css('fontSize')) * 1.333 * parseInt(fx.start[ss])) : 1;
            for (var ss = 1; ss < spos; ss += 2) { sarr.push(parseInt(emOffset * fx.start[ss])); }
            for (var es = 1; es < epos; es += 2) { earr.push(parseInt(emOffset * fx.end[es])); }
            fx.elem.style.clip = 'rect(' +
                parseInt((fx.pos * (earr[0] - sarr[0])) + sarr[0]) + 'px ' +
                parseInt((fx.pos * (earr[1] - sarr[1])) + sarr[1]) + 'px ' +
                parseInt((fx.pos * (earr[2] - sarr[2])) + sarr[2]) + 'px ' +
                parseInt((fx.pos * (earr[3] - sarr[3])) + sarr[3]) + 'px)';
        }
    }
})(jQuery);
/* /htapps/roger.babel/pt/web/vendor/jquery.animate.clip.js */
// jquery.event.move
//
// 1.3.6
//
// Stephen Band
//
// Triggers 'movestart', 'move' and 'moveend' events after
// mousemoves following a mousedown cross a distance threshold,
// similar to the native 'dragstart', 'drag' and 'dragend' events.
// Move events are throttled to animation frames. Move event objects
// have the properties:
//
// pageX:
// pageY:   Page coordinates of pointer.
// startX:
// startY:  Page coordinates of pointer at movestart.
// distX:
// distY:  Distance the pointer has moved since movestart.
// deltaX:
// deltaY:  Distance the finger has moved since last event.
// velocityX:
// velocityY:  Average velocity over last few events.


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){

	var // Number of pixels a pressed pointer travels before movestart
	    // event is fired.
	    threshold = 6,
	
	    add = jQuery.event.add,
	
	    remove = jQuery.event.remove,

	    // Just sugar, so we can have arguments in the same order as
	    // add and remove.
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    // Shim for requestAnimationFrame, falling back to timer. See:
	    // see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	    requestFrame = (function(){
	    	return (
	    		window.requestAnimationFrame ||
	    		window.webkitRequestAnimationFrame ||
	    		window.mozRequestAnimationFrame ||
	    		window.oRequestAnimationFrame ||
	    		window.msRequestAnimationFrame ||
	    		function(fn, element){
	    			return window.setTimeout(function(){
	    				fn();
	    			}, 25);
	    		}
	    	);
	    })(),
	    
	    ignoreTags = {
	    	textarea: true,
	    	input: true,
	    	select: true,
	    	button: true
	    },
	    
	    mouseevents = {
	    	move: 'mousemove',
	    	cancel: 'mouseup dragstart',
	    	end: 'mouseup'
	    },
	    
	    touchevents = {
	    	move: 'touchmove',
	    	cancel: 'touchend',
	    	end: 'touchend'
	    };


	// Constructors
	
	function Timer(fn){
		var callback = fn,
		    active = false,
		    running = false;
		
		function trigger(time) {
			if (active){
				callback();
				requestFrame(trigger);
				running = true;
				active = false;
			}
			else {
				running = false;
			}
		}
		
		this.kick = function(fn) {
			active = true;
			if (!running) { trigger(); }
		};
		
		this.end = function(fn) {
			var cb = callback;
			
			if (!fn) { return; }
			
			// If the timer is not running, simply call the end callback.
			if (!running) {
				fn();
			}
			// If the timer is running, and has been kicked lately, then
			// queue up the current callback and the end callback, otherwise
			// just the end callback.
			else {
				callback = active ?
					function(){ cb(); fn(); } : 
					fn ;
				
				active = true;
			}
		};
	}


	// Functions
	
	function returnTrue() {
		return true;
	}
	
	function returnFalse() {
		return false;
	}
	
	function preventDefault(e) {
		e.preventDefault();
	}
	
	function preventIgnoreTags(e) {
		// Don't prevent interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }
		
		e.preventDefault();
	}

	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function identifiedTouch(touchList, id) {
		var i, l;

		if (touchList.identifiedTouch) {
			return touchList.identifiedTouch(id);
		}
		
		// touchList.identifiedTouch() does not exist in
		// webkit yet… we must do the search ourselves...
		
		i = -1;
		l = touchList.length;
		
		while (++i < l) {
			if (touchList[i].identifier === id) {
				return touchList[i];
			}
		}
	}

	function changedTouch(e, event) {
		var touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		// Chrome Android (at least) includes touches that have not
		// changed in e.changedTouches. That's a bit annoying. Check
		// that this touch has changed.
		if (touch.pageX === event.pageX && touch.pageY === event.pageY) { return; }

		return touch;
	}


	// Handlers that decide when the first movestart is triggered
	
	function mousedown(e){
		var data;

		if (!isLeftButton(e)) { return; }

		data = {
			target: e.target,
			startX: e.pageX,
			startY: e.pageY,
			timeStamp: e.timeStamp
		};

		add(document, mouseevents.move, mousemove, data);
		add(document, mouseevents.cancel, mouseend, data);
	}

	function mousemove(e){
		var data = e.data;

		checkThreshold(e, data, e, removeMouse);
	}

	function mouseend(e) {
		removeMouse();
	}

	function removeMouse() {
		remove(document, mouseevents.move, mousemove);
		remove(document, mouseevents.cancel, mouseend);
	}

	function touchstart(e) {
		var touch, template;

		// Don't get in the way of interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }

		touch = e.changedTouches[0];
		
		// iOS live updates the touch objects whereas Android gives us copies.
		// That means we can't trust the touchstart object to stay the same,
		// so we must copy the data. This object acts as a template for
		// movestart, move and moveend event objects.
		template = {
			target: touch.target,
			startX: touch.pageX,
			startY: touch.pageY,
			timeStamp: e.timeStamp,
			identifier: touch.identifier
		};

		// Use the touch identifier as a namespace, so that we can later
		// remove handlers pertaining only to this touch.
		add(document, touchevents.move + '.' + touch.identifier, touchmove, template);
		add(document, touchevents.cancel + '.' + touch.identifier, touchend, template);
	}

	function touchmove(e){
		var data = e.data,
		    touch = changedTouch(e, data);

		if (!touch) { return; }

		checkThreshold(e, data, touch, removeTouch);
	}

	function touchend(e) {
		var template = e.data,
		    touch = identifiedTouch(e.changedTouches, template.identifier);

		if (!touch) { return; }

		removeTouch(template.identifier);
	}

	function removeTouch(identifier) {
		remove(document, '.' + identifier, touchmove);
		remove(document, '.' + identifier, touchend);
	}


	// Logic for deciding when to trigger a movestart.

	function checkThreshold(e, template, touch, fn) {
		var distX = touch.pageX - template.startX,
		    distY = touch.pageY - template.startY;

		// Do nothing if the threshold has not been crossed.
		if ((distX * distX) + (distY * distY) < (threshold * threshold)) { return; }

		triggerStart(e, template, touch, distX, distY, fn);
	}

	function handled() {
		// this._handled should return false once, and after return true.
		this._handled = returnTrue;
		return false;
	}

	function flagAsHandled(e) {
		e._handled();
	}

	function triggerStart(e, template, touch, distX, distY, fn) {
		var node = template.target,
		    touches, time;

		touches = e.targetTouches;
		time = e.timeStamp - template.timeStamp;

		// Create a movestart object with some special properties that
		// are passed only to the movestart handlers.
		template.type = 'movestart';
		template.distX = distX;
		template.distY = distY;
		template.deltaX = distX;
		template.deltaY = distY;
		template.pageX = touch.pageX;
		template.pageY = touch.pageY;
		template.velocityX = distX / time;
		template.velocityY = distY / time;
		template.targetTouches = touches;
		template.finger = touches ?
			touches.length :
			1 ;

		// The _handled method is fired to tell the default movestart
		// handler that one of the move events is bound.
		template._handled = handled;
			
		// Pass the touchmove event so it can be prevented if or when
		// movestart is handled.
		template._preventTouchmoveDefault = function() {
			e.preventDefault();
		};

		// Trigger the movestart event.
		trigger(template.target, template);

		// Unbind handlers that tracked the touch or mouse up till now.
		fn(template.identifier);
	}


	// Handlers that control what happens following a movestart

	function activeMousemove(e) {
		var timer = e.data.timer;

		e.data.touch = e;
		e.data.timeStamp = e.timeStamp;
		timer.kick();
	}

	function activeMouseend(e) {
		var event = e.data.event,
		    timer = e.data.timer;
		
		removeActiveMouse();

		endEvent(event, timer, function() {
			// Unbind the click suppressor, waiting until after mouseup
			// has been handled.
			setTimeout(function(){
				remove(event.target, 'click', returnFalse);
			}, 0);
		});
	}

	function removeActiveMouse(event) {
		remove(document, mouseevents.move, activeMousemove);
		remove(document, mouseevents.end, activeMouseend);
	}

	function activeTouchmove(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = changedTouch(e, event);

		if (!touch) { return; }

		// Stop the interface from gesturing
		e.preventDefault();

		event.targetTouches = e.targetTouches;
		e.data.touch = touch;
		e.data.timeStamp = e.timeStamp;
		timer.kick();
	}

	function activeTouchend(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		removeActiveTouch(event);
		endEvent(event, timer);
	}

	function removeActiveTouch(event) {
		remove(document, '.' + event.identifier, activeTouchmove);
		remove(document, '.' + event.identifier, activeTouchend);
	}


	// Logic for triggering move and moveend events

	function updateEvent(event, touch, timeStamp, timer) {
		var time = timeStamp - event.timeStamp;

		event.type = 'move';
		event.distX =  touch.pageX - event.startX;
		event.distY =  touch.pageY - event.startY;
		event.deltaX = touch.pageX - event.pageX;
		event.deltaY = touch.pageY - event.pageY;
		
		// Average the velocity of the last few events using a decay
		// curve to even out spurious jumps in values.
		event.velocityX = 0.3 * event.velocityX + 0.7 * event.deltaX / time;
		event.velocityY = 0.3 * event.velocityY + 0.7 * event.deltaY / time;
		event.pageX =  touch.pageX;
		event.pageY =  touch.pageY;
	}

	function endEvent(event, timer, fn) {
		timer.end(function(){
			event.type = 'moveend';

			trigger(event.target, event);
			
			return fn && fn();
		});
	}


	// jQuery special event definition

	function setup(data, namespaces, eventHandle) {
		// Stop the node from being dragged
		//add(this, 'dragstart.move drag.move', preventDefault);
		
		// Prevent text selection and touch interface scrolling
		//add(this, 'mousedown.move', preventIgnoreTags);
		
		// Tell movestart default handler that we've handled this
		add(this, 'movestart.move', flagAsHandled);

		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function teardown(namespaces) {
		remove(this, 'dragstart drag', preventDefault);
		remove(this, 'mousedown touchstart', preventIgnoreTags);
		remove(this, 'movestart', flagAsHandled);
		
		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function addMethod(handleObj) {
		// We're not interested in preventing defaults for handlers that
		// come from internal move or moveend bindings
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		// Stop the node from being dragged
		add(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid, preventDefault, undefined, handleObj.selector);
		
		// Prevent text selection and touch interface scrolling
		add(this, 'mousedown.' + handleObj.guid, preventIgnoreTags, undefined, handleObj.selector);
	}
	
	function removeMethod(handleObj) {
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		remove(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid);
		remove(this, 'mousedown.' + handleObj.guid);
	}
	
	jQuery.event.special.movestart = {
		setup: setup,
		teardown: teardown,
		add: addMethod,
		remove: removeMethod,

		_default: function(e) {
			var event, data;
			
			// If no move events were bound to any ancestors of this
			// target, high tail it out of here.
			if (!e._handled()) { return; }

			function update(time) {
				updateEvent(event, data.touch, data.timeStamp);
				trigger(e.target, event);
			}

			event = {
				target: e.target,
				startX: e.startX,
				startY: e.startY,
				pageX: e.pageX,
				pageY: e.pageY,
				distX: e.distX,
				distY: e.distY,
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				velocityX: e.velocityX,
				velocityY: e.velocityY,
				timeStamp: e.timeStamp,
				identifier: e.identifier,
				targetTouches: e.targetTouches,
				finger: e.finger
			};

			data = {
				event: event,
				timer: new Timer(update),
				touch: undefined,
				timeStamp: undefined
			};
			
			if (e.identifier === undefined) {
				// We're dealing with a mouse
				// Stop clicks from propagating during a move
				add(e.target, 'click', returnFalse);
				add(document, mouseevents.move, activeMousemove, data);
				add(document, mouseevents.end, activeMouseend, data);
			}
			else {
				// We're dealing with a touch. Stop touchmove doing
				// anything defaulty.
				e._preventTouchmoveDefault();
				add(document, touchevents.move + '.' + e.identifier, activeTouchmove, data);
				add(document, touchevents.end + '.' + e.identifier, activeTouchend, data);
			}
		}
	};

	jQuery.event.special.move = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.move', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.move', jQuery.noop);
		}
	};
	
	jQuery.event.special.moveend = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.moveend', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.moveend', jQuery.noop);
		}
	};

	add(document, 'mousedown.move', mousedown);
	add(document, 'touchstart.move', touchstart);

	// Make jQuery copy touch event properties over to the jQuery event
	// object, if they are not already listed. But only do the ones we
	// really need. IE7/8 do not have Array#indexOf(), but nor do they
	// have touch events, so let's assume we can ignore them.
	if (typeof Array.prototype.indexOf === 'function') {
		(function(jQuery, undefined){
			var props = ["changedTouches", "targetTouches"],
			    l = props.length;
			
			while (l--) {
				if (jQuery.event.props.indexOf(props[l]) === -1) {
					jQuery.event.props.push(props[l]);
				}
			}
		})(jQuery);
	};
});

/* /htapps/roger.babel/pt/web/vendor/jquery.event.move.js */
// jQuery.event.swipe
// 0.5
// Stephen Band

// Dependencies
// jQuery.event.move 1.2

// One of swipeleft, swiperight, swipeup or swipedown is triggered on
// moveend, when the move has covered a threshold ratio of the dimension
// of the target node, or has gone really fast. Threshold and velocity
// sensitivity changed with:
//
// jQuery.event.special.swipe.settings.threshold
// jQuery.event.special.swipe.settings.sensitivity

(function (thisModule) {
	if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], thisModule);
    } else if ((typeof module !== "undefined" && module !== null) && module.exports) {
        module.exports = thisModule;
	} else {
		// Browser globals
        thisModule(jQuery);
	}
})(function(jQuery, undefined){
	var add = jQuery.event.add,
	   
	    remove = jQuery.event.remove,

	    // Just sugar, so we can have arguments in the same order as
	    // add and remove.
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    settings = {
	    	// Ratio of distance over target finger must travel to be
	    	// considered a swipe.
	    	threshold: 0.4,
	    	// Faster fingers can travel shorter distances to be considered
	    	// swipes. 'sensitivity' controls how much. Bigger is shorter.
	    	sensitivity: 6
	    };

	function moveend(e) {
		var w, h, event;

		w = e.currentTarget.offsetWidth;
		h = e.currentTarget.offsetHeight;

		// Copy over some useful properties from the move event
		event = {
			distX: e.distX,
			distY: e.distY,
			velocityX: e.velocityX,
			velocityY: e.velocityY,
			finger: e.finger
		};

		// Find out which of the four directions was swiped
		if (e.distX > e.distY) {
			if (e.distX > -e.distY) {
				if (e.distX/w > settings.threshold || e.velocityX * e.distX/w * settings.sensitivity > 1) {
					event.type = 'swiperight';
					trigger(e.currentTarget, event);
				}
			}
			else {
				if (-e.distY/h > settings.threshold || e.velocityY * e.distY/w * settings.sensitivity > 1) {
					event.type = 'swipeup';
					trigger(e.currentTarget, event);
				}
			}
		}
		else {
			if (e.distX > -e.distY) {
				if (e.distY/h > settings.threshold || e.velocityY * e.distY/w * settings.sensitivity > 1) {
					event.type = 'swipedown';
					trigger(e.currentTarget, event);
				}
			}
			else {
				if (-e.distX/w > settings.threshold || e.velocityX * e.distX/w * settings.sensitivity > 1) {
					event.type = 'swipeleft';
					trigger(e.currentTarget, event);
				}
			}
		}
	}

	function getData(node) {
		var data = jQuery.data(node, 'event_swipe');
		
		if (!data) {
			data = { count: 0 };
			jQuery.data(node, 'event_swipe', data);
		}
		
		return data;
	}

	jQuery.event.special.swipe =
	jQuery.event.special.swipeleft =
	jQuery.event.special.swiperight =
	jQuery.event.special.swipeup =
	jQuery.event.special.swipedown = {
		setup: function( data, namespaces, eventHandle ) {
			var data = getData(this);

			// If another swipe event is already setup, don't setup again.
			if (data.count++ > 0) { return; }

			add(this, 'moveend', moveend);

			return true;
		},

		teardown: function() {
			var data = getData(this);

			// If another swipe event is still setup, don't teardown.
			if (--data.count > 0) { return; }

			remove(this, 'moveend', moveend);

			return true;
		},

		settings: settings
	};
});

/* /htapps/roger.babel/pt/web/vendor/jquery.event.swipe.js */
/**
 * jquery.bookblock.js v2.0.1
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
;( function( $, window, undefined ) {

	'use strict';

	// global
	var $window = $(window),
		Modernizr = window.Modernizr;

	// https://gist.github.com/edankwan/4389601
	Modernizr.addTest('csstransformspreserve3d', function () {
		var prop = Modernizr.prefixed('transformStyle');
		var val = 'preserve-3d';
		var computedStyle;
		if(!prop) return false;

		prop = prop.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

		Modernizr.testStyles('#modernizr{' + prop + ':' + val + ';}', function (el, rule) {
			computedStyle = window.getComputedStyle ? getComputedStyle(el, null).getPropertyValue(prop) : '';
		});

		return (computedStyle === val);
	});

	/*
	* debouncedresize: special jQuery event that happens once after a window resize
	*
	* latest version and complete README available on Github:
	* https://github.com/louisremi/jquery-smartresize
	*
	* Copyright 2012 @louis_remi
	* Licensed under the MIT license.
	*
	* This saved you an hour of work? 
	* Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
	*/
	var $event = $.event,
	$special,
	resizeTimeout;

	$special = $event.special.debouncedresize = {
		setup: function() {
			$( this ).on( "resize", $special.handler );
		},
		teardown: function() {
			$( this ).off( "resize", $special.handler );
		},
		handler: function( event, execAsap ) {
			// Save the context
			var context = this,
				args = arguments,
				dispatch = function() {
					// set correct event type
					event.type = "debouncedresize";
					$event.dispatch.apply( context, args );
				};

			if ( resizeTimeout ) {
				clearTimeout( resizeTimeout );
			}

			execAsap ?
				dispatch() :
				resizeTimeout = setTimeout( dispatch, $special.threshold );
		},
		threshold: 150
	};

	$.BookBlock = function( options, element ) {
		this.$el = $( element );
		this._init( options );
	};

	// the options
	$.BookBlock.defaults = {
		// vertical or horizontal flip
		orientation : 'vertical',
		// ltr (left to right) or rtl (right to left)
		direction : 'ltr',
		// speed for the flip transition in ms
		speed : 1000,
		// easing for the flip transition
		easing : 'ease-in-out',
		// if set to true, both the flipping page and the sides will have an overlay to simulate shadows
		shadows : true,
		// opacity value for the "shadow" on both sides (when the flipping page is over it)
		// value : 0.1 - 1
		shadowSides : 0.2,
		// opacity value for the "shadow" on the flipping page (while it is flipping)
		// value : 0.1 - 1
		shadowFlip : 0.1,
		// draw edges?
		edges: null,
		// draw edges as 2x the number of pages
		doublePages: true,
		// if we should show the first item after reaching the end
		circular : false,
		// if we want to specify a selector that triggers the next() function. example: ´#bb-nav-next´
		nextEl : '',
		// if we want to specify a selector that triggers the prev() function
		prevEl : '',
		// autoplay. If true it overwrites the circular option to true
		autoplay : false,
		// time (ms) between page switch, if autoplay is true
		interval : 3000,
		// callback after the flip transition
		// old is the index of the previous item
		// page is the current item´s index
		// isLimit is true if the current page is the last one (or the first one)
		onEndFlip : function(old, page, isLimit) { return false; },
		onEdgeClick: function(old, page, isLimit) { return false; },
		// callback before the flip transition
		// page is the current item´s index
		onBeforeFlip : function(page) { return false; }
	};

	$.BookBlock.prototype = {
		_init : function(options) {
			// options
			this.options = $.extend( true, {}, $.BookBlock.defaults, options );
			// orientation class
			this.$el.addClass( 'bb-' + this.options.orientation );
			// items
			this.$items = this.$el.children( '.bb-item' ).hide();
			// total items
			this.itemsCount = this.$items.length;
			// current item´s index
			this.current = 0;
			// previous item´s index
			this.previous = -1;
			// show first item
			this.$current = this.$items.eq( this.current ).show();
			// get width of this.$el
			// this will be necessary to create the flipping layout
			this.elWidth = this.$el.width();
			var transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			};
			this.transEndEventName = transEndEventNames[Modernizr.prefixed( 'transition' )] + '.bookblock';
			// support css 3d transforms && css transitions && Modernizr.csstransformspreserve3d
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d && Modernizr.csstransformspreserve3d;
			if ( Modernizr.no_ie && Modernizr.js && Modernizr.desktop ) {
				this.support = true;
			}
			// this.support = false;
			this.clipflip_support = ( ! this.support && Modernizr.canvas );
			// initialize/bind some events
			this._initEvents();
			this._setupEdges();

			if ( this.clipflip_support ) {
				var max_z = this.$items.length;
				this._clipReset = 'rect(0px ' + this.$el.width() + 'px ' + this.$el.height() + 'px 0px)';
				this._clipLeft = 'rect(0px 0px ' + this.$el.height() + 'px 0px)';
				var self = this;
				setTimeout(function() {
					self.$items.each(function(i, page) {
						$(page).css({ 'z-index' : max_z - i });
						// $(page).show();
						$(page).attr('id', 'p' + i);
					})
				}, 0);
			}

			// start slideshow
			if ( this.options.autoplay ) {
				this.options.circular = true;
				this._startSlideshow();
			}
			window.book = this;
		},
		_initEvents : function() {

			var self = this;

			if ( this.options.nextEl !== '' ) {
				$( this.options.nextEl ).on( 'click.bookblock touchstart.bookblock', function() { self._action( 'next' ); return false; } );
			}

			if ( this.options.prevEl !== '' ) {
				$( this.options.prevEl ).on( 'click.bookblock touchstart.bookblock', function() { self._action( 'prev' ); return false; } );
			}

			$window.on( 'debouncedresize', function() {		
				// update width value
				self.elWidth = self.$el.width();
			} );

		},
		_action : function( dir, page ) {
			this._stopSlideshow();
			this._navigate( dir, page );
		},
		_navigate : function( dir, page ) {

			if ( this.isAnimating ) {
				return false;
			}

			// callback trigger
			this.options.onBeforeFlip( this.current );

			this.isAnimating = true;
			// update current value
			this.$current = this.$items.eq( this.current );

			if ( page !== undefined ) {
				this.current = page;
			}
			else if ( dir === 'next' && this.options.direction === 'ltr' || dir === 'prev' && this.options.direction === 'rtl' ) {
				if ( !this.options.circular && this.current === this.itemsCount - 1 ) {
					this.end = true;
				}
				else {
					this.previous = this.current;
					this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;
				}
			}
			else if ( dir === 'prev' && this.options.direction === 'ltr' || dir === 'next' && this.options.direction === 'rtl' ) {
				if ( !this.options.circular && this.current === 0 ) {
					this.end = true;
				}
				else {
					this.previous = this.current;
					this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;
				}
			}

			this.$nextItem = !this.options.circular && this.end ? this.$current : this.$items.eq( this.current );
			
			if ( this.clipflip_support ) {
				this._layoutClipFlipSupport( dir );
			} else if ( !this.support ) {
				this._layoutNoSupport( dir );
			} else {
				this._layout( dir );
			}

		},
		_layoutNoSupport: function(dir) {
			// this.$items.hide();
			// this.$nextItem.show();

			this.$items.fadeOut('fast');
			this.$nextItem.fadeIn('fast');

			this.end = false;
			this.isAnimating = false;
			this.$current.hide();
			var isLimit = dir === 'next' && this.current === this.itemsCount - 1 || dir === 'prev' && this.current === 0;
			this._updateEdges();
			// callback trigger
			this.options.onEndFlip( this.previous, this.current, isLimit );
		},
		_layoutClipFlipSupport : function(dir) {

			var self = this;

			var _end_animate = function() {
				self.end = false;
				self.isAnimating = false;
				self.$current.hide();
				var isLimit = dir === 'next' && self.current === self.itemsCount - 1 || dir === 'prev' && self.current === 0;
				self._updateEdges();
				// callback trigger
				self.options.onEndFlip( self.previous, self.current, isLimit );
			}

			self.isAnimating = true;
			var current_idx = this.$items.index(this.$current);
			var next_idx = this.$items.index(this.$nextItem);
			if ( dir === 'next' ) {
				var $pages = this.$current; // this.$items.slice(current_idx, current_idx + ( next_idx - current_idx ));
				this.$current.css('clip', this._clipReset);
				this.$nextItem.show();
				setTimeout(function() {
					$pages.animate({ clip : self._clipLeft }, 400, function() {
						self.$current.css('clip', '');
						_end_animate();
					});
				}, 0);
			} else if ( dir === 'prev' ) {
				var $pages = this.$nextItem; // this.$items.slice(next_idx, next_idx + ( current_idx - next_idx ));
				this.$nextItem.css('clip', this._clipLeft);
				this.$nextItem.show();
				setTimeout(function() {
					self.$nextItem.animate({ clip : self._clipReset }, 400, function() {
						self.$nextItem.css('clip', '');
						_end_animate();
					});
				}, 0);
			}
		},
		// creates the necessary layout for the 3d structure
		_layout : function(dir) {

			var self = this,
				// basic structure: 1 element for the left side.
				$s_left = this._addSide( 'left', dir ),
				// 1 element for the flipping/middle page
				$s_middle = this._addSide( 'middle', dir ),
				// 1 element for the right side
				$s_right = this._addSide( 'right', dir ),
				// overlays
				$o_left = $s_left.find( 'div.bb-overlay' ),
				$o_middle_f = $s_middle.find( 'div.bb-flipoverlay:first' ),
				$o_middle_b = $s_middle.find( 'div.bb-flipoverlay:last' ),
				$o_right = $s_right.find( 'div.bb-overlay' ),
				speed = this.end ? 400 : this.options.speed;

			this.$items.hide();
			this.$el.prepend( $s_left, $s_middle, $s_right );
			
			$s_middle.css({
				transitionDuration: speed + 'ms',
				transitionTimingFunction : this.options.easing
			}).on( this.transEndEventName, function( event ) {
				if ( $( event.target ).hasClass( 'bb-page' ) ) {
					self.$el.children( '.bb-page' ).remove();
					self.$nextItem.show();
					self.end = false;
					self.isAnimating = false;
					var isLimit = dir === 'next' && self.current === self.itemsCount - 1 || dir === 'prev' && self.current === 0;
					self._updateEdges();
					// callback trigger
					self.options.onEndFlip( self.previous, self.current, isLimit );
				}
			});

			if ( dir === 'prev' ) {
				$s_middle.addClass( 'bb-flip-initial' );
			}

			// overlays
			if (this.options.shadows && !this.end) {

				var o_left_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms'
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear',
						opacity: this.options.shadowSides
					},
					o_middle_f_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear'
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms',
						opacity: this.options.shadowFlip
					},
					o_middle_b_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms',
						opacity: this.options.shadowFlip
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear'
					},
					o_right_style = (dir === 'next') ? {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear',
						opacity: this.options.shadowSides
					} : {
						transition: 'opacity ' + this.options.speed / 2 + 'ms ' + 'linear' + ' ' + this.options.speed / 2 + 'ms'
					};

				$o_middle_f.css(o_middle_f_style);
				$o_middle_b.css(o_middle_b_style);
				$o_left.css(o_left_style);
				$o_right.css(o_right_style);

			}

			setTimeout( function() {
				// first && last pages lift slightly up when we can't go further
				$s_middle.addClass( self.end ? 'bb-flip-' + dir + '-end' : 'bb-flip-' + dir );

				// overlays
				if ( self.options.shadows && !self.end ) {

					$o_middle_f.css({
						opacity: dir === 'next' ? self.options.shadowFlip : 0
					});

					$o_middle_b.css({
						opacity: dir === 'next' ? 0 : self.options.shadowFlip
					});

					$o_left.css({
						opacity: dir === 'next' ? self.options.shadowSides : 0
					});

					$o_right.css({
						opacity: dir === 'next' ? 0 : self.options.shadowSides
					});

				}
			}, 25 );
		},
		// adds the necessary sides (bb-page) to the layout 
		_addSide : function( side, dir ) {
			var $side;

			switch (side) {
				case 'left':
						/*
						<div class="bb-page" style="z-index:102;">
							<div class="bb-back">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of current page] : [content of next page]
										</div>
									</div>
									<div class="bb-overlay"></div>
								</div>
							</div>
						</div>
						*/
					$side = $('<div class="bb-page"><div class="bb-back"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + ( dir === 'next' ? this.$current.html() : this.$nextItem.html() ) + '</div></div><div class="bb-overlay"></div></div></div></div>').css( 'z-index', 102 );
					break;
				case 'middle':
						/*
						<div class="bb-page" style="z-index:103;">
							<div class="bb-front">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of current page] : [content of next page]
										</div>
									</div>
									<div class="bb-flipoverlay"></div>
								</div>
							</div>
							<div class="bb-back">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of next page] : [content of current page]
										</div>
									</div>
									<div class="bb-flipoverlay"></div>
								</div>
							</div>
						</div>
						*/
					$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + (dir === 'next' ? this.$current.html() : this.$nextItem.html()) + '</div></div><div class="bb-flipoverlay"></div></div></div><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + ( dir === 'next' ? this.$nextItem.html() : this.$current.html() ) + '</div></div><div class="bb-flipoverlay"></div></div></div></div>').css( 'z-index', 103 );
					break;
				case 'right':
						/*
						<div class="bb-page" style="z-index:101;">
							<div class="bb-front">
								<div class="bb-outer">
									<div class="bb-content">
										<div class="bb-inner">
											dir==='next' ? [content of next page] : [content of current page]
										</div>
									</div>
									<div class="bb-overlay"></div>
								</div>
							</div>
						</div>
						*/
					$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content"><div class="bb-inner">' + ( dir === 'next' ? this.$nextItem.html() : this.$current.html() ) + '</div></div><div class="bb-overlay"></div></div></div></div>').css( 'z-index', 101 );
					break;
			}

			return $side;
		},
		_startSlideshow : function() {
			var self = this;
			this.slideshow = setTimeout( function() {
				self._navigate( 'next' );
				if ( self.options.autoplay ) {
					self._startSlideshow();
				}
			}, this.options.interval );
		},
		_stopSlideshow : function() {
			if ( this.options.autoplay ) {
				clearTimeout( this.slideshow );
				this.options.autoplay = false;
			}
		},
		// public method: flips next
		next : function() {
			this._action( this.options.direction === 'ltr' ? 'next' : 'prev' );
		},
		// public method: flips back
		prev : function() {
			this._action( this.options.direction === 'ltr' ? 'prev' : 'next' );
		},
		// public method: goes to a specific page
		jump : function( page ) {

			page -= 1;

			if ( page === this.current || page >= this.itemsCount || page < 0 ) {
				return false;
			}

			var dir;
			if( this.options.direction === 'ltr' ) {
				dir = page > this.current ? 'next' : 'prev';
			}
			else {
				dir = page > this.current ? 'prev' : 'next';
			}
			this._action( dir, page );

		},
		// public method: goes to the last page
		last : function() {
			this.jump( this.itemsCount );
		},
		// public method: goes to the first page
		first : function() {
			this.jump( 1 );
		},
		status: function() {
			return { current: this.current, end: this.end };
		},
		// edges
		_updateEdges: function() {
			var self = this;
			if ( this.options.edges == null || this.options.edges.$edge.length == 0 ) { return ; }
			this._calculate_edges();
			setTimeout(function() {
				self._draw_edges();
			}, 100);
		},
		_setupEdges: function() {
			var self = this;
			if ( this.options.edges == null || this.options.edges.$edge.length == 0 ) { return; }
			this.edges = this.options.edges;
			// var w = $(".container").width() - $(".bb-custom-wrapper").width();
			this.edges.right_w = 0;
			this.edges.left_w = 0;

			this.edges.page_factor = 10;
			this.edges.num = this.$items.length * 2;
			this.edges.width = this.$el.width();


			// this.edges.max_w = parseFloat(this.$el.parent().css('margin-left'));
			// this.edges.max_w = ( this.$el.parent().outerWidth(true) - this.$el.parent().outerWidth() ) / 2;
			this.edges.max_w = this.edges.max_edge_width;
			console.log(this.$el, this.$el.parent(), this.$el.parent().outerWidth(true), this.$el.parent().outerWidth());

			// get the number of page segments we're going to show
			this.edges.page_w = 3 * Math.ceil(this.edges.num / this.edges.page_factor);
			// console.log("PAGE WIDTH INITIAL", this.edges.page_w, this.edges.max_w, this.edges.page_w > this.edges.max_w);
			if ( this.edges.page_w > this.edges.max_w ) {
			    this.edges.page_w = this.edges.max_w;
			    this.edges.page_factor = Math.ceil(( 3 * this.edges.num ) / this.edges.page_w);
			}

			// this.edges.$left.on('click', function(e) {
			// 	self._click_edge(e);
			// })
			// this.edges.$right.on('click', function(e) {
			// 	self._click_edge(e);
			// })

			this.edges.$edge.on('click', function(e) {
				self._click_edge(e);
			})

			this._calculate_edges();
			this._draw_edges();
		},
		_calculate_edges: function() {
			var left_pages = ( (this.current * 2) - 1 ) / this.edges.num;
			var right_pages = ( this.edges.num - (this.current * 2) + 1 ) / this.edges.num;
			this.edges.left_w = this.edges.page_w * left_pages;
			this.edges.right_w = this.edges.page_w * right_pages;
			if ( this.edges.left_w < 2 ) {
				this.edges.left_w = 2;
			}
			if ( this.edges.right_w < 2 ) {
				this.edges.right_w = 2;
			}
		},
		_draw_edges: function() {
			this.edges.$edge.css({
				left: - ( this.edges.left_w ),
				right: - ( this.edges.right_w )
			})
		},
		_click_edge: function(e) {

			var $target = $(e.target);
			var offset = e.pageX - $target.offset().left;

			offset = ( e.pageX - $target.offset().left );
			var per; var page; var num; var start; var x = 'LEFT';
			if ( offset > ( $target.width() / 2 ) ) {
				x = 'RIGHT';
				per = ( this.edges.right_w - ( $target.width() - offset ) ) / this.edges.right_w;
				num = ( this.edges.num - ( this.current * 2 ) );
				start = this.current * 2;
			} else {
				per = offset / this.edges.left_w;
				num = ( this.current - 1 ) * 2;
				start = 0;
			}
			if ( per > 1 ) { per = 1.0 ; }
			var page = start + ( num * per );

			// console.log("CLICK", x, offset, $target.width(), "CURRENT =", this.current * 2, "PER =", per, "NUM =", num, "START =", start, "PAGE =", page);

			// TRIGGER EDGE CLICK --- assumes that the contoller will
			// actually trigger the jump
			this.options.onEdgeClick( -1, Math.ceil(page/2), false );

		    // var $what = M['$' + what];
		    // var $label = $(".margin-" + what + " .label");
		    // $label.hide();

		    // var offset = e.pageX - $what.offset().left;
		    // var x = offset;
		    // var page = ( Math.round(x / 3) * M.page_factor ) + M.page_factor
		    // if ( what == 'right' ) {
		    //     page =  M.current + page;
		    // }
		    // console.log("JUMPING TO", page);
		    // this.jump(Math.ceil(page / 2);
		},
		// public method: check if isAnimating is true
		isActive: function() {
			return this.isAnimating;
		},
		// public method: dynamically adds new elements
		// call this method after inserting new "bb-item" elements inside the BookBlock
		update : function () {
			var $currentItem = this.$items.eq( this.current );
			this.$items = this.$el.children( '.bb-item' );
			this.itemsCount = this.$items.length;
			this.current = $currentItem.index();
		},
		toggleLayoutSupport: function() {
			if ( ! this._master_support ) {
				this._master_support = this.support;
			}

			if ( this._master_support ) {
				this.support = ! this.support;
			}		
		},
		destroy : function() {
			if ( this.options.autoplay ) {
				this._stopSlideshow();
			}
			this.$el.removeClass( 'bb-' + this.options.orientation );
			this.$items.show();

			if ( this.options.nextEl !== '' ) {
				$( this.options.nextEl ).off( '.bookblock' );
			}

			if ( this.options.prevEl !== '' ) {
				$( this.options.prevEl ).off( '.bookblock' );
			}

			$window.off( 'debouncedresize' );
		}
	}

 	var logError = function( message ) {
		if ( window.console ) {
			window.console.error( message );
		}
	};

	$.fn.bookblock = function( options ) {
		if ( typeof options === 'string' ) {
			var args = Array.prototype.slice.call( arguments, 1 );
			this.each(function() {
				var instance = $.data( this, 'bookblock' );
				if ( !instance ) {
					logError( "cannot call methods on bookblock prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for bookblock instance" );
					return;
				}
				instance[ options ].apply( instance, args );
			});
		} 
		else {
			this.each(function() {	
				var instance = $.data( this, 'bookblock' );
				if ( instance ) {
					instance._init();
				}
				else {
					instance = $.data( this, 'bookblock', new $.BookBlock( options, this ) );
				}
			});
		}
		return this;
	};

} )( jQuery, window );
/* /htapps/roger.babel/pt/web/vendor/BookBlock/js/jquery.bookblock.js */
/* =========================================================
 * bootstrap-slider.js v2.0.0
 * http://www.eyecon.ro/bootstrap-slider
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */
 
!function( $ ) {

	var Slider = function(element, options) {
		this.element = $(element);
		this.picker = $('<div class="slider">'+
							'<div class="slider-track">'+
								'<div class="slider-selection"></div>'+
								'<div class="slider-handle"></div>'+
								'<div class="slider-handle"></div>'+
							'</div>'+
							'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'+
						'</div>')
							.insertBefore(this.element)
							.append(this.element);
		this.id = this.element.data('slider-id')||options.id;
		if (this.id) {
			this.picker[0].id = this.id;
		}

		if (typeof Modernizr !== 'undefined' && Modernizr.touch) {
			this.touchCapable = true;
		}

		var tooltip = this.element.data('slider-tooltip')||options.tooltip;

		this.tooltip = this.picker.find('.tooltip');
		this.tooltipInner = this.tooltip.find('div.tooltip-inner');

		this.orientation = this.element.data('slider-orientation')||options.orientation;
		switch(this.orientation) {
			case 'vertical':
				this.picker.addClass('slider-vertical');
				this.stylePos = 'top';
				this.mousePos = 'pageY';
				this.sizePos = 'offsetHeight';
				this.tooltip.addClass('right')[0].style.left = '100%';
				break;
			default:
				this.picker
					.addClass('slider-horizontal')
					.css('width', this.element.outerWidth());
				this.orientation = 'horizontal';
				this.stylePos = 'left';
				this.mousePos = 'pageX';
				this.sizePos = 'offsetWidth';
				if ( this.touchCapable ) {
					this.tooltip.addClass('right')[0].style.left = '100%';
				} else {
					this.tooltip.addClass('top')[0].style.top = -this.tooltip.outerHeight() - 14 + 'px';					
				}
				break;
		}

		this.min = this.element.data('slider-min')||options.min;
		this.max = this.element.data('slider-max')||options.max;
		this.step = this.element.data('slider-step')||options.step;
		this.value = this.element.data('slider-value')||options.value;
		if (this.value[1]) {
			this.range = true;
		}

		this.selection = this.element.data('slider-selection')||options.selection;
		this.selectionEl = this.picker.find('.slider-selection');
		if (this.selection === 'none') {
			this.selectionEl.addClass('hide');
		}
		this.selectionElStyle = this.selectionEl[0].style;


		this.handle1 = this.picker.find('.slider-handle:first');
		this.handle1Stype = this.handle1[0].style;
		this.handle2 = this.picker.find('.slider-handle:last');
		this.handle2Stype = this.handle2[0].style;

		var handle = this.element.data('slider-handle')||options.handle;
		switch(handle) {
			case 'round':
				this.handle1.addClass('round');
				this.handle2.addClass('round');
				break
			case 'triangle':
				this.handle1.addClass('triangle');
				this.handle2.addClass('triangle');
				break
		}

		if (this.range) {
			this.value[0] = Math.max(this.min, Math.min(this.max, this.value[0]));
			this.value[1] = Math.max(this.min, Math.min(this.max, this.value[1]));
		} else {
			this.value = [ Math.max(this.min, Math.min(this.max, this.value))];
			this.handle2.addClass('hide');
			if (this.selection == 'after') {
				this.value[1] = this.max;
			} else {
				this.value[1] = this.min;
			}
		}
		this.diff = this.max - this.min;
		this.percentage = [
			(this.value[0]-this.min)*100/this.diff,
			(this.value[1]-this.min)*100/this.diff,
			this.step*100/this.diff
		];

		this.offset = this.picker.offset();
		this.size = this.picker[0][this.sizePos];

		this.formater = options.formater;

		this.layout();

		if (this.touchCapable) {
			// Touch: Bind touch events:
			this.picker.on({
				touchstart: $.proxy(this.mousedown, this)
			});
		} else {
			this.picker.on({
				mousedown: $.proxy(this.mousedown, this)
			});
		}

		if (tooltip === 'show') {
			this.picker.on({
				mouseenter: $.proxy(this.showTooltip, this),
				mouseleave: $.proxy(this.hideTooltip, this),
			});
		} else {
			this.tooltip.addClass('hide');
		}
	};

	Slider.prototype = {
		constructor: Slider,

		over: false,
		inDrag: false,
		
		showTooltip: function(){
			this.tooltip.addClass('in');
			//var left = Math.round(this.percent*this.width);
			//this.tooltip.css('left', left - this.tooltip.outerWidth()/2);
			console.log(this.tooltip);
			this.over = true;
		},
		
		hideTooltip: function(){
			console.log("HIDE TOOLTIP", this.inDrag, this.over);
			if (this.inDrag === false) {
				this.tooltip.removeClass('in');
			}
			this.over = false;
		},

		layout: function(){
			this.handle1Stype[this.stylePos] = this.percentage[0]+'%';
			this.handle2Stype[this.stylePos] = this.percentage[1]+'%';
			if (this.orientation == 'vertical') {
				this.selectionElStyle.top = Math.min(this.percentage[0], this.percentage[1]) +'%';
				this.selectionElStyle.height = Math.abs(this.percentage[0] - this.percentage[1]) +'%';
			} else {
				this.selectionElStyle.left = Math.min(this.percentage[0], this.percentage[1]) +'%';
				this.selectionElStyle.width = Math.abs(this.percentage[0] - this.percentage[1]) +'%';
			}
			if (this.range) {
				this.tooltipInner.text(
					this.formater(this.value[0]) + 
					' : ' + 
					this.formater(this.value[1])
				);
				this.tooltip[0].style[this.stylePos] = this.size * (this.percentage[0] + (this.percentage[1] - this.percentage[0])/2)/100 - (this.orientation === 'vertical' ? this.tooltip.outerHeight()/2 : this.tooltip.outerWidth()/2) +'px';
			} else {
				this.tooltipInner.text(
					this.formater(this.value[0])
				);
				if ( this.touchCapable && this.orientation === 'horizontal' )  {
					this.tooltip[0].style[this.stylePos] = ( this.size * this.percentage[0]/100 + this.tooltip.outerWidth()/4 ) + 'px';
				} else {
					this.tooltip[0].style[this.stylePos] = this.size * this.percentage[0]/100 - (this.orientation === 'vertical' ? this.tooltip.outerHeight()/2 : this.tooltip.outerWidth()/2) +'px';
				}
			}
		},

		mousedown: function(ev) {

			// Touch: Get the original event:
			if (this.touchCapable && ev.type === 'touchstart') {
				ev = ev.originalEvent;
				if ( ! this.tooltip.hasClass("hide") ) {
					this.showTooltip();
				}
			}

			this.offset = this.picker.offset();
			this.size = this.picker[0][this.sizePos];

			var percentage = this.getPercentage(ev);

			if (this.range) {
				var diff1 = Math.abs(this.percentage[0] - percentage);
				var diff2 = Math.abs(this.percentage[1] - percentage);
				this.dragged = (diff1 < diff2) ? 0 : 1;
			} else {
				this.dragged = 0;
			}

			this.percentage[this.dragged] = percentage;
			this.layout();

			if (this.touchCapable) {
				// Touch: Bind touch events:
				$(document).on({
					touchmove: $.proxy(this.mousemove, this),
					touchend: $.proxy(this.mouseup, this)
				});
			} else {
				$(document).on({
					mousemove: $.proxy(this.mousemove, this),
					mouseup: $.proxy(this.mouseup, this)
				});
			}

			this.inDrag = true;
			var val = this.calculateValue();
			this.element.trigger({
					type: 'slideStart',
					value: val
				}).trigger({
					type: 'slide',
					value: val
				});
			return false;
		},

		mousemove: function(ev) {
			
			// Touch: Get the original event:
			if (this.touchCapable && ev.type === 'touchmove') {
				ev = ev.originalEvent;
			}

			var percentage = this.getPercentage(ev);
			if (this.range) {
				if (this.dragged === 0 && this.percentage[1] < percentage) {
					this.percentage[0] = this.percentage[1];
					this.dragged = 1;
				} else if (this.dragged === 1 && this.percentage[0] > percentage) {
					this.percentage[1] = this.percentage[0];
					this.dragged = 0;
				}
			}
			this.percentage[this.dragged] = percentage;
			this.layout();
			var val = this.calculateValue();
			this.element
				.trigger({
					type: 'slide',
					value: val
				})
				.data('value', val)
				.prop('value', val);
			return false;
		},

		mouseup: function(ev) {
			if (this.touchCapable) {
				// Touch: Bind touch events:
				$(document).off({
					touchmove: this.mousemove,
					touchend: this.mouseup
				});
				this.hideTooltip();
			} else {
				$(document).off({
					mousemove: this.mousemove,
					mouseup: this.mouseup
				});
			}

			console.log("MOUSEUP", this.over);
			this.inDrag = false;
			if (this.over == false) {
				this.hideTooltip();
			}
			this.element;
			var val = this.calculateValue();
			this.element
				.trigger({
					type: 'slideStop',
					value: val
				})
				.data('value', val)
				.prop('value', val);
			return false;
		},

		calculateValue: function() {
			var val;
			if (this.range) {
				val = [
					(this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step),
					(this.min + Math.round((this.diff * this.percentage[1]/100)/this.step)*this.step)
				];
				this.value = val;
			} else {
				val = (this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step);
				this.value = [val, this.value[1]];
			}
			return val;
		},

		getPercentage: function(ev) {
			if (this.touchCapable) {
				ev = ev.touches[0];
			}
			var percentage = (ev[this.mousePos] - this.offset[this.stylePos])*100/this.size;
			percentage = Math.round(percentage/this.percentage[2])*this.percentage[2];
			return Math.max(0, Math.min(100, percentage));
		},

		getValue: function() {
			if (this.range) {
				return this.value;
			}
			return this.value[0];
		},

		setValue: function(val) {
			this.value = val;

			if (this.range) {
				this.value[0] = Math.max(this.min, Math.min(this.max, this.value[0]));
				this.value[1] = Math.max(this.min, Math.min(this.max, this.value[1]));
			} else {
				this.value = [ Math.max(this.min, Math.min(this.max, this.value))];
				this.handle2.addClass('hide');
				if (this.selection == 'after') {
					this.value[1] = this.max;
				} else {
					this.value[1] = this.min;
				}
			}
			this.diff = this.max - this.min;
			this.percentage = [
				(this.value[0]-this.min)*100/this.diff,
				(this.value[1]-this.min)*100/this.diff,
				this.step*100/this.diff
			];
			this.layout();
		}
	};

	$.fn.slider = function ( option, val ) {
		return this.each(function () {
			var $this = $(this),
				data = $this.data('slider'),
				options = typeof option === 'object' && option;
			if (!data)  {
				$this.data('slider', (data = new Slider(this, $.extend({}, $.fn.slider.defaults,options))));
			}
			if (typeof option == 'string') {
				data[option](val);
			}
		})
	};

	$.fn.slider.defaults = {
		min: 0,
		max: 10,
		step: 1,
		orientation: 'horizontal',
		value: 5,
		selection: 'before',
		tooltip: 'show',
		handle: 'round',
		formater: function(value) {
			return value;
		}
	};

	$.fn.slider.Constructor = Slider;

}( window.jQuery );
/* /htapps/roger.babel/pt/web/vendor/slider/js/bootstrap-slider.js */
head.ready(function() {

    var $window;
    var $sidebar;
    var $sidebar_scrollable;
    var $menu;
    var $navbar;

    $window = $(window);
    $sidebar = $(".sidebar-wrap");
    $sidebar_scrollable = $sidebar.find(".scrollable");

    if ( ! $sidebar.length ) {
        return;
    }

    if ( $("body").is(".view-image") || $("body").is(".view-plaintext") ) {
        return; // don't bother
    }

    HT.x = 10;

    var calculate_height = function() {
        $navbar  = $(".navbar-static-top");
        var window_h = $(window).height();
        var h = $(window).height() - $navbar.height() - $(".toolbar-horizontal").outerHeight() - 20;
        var main_h = $("#scrolling").height();
        if ( h > main_h ) { h = main_h ; }
        var h2 = h - $(".bibLinks").height() - HT.x;
        console.log("CALCULATING SCROLLABLE HEIGHT", h, main_h, h2);
        return h2;
    }


    // if ( $.browser.msie && parseInt($.browser.version) < 9 ) {
    //     return;
    // }

    $.subscribe("action.toggle.fullscreen.sidebar", function() {
        if ( $sidebar.parent().is(":visible") ) {
            // $sidebar.trigger("sticky_kit:recalc");
            console.log("SIDEBAR PARENT IS VISIBLE");
            $sidebar.trigger("sticky_kit:detach");
            $sidebar.stick_in_parent({ inner_scrolling : false, offset_top : $navbar.height() + 10, recalc_every: 500 });
        } else {
            console.log("SIDEBAR PARENT IS HIDDEN");
            $sidebar.trigger("sticky_kit:detach");
            $sidebar.css("left", "auto");
        }
    })

    var original_left = $sidebar.position().left;
    $sidebar.data('original-left', $sidebar.position().left);

    $sidebar.on('sticky_kit:stick', function(e) {
        // console.log("STUCK", e.target, $sidebar.css('top'));
        $sidebar.css('left', 'auto');
    }).on('sticky_kit:unstick', function(e) {
        // console.log("UNSTUCK", e.target);
        $sidebar.css('left', 'auto');
    }).on('sticky_kit:bottom', function(e) {
        // console.log("BOTTOM", e.target);
        $sidebar.css('left', 'auto');            
    }).on('sticky_kit:unbottom', function(e) {
        // console.log("UNBOTTOM", e.target);
    })

    $window.scroll(function() {
        var left = $sidebar.css('left');
        if ( $sidebar.css('position') == 'fixed' ) {
            if ( left == 'auto' ) { left = $sidebar.position().left ; }
            $sidebar.css('left', ( - $window.scrollLeft() + original_left ) + 'px' );
        } else {
            $sidebar.css("left", 'auto');
        }
    });

    $.subscribe("view.ready.sidebar", function() {

        $sidebar.trigger("sticky_kit:detach");
        $sidebar_scrollable.height(calculate_height());
        $sidebar.stick_in_parent({ inner_scrolling : false, offset_top : $navbar.height() + 10, recalc_every: 500 });

        // console.log("STICKING SIDEBAR");

    });

});
/* /htapps/roger.babel/pt/web/js/sidebar.js */
// reader.js

var HT = HT || {};
var $body = $("body");

HT.Reader = {
    init: function(options) {
        this.options = $.extend({}, this.options, options);
        // this.view = this._getView(); 
        this.id = this.options.params.id;
        HT.engines.imgsrv = Object.create(HT.ImgSrv).init({ 
            base : window.location.pathname.replace("/pt", "/imgsrv")
        });
        this._tracking = false;
        return this;
    },

    options: {

    },

    start : function() {
        var self = this;
        this._handleView(this.getView(), 'start');
        this.bindEvents();

        var zooms = {};
        if ( HT.params.size && HT.params.size != "100" ) {
            var size = parseInt(HT.params.size);
            zooms[this.getView()] = size;
        }

        HT.engines.manager = Object.create(HT.Manager).init({
            id : self.id,
            seq : self.options.params.seq,
            zooms : zooms
        })

        HT.engines.manager.start();

        if ( this.options.params.ui == 'fullscreen' ) {
            var $btn = $("#action-toggle-fullscreen");
            if ( ! $btn.is(":disabled") ) {
                setTimeout(function() {
                    // self._toggleFullScreen($btn);
                    self._manageFullScreen(true);
                }, 250);
            }
        }
    },

    updateView: function(view) {
        if ( view == this.getView() ) {
            return;
        }

        HT.prefs.set({ pt : { view : view } })

        if ( view == 'image' || view == 'plaintext' ) {
            window.location.href = this.$views.find("a[data-target=" + view + "]").attr('href');
            return;
        }

        this.$views.find("a.active").removeClass("active");
        this.$views.find("a[data-target=" + view + "]").addClass("active");

        this._tracking = false;
        this._handleView(this.getView(), 'exit');
        this._handleView(view, 'start');
        this._updateViews(view);
        this.setView(view);
        HT.engines.manager.restart();
    },

    bindEvents: function() {
        var self = this;

        // catch disabled items
        $("body").on('click', 'a', function(e) {
            if ( $(this).attr("disabled") ) {
                e.preventDefault();
                return false;
            }
        });

        // dyanmic in every view

        var $btn_fullScreen = $("#action-toggle-fullscreen");
        this._bindAction("toggle.fullscreen", this._toggleFullScreen);
        $(window).bind('fullscreen-toggle', function(e, state) { self._manageFullScreen(state); })
                 .bind('fullscreen-on',     function(e)        { self._manageFullScreen(true)  })
                 .bind('fullscreen-off',    function(e)        { self._manageFullScreen(false); })
                 .bind('fullscreen-key',    function(e, k, a)  { self._manageFullScreen() });

        // don't bind dynamic controls for the static views
        if ( this.getView() == 'image' || this.getView() == 'plaintext' ) {
            // and then disable buttons without links
            $(".toolbar").find("a[href='']").attr("disabled", "disabled").attr('tabindex', '-1');
            $(".action-views").on("click", "a", function() {
                var target = $(this).data('target');
                HT.prefs.set({ pt : { view : target } });
            })
            self._updateSocialLinks();
            return;
        }

        self.$views = $(".action-views");
        self.$views.on("click", "a", function(e) {
            e.preventDefault();
            var $this = $(this);
            var target = $this.data('target');
            self.updateView(target);
        })
        self.$views.find("a.active").removeClass("active").end().find("a[data-target='" + self.getView() + "']").addClass("active");

        // make the toolbar buttons "tracking-actions"
        // so they don't refresh the page
        $(".toolbar .btn[data-toggle*=tracking]").each(function() {
            if ( $(this).data('target') == 'image' || $(this).data('target') == 'plaintext' ) {
                // don't update these
                return;
            }
            var toggle = $(this).data('toggle');
            if ( toggle.indexOf("tracking-action") < 0 ) {
                $(this).data('toggle', toggle.replace('tracking', 'tracking-action'));
            }
        })

        this._bindAction("go.first");
        this._bindAction("go.prev");
        this._bindAction("go.next");
        this._bindAction("go.last");

        this._bindAction("zoom.in");
        this._bindAction("zoom.out");
        this._bindAction("rotate.clockwise");
        this._bindAction("rotate.counterclockwise");

        $(".table-of-contents").on("click", "a", function(e) {
            e.preventDefault();
            var seq = $(this).data('seq');
            $.publish("action.go.page", (seq));
            $(".bb-bookblock").removeClass("lowered");
        })

        $("#action-go-page").click(function(e) {
            e.preventDefault();
            var value = $.trim($("#input-go-page").val());
            var seq;
            if ( ! value ) { return ; }
            if ( value.match(/^\d+/) ) {
                // look up num -> seq in manager
                seq = HT.engines.manager.getSeqForPageNum(value);
                if ( ! seq ) {
                    // just punt
                    seq = value;
                }
            } else if ( value.substr(0, 1) == 'n' ) {
                seq = value.substr(1);
            }
            if ( seq ) {
                $.publish("action.go.page", (seq));
            }
        })

        $.subscribe("update.go.page", function(e, seq) {
            var orig = seq;
            if ( $.isArray(seq) ) {
                // some views return multiple pages, which we use for
                // other interface elements
                seq = seq[0] != null ? seq[0] : seq[1];
            }
            var value = HT.engines.manager.getPageNumForSeq(seq);
            if ( ! value ) {
                // value = "n" + seq;
                // don't display this for the end user
                value = "";
            }
            $("#input-go-page").val(value);
            self.setCurrentSeq(seq, orig);
            if ( self.$slider && HT.engines.view ) {
                self.$slider.slider('setValue', self.getView() == '2up' ? HT.engines.view._seq2page(seq) : seq);
            }
        })

        $.subscribe("update.zoom.size", function(e, zoom) {
            if ( self._animating ) { return ; }
            var size = Math.ceil(zoom * 100);
            HT.params.size = size;
            HT.engines.manager.update_zoom(self.getView(), size);
        })

        $.subscribe("update.rotate.orient", function(e, orient) {
            HT.params.orient = orient;
        })

        $.subscribe("update.focus.page", function(e, seq) {
            // we define the focus
            self.setCurrentSeq(seq);
            self.updateView("1up");
        });

        $.subscribe("view.ready.reader", function() {
            self._tracking = true;
            if ( self.getView() == '2up' ) {
                setTimeout(function() {
                    self.buildSlider();
                }, 250);
            }
            // and center the display
            self._centerContentDisplay();
            $(window).trigger('reset');

            console.log("AHOY: VIEW READY");
            self._updateSocialLinks();
        });

        $.subscribe("disable.download.page.pdf", function() {
            $(".page-pdf-link").attr("disabled", "disabled").addClass("disabled").attr('tabindex', -1);
        })

        $.subscribe("enable.download.page.pdf", function() {
            $(".page-pdf-link").attr("disabled", null).removeClass("disabled").attr('tabindex', null);
        })

        $.subscribe("enable.download.page.pdf", function() {
            $(".page-pdf-link").attr("disabled", null).removeClass("disabled");
        })

        $.subscribe("view.end.reader", function() {
            // enable everything when we switch views;
            // the views can update the state when they're initialized
            $.publish("enable.zoom");
            $.publish("enable.rotate");
            $.publish("enable.download.page");
            $.publish("enable.toggle.fullscreen");
        })

        var $e = get_resize_root();
        var last_size = { width : $e.width(), height: $e.height() };
        var lazyResize = _.debounce(function(e) {
            console.log("POSTING RESIZE EVENT", $e.width(), "x", $e.height());
            $.publish("action.resize");
        }, 500);
        $e.on('resize.reader', lazyResize);
        // $e.on('debouncedresize.reader', function() { console.log("POSTING RESIZE EVENT"); $.publish("action.resize"); });
    },

    getCurrentSeq: function() {
        return this._current_seq || this.options.params.seq || 1;
    },

    setCurrentSeq: function(seq) {
        var self = this;

        this._current_seq = seq;
        HT.params.seq = seq;

        this._updateState();
        this._updateLinks.apply(this, arguments);

        $(".action-views").find("a").each(function() {
            self._updateLinkSeq($(this), seq);
        })

        this._updateSocialLinks();
    },

    _centerContentDisplay: function() {
        // try to horizontally center content
        var $content = $("#content");
        var $window = $(window);
        var right_edge = $content.position().left + $content.width();
        // console.log("CENTERING", $window.scrollLeft(), $window.width(), right_edge);
        if ( right_edge > $window.width() && $window.scrollLeft() == 0 ) {
            $window.scrollLeft(right_edge - $window.width() - ( $("#sidebar").width() * 0.4 ) );
        }
    },

    _toggleFullScreen: function(btn) {
        var self = this;
        var $btn = $(btn);
        if ( $btn.hasClass("active") ) {
            // exitFullscreen();
            self._manageFullScreen(false);
        } else {
            console.log("LAUNCHING FULL SCREEN");
            // launchFullscreen(document.documentElement);
            self._manageFullScreen(true);
        }
    },

    _manageFullScreen: function(state) {
        var self = this;
        
        var $btn = $("#action-toggle-fullscreen");
        var $sidebar = $(".sidebar");
        if ( state == null ) { state = ! $btn.hasClass("active"); }
        // set this EARLY
        self._full_screen_state = state;
        self._animating = true;
        if ( ! state ) {
            $sidebar.show("fast", function() {
                //$("#sidebar").css("visibility", "hidden") //.show();
                $(window).scroll();
                //$("#sidebar").css('visibility', 'visible').show("fast");
                $btn.removeClass("active");
                $btn.find(".icomoon-fullscreen-exit").removeClass("icomoon-fullscreen-exit").addClass("icomoon-fullscreen");
                $.publish("action.toggle.fullscreen");
                // $(window).trigger("resize");
                setTimeout(function() {
                    self._animating = false;
                }, 500);
            })
        } else {
            $sidebar.hide( "fast", function() {
                $(window).scroll();
                $btn.addClass("active");
                $btn.find(".icomoon-fullscreen").removeClass("icomoon-fullscreen").addClass("icomoon-fullscreen-exit");
                $.publish("action.toggle.fullscreen");
                self._animating = false;
            })
        }
    },

    _bindAction: function(action, fn) {
        var self = this;
        var id = "#action-" + action.replace(".", "-");
        var $btn = $(id);
        $btn.click(function(e) {
            e.preventDefault();
            // HT.analytics.trackEvent({ category : "PT", action : "PT "+ action});
            if ( fn == null ) {
                $.publish("action." + action, (this));
            } else {
                fn.apply(self, [$btn]);
            }
        }).subscribe("disable." + action, function() {
            $(this).attr("disabled", "disabled").attr('tabindex', -1);
        }).subscribe("enable." + action, function() {
            $(this).attr("disabled", null).attr("tabindex", null);
        })
    },

    getView: function() {
        return this._current_view || this.options.params.view;
    },

    setView: function(view) {
        var views = {
            'Scroll' : '1up',
            'Flip' : '2up',
            'Thumbnail' : 'thumb',
            'Image' : 'image',
            'PlainText' : 'plaintext'
        }
        this._current_view = view;
        // and upate the reverse
        this.options.params.view = view;
        this._updateState({ view : view, size : HT.engines.manager.get_zoom(view) });
    },

    getViewModule: function() {
        var views = {
            '1up' : 'Scroll',
            '2up' : 'Flip',
            'thumb' : 'Thumbnail',
            'image' : 'Image',
            'plaintext' : 'PlainText'
        }
        return HT.Viewer[views[this.getView()]];
    },

    _updateState: function(params) {
        var new_href = window.location.pathname;
        new_href += "?id=" + HT.params.id;
        new_href += ";view=" + this.getView();
        new_href += ";seq=" + this.getCurrentSeq();
        var size = HT.engines.manager.get_zoom(this.getView());
        if ( size && size != 100 ) {
            new_href += ";size=" + size;
        }
        if ( HT.params.debug ) {
            new_href += ";debug=" + HT.params.debug;
        }
        if ( HT.params.skin ) {
            new_href += ";skin=" + HT.params.skin;
        }

        // if ( HT.params.size ) {
        //     new_href += ";size=" + HT.params.size;
        // }

        if ( window.history && window.history.replaceState != null ) {
            // create a whole new URL
            window.history.replaceState(null, document.title, new_href);

        } else {
            // update the hash
            var new_hash = '#view=' + this.getView();
            new_hash += ';seq=' + this.getCurrentSeq();
            if ( size && size != 100 ) {
                new_hash += ";size=" + size;
            }
            window.location.replace(new_hash); // replace blocks the back button!
        }
        this._trackPageview(new_href);

    },

    _trackPageview: function(href) {
        if ( this._tracking && HT.analytics && HT.analytics.enabled ) {
            HT.analytics.trackPageview(HT.analytics._simplifyPageHref(href));
            // if we were still doing the experiment, we'd do it here
            // HT.analytics.trackPageview(alternate_href, alternate_profile_id);
        }
    },

    _updateLinks: function(seq, seqs) {
        var self = this;
        if ( ! seq ) { seq = this.getCurrentSeq(); }
        if ( this.getView() == '2up' ) {
            _.each(seqs, function(seq, i) {
                var $link = $("#pagePdfLink" + ( i + 1 ));
                self._updateLinkSeq($link, seq);
            })
        } else {
            var $link = $("#pagePdfLink");
            self._updateLinkSeq($link, seq);
        }
        self._updateLinkSeq($("#pageURL"), seq);
        self._updateLinkSeq($("input[name=seq]"), seq);
        self._updateLinkSeq($("#login-button"), seq);
    },

    _updateLinkSeq: function($link, seq) {
        if ( ! $link.length ) { return ; }
        if ( seq == null ) {
            $link.attr("disabled", "disabled").attr('tabindex', -1);
        } else {
            if ( ! $link.hasClass("disabled") ) {
                $link.attr("disabled", null).attr("tabindex", null);
            }
            if ( $link.is("input") && $link.attr("name") == "seq" ) {
                $link.val(seq);
            } else if ( $link.is("input") ) {
                var href = $link.val();
                $link.val(href.replace(/seq=\d+/, "seq=" + seq))
            } else {
                this._updateLinkAttribute($link, "seq", seq);
            }
        }
    },

    _updateSocialLinks: function() {

        var canonical_url = $("#pageURL").val();
        var image_url = this.getCurrentImageURL();

        // twitter
        $("meta[name='twitter:image:src']").attr('content', image_url);
        $("meta[name='twitter:url']").attr('content', canonical_url);

        // facebook
        $("meta[property='og:image']").attr('content', image_url);
        $("meta[property='og:url']").attr('content', canonical_url);

        $(".social-links button[data-media]").data('media', image_url);
        $(".social-links button").data('url', canonical_url);
    },

    _updateViews: function(view) {
        var self = this;
        if ( ! view ) { view = this.getView(); }
        self._updateLinkAttribute($("#login-button"), "view", view);
        $("input[name=view]").val(view);
    },

    _updateLinkAttribute: function($link, key, value) {
        if ( ! $link.length ) { return ; }
        var href = $link.attr("href");
        var regex = new RegExp(key + "(=|%3D)");
        if ( ! regex.test(href) ) {
            // key not in href
            var text = key + "=" + value;
            var target_href = href;
            var idx;
            if ( ( idx = target_href.indexOf('target=') ) > -1 ) {
                // extract the target url
                idx += "target=".length;
                target_href = decodeURIComponent(href.substr(idx));
            }
            var sep = ';';
            if ( target_href.indexOf("&") > -1 ) {
                // add to parameters - semicolon
                sep = '&';
            }
            target_href += sep + text;
            if ( idx > -1 ) {
                // re-encode
                target_href = href.substr(0, idx) + encodeURIComponent(target_href);
            }
            $link.attr("href", target_href);
        } else {
            // replace existing key
            regex = new RegExp(key + "(=|%3D)" + "\\w+(;|&|%3B|%26)?");
            $link.attr("href", href.replace(regex, key + "$1" + value + "$2"));
        }
    },

    _handleView: function(view, stage) {
        if ( view == '2up' ) {
            this._handleFlip(stage);
        }
    },

    _handleFlip: function(stage) {
        var self = this;

        var $link = $("#pagePdfLink").parent();
        if ( stage == 'start' ) {
            // recto verso vs. rtl, BLEH!
            var $link1 = $link.clone(true).find("a").attr("id", "pagePdfLink1").text("Download left page (PDF)").end().insertAfter($link);
            var $link2 = $link.clone(true).find("a").attr("id", "pagePdfLink2").text("Download right page (PDF)").end().insertAfter($link1);
            $link.hide();

        } else {
            $("#pagePdfLink1").parent().remove();
            $("#pagePdfLink2").parent().remove();
            $link.show();
        }
    },

    _parseParams: function() {

    },

    buildSlider: function() {
        var self = this;
        if ( ! HT.engines.manager ) {
            return;
        }
        var $nob = $(".nob");
        if ( ! $nob.length ) {
            $nob = $('<input type="text" class="nob" value="1" />').appendTo($("#content"));
        }
        var manager = HT.engines.manager;
        var last_seq = manager.getLastSeq();
        var last_num = manager.getPageNumForSeq(last_seq);
        if ( last_num === undefined ) { last_num = "n" + last_seq ; }
        var current = self.getCurrentSeq();
        var this_view = self.getView();
        if ( this_view == '2up' ) { current = HT.engines.view._seq2page(current); }
        // console.log("INIT SLIDER", this_view, current, HT.engines.view.pages.length - 1);
        self.$slider = $nob.slider({
            min : 0,
            max : this_view == '2up' ? HT.engines.view.pages.length - 1 : last_seq - 1,
            value : current,
            selection : 'none',
            tooltip : 'show',
            formater : function(seq) {
                if ( this_view == '2up' ) {
                    var old_seq = seq;
                    seq = HT.engines.view._page2seq(seq);
                    if ( seq[0] == null ) {
                        seq = seq[1];
                    } else {
                        seq = seq[0];
                    }
                }
                var num = manager.getPageNumForSeq(seq);
                var text = " / " + last_num;
                if ( num ) {
                    text = num + text;
                } else {
                    text = "n" + seq  + text;
                }
                // var end = self._page2seq(total);
                return text;
            },
            handle : 'square'
        }).on('slideStop', function(ev) {
            var seq = ev.value;
            if ( this_view == '2up' ) {
                seq = HT.engines.view._page2seq(seq);
                if ( seq[0] !== null ) {
                    seq = seq[0]
                } else {
                    seq = seq[1];
                }
            }
            $.publish("action.go.page", (seq));
        })
    }, 

    getCurrentImageURL: function() {
        var image_url = window.location.origin + HT.engines.imgsrv.get_action_url('image', { id : HT.params.id, idth: 400, seq: this.getCurrentSeq() });
        image_url = image_url.replace('roger-full.', '');
        return image_url;
    },

    EOT: true

}

head.ready(function() {

    // update HT.params based on the hash
    if ( window.location.hash ) {
        var tmp1 = window.location.hash.substr(1).split(";");
        for(var i = 0; i < tmp1.length; i++) {
            var tmp2 = tmp1[i].split("=");
            HT.params[tmp2[0]] = tmp2[1];
        }
    }

    HT.engines = {};

    HT.engines.reader = Object.create(HT.Reader).init({
        params : HT.params
    })

    HT.engines.reader.start();

    $(".toolbar-vertical .btn").each(function() {
        var $btn = $(this);
        var title = $btn.text();
        $btn.tooltip({ title : title, placement : 'left', container : '#main', delay : { show : 250, hide: 50 }, xtrigger : 'hover focus', animation: false })
    })

    $(".toolbar-horizontal .btn").each(function() {
        var $btn = $(this);
        var title = $btn.find(".label").text();
        if ( title ) {
            $btn.tooltip({ title : title, placement : 'bottom', container : '.toolbar-horizontal', delay : { show : 250, hide: 50 }, xtrigger: 'hover focus', animation : false })
        }
    })

    $('html').on('click.dropdown.reader', '.table-of-contents .btn', function(e) {
        // $(".bb-bookblock").css('z-index', 100);
        $(".bb-bookblock").toggleClass("lowered");
    });

    HT.analytics.getTrackingLabel = function($link) {
        //var params = ( HT.reader != null ) ? HT.reader.paramsForTracking() : HT.params;

        var label = HT.params.id + " " + HT.params.seq + " " + HT.params.size + " " + HT.params.orient + " " + HT.params.view;
        return label;
    };

    // // initialize
    // $(".social-links button[data-media]").data('media', HT.engines.reader.getCurrentImage());
    // $("meta[property='og:image']").attr('content', HT.engines.reader.getCurrentImage());

})

// Find the right method, call on correct element
function launchFullscreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

/* /htapps/roger.babel/pt/web/js/reader.js */
// manager.js

var HT = HT || {};

HT.Manager = {
    init : function(options, callback) {
        this.options = $.extend({}, this.options, options);
        this.data = {};
        this.page_num_map = {};
        this.num_seq_map = {};
        this.seq_num_map = {};

        return this;
    },

    options: {
        zooms: {}
    },

    start : function() {
        var self = this;

        var view = HT.engines.reader.getView();
        var zoom = -1;
        if ( this.options.zooms[view] && this.options.zooms[view] != 100 ) {
            zoom = this.options.zooms[view] / 100;
        }

        HT.engines.view = Object.create(HT.engines.reader.getViewModule()).init({
            manager : self,
            reader : HT.engines.reader,
            zoom : zoom
        });

        if ( ! HT.engines.view.options.is_dynamic ) {
            HT.engines.view.start();
            return;
        }

        var href = HT.engines.imgsrv.get_action_url("meta", {});
        // $.ajaxSetup({ async : false });
        $.getJSON(href + "callback=?",
            { id : this.options.id, format : 'items', limit : 1000002, method : 'fudged', start : 0, debug : HT.params.debug || ''  },
            function(data) {
                // console.log("processing", data.items.length);
                self.data = data;
                self.num_pages = data.items.length;
                self.reading_order = data.readingOrder;
                self.parse_page_numbers();
                // console.log("ready");
                $.ajaxSetup({ async: true });
                // callback();
                HT.engines.view.start();
            },
            'json')

    },

    restart: function() {
        var self = this;

        HT.engines.view.end();
        delete HT.engines.view;
        // delete this.options.view;
        var view = HT.engines.reader.getView();
        var zoom = self.get_zoom(view);
        zoom = zoom == 100 ? -1 : zoom / 100; 
        console.log("RESTARTING", view, zoom);
        HT.engines.view = Object.create(HT.engines.reader.getViewModule()).init({
            manager : self,
            reader : HT.engines.reader,
            zoom : zoom
        });
        setTimeout(function() {
            HT.engines.view.start();
            $(window).trigger('reset');
        }, 100);
    },

    update_zoom: function(view, size) {
        this.options.zooms[view] = size;
    },

    get_zoom: function(view) {
        return this.options.zooms[view] || 100;
    },

    /* METHODS */

    parse_page_numbers: function() {
        var self = this;
        self.num_seq_map = {};
        self.seq_num_map = {};
        for(var i = 0; i < self.data.items.length; i++) {
            var item = self.data.items[i];
            if ( item.page_num ) {
                if ( self.num_seq_map[item.page_num] === undefined ) {
                    // first page number wins this mapping!
                    self.num_seq_map[item.page_num] = item.seq;
                }
                // but we can still keep this
                self.seq_num_map[item.seq] = item.page_num;
            }
        }
    },

    getSeqForPageNum: function(num) {
        return this.num_seq_map[num];
    },

    getPageNumForSeq: function(seq) {
        return this.seq_num_map ? this.seq_num_map[seq] : null;
    },

    getLastSeq: function() {
        var end_seq = this.num_pages;
        if ( this.has_feature(end_seq, "BACK_COVER") || ( this.has_feature(1, "COVER") && this.has_feature(1, "LEFT") ) ) {
            end_seq -= 1;
        }
        return end_seq;
    },

    getAltTextForSeq: function(seq) {
        var alt_text = "";
        var num = this.getPageNumForSeq(seq);
        if ( num ) {
            alt_text += "page " + num;
        } else {
            alt_text += "sequence " + seq;
        }
        return alt_text;
    },

    rotate_image: function(params) {
        var meta = this.get_page_meta(params);
        if ( ! meta.orient ) {
            meta.orient = 0;
        }
        meta.orient += 1;
        if ( meta.orient == 4 ) { meta.orient = 0; }
        this.set_page_meta({ seq : params.seq, meta : meta });
    },

    set_page_meta: function(params) {
        this.data.items[params.seq] = params.meta;
    },

    get_page_meta: function(params) {
        var meta;
        if ( this.data.items[params.seq - 1] ) {
            meta = _.clone(this.data.items[params.seq - 1]);
        } else {
            var w = 680; // default w
            var h = w * 1.294;
            meta = { width : w, height : h, orient : 0 };
        }
        if ( params.width ) {
            var r = params.width / meta.width;
            meta.width = params.width;
            meta.height = meta.height * r;
        }
        return meta;
    },

    has_feature : function(meta, feature) {
        if ( typeof(meta) == "number" ) {
            meta = this.get_page_meta({ seq : meta });
        }
        if ( meta.features && _.indexOf(meta.features, feature) > -1 ) {
            return true;
        }
        return false;
    },

    has_features : function(meta) {
        if ( typeof(meta) == "number" ) {
            meta = this.get_page_meta({ seq : meta });
        }
        if ( meta.features && meta.features.length > 0 ) {
            if ( meta.features.length == 1 && meta.features[0] == 'FUDGED' ) { return false; }
            return true;
        }
        return false;
    },

    get_text : function(params) {
        // params : seq, orient, size
        var self = this;
        var meta = this.get_page_meta(params);

        args = { seq : params.seq, id : this.options.id }
        var src = HT.engines.imgsrv.get_action_url(params.action || 'ocr', args);
        var is_missing = false;

        var p = $.ajax({
            url : src,
            dataType: 'html'
        })

        var $div = $("<div class='ocr_page'></div>");

        $.when(p.promise()).done(function(data) {
            $div.append($(data).children());
            if ( ! $.trim($div.text()) ) {
                $div.addClass("empty").empty().append('<div class="ocr_page"><div class="ocrx_block"><div class="ocr_par"><div class="alert alert-block alert-info alert-headline"><p>NO TEXT ON PAGE</p></div><p>This page does not contain any text recoverable by the OCR engine.</p></div></div>');
            }
            $div.trigger("text.loaded");
        })

        return $div;
    },

    get_image_src: function(params) {
        var meta = this.get_page_meta(params);

        args = { seq : params.seq, id : this.options.id, width : params.width }
        if ( params.height ) {
            args.height = params.height;
        }
        if ( params.orient ) {
            args.orient = params.orient;
        }
        params.seq = 10;
        var src = HT.engines.imgsrv.get_action_url(params.action || 'image', args);
        return src;
    },

    get_image : function(params) {
        // params : seq, orient, size
        var self = this;
        var src = self.get_image_src(params);
        var is_missing = false;
        // if ( self.has_feature(meta, 'MISSING_PAGE') ) {
        //     console.log("MISSING");
        //     src = "holder.js/" + meta.width + "x" + meta.height + "/text:MISSING PAGE";
        //     is_missing = true;
        // }


        var p = $.Deferred();

        var $img = $("<img/>"); // .addClass("loading");
        $img.load(p.resolve);
        $img.error(p.reject);
        $img.get(0).src = src;
        $.when(p.promise()).done(function() {
            // $(this).removeClass("loading");
            var check = new Image();
            // check.src = $img.get(0).src;

            // console.log("-- image:", check.src, params.seq, $img.get(0).width, "x", $img.get(0).height, ":", check.width, "x", check.height);

            $(check).load(function() {
                var r; var h; var w;
                if ( params.orient == 1 || params.orient == 3 ) {
                    h = check.width;
                    w = check.height;
                } else {
                    w = check.width;
                    h = check.height;
                }
                r = 680 / w;
                h = h * r;

                self.data.items[params.seq] = { width : 680, height : h };
                //$img.parent().css({ height: '100%' });
                // $img.parent().animate({ height : '100%' });

                $img.data('seq', params.seq);
                $img.data('natural-height', check.height);
                $img.data('natural-width', check.width);
                $img.trigger("image.fudge");
            }).attr('src', $img.get(0).src);

        }).fail(function(status) {
            $img.get(0).src = '/imgsrv/common-web/graphics/503_image_distorted.jpg';
            $img.data('natural-width', 320);
            $img.data('natural-height', 480);
            $img.trigger("image.fudge");
        })
        return $img;

    },

    EOT : true
}

/* /htapps/roger.babel/pt/web/js/manager.js */
var HT = HT || {};
HT.ImgSrv = {
	init : function(options) {
		this.options = $.extend({}, this.options, options);

		return this;
	},

	options: {

	},

	/* METHODS */

	get_action_url : function(action, params) {
		// var url = $.jurlp(this.options.base);
		// url.query(params);
		// url.path(action);
		// return url.url().toString();

		var action_url = this.options.base + "/" + action + "?";
		// if ( action == 'image' || action == 'thumbnail' ) {	
		// 	action_url = 'http://babel.hathitrust.org/cgi/imgsrv/' + action + '?';
		// }

		var args = [];
		if ( params.id ) {
			args.push("id=" + params.id);
		}
		if ( params.seq ) {
			args.push("seq=" + params.seq);
		}
		if ( params.width ) {
			args.push("width=" + Math.ceil(params.width));
		}
		if ( params.height ) {
			args.push("height=" + Math.ceil(params.height));
		}
		if ( params.orient !== undefined ) {
			args.push("orient=" + params.orient);
		}
		if ( params.format ) {
			args.push("format=" + params.format);
		}
		if ( params.limit ) {
			args.push("limit=" + params.limit);
		}
		if ( params.method ) {
			args.push("method=" + params.method);
		}
		if ( params.start ) {
			args.push("start=" + params.start);
		}

		if ( args.length && HT.params.debug ) {
			args.push("debug=" + HT.params.debug);
		}

		// https://roger-full.babel.hathitrust.org/cgi/imgsrv/meta?debug=supercallback=jQuery19104218266897369176_1366646687818&id=mdp.39015005503357&format=items&limit=1000002&method=fudged&start=0&_=1366646687819 

		return action_url + args.join(";");
	},

	EOT : true
}
/* /htapps/roger.babel/pt/web/js/imgsrv.js */
var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Image = {

    name : 'image',

    init : function(options) {
        var self = this;
        return this;
    },

    options: {},

    start: function() {
        $body.addClass("view-image");
        this.bindEvents();
    },

    bindEvents: function() {
        var self = this;
        $.publish("disable.toggle.fullscreen");
        // $.subscribe("action.go.first.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.go.prev.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.go.next.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.go.last.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.zoom.in.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.zoom.out.image", function(e, link) { self._gotoLink(link); });

        $body.find(".page-item img").load(function() {
            $(window).scroll();
        })
    },

    _gotoLink: function(link)  {
        window.location.href = $(link).attr("href");
    },

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/image.js */
// scroll

var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Scroll = {

    name : 'scroll',

    init : function(options) {
        var self = this;
        this.options = $.extend({}, this.options, options);

        this.w = this.options.default_w;
        this.zoom = this.options.zoom;
        this.zoom_levels = [ 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 3.00, 4.00 ];

        this.orient_cache = {};

        return this;
    },

    options: {
        default_w : 680,
        zoom : -1,
        is_dynamic: true
    },

    start : function() {
        $("body").addClass("view-1up"); // needs to correspond to our parameter. MM.
        $.publish("enable.download.page");
        this.options.seq = HT.engines.reader.getCurrentSeq();
        this.bindEvents();
        this.bindScroll();

        this._calculateBestFitZoom();
        if ( this.zoom < 0 ) {
            this.zoom = this.reset_zoom;
        } else {
            var zoom_idx = this.zoom_levels.indexOf(this.zoom);
            if ( zoom_idx < 0 ) {
                // use this zoom
                this.zoom = this.reset_zoom;
            }
        }
        this.w = this.options.default_w * this.zoom;

        this.drawPages();
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".scroll");
        $.publish("view.end");
        $(window).unbind(".scroll");
        $("body").unbind(".scroll");
        $("#content").empty();
        $(window).scrollTop(0);
        $("body").removeClass("view-1up");
    },

    bindEvents: function() {
        var self = this;

        $.subscribe("action.go.next.scroll", function(e) {
            self.gotoPage(null, 1);
        })

        $.subscribe("action.go.prev.scroll", function(e) {
            self.gotoPage(null, -1);
        })

        $.subscribe("action.go.first.scroll", function(e) {
            self.gotoPage(1);
        })

        $.subscribe("action.go.last.scroll", function(e) {
            self.gotoPage(HT.engines.manager.num_pages);
        })

        $.subscribe("action.go.page.scroll", function(e, seq) {
            self.gotoPage(seq);
        })

        $.subscribe("action.zoom.in.scroll", function(e) {
            self.incrementZoom(1);
        })

        $.subscribe("action.zoom.out.scroll", function(e) {
            self.incrementZoom(-1);
        })

        $.subscribe("action.zoom.reset.scroll", function(e) {
            self.updateZoom(self.reset_zoom);
        })

        $.subscribe("action.rotate.clockwise.scroll", function(e) {
            self.rotateCurrentPage(1);
        })

        $.subscribe("action.rotate.counterclockwise.scroll", function(e) {
            self.rotateCurrentPage(-1);
        })

        $("body").on('image.fudge.scroll', "img", function() {
            var h1 = $(this).data('natural-height');
            var h2 = $(this).parent().height();

            // console.log("FUDGE: SCROLL");

            $(this).parent().addClass("loaded");

            var t = 50;
            // console.log("FUDGE", h1, h2, Math.abs(h1 - h2), ">", t);

            if ( Math.abs(h1 - h2) > t ) {
                // $(this).parent().animate({ height: h1 }, 100);
                $(this).parent().height(h1);
                $(this).parent().addClass("imaged").addClass("expanded");
            }
        });

        var _lazyResize = _.debounce(function() {
            if ( self._resizing ) { return ; }
            self._resizing = true;

            self._calculateBestFitZoom();

            self.drawPages();
            self._resizing = false;
            console.log("RESIZE SCROLL");
        }, 250);

        $.subscribe("action.resize.scroll", function(e) {
            _lazyResize();
        })

        // var $e = get_resize_root();
        // $e.on('resize.viewer.scroll', _lazyResize);

    },

    incrementZoom: function(delta) {
        var self = this;
        var current_index = self.zoom_levels.indexOf(self.zoom);
        var new_index = current_index + delta;
        if ( new_index + delta < 0 ) {
            $.publish("disable.zoom.out");
        } else {
            $.publish("enable.zoom.out");
        }
        if ( new_index + delta >= self.zoom_levels.length ) {
            $.publish("disable.zoom.in");
        } else {
            $.publish("enable.zoom.in");
        }

        self.updateZoom(self.zoom_levels[new_index]);
    },

    updateZoom: function(zoom) {

        var self = this;

        self.zoom = zoom;
        self.w = self.options.default_w * self.zoom;

        self.drawPages();
        $.publish("update.zoom.size", ( self.zoom ));
        // $.publish("update.zoom.size", ( Math.ceil(self.zoom * 100) ));
    },

    rotateCurrentPage: function(delta) {
        var self = this;
        var $current = $(".page-item.current");
        var seq = $current.data('seq');
        var orient = this.getPageOrient(seq);
        this.orient_cache[seq] = orient = ( ( orient + delta ) + 4 ) % 4;
        this.drawPages();
        $.publish("update.rotate.orient", ( orient ));
    },

    getPageOrient: function(seq) {
        return this.orient_cache[seq] || 0;
    },

    bindScroll: function() {
        var self = this;
        var $window = $(window);
        var lazyLayout = _.debounce(function() {
            // figure out the MOST visible page

            var t0 = Date.now();

            var visibility = [];
            var scrollTop = $window.scrollTop();
            var windowHeight = $window.height();
            var $current = $(".page-item.current");

            var current_vp = 0;
            if ( $current.length ) {
                try {
                  current_vp = $current.fracs().visible;
                } catch (e) {
                }
            }

            if ( ! $(".page-item").length ) { return ; }

            var $imaged = $(".page-item.imaged");
            $imaged.addClass("checking");

            // // ORIGINAL ALGORITHM : viewport selector horribly slow in IE8
            // var $visible = $(".page-item:in-viewport");

            // var max_vp = -1; var $new;
            // for(var i = 0; i < $visible.length; i++) {
            //     var $page = $visible.slice(i, i + 1);
            //     self.loadPage($page);
            //     var f = $page.fracs();
            //     if ( f.visible > max_vp ) {
            //         max_vp = f.visible;
            //         $new = $page;
            //     }
            // }

            // iterate through all page-items to find the visible items.
            var $possible = $(".page-item");
            var $visible = $();
            var max_vp = 0; var $new;
            var past_visible = false;
            for (var i = 0; i < $possible.length; i++) {
                var $page = $possible.slice(i, i + 1);
                var f = $page.fracs();
                if ( f.visible ) {
                    self.loadPage($page);
                    $visible.push($page.get(0));
                    if ( f.visible > max_vp ) {
                        max_vp = f.visible;
                        $new = $page;
                    }
                    past_visible = true;
                } else if ( past_visible ) {
                    // don't need to keep looking
                    break;
                }
            }

            if ( $new.attr('id') != $current.attr('id') ) {
                $current.removeClass("current").attr('aria-hidden', 'true');
                $new.addClass("current").attr("aria-hidden", "false");
                $.publish("update.go.page", ( $new.data('seq') ));
            }

            // load the previous and next for caching
            var $previous = $visible.slice(0,1).prev();
            var $next = $visible.slice(-1).next();
            self.loadPage($previous);
            self.loadPage($next);

            $(".page-item.checking").removeClass("imaged").removeClass("loaded").removeClass("checking").find("img").remove();

            self.checkPageStatus();

        }, 250);

        $(window).on('scroll.viewer.scroll', lazyLayout);

    },

    gotoPage: function(seq, delta) {
        var self = this;

        if ( seq == null ) {
            var $current = $(".page-item.current");
            var seq = $current.data('seq');
        }

        if ( delta != null ) {
            seq += delta;
        }

        var $current = $("#page" + seq);
        if ( ! $current.length ) { return ; }
        $('html,body').animate({
            scrollTop : $current.offset().top - 100
        }, "fast", function() {

            // $(".page-item:in-viewport").each(function() {
            //     var $page = $(this);
            //     self.loadPage($page);
            // })

            $(window).trigger('scroll.viewer.scroll');

        });
    },

    loadPage: function($page) {
        if ( ! $page.length ) { return ; }
        if ( ! $page.is(".imaged")) {
            $page.addClass("imaged");
            var seq = $page.data('seq');
            if ( ! seq ) {
                console.log("NO SEQUENCE?", $page);
                return;
            }
            var $img = HT.engines.manager.get_image({ seq : seq, width : this.w, orient : this.getPageOrient(seq) });

            var alt_text = "image of " + HT.engines.manager.getAltTextForSeq(seq);
            $img.attr('alt', alt_text);
            $page.append($img);
        } else {
            $page.removeClass("checking");
        }
    },

    getCurrentSeq: function() {

        var $current = $(".page-item.current");
        if ( $current.length ) {
            return $current.data('seq');
        }
        return null;
    },

    drawPages : function() {
        var self = this;
        var current = self.getCurrentSeq();
        if ( current == null && self.options.seq ) {
            current = self.options.seq;
            delete self.options.seq;
        }

        $("#content").empty();

        var fragment = document.createDocumentFragment();

        for(var seq=1; seq <= HT.engines.manager.num_pages; seq++) {
            var meta = HT.engines.manager.get_page_meta({ seq : seq, width : self.w, orient : self.getPageOrient(seq) });
            var $page = $('<div class="page-item" aria-hidden="true"><div class="page-num">{SEQ}</div>'.replace('{SEQ}', seq)).appendTo($(fragment));
            $page.attr('id', 'page' + seq);

            var w = meta.width;
            var h = meta.height;

            if ( self.getPageOrient(seq) == 1 || self.getPageOrient(seq) == 3 ) {
                h = meta.width;
                w = meta.height;
            }

            $page.css({ height : h + 2, width : w + 4 });
            $page.data('seq', seq);
        }

        $("#content").append(fragment);

        // $("#content").css({ 'min-width' : self.w });


        $(window).scroll();

        if ( current && current > 1 ) {
            setTimeout(function() {
                self.gotoPage(current);
                $.publish("view.ready");
            }, 500);
        } else {
            setTimeout(function() {
                $.publish("view.ready");
            }, 500)
        }

        // this.gotoPage(1);

    },

    // UTIL

    checkPageStatus: function() {
        var self = this;
        var first = $("#page1").fracs();
        var last = $("#page" + HT.engines.manager.num_pages).fracs();

        if ( first.visible >= 0.9 ) {
            $.publish("disable.go.first");
        } else {
            $.publish("enable.go.first");
        }

        if ( last.visible >= 0.9 ) {
            $.publish("disable.go.last");
        } else {
            $.publish("enable.go.last");
        }

        // // identiy the "current" page
        // var $visibles = $(".page-item:in-viewport");
        // for(var i = 0; i < $visibles.length; i++) {
        //     var $visible = $visibles.slice(i,i+1);
        //     var fracs = $visible.fracs();
        //     if ( fracs && fracs.visible >= 0.75 ) {
        //         $.publish("update.go.page", ( $visible.data('seq') ));
        //         break;
        //     }
        // }

    },

    _getPageMargin: function() {
        return 1.2;
    },

    _calculateBestFitZoom: function() {
        var self = this;
        var $content = $("#content");
        var fit_w = $content.width();
        if ( $("html").is(".mobile") ) { fit_w *= 0.90; console.log("WIDTH =", fit_w);  }
        var best_w = -1; var best_zoom = 0;
        for(var i = 0; i < self.zoom_levels.length; i++) {
            var zoom = self.zoom_levels[i];
            // console.log("CALCULATE BEST FIT", self.options.default_w * zoom * self._getPageMargin(), fit_w);
            var check_w = self.options.default_w * zoom * self._getPageMargin();
            if (  check_w > fit_w ) {
                if ( check_w / fit_w < 1.25 ) {
                    // self.w = Math.ceil(fit_w * 0.98);
                    self.reset_zoom = zoom;
                }
                break;
            }
            // self.w = self.options.default_w * zoom;
            self.reset_zoom = zoom;
        }

    },

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/scroll.js */
var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Thumbnail = {

    name : 'thumbnail',

    init : function(options) {
        var self = this;
        this.options = $.extend({}, this.options, options);
        this.inited = false;
        this.zoom = this.options.zoom;
        this.zoom_levels = [ 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 3.00, 4.00 ];

        this.w = -1;

        return this;
    },

    options: {
        default_w : 150,
        min_w : 75,
        max_w : 250,
        zoom: -1,
        is_dynamic: true
    },

    start : function() {
        this.inited = false;
        $("body").addClass("view-thumb");
        this.bindEvents();
        this.bindScroll();
        this._calculateAverages();
        this._calculateBestFitZoom();

        var factor = 1;

        if ( this.zoom > 0 ) {
            console.log("INIT THUMBNAIL WITH ZOOM", this.zoom, this.options.default_w * this.zoom, this.options.min_w, this.options.max_w);
            var zoom_idx = this.zoom_levels.indexOf(this.zoom);
            if ( zoom_idx < 0 || 
                 this.options.default_w * this.zoom > this.options.max_w || 
                 this.options.default_w * this.zoom < this.options.min_w ) {
                // not a valid zoom
                this.zoom = this.reset_zoom;
            }
        } else {
            this.zoom = this.reset_zoom;
        }

        this.updateZoom(0, this.zoom);
        // this.drawPages();
        $.publish("disable.rotate");
        $.publish("disable.download.page");
        this.inited = true;
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".thumb");
        $.publish("view.end");
        $("#content").empty();
        $(window).unbind(".thumb");
        $("body").unbind(".thumb");
        $(window).scrollTop(0);
        $("body").removeClass("view-thumb");
        console.log("UNBOUND THUMBNAIL");
    },

    bindEvents: function() {
        var self = this;

        var $body = $("body");

        $.subscribe("action.go.first.thumb", function(e) {
            self.gotoPage(1);
        })

        $.subscribe("action.go.last.thumb", function(e) {
            self.gotoPage(HT.engines.manager.getLastSeq());
        })

        $.subscribe("action.go.next.thumb", function(e) {
            self.gotoPage(null, -1);
        })

        $.subscribe("action.go.prev.thumb", function(e) {
            self.gotoPage(null, 1);
        })

        $.subscribe("action.go.page.thumb", function(e, seq) {
            self.gotoPage(seq);
        })

        $.subscribe("action.zoom.in.thumb", function(e) {
            // self.updateZoom(1.25);
            self.updateZoom(1);
        })

        $.subscribe("action.zoom.out.thumb", function(e) {
            // self.updateZoom(0.8);
            self.updateZoom(-1);
        })

        $body.on('click.thumb', '.page-link', function(e) {
            e.preventDefault();
            // we carry the seq as a hash
            var seq = $(this).attr('href').substr(1);
            $.publish("update.focus.page", ( seq ));
        })

        $body.on('image.fudge.thumb', "img", function() {
            var h1 = $(this).data('natural-height');
            var $parent = $(this).parents(".page-item");
            var h2 = $parent.height();

            var t = 50;

            var n = ( h1 > h2 ) ? h2 : h1;
            var d = ( h1 > h2 ) ? h1 : h2;

            // console.log("THUMB FUDGING", $parent.attr("id"), h1, h2, ( n / d));

            // if ( ( n / d ) < 0.90 ) {
            //     // $(this).parent().animate({ height: h1 }, 100);
            //     console.log("--- FUDGING", $parent.attr("id"), h1);
            //     $parent.height(h1);
            //     // $(this).parent().addClass("imaged").addClass("expanded");
            // }

            $parent.addClass("loaded").removeClass("loading");
        });

        // // does this work in IE8?
        // if ( ! $("html").is(".lt-ie9") ) {
        //     $(window).on("resize.thumb", function() {
        //         self.$container.css({ width : '' }).hide();
        //         setTimeout(function() {
        //             self.$container.width(self.$container.parent().width()).show();
        //             console.log("THUMBNAIL RESIZED");
        //             $(window).scroll();
        //         }, 100);
        //     })
        // }

        var _lazyResize = _.debounce(function() {
            if ( ! self.inited ) { return ; }
            if ( self._resizing ) { return ; }
            console.log("THUMBNAIL RESIZE EVENT", self.inited);
            self._resizing = true;
            self.w = -1;
            self.drawPages();
            self._resizing = false;
        }, 250);

        var $e = get_resize_root();
        $e.on('resize.viewer.thumb', _lazyResize);

    },

    updateZoom: function(delta, zoom) {
        var self = this;
        var current_index = self.zoom_levels.indexOf(self.zoom);
        if ( delta == 0 ) {
            delta = self.zoom_levels.indexOf(zoom) - current_index;
        }
        var new_index = current_index + delta;
        if ( new_index + delta < 0 || self.default_w * self.zoom_levels[new_index - delta] < self.options.min_w ) {
            $.publish("disable.zoom.out");
        } else {
            $.publish("enable.zoom.out");
        }
        if ( new_index + delta >= self.zoom_levels.length || self.default_w * self.zoom_levels[new_index + 1] > self.options.max_w ) {
            $.publish("disable.zoom.in");
        } else {
            $.publish("enable.zoom.in");
        }

        self.zoom = self.zoom_levels[new_index];
        self.w = ( self.default_w * self.zoom );

        self.drawPages();
        $.publish("update.zoom.size", ( self.zoom ));

    },

    updateZoom_XX: function(factor) {
        var self = this;

        self.w = self.w * factor;
        self.zoom = self.zoom * factor;

        if ( self.w * factor > self.options.max_w ) {
            $.publish("disable.zoom.in");
        } else {
            $.publish("enable.zoom.in");
        }

        if ( factor * self.w < self.options.min_w ) {
            $.publish("disable.zoom.out");
        } else {
            $.publish("enable.zoom.out");
        }
        self.drawPages();
        $.publish("update.zoom.size", ( self.zoom ));
    },

    bindScroll: function() {
        var self = this;

        var lazyLayout = _.debounce(function() {

            console.log("REPAINTING THUMBNIAL");

            var t0 = Date.now();

            if ( ! $(".page-item").length ) { return ; }

            var $imaged = $(".page-item.imaged");
            $imaged.addClass("checking");

            // var $visible = $(".page-item:in-viewport");
            var $visible = $();
            var $possible = $(".page-item");
            var past_visible = false;
            for (var i = 0; i < $possible.length; i++) {
                var $page = $possible.slice(i, i + 1);
                var f = $page.fracs();
                if ( f.visible ) {
                    // $page.addClass("visible");
                    $visible = $visible.add($page);
                    past_visible = true;
                } else if ( past_visible ) {
                    // don't need to keep looking
                    break;
                }
            }

            // $visible = $possible.filter(".visible");
            self.loadPage($visible);

            // load the previous and next for caching
            var $previous = $visible.slice(0,1).prevAll().slice(0,6);
            var $next = $visible.slice(-1).nextAll().slice(0,6);
            self.loadPage($previous);
            self.loadPage($next);

            // $(".page-item.checking").removeClass("imaged").removeClass("checking").removeClass("loaded").removeClass("loading").find("img").remove();
            $(".page-item.checking").removeClass("imaged checking loaded loading").find("img").remove();

            self.checkPageStatus();

        }, 250);

        $(window).on('scroll.viewer.thumb', lazyLayout);
        console.log("DEFINED SCROLL EVENT");

    },

    gotoPage: function(seq, delta) {
        var $page;
        if ( seq == null ) {
            var $visibles = $(".page-item:in-viewport");
            $page = $visibles.slice(delta);
            seq = $page.data('seq');
            if ( delta < 0 ) { seq -= 1 ; }
            else { seq += 1 ; }
        }

        if ( seq < 1 ) { seq = 1 ; }
        else if ( seq > HT.engines.manager.getLastSeq() ) { seq = HT.engines.manager.getLastSeq(); }

        var $page = $("#page" + seq);
        if ( ! $page.length ) { return ; }
        $('html,body').animate({
            scrollTop: $page.offset().top - 100
        }, "fast");
    },

    loadPage: function($pages) {
        var self = this;
        $pages.removeClass("checking"); // .removeClass("visible");
        self._processLoadQueue($pages.toArray());
    },

    _processLoadQueue: function(pages) {
        var self = this;

        // load 4 thumbnails at a time
        var queue = [];
        var i = 0;
        while ( i < pages.length ) {
            var tmp = pages.slice(i, i + 4);
            if ( tmp.length ) {
                queue.push(tmp);
            }
            i += 4;
        }
        // console.log("QUEUE", queue);
        if ( ! queue.length ) {
            return;
        }

        var timer;
        var fn = function() {
            var $check = $(".loading");
            if ( $check.length > 2 ) {
                // console.log("STILL LOADING", $check.length);
                return;
            }
            var pages_ = queue.shift();
            if ( queue.length == 0 ) {
                clearInterval(timer);
            }
            _.each(pages_, function(page) {
                var $page = $(page);
                if ( ! $page.is(".imaged")) {
                    $page.addClass("imaged").addClass("loading");
                    var seq = $page.data('seq');
                    var $a = $page.find("a.page-link");
                    var h = $page.data('h');
                    var $img = HT.engines.manager.get_image({ seq : seq, width : self.w, height: h, action : 'thumbnail' });
                    $img.attr("alt", "image of " + HT.engines.manager.getAltTextForSeq(seq));
                    $a.append($img);
                } else {
                    $page.removeClass("checking");
                }
            })

        };

        timer = setInterval(fn, 500);

    },

    drawPages : function() {
        var self = this;

        $("#content").empty();
        // self.$container = $("#content");
        self.$container = $('<div class="thumbnails"></div>');

        if ( HT.engines.manager.reading_order == 'right-to-left' ) {
            self.$container.addClass("rtl");
        }

        var fragment = document.createDocumentFragment();

        for(var seq=1; seq <= HT.engines.manager.num_pages; seq++) {
            var meta = HT.engines.manager.get_page_meta({ seq : seq, width : 680 });

            var r = self.w / meta.width;
            // var h = meta.height * r;
            var h = self.h * r;

            var $page = $('<div class="page-item"><div class="page-num">{SEQ}</div><a class="page-link" href="#{SEQ}"></a></div>'.replace(/\{SEQ\}/g, seq)).appendTo($(fragment));
            $page.attr('id', 'page' + seq);
            $page.css({ height : self.w, width : self.w });
            $page.data('seq', seq);
            $page.data('h', self.w);
            // $page.addClass("loading");

            // need to bind clicking the thumbnail to open to that page; so wrap in an anchor!!
        }

        // $(fragment).append("<br clear='both' />");
        self.$container.append(fragment);
        $("#content").append(self.$container);
        self.$container.show();

        $(window).scroll();
        var current = HT.engines.reader.getCurrentSeq();
        if ( current && current > 1 ) {
            self.gotoPage(current);
        }

        $.publish("view.ready");

    },

    // UTIL

    checkPageStatus: function() {
        var self = this;

        var first = $("#page1").fracs();
        var last = $("#page" + HT.engines.manager.num_pages).fracs();

        if ( first.visible >= 0.9 ) {
            $.publish("disable.go.first");
        } else {
            $.publish("enable.go.first");
        }

        if ( last.visible >= 0.9 ) {
            $.publish("disable.go.last");
        } else {
            $.publish("enable.go.last");
        }

        // identiy the "current" page
        var $visibles = $(".page-item:in-viewport");
        for(var i = 0; i < $visibles.length; i++) {
            var $visible = $visibles.slice(i,i+1);
            var fracs = $visible.fracs();
            if ( fracs && fracs.visible >= 0.75 ) {
                $.publish("update.go.page", ( $visible.data('seq') ));
                break;
            }
        }

    },

    _calculateAverages: function() {
        var self = this;
        // find an average h for scaling
        var tmp = {};
        for(var seq=1; seq <= HT.engines.manager.num_pages; seq++) {
            var meta = HT.engines.manager.get_page_meta({ seq : seq, width : 680 });
            tmp[meta.height] = ( tmp[meta.height] || 0 ) + 1;
        }
        var n = -1; var idx;
        var heights = _.keys(tmp);
        self.h = heights[0];
        console.log(tmp);
        console.log(heights);
        for(var i=0; i < heights.length; i++) {
            var h = heights[i];
            if ( tmp[h] > n ) {
                n = tmp[h];
                self.h = h;
            }
        }
    },

    _calculateBestFitZoom: function() {
        var self = this;

        var total_w = $("#content").width();
        var w = self.options.min_w;
        var best_w = w;
        var zoom = 1;
        var factor = 1.25;

        while ( w * 4 < total_w ) {
            best_w = w;
            w *= factor;
            zoom *= factor;
        }

        if ( best_w > self.options.max_w ) {
            best_w = self.options.max_w;
        }

        self.default_w = best_w;
        self.reset_zoom = 1;
    },

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/thumb.js */
// flip

var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Flip = {

    name : 'flip',

    init : function(options) {
        var self = this;
        this.options = $.extend({}, this.options, options);

        this.w = -1;
        this.zoom = this.options.zoom;
        this.zoom_levels = [ 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 3.00, 4.00 ];

        this.orient_cache = {};

        this.rotate = 0;

        return this;
    },

    options: {
        default_w : 680,
        zoom : -1,
        is_dynamic: true
    },

    start : function() {
        $("body").addClass("view-2up"); // needs to correspond to our parameter. MM.
        $.publish("enable.download.page");
        $.publish("disable.rotate");

        this.is_rtl = HT.engines.manager.reading_order == 'right-to-left';

        this.options.seq = HT.engines.reader.getCurrentSeq();
        this._calculateBestFitZoom();

        if ( this.zoom < 0 ) {
            this.zoom = this.reset_zoom;
        } else {
            var zoom_idx = this.zoom_levels.indexOf(this.zoom);
            if ( zoom_idx < 0 ) {
                // use this zoom
                this.zoom = this.reset_zoom;
            }
        }

        this.bindEvents();

        // this.w = ( this.options.default_w * this.zoom ) / 2;
        // this.drawPages();
        this.updateZoom(0, this.zoom);
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".flip");
        $.publish("view.end");
        $(window).unbind(".flip");
        $(document).unbind(".flip");
        $("body").unbind(".flip");
        $("#content").empty().css('margin-top', '');
        $("body").removeClass("view-2up");
    },

    bindEvents: function() {
        var self = this;

        $.subscribe("action.go.next.flip", function(e) {
            // self.gotoPage(null, self.is_rtl ? -1 : 1);
            self.gotoPage(null, 1);
        })

        $.subscribe("action.go.prev.flip", function(e) {
            // self.gotoPage(null, self.is_rtl ? 1 : -1);
            self.gotoPage(null, -1);
        })

        $.subscribe("action.go.first.flip", function(e) {
            self.gotoPage(self.is_rtl ? HT.engines.manager.num_pages : 1);
        })

        $.subscribe("action.go.last.flip", function(e) {
            self.gotoPage(self.is_rtl ? 1 : HT.engines.manager.num_pages);
        })

        $.subscribe("action.go.page.flip", function(e, seq) {
            self.gotoPage(seq);
        })

        $.subscribe("action.zoom.in.flip", function(e) {
            self.updateZoom(1);
        })

        $.subscribe("action.zoom.out.flip", function(e) {
            self.updateZoom(-1);
        })

        $.subscribe("action.zoom.reset.flip", function(e) {
            self.updateZoom(0, self.reset_zoom);
        })

        $.subscribe("action.rotate.clockwise.flip", function(e) {
            self.rotateBook(1);
        })

        $.subscribe("action.rotate.counterclockwise.flip", function(e) {
            self.rotateBook(-1);
        })

        $.subscribe("action.toggle.fullscreen.flip", function(e) {
            self._calculateBestFitZoom();
            self.updateZoom(0, self.reset_zoom);
        })

        self.resize_timer = null;
        var do_rezoom = false;

        var _lazyResize = _.debounce(function() {
            if ( self._resizing ) { return ; }
            self._resizing = true;
            // self.updateZoom(0, self.zoom);
            if ( self.resize_timer === null ) {
                self.resize_timer = setTimeout(function() {
                    if ( self.zoom == self.reset_zoom ) {
                        do_rezoom = true;
                    }
                    self._calculateBestFitZoom();
                    if ( do_rezoom ) {
                        self.zoom = self.reset_zoom;
                    }
                    self.updateZoom(0, self.zoom);
                    self.reset_timer = null;
                }, 500);
            }
            self._resizing = false;
        }, 250);

        $.subscribe("action.resize.flip", function(e) {
            setTimeout(function() { self.handleResize(); }, 100);
            // self.handleResize();
        })

        // var $e = get_resize_root();
        // $e.on('resize.viewer.flip', _lazyResize);

        $("body").on('image.fudge.flip', "img", function() {
            var $img = $(this);
            var seq = $(this).data('seq');

            // console.log("FUDGE: FLIP");

            var h1 = $(this).data('natural-height');
            var h2 = $(this).parent().height();

            var w1 = $(this).data('natural-width');
            var w2 = $(this).parent().parent().width() / 2;

            var t = 100;

            $(this).parent().addClass("loaded");

            if ( w1 - self.w > t ) {
                var $parent = $(this).parent();
                $(this).parent().addClass("untypical-page");
                if ( ! $parent.find("button").length ) {
                    $('<button href="{SRC}" class="btn btn-mini">View Larger</button>'.replace('{SRC}', $img.attr('src')))
                        .appendTo($(this).parent())
                        .click(function(e) {
                            e.preventDefault();
                            $.fancybox.open([ { href : $img.attr('src'), type : 'image' }])
                            return false;
                        })
                }
            }
        });

        $(document).on('keydown.flip', function(e) {
            var keyCode = e.keyCode || e.which;
            var arrow = {
                left: 37,
                up: 38,
                right: 39,
                down: 40
            };

            switch (keyCode) {
            case arrow.left:
                self.gotoPage(null, -1);
                // self._stopSlideshow();
                // self._navigate('prev');
                break;
            case arrow.right:
                self.gotoPage(null, 1);
                // self._stopSlideshow();
                // self._navigate('next');
                break;

            }
        })
    },

    handleResize: function() {
        var self = this;

        self._resizing = true;
        var do_rezoom = false;
        var last_reset_zoom = self.reset_zoom;
        if ( self.zoom == self.reset_zoom ) {
            do_rezoom = true;
        }
        self._calculateBestFitZoom();
        if ( do_rezoom ) {
            self.zoom = self.reset_zoom;
        }
        console.log("FLIP RESIZE", do_rezoom, self.zoom, last_reset_zoom, self.reset_zoom);
        self.updateZoom(0, self.zoom);
        self._resizing = false;
    },

    updateZoom: function(delta, zoom) {
        var self = this;

        var current_index = self.zoom_levels.indexOf(self.zoom);
        if ( delta == 0 ) {
            delta = self.zoom_levels.indexOf(zoom) - current_index;
        }
        var new_index = current_index + delta;
        if ( new_index + delta < 0 ) {
            $.publish("disable.zoom.out");
        } else {
            $.publish("enable.zoom.out");
        }
        if ( new_index + delta >= self.zoom_levels.length ) {
            $.publish("disable.zoom.in");
        } else {
            $.publish("enable.zoom.in");
        }

        self.zoom = self.zoom_levels[new_index];
        self.target_h = self.reset_target_h * self.zoom;

        console.log("UPDATE ZOOM", self.target_h, self.zoom);

        // self.w = ( self.options.default_w * self.zoom ) / 2;

        self.drawPages();
        $.publish("update.zoom.size", ( self.zoom ));

    },

    rotateBook: function(delta) {
        var self = this;

        self.$wrapper.addClass("flip-rotating");
        if ( self.rotate > 0 ) {
            self.$wrapper.removeClass("flip-rotated-" + self.rotate);
        }
        self.rotate += ( 90 * delta );
        if ( self.rotate < 0 ) {
            self.rotate += 360;
        }
        if ( self.rotate == 360 || self.rotate == 0 ) {
            self.rotate = 0;
        } else {
            self.$wrapper.addClass("flip-rotated-" + self.rotate);
        }
        $.publish("update.rotate.orient", ( self.rotate ));
    },

    getPageOrient: function(seq) {
        return this.orient_cache[seq] || 0;
    },

    gotoPage: function(seq, delta) {
        var self = this;

        if ( seq != null ) {
            var page = self._seq2page(seq);
            self.loadPage(page);
            self.book.bookblock('jump', page + 1);
        } else {
            if ( delta > 0 ) {
                // self.do_ltr ? self.book.bookblock('prev') : self.book.bookblock('next');
                self.book.bookblock('next');
            } else {
                // self.do_ltr ? self.book.bookblock('next') : self.book.bookblock('prev');
                self.book.bookblock('prev');
            }
        }


        self.checkPageStatus();

    },

    loadPage: function(page) {
        var self = this;
        // console.log("LOADING", page);
        _.each(self._page2seq(page), function(seq) {
            if ( seq != null ) {
                var $page = $("#page" + seq);
                if ( ! $page.size() ) {
                    // console.log("NO PAGE", seq);
                    return;
                }
                if ( $page.find('img').size() ) {
                    return;
                }
                var $img = HT.engines.manager.get_image({ seq : seq, height: Math.ceil(self.h) }); // why divide h by 2?
                $img.attr("alt", "image of " + HT.engines.manager.getAltTextForSeq(seq));
                $img.appendTo($page);
            }
        })
    },

    unloadPage : function(page) {
        var self = this;
        _.each(self._page2seq(page), function(seq) {
            if ( seq == null ) { return; }
            var $page = $("#page" + seq);
            if ( ! $page.size() ) {
                return;
            }
            // console.log("UNLOADING IMAGE", seq);
            $page.find("img").remove();
        })
    },

    removeImage : function(seq) {
        var $page = $("#page" + seq);
        if ( ! $page.size() ) {
            return;
        }
        // console.log("UNLOADING IMAGE", seq);
        $page.find("img").remove();

        $page = $("#page" + (seq + 1));
        $page.find("img").remove();
    },

    getCurrentSeq: function() {

        var status = this.book.data('bookblock').status();
        var seq = this._page2seq(status.current);
        return seq[0] || seq[1];

        // var $current = $(".page-item.current");
        // if ( $current.length ) {
        //     return $current.data('seq');
        // }
        // return null;
    },

    drawPages : function() {
        var self = this;

        var current = self.is_rtl ? -1 : 0;
        var status;

        if ( self.book != null ) {
            status = self.book.data('bookblock').status();
            current = status.current;
            self.book.bookblock('destroy');
            delete self.book;
        }

        $("#content").empty();

        var wrapper_html;
        if ( Modernizr.canvas ) {
            wrapper_html = '<div class="bb-custom-wrapper"><div class="bb-bookblock"></div><div class="bb-edge"></div></div>';
        } else {
            wrapper_html = '<div class="bb-custom-wrapper"><div class="bb-bookblock"></div></div>';
        }
        $("#content").append(wrapper_html);
        var $container = $(".bb-bookblock");
        self.$container = $container;
        self.$wrapper = $("#content").find(".bb-custom-wrapper");

        // now figure out the best height?
        var h;
        var meta = HT.engines.manager.get_page_meta({seq : 1, width : 680 });
        self.r = meta.width / meta.height;
        // self.h = self.w / self.r;
        // h = self.h; //  / 2;

        var $target = self.$target;
        var target_h = self.target_h;
        var margin_w = self.margin_w;
        var height_target = self.height_target;
        var r = meta.height / target_h;
        self.w = ( meta.width / r ) * 1;
        h = target_h;
        self.h = h;
        // self.w = meta.width / r;

        var max_width = (self.w * 2) + self.margin_w;
        if ( self.height_target == 'window' && max_width > $(window).width() && self.zoom == self.reset_zoom ) {
            // too big an initial zoom!
            max_width = $(window).width() - 25;
        }

        if ( self.zoom == self.reset_zoom && target_h > 0 ) {
            if ( h > target_h ) {
                var msg = [ "REDEFINING", target_h, ":", self.w, "x", self.h ];
                r = target_h / h;
                h = target_h;
                self.h = h;
                self.w = self.w * r;
                msg.push("/", self.w, "x", self.h);
                max_width = (self.w * 2) + margin_w;
                if ( height_target == 'window' && max_width > $(window).width() && self.zoom == self.reset_zoom ) {
                   // too big an initial zoom!
                   max_width = $(window).width() - 25;
                }
                // console.log.apply(console, msg);
            }
        }
        console.log("META: ", meta, self.zoom, self.reset_zoom, r, "/", self.w, self.h, "/", h, target_h);

        self.$wrapper.css({ 'width' : max_width  });

        self.$wrapper.height(h); // .width(HT.w);
        $container.height(h);

        if ( $target != null && h < $target.height() ) {
            // what's the vertical center of this container?
            var y = $target.height() / 2;
            y -= ( h / 2 );
            self.$wrapper.css('margin-top', y + "px");
        }

        // mdpItem will normalize the pages so seq=1 IS THE START OF THE BOOK
        // right-to-left only means we stack the pages in the div differently
        var pages = [];
        var page = [];

        var start_seq = 1;
        var end_seq = HT.engines.manager.num_pages;

        if ( HT.engines.manager.has_feature(1, "FRONT_COVER") || ( HT.engines.manager.has_feature(1, "COVER") && HT.engines.manager.has_feature(1, "RIGHT") ) || HT.engines.manager.has_feature(1, "COVER") || ! HT.engines.manager.has_features(1) ) {
            // first page is a cover
            if ( HT.engines.manager.reading_order == 'right-to-left' ) {
                pages.push([ 1, null ]);
            } else {
                pages.push([ null, 1 ]);
            }
            start_seq = 2;
        }
        var last_page;
        if ( HT.engines.manager.has_feature(end_seq, "BACK_COVER") || ( HT.engines.manager.has_feature(1, "COVER") && HT.engines.manager.has_feature(1, "LEFT") ) ) {
            if ( HT.engines.manager.reading_order == 'right-to-left' ) {
                last_page = [ null, end_seq ];
            } else {
                last_page = [ end_seq, null ];
            }
            end_seq -= 1;
        }

        for(var seq = start_seq; seq <= end_seq; seq += 2) {
            var next_seq = seq + 1;
            if ( next_seq > HT.engines.manager.num_pages ) {
                next_seq = null;
            }
            if ( HT.engines.manager.reading_order == 'right-to-left' ) {
                // seq + 1 may not exist?
                pages.push([ next_seq, seq ]);
            } else {
                pages.push([ seq, next_seq ]);
            }
        }

        if ( last_page ) {
            pages.push(last_page);
        }

        if ( HT.engines.manager.reading_order == 'right-to-left' ) {
            pages.reverse();
        }

        self._seq2page_map = {}; self._page2seq_map = {};
        _.each(pages, function(page, i) {
            if ( ! page ) { return ; }
            var left_page_seq = page[0];
            var right_page_seq = page[1];
            var html = '<div class="bb-item" aria-hidden="true">';
            self._page2seq_map[i] = [null, null];
            if ( left_page_seq ) {
                // html += '<div id="page{SEQ}" class="page-item page-left"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, left_page_seq);
                html += '<div id="page{SEQ}" class="bb-custom-side page-item page-left"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, left_page_seq);
                self._seq2page_map[left_page_seq] = i;
                self._page2seq_map[i][0] = left_page_seq;
            } else {
                html += '<div class="bb-custom-side page-item page-left empty"></div>';
            }
            if ( right_page_seq ) {
                // html += '<div id="page{SEQ}" class="page-item page-right"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, right_page_seq);
                html += '<div id="page{SEQ}" class="bb-custom-side page-item page-right"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, right_page_seq);
                self._seq2page_map[right_page_seq] = i;
                self._page2seq_map[i][1] = right_page_seq;
                // if ( ! left_page_seq || left_page_seq > right_page_seq ) {
                //     self._page2seq_map[i][1] = right_page_seq;
                // }
            } else {
                html += '<div class="bb-custom-side page-item page-right empty"></div>';
            }
            html += '</div>';
            self._attachPageHTML(html);

            $.each([ left_page_seq, right_page_seq ], function() {
                if ( this ) {
                    var meta = HT.engines.manager.get_page_meta({ seq : this });
                    if ( HT.engines.manager.has_feature(meta, "UNTYPICAL_PAGE") ) {
                        $("#page" + this).addClass("untypical-page");
                    }
                }
            })

        })

        this.$leafs = $container.find(".bb-item");
        var max_edge_width = ( ( $("#content").width() - $container.width() ) * 0.85 ) / 2;

        this.book = $container.bookblock( {
                    speed               : 600,
                    shadowSides : 0.8,
                    shadowFlip  : 0.4,
                    // perspective: 1300,
                    edges: { $edge: $(".bb-edge"), max_edge_width: max_edge_width  },
                    n : pages.length,

                    onBeforeFlip : function ( page, isLimit ) {
                        $container.addClass("flipping");
                        // console.log("PRE FLIP:", page, isLimit);
                        self.$leafs.slice(page,page+1).attr('aria-hidden', 'true');
                        // load images a couple of pages in the future
                    },
                    onEndFlip : function ( previous, page, isLimit ) {
                        // console.log("FLIPPED:", current, previous, page, isLimit, arguments );
                        $container.removeClass("flipping");
                        self.$leafs.slice(page,page+1).attr('aria-hidden', 'false');
                        self.loadPage(page - 1);
                        self.loadPage(page - 2);
                        self.loadPage(page + 1);
                        self.loadPage(page + 2);

                        self.unloadPage(page - 8);
                        self.unloadPage(page + 8);

                    },
                    onEdgeClick: function( previous, page, isLimit ) {
                        var seqs = self._page2seq(page);
                        // console.log("JUMP THROUGH EDGE STATUS: ", previous, page, seqs);
                        self.gotoPage(seqs[0]);
                    }
                } );

        this.book.n = pages.length;
        self.pages = pages;

        if ( self.options.seq ) {
            current = self._seq2page(self.options.seq);
            delete self.options.seq;
        } else {
            if ( current < 0 ) {
                current = pages.length;
            }
        }

        var last_num = HT.engines.manager.getPageNumForSeq(end_seq);
        if ( ! last_num ) {
            last_num = "n" + end_seq;
        }
        self.options.last_num = last_num;

        self.loadPage(current);
        self.loadPage(current + 1);
        self.loadPage(current - 1);
        // self.loadPage(self._page2seq(current)); self.loadPage(self._page2seq(current) + 1);

        self.book.bookblock('toggleLayoutSupport');
        self.book.bookblock('jump', current + 1);
        self.book.bookblock('toggleLayoutSupport');

        $(window).scroll();

        setTimeout(function() {
            // self.buildSlider(pages, current);
            self.checkPageStatus();
        }, 100);

        $container.on('click', '.page-right', function() { // .page-right img?
            // self.book.bookblock('next');
            self.gotoPage(null, 1);
        }).on('click', '.page-left', function() { // .page-left img?
            // self.book.bookblock('prev');
            self.gotoPage(null, -1);
        }).on('swipeleft', function(e) { self.gotoPage(null, 1); })
          .on('swiperight', function(e) { self.gotoPage(null, -1); })

        $.publish("view.ready");

    },

    buildSlider: function(pages, current) {
        var self = this;
        var $nob = $('<input type="text" class="nob" value="1" />').appendTo($("#content"));
        var last_num = self.options.last_num;
        self.$slider = $nob.slider({
            min : 0,
            max : pages.length - 1,
            value : current,
            selection : 'none',
            tooltip : 'show',
            label : function(current, total) {
                var seq = self._page2seq(current);
                if ( seq[0] == null ) {
                    seq = seq[1];
                } else {
                    seq = seq[0];
                }
                var num = HT.engines.manager.getPageNumForSeq(seq);
                var text = " / " + last_num;
                if ( num ) {
                    text = num + text;
                } else {
                    text = "n" + seq  + text;
                }
                // var end = self._page2seq(total);
                return text;
            },
            handle : 'square'
        }).on('slideStop', function(ev) {
            var value = ev.value;
            var seq = self._page2seq(value);
            // console.log("JUMPING TO", value, seq);
            self.gotoPage(seq[0]);
        })
    },

    // UTIL

    checkPageStatus: function() {
        var self = this;

        var status = self.book.data('bookblock').status();
        if ( status.current == 0 ) {
            $.publish("disable.go.first");
        } else {
            $.publish("enable.go.first");
        }

        if ( status.end ) {
            $.publish("disable.go.last");
        } else {
            $.publish("enable.go.last");
        }

        // self.$slider.slider('setValue', page);

        var seq = self._page2seq(status.current);

        $.publish("update.go.page", [seq]);

    },

    _calculateBestFitZoom: function() {
        var self = this;

        var fit_w = $("#content").width();
        var $window = $(window);

        var $target; var target_h = -1;
        var height_target = $("#content").data('height-target');
        var margin_w = 0;
        if ( height_target ) {
            $target = ( height_target == 'window' ) ? $(window) : $("#" + height_target);
            target_h = $target.height() * 0.98;
        } else {

            // var w = window,
            //     d = document,
            //     e = d.documentElement,
            //     g = d.getElementsByTagName('body')[0],
            //     x = w.innerWidth || e.clientWidth || g.clientWidth,
            //     y = w.innerHeight|| e.clientHeight|| g.clientHeight;

            // y = e.clientHeight || g.clientHeight || w.innerHeight;
            var y = $(window).height();

            console.log("BEST FIT target_h", y, $(window).height(), $(".navbar").height(), $(".toolbar-horizontal").height());
            target_h = y - $(".navbar").height() - $(".toolbar-horizontal").height() - 25 - 75;
            margin_w = 75;
        }
       
        // for(var i = 0; i < self.zoom_levels.length; i++) {
        //     var zoom = self.zoom_levels[i];
        //     // if ( 0 && ( self.options.default_w * zoom ) * 2  > ( fit_w * 2 ) && ( height_target != 'window' ) ) {
        //     //     break;
        //     // }
        //     // self.w = ( self.options.default_w * zoom ) / 2;
        //     self.reset_zoom = zoom;
        //     if ( ( self.options.default_w * zoom ) * 2  > ( fit_w * 2 ) && ( 1 || height_target == 'window' ) ) {
        //         break;
        //     }
        // }

        // THIS IS THE BEST FIT ZOOM; THIS BECOMES SIZE=100
        self.reset_zoom = 1;

        self.$target = $target;
        self.height_target = height_target;
        self.target_h = target_h;
        self.reset_target_h = target_h;
        self.margin_w = margin_w;
        console.log("BEST FIT", target_h, margin_w);
    },

    _page2seq: function(page) {
        return this._page2seq_map[page];
    },

    _seq2page: function(seq) {
        return this._seq2page_map[seq];
    },

    _attachPageHTML: function(html) {
        if ( false && HT.engines.manager.do_ltr ) {
            $(html).prependTo(this.$container);
        } else {
            $(html).appendTo(this.$container);
        }
    },

    isRTL: function() {
        return HT.engines.manager.reading_order == 'right-to-left';
    },

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/flip.js */
var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.PlainText = {
    name : 'plaintext',

    init : function(options) {
        var self = this;
        return this;
    },

    options: {},

    start: function() {
        $body.addClass("view-plaintext");
        this.bindEvents();
    },

    bindEvents: function() {
        var self = this;
        $.publish("disable.toggle.fullscreen");
        $.publish("disable.zoom.in");
        $.publish("disable.zoom.out");
        $.publish("disable.rotate.clockwise");
        $.publish("disable.rotate.counterclockwise");
    },

    _gotoLink: function(link)  {
        window.location.href = $(link).attr("href");
    },

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/plaintext.js */
