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
(function() {

	var event = jQuery.event,

		//helper that finds handlers by type and calls back a function, this is basically handle
		// events - the events object
		// types - an array of event types to look for
		// callback(type, handlerFunc, selector) - a callback
		// selector - an optional selector to filter with, if there, matches by selector
		//     if null, matches anything, otherwise, matches with no selector
		findHelper = function( events, types, callback, selector ) {
			var t, type, typeHandlers, all, h, handle, 
				namespaces, namespace,
				match;
			for ( t = 0; t < types.length; t++ ) {
				type = types[t];
				all = type.indexOf(".") < 0;
				if (!all ) {
					namespaces = type.split(".");
					type = namespaces.shift();
					namespace = new RegExp("(^|\\.)" + namespaces.slice(0).sort().join("\\.(?:.*\\.)?") + "(\\.|$)");
				}
				typeHandlers = (events[type] || []).slice(0);

				for ( h = 0; h < typeHandlers.length; h++ ) {
					handle = typeHandlers[h];
					
					match = (all || namespace.test(handle.namespace));
					
					if(match){
						if(selector){
							if (handle.selector === selector  ) {
								callback(type, handle.origHandler || handle.handler);
							}
						} else if (selector === null){
							callback(type, handle.origHandler || handle.handler, handle.selector);
						}
						else if (!handle.selector ) {
							callback(type, handle.origHandler || handle.handler);
							
						} 
					}
					
					
				}
			}
		};

	/**
	 * Finds event handlers of a given type on an element.
	 * @param {HTMLElement} el
	 * @param {Array} types an array of event names
	 * @param {String} [selector] optional selector
	 * @return {Array} an array of event handlers
	 */
	event.find = function( el, types, selector ) {
		var events = ( $._data(el) || {} ).events,
			handlers = [],
			t, liver, live;

		if (!events ) {
			return handlers;
		}
		findHelper(events, types, function( type, handler ) {
			handlers.push(handler);
		}, selector);
		return handlers;
	};
	/**
	 * Finds all events.  Group by selector.
	 * @param {HTMLElement} el the element
	 * @param {Array} types event types
	 */
	event.findBySelector = function( el, types ) {
		var events = $._data(el).events,
			selectors = {},
			//adds a handler for a given selector and event
			add = function( selector, event, handler ) {
				var select = selectors[selector] || (selectors[selector] = {}),
					events = select[event] || (select[event] = []);
				events.push(handler);
			};

		if (!events ) {
			return selectors;
		}
		//first check live:
		/*$.each(events.live || [], function( i, live ) {
			if ( $.inArray(live.origType, types) !== -1 ) {
				add(live.selector, live.origType, live.origHandler || live.handler);
			}
		});*/
		//then check straight binds
		findHelper(events, types, function( type, handler, selector ) {
			add(selector || "", type, handler);
		}, null);

		return selectors;
	};
	event.supportTouch = "ontouchend" in document;
	
	$.fn.respondsTo = function( events ) {
		if (!this.length ) {
			return false;
		} else {
			//add default ?
			return event.find(this[0], $.isArray(events) ? events : [events]).length > 0;
		}
	};
	$.fn.triggerHandled = function( event, data ) {
		event = (typeof event == "string" ? $.Event(event) : event);
		this.trigger(event, data);
		return event.handled;
	};
	/**
	 * Only attaches one event handler for all types ...
	 * @param {Array} types llist of types that will delegate here
	 * @param {Object} startingEvent the first event to start listening to
	 * @param {Object} onFirst a function to call 
	 */
	event.setupHelper = function( types, startingEvent, onFirst ) {
		if (!onFirst ) {
			onFirst = startingEvent;
			startingEvent = null;
		}
		var add = function( handleObj ) {

			var bySelector, selector = handleObj.selector || "";
			if ( selector ) {
				bySelector = event.find(this, types, selector);
				if (!bySelector.length ) {
					$(this).delegate(selector, startingEvent, onFirst);
				}
			}
			else {
				//var bySelector = event.find(this, types, selector);
				if (!event.find(this, types, selector).length ) {
					event.add(this, startingEvent, onFirst, {
						selector: selector,
						delegate: this
					});
				}

			}

		},
			remove = function( handleObj ) {
				var bySelector, selector = handleObj.selector || "";
				if ( selector ) {
					bySelector = event.find(this, types, selector);
					if (!bySelector.length ) {
						$(this).undelegate(selector, startingEvent, onFirst);
					}
				}
				else {
					if (!event.find(this, types, selector).length ) {
						event.remove(this, startingEvent, onFirst, {
							selector: selector,
							delegate: this
						});
					}
				}
			};
		$.each(types, function() {
			event.special[this] = {
				add: add,
				remove: remove,
				setup: function() {},
				teardown: function() {}
			};
		});
	};
})(jQuery);
(function($){
var isPhantom = /Phantom/.test(navigator.userAgent),
	supportTouch = !isPhantom && "ontouchend" in document,
	scrollEvent = "touchmove scroll",
	// Use touch events or map it to mouse events
	touchStartEvent = supportTouch ? "touchstart" : "mousedown",
	touchStopEvent = supportTouch ? "touchend" : "mouseup",
	touchMoveEvent = supportTouch ? "touchmove" : "mousemove",
	data = function(event){
		var d = event.originalEvent.touches ?
			event.originalEvent.touches[ 0 ] :
			event;
		return {
			time: (new Date).getTime(),
			coords: [ d.pageX, d.pageY ],
			origin: $( event.target )
		};
	};

/**
 * @add jQuery.event.swipe
 */
var swipe = $.event.swipe = {
	/**
	 * @attribute delay
	 * Delay is the upper limit of time the swipe motion can take in milliseconds.  This defaults to 500.
	 * 
	 * A user must perform the swipe motion in this much time.
	 */
	delay : 500,
	/**
	 * @attribute max
	 * The maximum distance the pointer must travel in pixels.  The default is 75 pixels.
	 */
	max : 75,
	/**
	 * @attribute min
	 * The minimum distance the pointer must travel in pixels.  The default is 30 pixels.
	 */
	min : 30
};

$.event.setupHelper( [

/**
 * @hide
 * @attribute swipe
 */
"swipe",
/**
 * @hide
 * @attribute swipeleft
 */
'swipeleft',
/**
 * @hide
 * @attribute swiperight
 */
'swiperight',
/**
 * @hide
 * @attribute swipeup
 */
'swipeup',
/**
 * @hide
 * @attribute swipedown
 */
'swipedown'], touchStartEvent, function(ev){
	var
		// update with data when the event was started
		start = data(ev),
		stop,
		delegate = ev.delegateTarget || ev.currentTarget,
		selector = ev.handleObj.selector,
		entered = this;
	
	function moveHandler(event){
		if ( !start ) {
			return;
		}
		// update stop with the data from the current event
		stop = data(event);

		// prevent scrolling
		if ( Math.abs( start.coords[0] - stop.coords[0] ) > 10 ) {
			event.preventDefault();
		}
	};

	// Attach to the touch move events
	$(document.documentElement).bind(touchMoveEvent, moveHandler)
		.one(touchStopEvent, function(event){
			$(this).unbind( touchMoveEvent, moveHandler);
			// if start and stop contain data figure out if we have a swipe event
			if ( start && stop ) {
				// calculate the distance between start and stop data
				var deltaX = Math.abs(start.coords[0] - stop.coords[0]),
					deltaY = Math.abs(start.coords[1] - stop.coords[1]),
					distance = Math.sqrt(deltaX*deltaX+deltaY*deltaY);

				// check if the delay and distance are matched
				if ( stop.time - start.time < swipe.delay && distance >= swipe.min ) {
					var events = ['swipe'];
					// check if we moved horizontally
					if( deltaX >= swipe.min && deltaY < swipe.min) {
						// based on the x coordinate check if we moved left or right
						events.push( start.coords[0] > stop.coords[0] ? "swipeleft" : "swiperight" );
					} else
					// check if we moved vertically
					if(deltaY >= swipe.min && deltaX < swipe.min){
						// based on the y coordinate check if we moved up or down
						events.push( start.coords[1] < stop.coords[1] ? "swipedown" : "swipeup" );
					}

					// trigger swipe events on this guy
					$.each($.event.find(delegate, events, selector), function(){
						this.call(entered, ev, {start : start, end: stop})
					})
				
				}
			}
			// reset start and stop
			start = stop = undefined;
		})
});

})(jQuery)
/* /htapps/roger.babel/pt/web/vendor/BookBlock/js/jquerypp.custom.js */
/**
 * jquery.bookblock.js v1.0.2
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2012, Codrops
 * http://www.codrops.com
 */

;
(function($, window, undefined) {

	'use strict';

	// global
	var Modernizr = window.Modernizr;

	$.BookBlock = function(options, element) {

		this.$el = $(element);
		this._init(options);

	};

	// the options
	$.BookBlock.defaults = {
		// speed for the flip transition in ms.
		speed: 1000,
		// easing for the flip transition.
		easing: 'ease-in-out',
		// if set to true, both the flipping page and the sides will have an overlay to simulate shadows
		shadows: true,
		// opacity value for the "shadow" on both sides (when the flipping page is over it).
		// value : 0.1 - 1
		shadowSides: 0.2,
		// opacity value for the "shadow" on the flipping page (while it is flipping).
		// value : 0.1 - 1
		shadowFlip: 0.1,
		// perspective value
		perspective: 1300,
		// if we should show the first item after reaching the end.
		circular: false,
		// if we want to specify a selector that triggers the next() function. example: '#bb-nav-next'.
		nextEl: '',
		// if we want to specify a selector that triggers the prev() function.
		prevEl: '',
		// autoplay. If true it overwrites the circular option to true!
		autoplay: false,
		// time (ms) between page switch, if autoplay is true. 
		interval: 3000,
		//if we want to navigate the slides with the keyboard arrows
		keyboard: true,
		// callback after the flip transition.
		// page is the current item's index.
		// isLimit is true if the current page is the last one (or the first one).
		onEndFlip: function(page, isLimit) {
			return false;
		},
		// callback before the flip transition.
		// page is the current item's index.
		onBeforeFlip: function(page) {
			return false;
		}
	};

	$.BookBlock.prototype = {

		_init: function(options) {

			// options.
			this.options = $.extend(true, {}, $.BookBlock.defaults, options);
			// set the perspective
			this.$el.css('perspective', this.options.perspective);
			// items.
			this.$items = this.$el.children('.bb-item');
			// total items.
			this.itemsCount = this.$items.length;
			// current item.
			this.current = 0;
			// show first item.
			this.$current = this.$items.eq(this.current).show();
			// get width of this.$el
			// this will be necessary to create the flipping layout.
			this.elWidth = this.$el.width();
			// https://github.com/twitter/bootstrap/issues/2870.
			var transEndEventNames = {
				'WebkitTransition': 'webkitTransitionEnd',
				'MozTransition': 'transitionend',
				'OTransition': 'oTransitionEnd',
				'msTransition': 'MSTransitionEnd',
				'transition': 'transitionend'
			};
			this.transEndEventName = transEndEventNames[Modernizr.prefixed('transition')];
			// support (3dtransforms && transitions).
			this.support = Modernizr.csstransitions && Modernizr.csstransforms3d;
			// this seems like a bad hack, but webkit has flaky csstransforms3d detection
			if ( $.browser.webkit ) {
				this.support = true;
			}

			this._initEvents();

			if (this.options.autoplay) {

				this.options.circular = true;
				this._startSlideshow();

			}

		},
		_initEvents: function() {

			var self = this;

			if (this.options.nextEl !== '') {

				$(this.options.nextEl).on('click.bookblock', function() {

					self._stopSlideshow();
					self._navigate('next');
					return false;

				});

			}

			if (this.options.prevEl !== '') {

				$(this.options.prevEl).on('click.bookblock', function() {

					self._stopSlideshow();
					self._navigate('prev');
					return false;

				});

			}

			if (this.options.keyboard == true) {
				$(document).keydown(function(e) {
					var keyCode = e.keyCode || e.which;
					var arrow = {
						left: 37,
						up: 38,
						right: 39,
						down: 40
					};

					switch (keyCode) {
					case arrow.left:
						self._stopSlideshow();
						self._navigate('prev');
						break;
					case arrow.right:
						self._stopSlideshow();
						self._navigate('next');
						break;

					}
				});
			}

		},
		// public method: flips next
		next: function() {

			this._stopSlideshow();
			this._navigate('next');

		},
		// public method: flips back
		prev: function() {

			this._stopSlideshow();
			this._navigate('prev');

		},
		// public method: goes to a specific page.
		jump: function(page) {

			page -= 1;

			if (page === this.current || page >= this.itemsCount || page < 0) {

				return false;

			}

			this._stopSlideshow();
			this._navigate(page > this.current ? 'next' : 'prev', page);

		},
		// public method: check if isAnimating is true
		isActive: function() {

			return this.isAnimating;

		},
		_navigate: function(dir, page) {

			if (this.isAnimating) {

				return false;

			}

			// callback trigger
			this.options.onBeforeFlip(this.current);

			this.isAnimating = true;
			this.$current = this.$items.eq(this.current);

			if (page !== undefined) {

				this.current = page;

			} else if (dir === 'next') {

				if (!this.options.circular && this.current === this.itemsCount - 1) {

					this.end = true;

				} else {

					this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;

				}

			} else if (dir === 'prev') {

				if (!this.options.circular && this.current === 0) {

					this.end = true;

				} else {

					this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;

				}

			}

			if (!this.options.circular && this.end) {

				this.$nextItem = this.$current;

			} else {

				this.$nextItem = this.$items.eq(this.current);

			}

			if (!this.support) {

				this._layoutNoSupport(dir);

			} else {

				this._layout(dir);

			}

		},

		toggleLayoutSupport: function() {
			if ( ! this._master_support ) {
				this._master_support = this.support;
			}
			if ( this._master_support ) {
				this.support = ! this.support;
			}
		},

		// with no support we consider no 3d transforms and transitions
		_layoutNoSupport: function(dir) {

			// this.$items.hide();
			// this.$nextItem.show();

			this.$items.fadeOut('fast');
			this.$nextItem.fadeIn('fast');

			this.end = false;
			this.isAnimating = false;

			var isLimit = dir === 'next' && this.current === this.itemsCount - 1 || dir === 'prev' && this.current === 0;
			// callback trigger
			this.options.onEndFlip(this.current, isLimit);

		},
		// creates the necessary layout for the 3d animation, and triggers the transitions
		_layout: function(dir) {

			var self = this,

				// basic structure:
				// 1 element for the left side.
				$s_left = this._addSide('left', dir),
				// 1 element for the flipping/middle page
				$s_middle = this._addSide('middle', dir),
				// 1 element for the right side
				$s_right = this._addSide('right', dir),
				// overlays
				$o_left = $s_left.find('div.bb-overlay'),
				$o_middle_f = $s_middle.find('div.bb-flipoverlay:first'),
				$o_middle_b = $s_middle.find('div.bb-flipoverlay:last'),
				$o_right = $s_right.find('div.bb-overlay'),
				speed = this.options.speed;

			this.$items.hide();
			this.$el.prepend($s_left, $s_middle, $s_right);

			if (this.end) {

				speed = 400;

			}

			$s_middle.css({
				transition: 'all ' + speed + 'ms ' + this.options.easing
			}).on(this.transEndEventName, function(event) {

				if (event.target.className === 'bb-page') {

					self.$el.children('div.bb-page').remove();
					self.$nextItem.show();

					self.end = false;
					self.isAnimating = false;

					var isLimit = dir === 'next' && self.current === self.itemsCount - 1 || dir === 'prev' && self.current === 0;

					// callback trigger
					self.options.onEndFlip(self.current, isLimit);

				}

			});

			if (dir === 'prev') {

				$s_middle.css({
					transform: 'rotateY(-180deg)'
				});

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

			setTimeout(function() {

				var style = (dir === 'next') ? 'rotateY(-180deg)' : 'rotateY(0deg)';

				if (self.end) {

					// first && last pages lift up 15 deg when we can't go further. 
					style = (dir === 'next') ? 'rotateY(-15deg)' : 'rotateY(-165deg)';

				}

				$s_middle.css({
					transform: style
				});

				// overlays
				if (self.options.shadows && !self.end) {

					$o_middle_f.css({
						opacity: (dir === 'next') ? self.options.shadowFlip : 0
					});

					$o_middle_b.css({
						opacity: (dir === 'next') ? 0 : self.options.shadowFlip
					});

					$o_left.css({
						opacity: (dir === 'next') ? self.options.shadowSides : 0
					});

					$o_right.css({
						opacity: (dir === 'next') ? 0 : self.options.shadowSides
					});

				}


			}, 30);

		},
		// adds the necessary sides (bb-page) to the layout 
		_addSide: function(side, dir) {

			var $side;

			switch (side) {

			case 'left':
/*
					<div class="bb-page" style="z-index:2;">
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
				$side = $('<div class="bb-page"><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$current.html() : this.$nextItem.html()) + '</div></div><div class="bb-overlay"></div></div></div></div>').css('z-index', 102);
				break;

			case 'middle':
/*
					<div class="bb-page" style="z-index:3;">
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
				$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content" style="left:' + (-this.elWidth / 2) + 'px;width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$current.html() : this.$nextItem.html()) + '</div></div><div class="bb-flipoverlay"></div></div></div><div class="bb-back"><div class="bb-outer"><div class="bb-content" style="width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$nextItem.html() : this.$current.html()) + '</div></div><div class="bb-flipoverlay"></div></div></div></div>').css('z-index', 103);
				break;

			case 'right':
/*
					<div class="bb-page" style="z-index:1;">
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
				$side = $('<div class="bb-page"><div class="bb-front"><div class="bb-outer"><div class="bb-content" style="left:' + (-this.elWidth / 2) + 'px;width:' + this.elWidth + 'px"><div class="bb-inner">' + (dir === 'next' ? this.$nextItem.html() : this.$current.html()) + '</div></div><div class="bb-overlay"></div></div></div></div>').css('z-index', 101);
				break;

			}

			return $side;

		},
		_startSlideshow: function() {

			var self = this;

			this.slideshow = setTimeout(function() {

				self._navigate('next');

				if (self.options.autoplay) {

					self._startSlideshow();

				}

			}, this.options.interval);

		},
		_stopSlideshow: function() {

			if (this.options.autoplay) {

				clearTimeout(this.slideshow);
				this.options.autoplay = false;

			}

		}

	};

	var logError = function(message) {

			if (window.console) {

				window.console.error(message);

			}

		};

	$.fn.bookblock = function(options) {

		var instance = $.data(this, 'bookblock');

		if (typeof options === 'string') {

			var args = Array.prototype.slice.call(arguments, 1);

			this.each(function() {

				if (!instance) {

					logError("cannot call methods on bookblock prior to initialization; " + "attempted to call method '" + options + "'");
					return;

				}

				if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {

					logError("no such method '" + options + "' for bookblock instance");
					return;

				}

				instance[options].apply(instance, args);

			});

		} else {

			this.each(function() {

				if (instance) {

					instance._init();

				} else {

					instance = $.data(this, 'bookblock', new $.BookBlock(options, this));

				}

			});

		}

		return instance;

	};

})(jQuery, window);

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

		var width = this.element.outerWidth();

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

		var tooltip = this.element.data('slider-tooltip')||options.tooltip;
		this.label = options.label;

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
				// console.log("SETTING THE WIDTH:", this.element.outerWidth(), this.element, tmp1, tmp2);
				this.picker
					.addClass('slider-horizontal')
					.css('width', width);
				this.orientation = 'horizontal';
				this.stylePos = 'left';
				this.mousePos = 'pageX';
				this.sizePos = 'offsetWidth';
				this.tooltip.addClass('top')[0].style.top = -this.tooltip.outerHeight() - 14 + 'px';
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

		this.layout();
		this.picker.on({
			mousedown: $.proxy(this.mousedown, this)});
		if (tooltip === 'show') {
			this.picker.on({
				mouseenter: $.proxy(this.showTooltip, this),
				mouseleave: $.proxy(this.hideTooltip, this)
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
			this.over = true;
		},
		
		hideTooltip: function(){
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
					(this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step) + 
					' : ' + 
					(this.min + Math.round((this.diff * this.percentage[1]/100)/this.step)*this.step)
				);
				this.tooltip[0].style[this.stylePos] = this.size * (this.percentage[0] + (this.percentage[1] - this.percentage[0])/2)/100 - (this.orientation === 'vertical' ? this.tooltip.outerHeight()/2 : this.tooltip.outerWidth()/2) +'px';
			} else {
				var text = (this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step);
				if ( this.label ) {
					text = this.label(text, this.max);
				}
				this.tooltipInner.text(
					text
				);
				this.tooltip[0].style[this.stylePos] = this.size * this.percentage[0]/100 - (this.orientation === 'vertical' ? this.tooltip.outerHeight()/2 : this.tooltip.outerWidth()/2) +'px';
			}
		},

		mousedown: function(ev) {
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

			$(document).on({
				mousemove: $.proxy(this.mousemove, this),
				mouseup: $.proxy(this.mouseup, this)
			});
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
			$(document).off({
				mousemove: this.mousemove,
				mouseup: this.mouseup
			});
			this.inDrag = false;
			if (this.over == false) {
				this.hideTooltip();
			}
			this.element;
			var val = this.calculateValue();
			console.log("MOUSEUP", val);
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
		handle: 'round'
	};

	$.fn.slider.Constructor = Slider;

}( window.jQuery );
/* /htapps/roger.babel/pt/web/vendor/slider/js/bootstrap-slider.js */

var HT = HT || {};
HT.scrolling = {};

var $window;

head.ready(function() {

    $window = $(window);

    var last_top = $window.scrollTop();
    var last_left = $window.scrollLeft();

    HT.x = 10;

    var rebuild_sidebar = function() {
        var h = $window.height() - $(".header.fixed").height() - $(".navbar-static-top").height();
        var h2 = h - $(".bibLinks").height() - HT.x;
        $("#sidebar").height(h).find(".scrollable").height(h2).addClass("nano");
        $(".sidebar.dummy").height($("#sidebar").height());
        $(".scrollable.nano").nanoScroller({ alwaysVisible : true });
    }

    HT.scrolling.rebuild_sidebar = rebuild_sidebar;

    var is_fix_active = false;
    var rebuild_fixed = function() {
        var idx = 0;
        $fixed.each(function() {
            var $original = $(this);

            var xy = $original.offset();
            var w = $original.outerWidth();
            var h = $original.outerHeight();
            if ( $original.is("#toolbar-vertical") ) {
                w = 40;
            } else if ( $original.is("#toolbar-horizontal") ) {
                h = 40;
            }

            // console.log("ORIGINAL", w);

            if ( ! $original.attr("id") ) {
                idx += 1;
                $original.attr("id", "id" + idx);
            }

            $original.css({ position: 'fixed', top : xy.top, left : xy.left, width : w }).addClass("stuck");

            // if ( $original.hasClass("sidebar") ) {
            //     $original.height($(window).height());
            // }

            if ( ! $original.is(".no-dummy") ) {
                var extra_h = 0; // $.browser.webkit ? ( $original.data('extra-height') || 0 ) : 0;
                var $dummy = $("<div><div></div></div>").attr('id', $original.attr("id") + "-dummy").attr('class', $original.attr('class')).addClass("dummy").removeClass("stuck").css({ height: h + extra_h, width : w });
                $original.before($dummy).addClass('fixed-placed');
                $dummy = $("#" + $original.attr("id") + "-dummy");
                // $dummy.height($original.outerHeight());
                if ( $original.is("#header") ) {
                    console.log("ORIGINAL:", $original.css('height'), $original.height(), $original.outerHeight(false), $original.outerHeight(true), $original.innerHeight(), $dummy.height(), $dummy.outerHeight());
                    var x = 2 * 3;
                }
                $original.css('top', $dummy.offset().top).width($dummy.outerWidth()).addClass("static");
                if ( $original.is(".fixed-x") ) {
                    $original.css('left', $dummy.offset().left);
                }
                dummies[$original.attr('id')] = $dummy;
            }


        })
        is_fix_active = true;
        handle_margins(true);
        rebuild_sidebar();
    };


    $(".header").addClass("fixed").addClass("fixed-x").data('extra-height', 40).data('shadow', '#navbar-inner');

    var $fixed = $(".fixed");
    var $fixed_x = $(".fixed.fixed-x");
    var $fixed_y = $(".fixed.fixed-y");
    var dummies = {}

    var $bottom = $(".main");


    setTimeout(rebuild_fixed, 10);


    var handle_scroll_horizontal = function() {

        if ( ! is_fix_active ) { return; }

        var current_left = $(window).scrollLeft();
        $fixed.filter(".fixed-y").each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr('id')];
            $original.css({ left : $dummy.offset().left - current_left });
        })
    }

    var handle_scroll_vertical = function() {
        if ( ! is_fix_active ) { return; }

        var current_top = $(window).scrollTop();

        //console.log("-- scrolling", current_top, last_top);
        // console.log($("#sidebar").fracs().rects.viewport.bottom, " / ", $(".main").fracs().rects.viewport.bottom);
        if ( current_top == last_top ) {
            return;
        }

        $fixed_y.each(function() {
            var $original = $(this);
            var margin_top = $original.data('margin-top') || 0;
            var $dummy = dummies[$original.attr("id")];
            var top = parseInt($original.css('top'));

            if ( ! $original.is(":visible") ) { return ; }

            var original_bottom = top + $original.height();

            if ( last_top < current_top ) {
                // scrolling window content up, toward bottom
                var check_top, next_top;
                next_top = check_top = top + ( last_top - current_top );
                if ( ! $original.is(".unlocked") && next_top <= margin_top ) {
                    next_top = margin_top;
                }
                if ( ( next_top >= 0 || $original.is(".unlocked")  ) && next_top < top) {
                    $original.css({ top : next_top });
                }

                // track the bottom; can't use the dummies, need a container
                var f1 = $original.fracs(); var f2 = $bottom.fracs();
                if ( f1.rects.viewport.bottom - f2.rects.viewport.bottom > 0 ) {
                    // console.log("UNLOCKING:", f1.rects.viewport.bottom, f2.rects.viewport.bottom);
                    var delta = f1.rects.viewport.bottom - f2.rects.viewport.bottom;
                    $original.css({ top : check_top });
                    $original.addClass("unlocked");
                }

            } else {

                var next_top = $dummy.offset().top - current_top;
                if ( next_top >= margin_top ) {
                    $original.css({ top : next_top });
                    $original.removeClass("unlocked");
                } else if ( $original.is(".unlocked") ) {
                    next_top = top - ( current_top - last_top );
                    if ( next_top >= margin_top ) {
                        next_top = margin_top;
                        $original.removeClass("unlocked");
                    }
                    $original.css({ top : next_top });
                }

            }

            if ( top <= margin_top  ) {
                $original.addClass("locked");
            } else {
                $original.removeClass("locked");
            }

        })

        $fixed_x.each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr("id")];
            $original.css({ top : $dummy.offset().top - current_top });
            if ( $original.attr("id") == 'header' ) {
                var $menu = $("#menu-toggle");
                if ( $original.fracs().visible < 0.5 ) {
                    if ( ! $menu.length ) {
                        // var $ul = $("#person-nav");
                        // if ( ! $ul.length ) {
                        //     // we are not logged in; bugger.
                        //     $ul = $('<ul id="person-nav" class="nav pull-right"></ul>').appendTo("#navbar-inner");
                        // }

                        // $menu = $("<li><a id='menu-toggle' href='#'><span class='offscreen'>Toggle Header</span><i class='icomoon-reorder'></i></a></li>").appendTo($ul);
                        $menu = $('<div id="menu-toggle"><a href="#"><span class="offscreen">Toggle Header</span><i class="icomoon-reorder"></i></a></div>').appendTo("#navbar-inner");
                        $menu.find("a").click(function(e) {
                            e.preventDefault();
                            handle_drop($(this));
                        })
                    }
                    $menu.show();
                } else {
                    $menu.hide();
                }
            }
        })

        last_top = current_top;
    }

    var handle_resize_fn = function() {
        if ( ! is_fix_active ) { return; }
        var scroll_left = $(window).scrollLeft();
        $fixed_y.each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr("id")];
            var new_left = $dummy.offset().left + scroll_left;
            $original.css({ left : new_left });
        })

        $fixed_x.each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr("id")];
            //$dummy.css({ width : ''  });
            var new_left = $dummy.offset().left + parseInt($dummy.css('margin-left'));;
            //console.log("ER:", $dummy.offset().left, $dummy.width(), $dummy.css('margin-left'));
            // console.log("ER:", $original.offset().left, $dummy.offset().left, scroll_left);
            // $original.css({ left : new_left, xwidth : $dummy.width() });

            var $shadow = $($original.data('shadow'));
            //new_left = ( $(window).width() - $shadow.width() ) / 2;
            var new_left = ( $(window).width() - $shadow.width() ) / 2;
            $original.css({ width : $shadow.width(), left : new_left });
            $dummy.width( $original.outerWidth() );

        })

        var $uber = $(".container.page.centered");
        $uber.removeClass("page");
        setTimeout(function() {
            $uber.addClass("page");
            rebuild_sidebar();
        }, 100);
    }

    var handle_resize =  _.debounce(handle_resize_fn, 250);

    var handle_drop = function($btn) {
        var $header = $("#header");
        if ( $header.is(".dropped") ) {
            var pos = $header.data('pos');
            $header.animate({ top : pos.top }, function() {
                $header.removeClass("dropped");
                $btn.removeClass("active");
            });
        } else {
            var pos = { top : $header.css('top') };
            $header.data('pos', pos);
            $header.addClass("dropped").animate({ top : 40 }, function() { $btn.addClass("active"); });
        }        
    }

    var page_ml = -1;
    var handle_margins = function(force) {

        if ( ! is_fix_active ) {
            return;
        }

        var window_w = $window.width();
        var _get_ml = function($div) {
            var div_w = $div.width();
            return ( window_w / 2 ) - ( div_w / 2 );
        };

        var $page = $(".container.page");
        var $header = $(".header.dummy");

        if ( ! $header.length ) {
            return ; 
        }

        var ml = _get_ml($header);
        if ( _get_ml($page) < ml ) {
            if ( page_ml != ml ) {
                // console.log("SHOULD BE SETTING MARGIN-LEFT", $(".header.dummy").css("margin-left"), ml);
                $page.css('margin-left', ml);
                page_ml = ml;
            }
        } else if ( page_ml > 0) {
            // console.log("SHOULD BE REMOVING MARGIN-LEFT");
            $page.css("margin-left", "");
            page_ml = -1;
        }
        handle_scroll_horizontal();
    }

    $(window).on('scroll', handle_margins);
    $(window).on('scroll', handle_scroll_vertical);
    $(window).on('scroll', handle_scroll_horizontal);

    if ( ! $("html").is(".mobile") ) {
        var $window = get_resize_root();
        $window.on('resize', handle_resize);
    }

    $(window).on('reset', function() {
        setTimeout(function() {
            $fixed.removeClass("locked");
            $(window).scroll();
        }, 100);
    })

})



/* /htapps/roger.babel/pt/web/js/scrolling.js */
// reader.js

var HT = HT || {};
var $body = $("body");

HT.Reader = {
    init: function(options) {
        this.options = $.extend({}, this.options, options);
        // this.view = this._getView(); 
        this.id = this.options.params.id;
        this.imgsrv = Object.create(HT.ImgSrv).init({ 
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
        this.manager = Object.create(HT.Manager).init({
            reader : self,
            id : self.id,
            seq : self.options.params.seq
        })

        this.manager.start();

        if ( this.options.params.ui == 'fullscreen' ) {
            var $btn = $("#action-toggle-fullscreen");
            if ( ! $btn.is(":disabled") ) {
                setTimeout(function() {
                    self._toggleFullScreen($btn);
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
        this.manager.restart();
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

        this._bindAction("toggle.fullscreen", this._toggleFullScreen);

        // don't bind dynamic controls for the static views
        if ( this.getView() == 'image' || this.getView() == 'plaintext' ) {
            // and then disable buttons without links
            $(".toolbar").find("a[href='']").attr("disabled", "disabled").attr('tabindex', '-1');
            $(".action-views").on("click", "a", function() {
                var target = $(this).data('target');
                console.log("SETTING PREFERENCE", target);
                HT.prefs.set({ pt : { view : target } });
            })
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
                seq = self.manager.getSeqForPageNum(value);
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
            var value = self.manager.getPageNumForSeq(seq);
            if ( ! value ) {
                // value = "n" + seq;
                // don't display this for the end user
                value = "";
            }
            $("#input-go-page").val(value);
            self.setCurrentSeq(seq, orig);
        })

        $.subscribe("update.focus.page", function(e, seq) {
            // we define the focus
            self.setCurrentSeq(seq);
            self.updateView("1up");
        });

        $.subscribe("view.ready.reader", function() {
            self._tracking = true;
            $(window).trigger('reset');
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

        $(document).on("webkitfullscreenchange mozfullscreenchange fullscreenchange", function() {
            console.log("FULLSCREEN?", $(document).fullScreen());
            // var $main = $(".main");
            // if ( $(".main").fullScreen() ) {
            //     $main.data('original-width', $main.css('width'));
            //     $main.data('original-height', $main.css('height'));
            //     $main.css({ height: $(window).height() - 50, width : $(window).width() - 50 });

            //     $("#toolbar-horizontal").data('original-top', $("#toolbar-horizontal").css('top'));
            //     $("#toolbar-horizontal").css("top", 50);
            // } else {
            //     $(".main").css({ 
            //         height : $main.data('original-height'),
            //         width : $main.data('original-width')
            //     });
            //     $("#toolbar-horizontal").css('top', $("#toolbar-horizontal").data('original-top'));
            // }
            $.publish("action.toggle.fullscreen");
            $(window).resize();
        })

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
    },

    _toggleFullScreen: function(btn) {

        var $btn = $(btn);
        var $sidebar = $(".sidebar");
        if ( $btn.hasClass("active") ) {
            $(".sidebar.dummy").show("fast", function() {
                $("#sidebar").css("visibility", "hidden") //.show();
                $(window).scroll();
                $("#sidebar").css('visibility', 'visible').show("fast");
                $btn.removeClass("active");
                $btn.find(".icomoon-fullscreen-exit").removeClass("icomoon-fullscreen-exit").addClass("icomoon-fullscreen");
                $.publish("action.toggle.fullscreen");
            })
        } else {
            $(".sidebar").hide( "fast", function() {
                $(window).scroll();
                $btn.addClass("active");
                $btn.find(".icomoon-fullscreen").removeClass("icomoon-fullscreen").addClass("icomoon-fullscreen-exit");
                $.publish("action.toggle.fullscreen");
            })
        }
    },

    _bindAction: function(action, fn) {
        var self = this;
        var id = "#action-" + action.replace(".", "-");
        var $btn = $(id);
        $btn.click(function(e) {
            e.preventDefault();
            if ( fn == null ) {
                $.publish("action." + action, (this));
            } else {
                fn.apply(self, $btn);
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
        this._updateState({ view : view });
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
            window.location.replace(new_hash); // replace blocks the back button!
        }
        this._trackPageview(new_href);
        $.publish("update.reader.state");
    },

    _trackPageview: function(href) {
        if ( this._tracking && HT.analytics && HT.analytics.enabled ) {
            HT.analytics.trackPageview(href);
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

    HT.reader = Object.create(HT.Reader).init({
        params : HT.params
    })

    HT.reader.start();

    $(".toolbar-vertical .btn").each(function() {
        var $btn = $(this);
        var title = $btn.text();
        $btn.tooltip({ title : title, placement : 'left', container : '#main', delay : { show : 250, hide: 50 }, xtrigger : 'hover focus', animation: false })
    })

    $(".toolbar-horizontal .btn").each(function() {
        var $btn = $(this);
        var title = $btn.find(".label").text();
        if ( title ) {
            $btn.tooltip({ title : title, placement : 'top', container : '.toolbar-horizontal', delay : { show : 250, hide: 50 }, xtrigger: 'hover focus', animation : false })
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
    }

})

/* /htapps/roger.babel/pt/web/js/reader.js */
// manager.js

var HT = HT || {};

HT.Manager = {
    init : function(options, callback) {
        this.options = $.extend({}, this.options, options);
        this.data = {};
        self.page_num_map = {};
        self.num_seq_map = {};
        self.seq_num_map = {};

        return this;
    },

    options: {

    },

    start : function() {
        var self = this;

        this.view = Object.create(self.options.reader.getViewModule()).init({
            manager : self,
            reader : self.options.reader
        });

        if ( ! self.view.options.is_dynamic ) {
            self.view.start();
            return;
        }

        var href = this.options.reader.imgsrv.get_action_url("meta", {});
        $.ajaxSetup({ async : false });
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
                self.view.start();
            }, 
            'json')

    },

    restart: function() {
        var self = this;

        self.view.end();
        delete self.view;
        // delete this.options.view;
        self.view = Object.create(self.options.reader.getViewModule()).init({
            manager : self,
            reader : self.options.reader
        });
        self.view.start();
        $(window).trigger('reset');
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
        return this.seq_num_map[seq];
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
            meta = this.data.items[params.seq - 1];
        } else {
            var w = 680; // default w
            var h = w * 1.3;
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

    get_image : function(params) {
        // params : seq, orient, size
        var self = this;
        var meta = this.get_page_meta(params);

        args = { seq : params.seq, id : this.options.id, width : params.width }
        if ( params.height ) {
            args.height = params.height;
        }
        if ( params.orient ) {
            args.orient = params.orient;
        }
        var src = this.options.reader.imgsrv.get_action_url(params.action || 'image', args);
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
        zoom : 1,
        is_dynamic: true
    },

    start : function() {
        $("body").addClass("view-1up"); // needs to correspond to our parameter. MM.
        $.publish("enable.download.page");
        this.options.seq = this.options.reader.getCurrentSeq();
        this.bindEvents();
        this.bindScroll();
        this.drawPages();
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".scroll");
        $.publish("view.end");
        $("#content").empty();
        $(window).unbind(".scroll");
        $("body").unbind(".scroll");
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
            self.gotoPage(self.options.manager.num_pages);
        })

        $.subscribe("action.go.page.scroll", function(e, seq) {
            self.gotoPage(seq);
        })

        $.subscribe("action.zoom.in.scroll", function(e) {
            self.updateZoom(1);
        })

        $.subscribe("action.zoom.out.scroll", function(e) {
            self.updateZoom(-1);
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

            var $content = $("#content");
            var fit_w = $content.width();
            var best_w = -1; var best_zoom = 0;
            for(var i = 0; i < self.zoom_levels.length; i++) {
                var zoom = self.zoom_levels[i];
                if ( self.options.default_w * zoom * 1.2 > fit_w ) {
                    break;
                }
                self.w = self.options.default_w * zoom;
                self.zoom = zoom;
            }

            self.drawPages();
            self._resizing = false;
        }, 250);

        var $e = get_resize_root();
        $e.on('resize.viewer.scroll', _lazyResize);

    },

    updateZoom: function(delta) {
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

        self.zoom = self.zoom_levels[new_index];
        self.w = self.options.default_w * self.zoom;

        self.drawPages();

    },

    rotateCurrentPage: function(delta) {
        var self = this;
        var $current = $(".page-item.current");
        var seq = $current.data('seq');
        var orient = this.getPageOrient(seq);
        this.orient_cache[seq] = orient = ( orient + 1 ) % 4;
        this.drawPages();
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
                current_vp = $current.fracs().visible;
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
                    $visible.push($page);
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
            var $img = this.options.manager.get_image({ seq : seq, width : this.w, orient : this.getPageOrient(seq) });

            var alt_text = "image of " + this.options.manager.getAltTextForSeq(seq);
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

        for(var seq=1; seq <= this.options.manager.num_pages; seq++) {
            var meta = this.options.manager.get_page_meta({ seq : seq, width : self.w, orient : self.getPageOrient(seq) });
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
        }

        // this.gotoPage(1);

    },

    // UTIL

    checkPageStatus: function() {
        var self = this;
        var first = $("#page1").fracs();
        var last = $("#page" + self.options.manager.num_pages).fracs();

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

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/scroll.js */
var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Thumbnail = {

    init : function(options) {
        var self = this;
        this.options = $.extend({}, this.options, options);
        this.w = -1; // this.options.default_w;
        // this.id = HT.generate_id();
        // console.log("THUMB:", this.id);

        return this;
    },

    options: {
        default_w : 150,
        min_w : 75,
        max_w : 250,
        is_dynamic: true
    },

    start : function() {
        $body.addClass("view-thumb");
        // this.options.seq = this.options.reader.getCurrentSeq();
        this.bindEvents();
        this.bindScroll();
        this.calculate();
        this.drawPages();
        $.publish("disable.rotate");
        $.publish("disable.download.page");
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".thumb");
        $.publish("view.end");
        $("#content").empty();
        // $(window).unbind("scroll.viewer.thumb");
        // $(window).unbind("resize.thumb");
        $(window).unbind(".thumb");
        $("body").unbind(".thumb");
        $(window).scrollTop(0);
        $body.removeClass("view-thumb");
        console.log("UNBOUND THUMBNAIL");
    },

    bindEvents: function() {
        var self = this;

        $.subscribe("action.go.first.thumb", function(e) {
            $("html,body").animate({ scrollTop : 0 });
        })

        $.subscribe("action.go.last.thumb", function(e) {
            $("html,body").animate({ scrollTop : $("body").height() - $(window).height() });
        })

        $.subscribe("action.go.next.thumb", function(e) {
            var $body = $("body");
            var $window = $(window);

            var step = $window.height() / 3;
            $("html,body").animate({ scrollTop : $body.scrollTop() + step });
        })

        $.subscribe("action.go.prev.thumb", function(e) {

            var $body = $("body");
            var $window = $(window);

            var step = $window.height() / 3;
            $("html,body").animate({ scrollTop : $body.scrollTop() - step });

        })

        $.subscribe("action.go.page.thumb", function(e, seq) {
            self.gotoPage(seq);
        })

        $.subscribe("action.zoom.in.thumb", function(e) {
            self.updateZoom(1.25);
        })

        $.subscribe("action.zoom.out.thumb", function(e) {
            self.updateZoom(0.8);
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
            if ( self._resizing ) { return ; }
            self._resizing = true;
            self.w = -1;
            self.drawPages();
            self._resizing = false;
        }, 250);

        var $e = get_resize_root();
        $e.on('resize.viewer.thumb', _lazyResize);

    },

    updateZoom: function(factor) {
        var self = this;

        self.w = self.w * factor;
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
    },

    bindScroll: function() {
        var self = this;

        var lazyLayout = _.debounce(function() {

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

    gotoPage: function(seq) {
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
                    var $img = self.options.manager.get_image({ seq : seq, width : self.w, height: h, action : 'thumbnail' });
                    $img.attr("alt", "image of " + self.options.manager.getAltTextForSeq(seq));
                    $a.append($img);
                } else {
                    $page.removeClass("checking");
                }
            })

        };

        timer = setInterval(fn, 500);

    },

    calculate: function() {
        var self = this;
        // find an average h for scaling
        var tmp = {};
        for(var seq=1; seq <= self.options.manager.num_pages; seq++) {
            var meta = self.options.manager.get_page_meta({ seq : seq, width : 680 });
            tmp[meta.height] = ( tmp[meta.height] || 0 ) + 1;
        }
        var n = -1; var idx;
        var heights = _.keys(tmp);
        self.h = heights[0];
        for(var i=0; i < heights.length; i++) {
            var h = heights[i];
            if ( tmp[h] > n ) {
                n = tmp[h];
                self.h = h;
            }
        }
    },

    drawPages : function() {
        var self = this;

        $("#content").empty();
        // self.$container = $("#content");
        self.$container = $('<div class="thumbnails"></div>');

        var total_w = $("#content").width();
        // really, how many thumbnails can we fit at self.w?
        
        if ( self.w < 0 ) {
            // find a size that fits 4 thumbnails across?

            var w = self.options.min_w;
            var best_w = w;
            var factor = 1.25;

            while ( w * 4 < total_w ) {
                best_w = w;
                w *= factor;
            }

            if ( best_w > self.options.max_w ) {
                best_w = self.options.max_w;
            }

            self.w = best_w;

        }


        if ( self.options.manager.reading_order == 'right-to-left' ) {
            self.$container.addClass("rtl");
        }

        var fragment = document.createDocumentFragment();

        for(var seq=1; seq <= self.options.manager.num_pages; seq++) {
            var meta = self.options.manager.get_page_meta({ seq : seq, width : 680 });

            var r = self.w / meta.width;
            // var h = meta.height * r;
            var h = self.h * r;

            var $page = $('<div class="page-item"><div class="page-num">{SEQ}</div><a class="page-link" href="#{SEQ}"></a></div>'.replace(/\{SEQ\}/g, seq)).appendTo($(fragment));
            $page.attr('id', 'page' + seq);
            $page.css({ height : h, width : self.w });
            $page.data('seq', seq);
            $page.data('h', h);
            // $page.addClass("loading");

            // need to bind clicking the thumbnail to open to that page; so wrap in an anchor!!
        }

        // $(fragment).append("<br clear='both' />");
        self.$container.append(fragment);
        $("#content").append(self.$container);
        self.$container.show();

        $(window).scroll();
        var current = self.options.reader.getCurrentSeq();
        if ( current && current > 1 ) {
            self.gotoPage(current);
        }

        $.publish("view.ready");

    },

    // UTIL

    checkPageStatus: function() {
        var self = this;

        var first = $("#page1").fracs();
        var last = $("#page" + self.options.manager.num_pages).fracs();

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

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/thumb.js */
// flip

var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Flip = {

    init : function(options) {
        var self = this;
        this.options = $.extend({}, this.options, options);

        this.w = -1;
        this.zoom = -1;
        this.zoom_levels = [ 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 3.00, 4.00 ];

        this.orient_cache = {};

        this.rotate = 0;

        return this;
    },

    options: {
        default_w : 680,
        zoom : 1,
        is_dynamic: true
    },

    start : function() {
        $("body").addClass("view-2up"); // needs to correspond to our parameter. MM.
        $.publish("enable.download.page");

        this.is_rtl = this.options.manager.reading_order == 'right-to-left';

        this.options.seq = this.options.reader.getCurrentSeq();

        this.bindEvents();
        this.drawPages();
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".flip");
        $.publish("view.end");
        $(window).unbind(".flip");
        $("body").unbind(".flip");
        $("#content").empty();
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
            self.gotoPage(self.is_rtl ? self.options.manager.num_pages : 1);
        })

        $.subscribe("action.go.last.flip", function(e) {
            self.gotoPage(self.is_rtl ? 1 : self.options.manager.num_pages);
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

        $.subscribe("action.rotate.clockwise.flip", function(e) {
            self.rotateBook(1);
        })

        $.subscribe("action.rotate.counterclockwise.flip", function(e) {
            self.rotateBook(-1);
        })

        $.subscribe("action.toggle.fullscreen.flip", function(e) {
            self.w = -1;
            self.drawPages();
        })

        var _lazyResize = _.debounce(function() {
            if ( self._resizing ) { return ; }
            self._resizing = true;
            self.w = -1;
            self.drawPages();
            self._resizing = false;
        }, 250);

        var $e = get_resize_root();
        $e.on('resize.viewer.flip', _lazyResize);

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
    },

    updateZoom: function(delta) {
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

        self.zoom = self.zoom_levels[new_index];
        self.w = self.options.default_w * self.zoom;

        self.drawPages();

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
    },

    getPageOrient: function(seq) {
        return this.orient_cache[seq] || 0;
    },

    gotoPage: function(seq, delta) {
        var self = this;

        if ( seq != null ) {
            var page = self._seq2page(seq);
            self.loadPage(page);
            self.book.jump(page + 1);
        } else {
            if ( delta > 0 ) {
                // self.do_ltr ? self.book.prev() : self.book.next();
                self.book.next();
            } else {
                // self.do_ltr ? self.book.next() : self.book.prev();
                self.book.prev();
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
                // console.log("LOADING", seq, self.w, self.h, $page.width());
                var $img = self.options.manager.get_image({ seq : seq, height: Math.ceil(self.h / 2) });
                $img.attr("alt", "image of " + self.options.manager.getAltTextForSeq(seq));
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

        var page = this.book.current;
        var seq = this._page2seq(page);
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
        if ( self.book ) {
            current = self.book.current ;
            delete self.book;
        }

        $("#content").empty();

        var fit_w = $("#content").width();

        $("#content").append('<div class="bb-custom-wrapper"><div class="bb-bookblock"></div></div>');
        var $container = $(".bb-bookblock");
        self.$container = $container;
        self.$wrapper = $("#content").find(".bb-custom-wrapper");

        // // which size bets fit the content width?
        // var fit = 1.2;
        // fit = 1.0;
        // if ( self.w < 0 ) {
        //     var best_w = -1; var best_zoom = 0;
        //     for(var i = 0; i < self.zoom_levels.length; i++) {
        //         var zoom = self.zoom_levels[i];
        //         // 1.2
        //         if ( self.options.default_w * zoom * fit > fit_w ) {
        //             break;
        //         }
        //         self.w = self.options.default_w * zoom;
        //         self.zoom = zoom;
        //     }

        //     // console.log("STARTUP", self.w, self.zoom);
        // }

        // var meta = self.options.manager.get_page_meta({ seq : 1 });
        // var r = self.w / meta.width;
        // self.h = meta.height * r;
        // var h = self.h / 1.5; // 2;

        // which size fits the content width?
        if ( self.w < 0 ) {
            var best_w = -1; var best_zoom = 0;
            for(var i = 0; i < self.zoom_levels.length; i++) {
                var zoom = self.zoom_levels[i];
                if ( ( self.options.default_w * zoom ) * 2  > ( fit_w * 2 ) ) {
                    break;
                }
                self.w = ( self.options.default_w * zoom ) / 2;
                self.zoom = zoom;
            }
        }

        var meta = self.options.manager.get_page_meta({seq : 1, width : 680 });
        self.h = meta.height * self.zoom;
        var h = self.h / 2;

        console.log("META: ", meta, self.zoom, self.w, self.h);

        self.$wrapper.css({ 'min-width' : self.w + 25 });

        self.$wrapper.height(h); // .width(HT.w);
        $container.height(h);

        // mdpItem will normalize the pages so seq=1 IS THE START OF THE BOOK
        // right-to-left only means we stack the pages in the div differently
        var pages = [];
        var page = [];

        var start_seq = 1;
        var end_seq = self.options.manager.num_pages;
        if ( self.options.manager.has_feature(1, "FRONT_COVER") ) {
            // first page is a cover
            if ( self.options.manager.reading_order == 'right-to-left' ) {
                pages.push([ 1, null ]);
            } else {
                pages.push([ null, 1 ]);
            }
            start_seq = 2;
        }
        var last_page;
        if ( self.options.manager.has_feature(end_seq, "BACK_COVER") ) {
            if ( self.options.manager.reading_order == 'right-to-left' ) {
                last_page = [ null, end_seq ];
            } else {
                last_page = [ end_seq, null ];
            }
            end_seq -= 1;           
        }

        for(var seq = start_seq; seq <= end_seq; seq += 2) {
            if ( self.options.manager.reading_order == 'right-to-left' ) {
                // seq + 1 may not exist?
                pages.push([ seq + 1, seq ]);
            } else {
                pages.push([ seq, seq + 1 ]);
            }
        }

        if ( last_page ) {
            pages.push(last_page);
        }

        if ( self.options.manager.reading_order == 'right-to-left' ) {
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
                html += '<div id="page{SEQ}" class="page-item page-left"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, left_page_seq);
                self._seq2page_map[left_page_seq] = i;
                self._page2seq_map[i][0] = left_page_seq;
            } else {
                html += '<div class="page-item page-left empty"></div>';
            }
            if ( right_page_seq ) {
                html += '<div id="page{SEQ}" class="page-item page-right"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, right_page_seq);
                self._seq2page_map[right_page_seq] = i;
                self._page2seq_map[i][1] = right_page_seq;
                // if ( ! left_page_seq || left_page_seq > right_page_seq ) {
                //     self._page2seq_map[i][1] = right_page_seq;
                // }
            } else {
                html += '<div class="page-item page-right empty"></div>';
            }
            html += '</div>';
            self._attachPageHTML(html);

            $.each([ left_page_seq, right_page_seq ], function() {
                if ( this ) {
                    var meta = self.options.manager.get_page_meta({ seq : this });
                    if ( self.options.manager.has_feature(meta, "UNTYPICAL_PAGE") ) {
                        $("#page" + this).addClass("untypical-page");
                    }
                }
            })

        })

        this.$leafs = $container.find(".bb-item");

        this.book = $container.bookblock( {
                    speed               : 600,
                    shadowSides : 0.8,
                    shadowFlip  : 0.7,
                    perspective: 1300,
                    n : pages.length,
                    onBeforeFlip : function ( page, isLimit ) {
                        $container.addClass("flipping");
                        console.log("PRE FLIP:", page, isLimit);
                        self.$leafs.slice(page,page+1).attr('aria-hidden', 'true');
                        // load images a couple of pages in the future
                    },
                    onEndFlip : function ( page, isLimit ) {
                        console.log("FLIPPED:", page, isLimit);
                        $container.removeClass("flipping");
                        self.$leafs.slice(page,page+1).attr('aria-hidden', 'false');
                        self.loadPage(page - 1);
                        self.loadPage(page - 2);
                        self.loadPage(page + 1);
                        self.loadPage(page + 2);

                        self.unloadPage(page - 8);
                        self.unloadPage(page + 8);

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

        var last_num = self.options.manager.getPageNumForSeq(end_seq);
        if ( ! last_num ) {
            last_num = "n" + end_seq;
        }
        self.options.last_num = last_num;

        self.loadPage(current);
        self.loadPage(current + 1);
        self.loadPage(current - 1);
        // self.loadPage(self._page2seq(current)); self.loadPage(self._page2seq(current) + 1);

        self.book.toggleLayoutSupport();
        self.book.jump(current + 1);
        self.book.toggleLayoutSupport();

        $(window).scroll();

        setTimeout(function() {
            self.buildSlider(pages, current);
            self.checkPageStatus();
        }, 100);

        $container.on('click', '.page-right img', function() {
            // self.book.next();
            self.gotoPage(null, 1);
        }).on('click', '.page-left img', function() {
            // self.book.prev();
            self.gotoPage(null, -1);
        })

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
                var num = self.options.manager.getPageNumForSeq(seq);
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
            console.log("JUMPING TO", value, seq);
            self.gotoPage(seq[0]);
        })
    },

    // UTIL

    checkPageStatus: function() {
        var self = this;

        var page = self.book.current;
        if ( page == 0 ) {
            $.publish("disable.go.first");
        } else {
            $.publish("enable.go.first");
        }

        if ( self.book.end ) {
            $.publish("disable.go.last");
        } else {
            $.publish("enable.go.last");
        }

        self.$slider.slider('setValue', page);

        var seq = self._page2seq(page);

        $.publish("update.go.page", [seq]);

    },

    _page2seq: function(page) {
        return this._page2seq_map[page];
    },

    _seq2page: function(seq) {
        return this._seq2page_map[seq];
    },

    _attachPageHTML: function(html) {
        if ( false && self.options.manager.do_ltr ) {
            $(html).prependTo(this.$container);
        } else {
            $(html).appendTo(this.$container);
        }
    },

    isRTL: function() {
        return self.options.manager.reading_order == 'right-to-left';
    },

    EOT : true

};

/* /htapps/roger.babel/pt/web/js/view/flip.js */
var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.PlainText = {
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
