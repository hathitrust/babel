/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */
/* /htapps/roger.babel/pt/web/vendor/jquery.easing.1.3.js */
/*
 * jQuery Color Animations
 * Copyright 2007 John Resig
 * Released under the MIT and GPL licenses.
 */

(function(jQuery){

    // We override the animation for all of these color styles
    jQuery.each(['backgroundColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'color', 'outlineColor'], function(i,attr){
        jQuery.fx.step[attr] = function(fx){
            if ( !fx.colorInit ) {
                fx.start = getColor( fx.elem, attr );
                fx.end = getRGB( fx.end );
                fx.colorInit = true;
            }

            fx.elem.style[attr] = "rgb(" + [
                Math.max(Math.min( parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0]), 255), 0),
                Math.max(Math.min( parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1]), 255), 0),
                Math.max(Math.min( parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2]), 255), 0)
            ].join(",") + ")";
        }
    });

    // Color Conversion functions from highlightFade
    // By Blair Mitchelmore
    // http://jquery.offput.ca/highlightFade/

    // Parse strings looking for color tuples [255,255,255]
    function getRGB(color) {
        var result;

        // Check if we're already dealing with an array of colors
        if ( color && color.constructor == Array && color.length == 3 )
            return color;

        // Look for rgb(num,num,num)
        if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))
            return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

        // Look for rgb(num%,num%,num%)
        if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))
            return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];

        // Look for #a0b1c2
        if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
            return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];

        // Look for #fff
        if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))
            return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];

        // Look for rgba(0, 0, 0, 0) == transparent in Safari 3
        if (result = /rgba\(0, 0, 0, 0\)/.exec(color))
            return colors['transparent'];

        // Otherwise, we're most likely dealing with a named color
        return colors[jQuery.trim(color).toLowerCase()];
    }

    function getColor(elem, attr) {
        var color;
        
        do {
            color = jQuery.curCSS(elem, attr);

            // Keep going until we find an element that has color, or we hit the body
            if ( color != '' && color != 'transparent' || jQuery.nodeName(elem, "body") )
                break;

            attr = "backgroundColor";
        } while ( elem = elem.parentNode );
        
        if ( ! color ) { 
            color = 'transparent';
        }

        return getRGB(color);
    };

    // Some named colors to work with
    // From Interface by Stefan Petre
    // http://interface.eyecon.ro/

    var colors = {
        aqua:[0,255,255],
        azure:[240,255,255],
        beige:[245,245,220],
        black:[0,0,0],
        blue:[0,0,255],
        brown:[165,42,42],
        cyan:[0,255,255],
        darkblue:[0,0,139],
        darkcyan:[0,139,139],
        darkgrey:[169,169,169],
        darkgreen:[0,100,0],
        darkkhaki:[189,183,107],
        darkmagenta:[139,0,139],
        darkolivegreen:[85,107,47],
        darkorange:[255,140,0],
        darkorchid:[153,50,204],
        darkred:[139,0,0],
        darksalmon:[233,150,122],
        darkviolet:[148,0,211],
        fuchsia:[255,0,255],
        gold:[255,215,0],
        green:[0,128,0],
        indigo:[75,0,130],
        khaki:[240,230,140],
        lightblue:[173,216,230],
        lightcyan:[224,255,255],
        lightgreen:[144,238,144],
        lightgrey:[211,211,211],
        lightpink:[255,182,193],
        lightyellow:[255,255,224],
        lime:[0,255,0],
        magenta:[255,0,255],
        maroon:[128,0,0],
        navy:[0,0,128],
        olive:[128,128,0],
        orange:[255,165,0],
        pink:[255,192,203],
        purple:[128,0,128],
        violet:[128,0,128],
        red:[255,0,0],
        silver:[192,192,192],
        white:[255,255,255],
        yellow:[255,255,0],
        transparent: [255,255,255]
    };

})(jQuery);

/* /htapps/roger.babel/pt/web/vendor/jquery.color.js */
;(function($) {
/**
* Resize inner element to fit the outer element
* @author Some modifications by Alexander Sandstorm
* @author Code based on earlier works by Russ Painter (WebDesign@GeekyMonkey.com)
* @version 0.2
*/
$.fn.textfill = function(options) {

    options = jQuery.extend({
        maxFontSize: null,
        minFontSize: 4,
        step: 1.25,
        sel: null
    }, options);

    return this.each(function() {

        var innerElements = options.sel ? $(this).find(options.sel) : $(this).children(':visible'),
            fontSize = options.maxFontSize || parseInt(innerElements.css("font-size")), // use current font-size by default
            maxHeight = $(this).height(),
            maxWidth = $(this).width(),
            innerHeight,
            innerWidth;
        var $self = $(this);
        
        //console.log("STARTING WITH=", fontSize);
        
        do {

            //innerElements.css('font-size', fontSize + "px");
            $self.css('font-size', fontSize + 'px');

            // use the combined height of all children, eg. multiple <p> elements.
            innerHeight = $.map(innerElements, function(e) {
                return $(e).outerHeight();
            }).reduce(function(p, c) {
                return p + c;
            }, 0);
            
            // innerWidth = innerElements.outerWidth(); // assumes that all inner elements have the same width
            var innerWidth = 0;
            innerElements.each(function() {
                if ( innerWidth < $(this).outerWidth() ) {
                    innerWidth = $(this).outerWidth();
                }
            })
            
            fontSize = fontSize - options.step;
            
            // console.log(innerWidth, innerHeight, "/", maxWidth, maxHeight, "/", fontSize);
            
        } while ((innerHeight > maxHeight || innerWidth > maxWidth) && fontSize > options.minFontSize);
        
        //console.log("SET TO =", fontSize);

        var has_overflow = 0;
        do {
          
            // innerElements.each(function(idx, item) {
            //   var original = item.scrollLeft++;
            //   if ( item.scrollLeft-- > original ) {
            //     has_overflow = 1;
            //   }
            // })

            innerElements.each(function(idx, item) {
                if (item !== undefined) {
                    var $item = $(item);
                    var original = $item.scrollLeft();
                    $item.scrollLeft(original + 1);
                    if ( $item.scrollLeft() > original ) {
                        has_overflow = 1;
                    }
                }
            })
            
            if ( has_overflow ) {
              fontSize = fontSize - options.step;
              //innerElements.css('font-size', fontSize + "px");
              $self.css('font-size', fontSize + 'px');
              has_overflow = 0;
            }
            
        } while (has_overflow);

        // console.log("FIXED TO =", fontSize);
        
        has_overflow = 0;
        var iter = 0;
        var line_height = 1.25;
        
        do {
            
            $self.css('line-height', line_height);
            //innerElements.css('line-height', line_height);
        
            // var original = $self.get(0).scrollTop++;
            // if ( $self.get(0).scrollTop-- > original ) {
            //   has_overflow = 1;
            //   line_height -= 0.25;
            //   $self.css('line-height', line_height);
            // } else {
            //   has_overflow = 0;
            // }

            var original = $self.scrollTop();
            $self.scrollTop(original + 1);
            
            if ( $self.scrollTop() > original ) {
              $self.scrollTop(original);
              has_overflow = 1;
              line_height -= 0.25;
              $self.css('line-height', line_height);
              //innerElements.css('line-height', line_height);
              
            } else {
              has_overflow = 0;
            }
            
            iter += 1;
            if ( iter > 1000 ) {
              // console.log("QUITTING", iter, line_height, has_overflow);
              break;
            }
            
        } while (has_overflow && line_height > 0);
        
        // console.log(innerElements);

    });

};

})(jQuery);

/* /htapps/roger.babel/pt/web/vendor/jquery.textfill.js */
/*
Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.

    BookReader is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    BookReader is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with BookReader.  If not, see <http://www.gnu.org/licenses/>.
    
    The BookReader source is hosted at http://github.com/openlibrary/bookreader/

    archive.org cvs $Revision: 1.2 $ $Date: 2009-06-22 18:42:51 $
*/

// BookReader()
//______________________________________________________________________________
// After you instantiate this object, you must supply the following
// book-specific functions, before calling init().  Some of these functions
// can just be stubs for simple books.
//  - getPageWidth()
//  - getPageHeight()
//  - getPageURI()
//  - getPageSide()
//  - canRotatePage()
//  - getPageNum()
//  - getSpreadIndices()
// You must also add a numLeafs property before calling init().

function BookReader() {
    this.reduce  = 4;
    this.padding = 10;
    this.mode    = 1; //1, 2, 3
    this.ui = 'full'; // UI mode

    // thumbnail mode
    this.thumbWidth = 100; // will be overridden during prepareThumbnailView
    this.thumbRowBuffer = 2; // number of rows to pre-cache out a view
    this.thumbColumns = 6; // default
    this.thumbMaxLoading = 4; // number of thumbnails to load at once
    this.displayedRows=[];
    
    this.displayedIndices = [];
    //this.indicesToDisplay = [];
    this.imgs = {};
    this.prefetchedImgs = {}; //an object with numeric keys cooresponding to page index
    
    this.timer     = null;
    this.animating = false;
    this.auto      = false;
    this.autoTimer = null;
    this.flipSpeed = 'fast';

    this.twoPagePopUp = null;
    this.leafEdgeTmp  = null;
    this.embedPopup = null;
    this.printPopup = null;
    
    this.searchTerm = '';
    this.searchResults = {};
    
    this.firstIndex = null;
    
    this.lastDisplayableIndex2up = null;
    
    // We link to index.php to avoid redirect which breaks back button
    // Should be overriden (before init) by custom implmentations.
    this.logoURL = 'http://www.archive.org/index.php';
    
    // Base URL for UI images - should be overriden (before init) by
    // custom implementations.
    // $$$ This is the same directory as the images referenced by relative
    //     path in the CSS.  Would be better to automagically find that path.
    this.imagesBaseURL = '/bookreader/images/';
    
    // Mode constants
    this.constMode1up = 1;
    this.constMode2up = 2;
    this.constModeThumb = 3;
    
    // Zoom levels
    // $$$ provide finer grained zooming
    this.reductionFactors = [ {reduce: 0.5, autofit: null},
                              {reduce: 1, autofit: null},
                              {reduce: 2, autofit: null},
                              {reduce: 4, autofit: null},
                              {reduce: 8, autofit: null},
                              {reduce: 16, autofit: null} ];

    // Object to hold parameters related to 1up mode
    this.onePage = {
        autofit: 'height'                                     // valid values are height, width, none
    };
    
    // Object to hold parameters related to 2up mode
    this.twoPage = {
        coverInternalPadding: 10, // Width of cover
        coverExternalPadding: 10, // Padding outside of cover
        bookSpineDivWidth: 30,    // Width of book spine  $$$ consider sizing based on book length
        autofit: 'auto'
    };
    
    return this;
};

// init()
//______________________________________________________________________________
BookReader.prototype.init = function() {

    var startIndex = undefined;
    this.pageScale = this.reduce; // preserve current reduce
    
    // Find start index and mode if set in location hash
    var params = this.paramsFromFragment(window.location.hash);
    
    // Sanitize/process parameters

    if ( !this.canSwitchToMode( this.mode ) ) {
        this.mode = this.constMode1up;
    }    
        
    if ('undefined' != typeof(params.index)) {
        startIndex = params.index;
    } else if ('undefined' != typeof(params.page)) {
        startIndex = this.getPageIndex(params.page);
    }

    if ('undefined' == typeof(startIndex)) {
        if ('undefined' != typeof(this.titleLeaf)) {
            // title leaf is known - but only use as default if book has a few pages
            if (this.numLeafs > 2) {
                startIndex = this.leafNumToIndex(this.titleLeaf);
            }
        }
    }
    
    if ('undefined' == typeof(startIndex)) {
        startIndex = 0;
    }
    
    if ('undefined' != typeof(params.mode)) {
        this.mode = params.mode;
    }
    
    // Set document title -- may have already been set in enclosing html for
    // search engine visibility
    document.title = this.shortTitle(50);
    
    $("#BookReader").empty();
        
    this.initToolbar(this.mode, this.ui); // Build inside of toolbar div
    $("#BookReader").append("<div id='BRcontainer'></div>");
    $("#BRcontainer").append("<div id='BRpageview'></div>");

    $("#BRcontainer").bind('scroll', this, function(e) {
        e.data.loadLeafs();
    });
        
    this.setupKeyListeners();
    this.startLocationPolling();

    $(window).bind('resize', this, function(e) {
        //console.log('resize!');
        if (1 == e.data.mode) {
            //console.log('centering 1page view');
            var currentIndex = e.data.currentIndex();
            if (e.data.autofit) {
                e.data.resizePageView();
            }
            e.data.centerPageView();
            $('#BRpageview').empty()
            e.data.displayedIndices = [];
            e.data.updateSearchHilites(); //deletes hilights but does not call remove()            
            e.data.loadLeafs();
            setTimeout(function() {
                e.data.jumpToIndex(currentIndex);                
            }, 500);
        } else if (3 == e.data.mode){
            e.data.prepareThumbnailView();
        } else {
            //console.log('drawing 2 page view');
            
            // We only need to prepare again in autofit (size of spread changes)
            if (e.data.twoPage.autofit) {
                e.data.prepareTwoPageView();
            } else {
                // Re-center if the scrollbars have disappeared
                var center = e.data.twoPageGetViewCenter();
                var doRecenter = false;
                if (e.data.twoPage.totalWidth < $('#BRcontainer').attr('clientWidth')) {
                    center.percentageX = 0.5;
                    doRecenter = true;
                }
                if (e.data.twoPage.totalHeight < $('#BRcontainer').attr('clientHeight')) {
                    center.percentageY = 0.5;
                    doRecenter = true;
                }
                if (doRecenter) {
                    e.data.twoPageCenterView(center.percentageX, center.percentageY);
                }
            }
        }
    });

    //// this event will not persist
    // $('.BRpagediv1up').bind('mousedown', this, function(e) {
    //     // $$$ the purpose of this is to disable selection of the image (makes it turn blue)
    //     //     but this also interferes with right-click.  See https://bugs.edge.launchpad.net/gnubook/+bug/362626
    //     return false;
    // });

    // $$$ refactor this so it's enough to set the first index and call preparePageView
    //     (get rid of mode-specific logic at this point)
    if (1 == this.mode) {
        this.firstIndex = startIndex;
        this.prepareOnePageView();
        this.jumpToIndex(startIndex);
    } else if (3 == this.mode) {
        this.firstIndex = startIndex;
        this.prepareThumbnailView();
        this.jumpToIndex(startIndex);
    } else {
        //this.resizePageView();
        
        this.displayedIndices=[0];
        this.firstIndex = startIndex;
        this.displayedIndices = [this.firstIndex];
        //console.log('titleLeaf: %d', this.titleLeaf);
        //console.log('displayedIndices: %s', this.displayedIndices);
        this.prepareTwoPageView();
    }
        
    // Enact other parts of initial params
    this.updateFromParams(params);
}

BookReader.prototype.setupKeyListeners = function() {
    var self = this;
    
    var KEY_PGUP = 33;
    var KEY_PGDOWN = 34;
    var KEY_END = 35;
    var KEY_HOME = 36;

    var KEY_LEFT = 37;
    var KEY_UP = 38;
    var KEY_RIGHT = 39;
    var KEY_DOWN = 40;

    // We use document here instead of window to avoid a bug in jQuery on IE7
    $(document).keydown(function(e) {
    
        // Keyboard navigation        
        if (!self.keyboardNavigationIsDisabled(e)) {
            switch(e.keyCode) {
                case KEY_PGUP:
                case KEY_UP:            
                    // In 1up mode page scrolling is handled by browser
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.prev();
                    }
                    break;
                case KEY_DOWN:
                case KEY_PGDOWN:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.next();
                    }
                    break;
                case KEY_END:
                    e.preventDefault();
                    self.last();
                    break;
                case KEY_HOME:
                    e.preventDefault();
                    self.first();
                    break;
                case KEY_LEFT:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.left();
                    }
                    break;
                case KEY_RIGHT:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.right();
                    }
                    break;
            }
        }
    });
}

// drawLeafs()
//______________________________________________________________________________
BookReader.prototype.drawLeafs = function() {
    if (1 == this.mode) {
        this.drawLeafsOnePage();
    } else if (3 == this.mode) {
        this.drawLeafsThumbnail();
    } else {
        this.drawLeafsTwoPage();
    }
    
}

// bindGestures(jElement)
//______________________________________________________________________________
BookReader.prototype.bindGestures = function(jElement) {

    jElement.unbind('gesturechange').bind('gesturechange', function(e) {
        e.preventDefault();
        if (e.originalEvent.scale > 1.5) {
            br.zoom(1);
        } else if (e.originalEvent.scale < 0.6) {
            br.zoom(-1);
        }
    });
        
}

BookReader.prototype.setClickHandler2UP = function( element, data, handler) {
    //console.log('setting handler');
    //console.log(element.tagName);
    
    $(element).unbind('tap').bind('tap', data, function(e) {
        handler(e);
    });
}

// drawLeafsOnePage()
//______________________________________________________________________________
BookReader.prototype.drawLeafsOnePage = function() {
    //alert('drawing leafs!');
    this.timer = null;

    var scrollTop = $('#BRcontainer').attr('scrollTop');
    var scrollBottom = scrollTop + $('#BRcontainer').height();
    
    var indicesToDisplay = [];
    var portionVisible = {};
    
    var i;
    var leafTop = 0;
    var leafBottom = 0;
    for (i=0; i<this.numLeafs; i++) {
        var height  = parseInt(this._getPageHeight(i)/this.reduce); 
    
        leafBottom += height;
        // console.log('leafTop = '+leafTop+ ' pageH = ' + this.pageH[i] + 'leafTop>=scrollTop=' + (leafTop>=scrollTop));
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        // console.log('LEAF', i, scrollTop, leafTop, height, topInView, bottomInView, middleInView);
        if (topInView | bottomInView | middleInView) {
            //console.log('displayed: ' + this.displayedIndices);
            //console.log('to display: ' + i);
            indicesToDisplay.push(i);
            if ( leafTop <= scrollTop ) {
              // leaf is scrolling off
              portionVisible[i] = (height - ( scrollTop - leafTop )) / height;
            } else if ( leafBottom >= scrollBottom ) {
              portionVisible[i] = (height - ( leafBottom - scrollBottom )) / height;
            } else {
              portionVisible[i] = 1;
            }
        }
        leafTop += height +10;      
        leafBottom += 10;
    }
    
    var firstIndexToDraw  = indicesToDisplay[0];
    this.firstIndex      = firstIndexToDraw;
    
    // var now = new Date;
    // console.log(now.getSeconds(), "SET CURRENT INDEX", this.firstIndex, indicesToDisplay.join("/"));
    
    for(i=0; i < indicesToDisplay.length; i++) {
      var index = indicesToDisplay[i];
      if (portionVisible[index] > portionVisible[this.firstIndex] && portionVisible[this.firstIndex] < 0.4) {
        this.firstIndex = index;
        if ( this.firstIndex != this.lastUpdatedIndex ) {
          this.lastUpdatedIndex = this.firstIndex;
        }
      }
    }
    
    // Update hash, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedIndices.length > 0) {
        this.updateLocationHash();
    }

    if ((0 != firstIndexToDraw) && (1 < this.reduce)) {
        firstIndexToDraw--;
        indicesToDisplay.unshift(firstIndexToDraw);
    }
    
    var lastIndexToDraw = indicesToDisplay[indicesToDisplay.length-1];
    if ( ((this.numLeafs-1) != lastIndexToDraw) && (1 < this.reduce) ) {
        indicesToDisplay.push(lastIndexToDraw+1);
    }
    
    //var viewWidth = $('#BRpageview').width(); //includes scroll bar width
    var viewWidth = $('#BRcontainer').attr('scrollWidth');

    leafTop = 0;
    var i;
    for (i=0; i<firstIndexToDraw; i++) {
      var height = this._getPageHeight(i) / this.reduce;
      var width = this._getPageWidth(i) / this.reduce;
      if ( viewWidth < width ) {
        var r = ( viewWidth - 20 ) / width;
        width = ( viewWidth - 20 );
        height = Math.floor(height * r);
      }
        // leafTop += parseInt(this._getPageHeight(i)/this.reduce) +10;
        leafTop += height + 10;
    }

    this.onePage.firstIndexToDraw = firstIndexToDraw;


    for (i=0; i<indicesToDisplay.length; i++) {
        var index = indicesToDisplay[i];    
        var height  = parseInt(this._getPageHeight(index)/this.reduce); 
        var width   = parseInt(this._getPageWidth(index)/this.reduce); 

        if ( viewWidth < width ) {
          var r = ( viewWidth - 20 ) / width;
          width = ( viewWidth - 20 );
          height = Math.floor(height * r);
        }

        if (BookReader.util.notInArray(indicesToDisplay[i], this.displayedIndices)) {            
            //console.log("displaying leaf " + indicesToDisplay[i] + ' leafTop=' +leafTop);
            var div = document.createElement("div");
            div.className = 'BRpagediv1up';
            div.id = 'pagediv'+index;
            div.style.position = "absolute";
            $(div).css('top', leafTop + 'px');
            var left = (viewWidth-width)>>1;
            if (left<0) left = 0;
            $(div).css('left', left+'px');
            $(div).css('width', width+'px');
            $(div).css('height', height+'px');
            //$(div).text('loading...');
            
            $('#BRpageview').append(div);
            $.data(div, 'index', index);

            var img = this.createContentElement(index, this.reduce, width, height);
            // $(img).css('width', width+'px');
            // $(img).css('height', height+'px');
            $(div).append(img);
            
            // $('<div class="debugIndex">' + index + '</div>').appendTo(div);

            // var img = document.createElement("img");
            // img.src = this._getPageURI(index, this.reduce, 0);
            // $(img).css('width', width+'px');
            // $(img).css('height', height+'px');
            // $(div).append(img);
            
        } else {
            //console.log("not displaying " + indicesToDisplay[i] + ' score=' + jQuery.inArray(indicesToDisplay[i], this.displayedIndices));            
            var $pagediv = $("#pagediv" + index);
            if ( $pagediv.has('.choked').length ) {
              var img = this.createContentElement(index, this.reduce, width, height);
              $(img).replaceAll($pagediv.find(".choked"));
            }
        }

        leafTop += height +10;

    }
    
    for (i=0; i<this.displayedIndices.length; i++) {
        if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
            var index = this.displayedIndices[i];
            //console.log('Removing leaf ' + index);
            //console.log('id='+'#pagediv'+index+ ' top = ' +$('#pagediv'+index).css('top'));
            $('#pagediv'+index).remove();
        } else {
            //console.log('NOT Removing leaf ' + this.displayedIndices[i]);
        }
    }
    
    this.displayedIndices = indicesToDisplay.slice();
    this.updateSearchHilites();
    
    if (null != this.getPageNum(firstIndexToDraw))  {
        this.updatePageNumBox();
        // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }
            
    this.updateToolbarZoom(this.reduce);
    
}

// drawLeafsThumbnail()
//______________________________________________________________________________
// If seekIndex is defined, the view will be drawn with that page visible (without any
// animated scrolling)
BookReader.prototype.drawLeafsThumbnail = function( seekIndex ) {
    //alert('drawing leafs!');
    this.timer = null;
    
    var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer

    //console.log('top=' + scrollTop + ' bottom='+scrollBottom);

    var i;
    var leafWidth;
    var leafHeight;
    var rightPos = 0;
    var bottomPos = 0;
    var maxRight = 0;
    var currentRow = 0;
    var leafIndex = 0;
    var leafMap = [];
    
    var self = this;
    
    // Will be set to top of requested seek index, if set
    var seekTop;

    // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
    for (i=0; i<this.numLeafs; i++) {
        leafWidth = this.thumbWidth;
        if (rightPos + (leafWidth + this.padding) > viewWidth){
            currentRow++;
            rightPos = 0;
            leafIndex = 0;
        }

        if (leafMap[currentRow]===undefined) { leafMap[currentRow] = {}; }
        if (leafMap[currentRow].leafs===undefined) {
            leafMap[currentRow].leafs = [];
            leafMap[currentRow].height = 0;
            leafMap[currentRow].top = 0;
        }
        leafMap[currentRow].leafs[leafIndex] = {};
        leafMap[currentRow].leafs[leafIndex].num = i;
        leafMap[currentRow].leafs[leafIndex].left = rightPos;

        leafHeight = parseInt((this.getPageHeight(leafMap[currentRow].leafs[leafIndex].num)*this.thumbWidth)/this.getPageWidth(leafMap[currentRow].leafs[leafIndex].num), 10);
        if (leafHeight > leafMap[currentRow].height) {
            leafMap[currentRow].height = leafHeight;
        }
        if (leafIndex===0) { bottomPos += this.padding + leafMap[currentRow].height; }
        rightPos += leafWidth + this.padding;
        if (rightPos > maxRight) { maxRight = rightPos; }
        leafIndex++;
        
        if (i == seekIndex) {
            seekTop = bottomPos - this.padding - leafMap[currentRow].height;
        }
    }

    // reset the bottom position based on thumbnails
    $('#BRpageview').height(bottomPos);

    var pageViewBuffer = Math.floor(($('#BRcontainer').attr('scrollWidth') - maxRight) / 2) - 14;

    // If seekTop is defined, seeking was requested and target found
    if (typeof(seekTop) != 'undefined') {
        $('#BRcontainer').scrollTop( seekTop );
    }
        
    var scrollTop = $('#BRcontainer').attr('scrollTop');
    var scrollBottom = scrollTop + $('#BRcontainer').height();

    var leafTop = 0;
    var leafBottom = 0;
    var rowsToDisplay = [];

    // Visible leafs with least/greatest index
    var leastVisible = this.numLeafs - 1;
    var mostVisible = 0;
    
    // Determine the thumbnails in view
    for (i=0; i<leafMap.length; i++) {
        leafBottom += this.padding + leafMap[i].height;
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        if (topInView | bottomInView | middleInView) {
            //console.log('row to display: ' + j);
            rowsToDisplay.push(i);
            if (leafMap[i].leafs[0].num < leastVisible) {
                leastVisible = leafMap[i].leafs[0].num;
            }
            if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
                mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
            }
        }
        if (leafTop > leafMap[i].top) { leafMap[i].top = leafTop; }
        leafTop = leafBottom;
    }

    // create a buffer of preloaded rows before and after the visible rows
    var firstRow = rowsToDisplay[0];
    var lastRow = rowsToDisplay[rowsToDisplay.length-1];
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (lastRow+i < leafMap.length) { rowsToDisplay.push(lastRow+i); }
    }
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (firstRow-i >= 0) { rowsToDisplay.push(firstRow-i); }
    }

    // Create the thumbnail divs and images (lazy loaded)
    var j;
    var row;
    var left;
    var index;
    var div;
    var link;
    var img;
    var page;
    for (i=0; i<rowsToDisplay.length; i++) {
        if (BookReader.util.notInArray(rowsToDisplay[i], this.displayedRows)) {    
            row = rowsToDisplay[i];

            for (j=0; j<leafMap[row].leafs.length; j++) {
                index = j;
                leaf = leafMap[row].leafs[j].num;

                leafWidth = this.thumbWidth;
                leafHeight = parseInt((this.getPageHeight(leaf)*this.thumbWidth)/this.getPageWidth(leaf), 10);
                leafTop = leafMap[row].top;
                left = leafMap[row].leafs[index].left + pageViewBuffer;
                if ('rl' == this.pageProgression){
                    left = viewWidth - leafWidth - left;
                }

                div = document.createElement("div");
                div.id = 'pagediv'+leaf;
                div.style.position = "absolute";
                div.className = "BRpagedivthumb";

                left += this.padding;
                $(div).css('top', leafTop + 'px');
                $(div).css('left', left+'px');
                $(div).css('width', leafWidth+'px');
                $(div).css('height', leafHeight+'px');
                //$(div).text('loading...');

                // link to page in single page mode
                link = document.createElement("a");
                $(link).data('leaf', leaf);
                $(link).bind('tap', function(event) {
                    self.firstIndex = $(this).data('leaf');
                    self.switchMode(self.constMode1up);
                    event.preventDefault();
                });
                
                // $$$ we don't actually go to this URL (click is handled in handler above)
                var title = "image of page " + this.getPageNum(leaf);
                link.href = '#page/' + (this.getPageNum(leaf)) +'/mode/1up' ;
                $(link).attr({ title : title });
                $(div).append(link);
                
                $('#BRpageview').append(div);

                img = document.createElement("img");
                var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);
                // UM
                $(img).attr({'src' : this.imagesBaseURL + 'transparent.png', title : title, alt : title})
                    .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                    .addClass('BRlazyload')
                    // Store the URL of the image that will replace this one
                    .data('srcURL',  this._getPageURI(leaf, thumbReduce));
                $(link).append(img);
                //console.log('displaying thumbnail: ' + leaf);
            }   
        }
    }
    
    // Remove thumbnails that are not to be displayed
    var k;
    for (i=0; i<this.displayedRows.length; i++) {
        if (BookReader.util.notInArray(this.displayedRows[i], rowsToDisplay)) {
            row = this.displayedRows[i];
            
            // $$$ Safari doesn't like the comprehension
            //var rowLeafs =  [leaf.num for each (leaf in leafMap[row].leafs)];
            //console.log('Removing row ' + row + ' ' + rowLeafs);
            
            for (k=0; k<leafMap[row].leafs.length; k++) {
                index = leafMap[row].leafs[k].num;
                //console.log('Removing leaf ' + index);
                $('#pagediv'+index).remove();
            }
        } else {
            /*
            var mRow = this.displayedRows[i];
            var mLeafs = '[' +  [leaf.num for each (leaf in leafMap[mRow].leafs)] + ']';
            console.log('NOT Removing row ' + mRow + ' ' + mLeafs);
            */
        }
    }
    
    // Update which page is considered current to make sure a visible page is the current one
    var currentIndex = this.currentIndex();
    // console.log('current ' + currentIndex);
    // console.log('least visible ' + leastVisible + ' most visible ' + mostVisible);
    if (currentIndex < leastVisible) {
        this.setCurrentIndex(leastVisible);
    } else if (currentIndex > mostVisible) {
        this.setCurrentIndex(mostVisible);
    }

    this.displayedRows = rowsToDisplay.slice();
    
    // Update hash, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedRows.length > 0) {
        this.updateLocationHash();
    }

    // remove previous highlights
    $('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');
    
    // highlight current page
    $('#pagediv'+this.currentIndex()).addClass('BRpagedivthumb_highlight');
    
    this.lazyLoadThumbnails();

    // Update page number box.  $$$ refactor to function
    if (null !== this.getPageNum(this.currentIndex()))  {
        $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }

    this.updateToolbarZoom(this.reduce); 
}

BookReader.prototype.lazyLoadThumbnails = function(ts) {

    // console.log('lazy load');

    // We check the complete property since load may not be fired if loading from the cache
    $('.BRlazyloading').filter('[complete=true]').removeClass('BRlazyloading');

    var loading = $('.BRlazyloading').length;
    var toLoad = this.thumbMaxLoading - loading;

    // console.log('  ' + loading + ' thumbnails loading');
    // console.log('  this.thumbMaxLoading ' + this.thumbMaxLoading);
    
    var self = this;
    if ( self.load_counter == null ) {
      self.load_counter = 0;
    }
        
    if (toLoad > 0) {
      self.load_counter += 1;
      var now = new Date();
      var delta = now.getTime() - ts;
      var stamp = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
        // $$$ TODO load those near top (but not beyond) page view first
        var self = this;
        $('#BRpageview img.BRlazyload').filter(':lt(' + toLoad + ')').each( function() {
          //console.log("THUMBNAIL:", self.load_counter, ":", stamp.join(":"), delta, ":", loading, "/", toLoad, "<", self.thumbMaxLoading);
            self.lazyLoadImage(this);
        });
    }
}

BookReader.prototype.lazyLoadImage = function (dummyImage) {
    //console.log(' lazy load started for ' + $(dummyImage).data('srcURL').match('([0-9]{4}).jp2')[1] );
        
    var img = new Image();
    img.dummyImage = dummyImage;
    var self = this;
    
    $(dummyImage).removeClass("BRlazyload"); // since it's not being immediately removed
    $(img)
        .addClass('BRlazyloading')
        .one('load', function() {
            //if (console) { console.log(' onload ' + $(this).attr('src').match('([0-9]{4}).jp2')[1]); };
            
            $(this).removeClass('BRlazyloading');
            
            // roger
            var $dummyImage = $(this.dummyImage);
            this.dummyImage = null;
            if ( ! $dummyImage.length ) {
              // original image has vanished from DOM; bail
              return;
            }

            var height = $dummyImage.height();
            var width = $dummyImage.width();
            var index = $dummyImage.data('index');
            var reduce = $dummyImage.data('reduce');
            var target_height = height;
            var target_width = width;
            
            var fudged = false;
            if ( this.height == HT.config.CHOKE_DIM && this.width == HT.config.CHOKE_DIM ) {
              $(this).addClass("choked");
              HT.monitor.run(this.src);
            } else {
              
              if ( self.hasPageFeature(index, "FUDGED") ) {
                var slice = self.sliceFromIndex(index);
                var true_height = this.height * reduce;
                var true_width = this.width * reduce;
                self.bookData[slice.slice]['height'][slice.index] = true_height;
                self.bookData[slice.slice]['width'][slice.index] = true_width;
                self.removePageFeature(index, 'FUDGED');
                target_height = this.height;
                target_width = this.width;
                fudged = true;
              }
              
            }
            
            $(this).attr({ width : width, height : height });
            $dummyImage.before(this).remove();
            
            if ( fudged ) {
              var r = width / target_width;
              var original_height = target_height;
              var original_width = target_width;
              target_width = width;
              target_height = target_height * r;
              var squished = false;
              if ( target_height > height ) {
                // target_height = height;
                squished = true;
              }
              $(this).parents(".BRpagedivthumb").andSelf().addClass("squished").animate({ height : target_height, width : target_width }, "fast");
            }
            
            // $$$ Calling lazyLoadThumbnails here was causing stack overflow on IE so
            //     we call the function after a slight delay.  Also the img.complete property
            //     is not yet set in IE8 inside this onload handler
            var now = (new Date()).getTime();
            setTimeout(function() { self.lazyLoadThumbnails(now); }, self.lazyDelay);
        })
        .one('error', function() {
            // Remove class so we no longer count as loading
            $(this).removeClass('BRlazyloading');
        })
        .attr( { 
                   // width: $(dummyImage).width(),
                   // height: $(dummyImage).height(),
                   src: $(dummyImage).data('srcURL'),
                   //title : $(dummyImage).attr('title'), // UM
                   alt : $(dummyImage).attr('alt')
        });
                 
    // replace with the new img
    // // $(dummyImage).before(img).remove();
    
    img = null; // tidy up closure
}


// drawLeafsTwoPage()
//______________________________________________________________________________
BookReader.prototype.drawLeafsTwoPage = function() {
    var scrollTop = $('#BRtwopageview').attr('scrollTop');
    var scrollBottom = scrollTop + $('#BRtwopageview').height();
    
    // $$$ we should use calculated values in this.twoPage (recalc if necessary)
    
    var indexL = this.twoPage.currentIndexL;
        
    var heightL  = this._getPageHeight(indexL); 
    var widthL   = this._getPageWidth(indexL);

    var leafEdgeWidthL = this.leafEdgeWidth(indexL);
    var leafEdgeWidthR = this.twoPage.edgeWidth - leafEdgeWidthL;
    //var bookCoverDivWidth = this.twoPage.width*2 + 20 + this.twoPage.edgeWidth; // $$$ hardcoded cover width
    var bookCoverDivWidth = this.twoPage.bookCoverDivWidth;
    //console.log(leafEdgeWidthL);

    var middle = this.twoPage.middle; // $$$ getter instead?
    var top = this.twoPageTop();
    var bookCoverDivLeft = this.twoPage.bookCoverDivLeft;

    this.twoPage.scaledWL = this.getPageWidth2UP(indexL);
    this.twoPage.gutter = this.twoPageGutter();
            
    this.prefetchImg(indexL);
    $(this.prefetchedImgs[indexL]).css({
        position: 'absolute',
        left: this.twoPage.gutter-this.twoPage.scaledWL+'px',
        right: '',
        top:    top+'px',
        height: this.twoPage.height +'px', // $$$ height forced the same for both pages
        width:  this.twoPage.scaledWL + 'px',
        borderRight: '1px solid black',
        zIndex: 2
    }).appendTo('#BRtwopageview');
    
    var indexR = this.twoPage.currentIndexR;
    var heightR  = this._getPageHeight(indexR); 
    var widthR   = this._getPageWidth(indexR);

    // $$$ should use getwidth2up?
    //var scaledWR = this.twoPage.height*widthR/heightR;
    this.twoPage.scaledWR = this.getPageWidth2UP(indexR);
    this.prefetchImg(indexR);
    $(this.prefetchedImgs[indexR]).css({
        position: 'absolute',
        left:   this.twoPage.gutter+'px',
        right: '',
        top:    top+'px',
        height: this.twoPage.height + 'px', // $$$ height forced the same for both pages
        width:  this.twoPage.scaledWR + 'px',
        borderLeft: '1px solid black',
        zIndex: 2
    }).appendTo('#BRtwopageview');
        

    this.displayedIndices = [this.twoPage.currentIndexL, this.twoPage.currentIndexR];
    this.setMouseHandlers2UP();
    this.twoPageSetCursor();

    this.updatePageNumBox2UP();
    this.updateToolbarZoom(this.reduce);
    
    // this.twoPagePlaceFlipAreas();  // No longer used

}

// updatePageNumBox2UP
//______________________________________________________________________________
BookReader.prototype.updatePageNumBox2UP = function() {
    if (null != this.getPageNum(this.twoPage.currentIndexL))  {
        this.updatePageNumBox();
        // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }
    this.updateLocationHash();
}

// loadLeafs()
//______________________________________________________________________________
BookReader.prototype.loadLeafs = function() {


    var self = this;
    if (null == this.timer) {
        this.timer=setTimeout(function(){self.drawLeafs()},250);
    } else {
        clearTimeout(this.timer);
        this.timer=setTimeout(function(){self.drawLeafs()},250);    
    }
}

// zoom(direction)
//
// Pass 1 to zoom in, anything else to zoom out
//______________________________________________________________________________
BookReader.prototype.zoom = function(direction) {
    switch (this.mode) {
        case this.constMode1up:
            if (direction == 1) {
                // XXX other cases
                return this.zoom1up('in');
            } else {
                return this.zoom1up('out');
            }
            
        case this.constMode2up:
            if (direction == 1) {
                // XXX other cases
                return this.zoom2up('in');
            } else { 
                return this.zoom2up('out');
            }
            
        case this.constModeThumb:
            // XXX update zoomThumb for named directions
            return this.zoomThumb(direction);
            
    }
}

// zoom1up(dir)
//______________________________________________________________________________
BookReader.prototype.zoom1up = function(direction) {

    if (2 == this.mode) {     //can only zoom in 1-page mode
        this.switchMode(1);
        return;
    }
    
    var reduceFactor = this.nextReduce(this.reduce, direction, this.onePage.reductionFactors);
    
    if (this.reduce == reduceFactor.reduce) {
        // Already at this level
        return;
    }
    
    this.reduce = reduceFactor.reduce; // $$$ incorporate into function
    this.onePage.autofit = reduceFactor.autofit;
        
    this.pageScale = this.reduce; // preserve current reduce
    
    var currentIndex = this.currentIndex();

    $('#BRpageview').empty()
    this.resizePageView();
    this.displayedIndices = [];
    this.loadLeafs();
    
    this.updateToolbarZoom(this.reduce);
    
    // Recalculate search hilites
    this.removeSearchHilites(); 
    this.updateSearchHilites();
    
    this.jumpToIndex(currentIndex);

}

// resizePageView()
//______________________________________________________________________________
BookReader.prototype.resizePageView = function() {

    // $$$ This code assumes 1up mode
    //     e.g. does not preserve position in thumbnail mode
    //     See http://bugs.launchpad.net/bookreader/+bug/552972
    
    switch (this.mode) {
        case this.constMode1up:
        case this.constMode2up:
            this.resizePageView1up();
            break;
        case this.constModeThumb:
            this.prepareThumbnailView( this.currentIndex() );
            break;
        default:
            alert('Resize not implemented for this mode');
    }
}

BookReader.prototype.resizePageView1up = function() {
    var i;
    var viewHeight = 0;
    //var viewWidth  = $('#BRcontainer').width(); //includes scrollBar
    var viewWidth  = $('#BRcontainer').attr('clientWidth');   

    var oldScrollTop  = $('#BRcontainer').attr('scrollTop');
    var oldScrollLeft = $('#BRcontainer').attr('scrollLeft');
    var oldPageViewHeight = $('#BRpageview').height();
    var oldPageViewWidth = $('#BRpageview').width();
    
    var oldCenterY = this.centerY1up();
    var oldCenterX = this.centerX1up();
    
    if (0 != oldPageViewHeight) {
        var scrollRatio = oldCenterY / oldPageViewHeight;
    } else {
        var scrollRatio = 0;
    }
    
    // Recalculate 1up reduction factors
    this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'),
                                           $('#BRcontainer').attr('clientHeight') );                                        
    // Update current reduce (if in autofit)
    if (this.onePage.autofit) {
        var reductionFactor = this.nextReduce(this.reduce, this.onePage.autofit, this.onePage.reductionFactors);
        this.reduce = reductionFactor.reduce;
    }
    
    for (i=0; i<this.numLeafs; i++) {
        viewHeight += parseInt(this._getPageHeight(i)/this.reduce) + this.padding; 
        var width = parseInt(this._getPageWidth(i)/this.reduce);
        if (width>viewWidth) viewWidth=width;
    }
    $('#BRpageview').height(viewHeight);
    $('#BRpageview').width(viewWidth);

    var newCenterY = scrollRatio*viewHeight;
    var newTop = Math.max(0, Math.floor( newCenterY - $('#BRcontainer').height()/2 ));
    $('#BRcontainer').attr('scrollTop', newTop);
    
    // We use clientWidth here to avoid miscalculating due to scroll bar
    var newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    var newLeft = newCenterX - $('#BRcontainer').attr('clientWidth') / 2;
    newLeft = Math.max(newLeft, 0);
    $('#BRcontainer').attr('scrollLeft', newLeft);
    //console.log('oldCenterX ' + oldCenterX + ' newCenterX ' + newCenterX + ' newLeft ' + newLeft);
    
    //this.centerPageView();
    this.loadLeafs();
        
    this.removeSearchHilites();
    this.updateSearchHilites();
}


// centerX1up()
//______________________________________________________________________________
// Returns the current offset of the viewport center in scaled document coordinates.
BookReader.prototype.centerX1up = function() {
    var centerX;
    if ($('#BRpageview').width() < $('#BRcontainer').attr('clientWidth')) { // fully shown
        centerX = $('#BRpageview').width();
    } else {
        centerX = $('#BRcontainer').attr('scrollLeft') + $('#BRcontainer').attr('clientWidth') / 2;
    }
    centerX = Math.floor(centerX);
    return centerX;
}

// centerY1up()
//______________________________________________________________________________
// Returns the current offset of the viewport center in scaled document coordinates.
BookReader.prototype.centerY1up = function() {
    var centerY = $('#BRcontainer').attr('scrollTop') + $('#BRcontainer').height() / 2;
    return Math.floor(centerY);
}

// centerPageView()
//______________________________________________________________________________
BookReader.prototype.centerPageView = function() {

    var scrollWidth  = $('#BRcontainer').attr('scrollWidth');
    var clientWidth  =  $('#BRcontainer').attr('clientWidth');
    //console.log('sW='+scrollWidth+' cW='+clientWidth);
    if (scrollWidth > clientWidth) {
        $('#BRcontainer').attr('scrollLeft', (scrollWidth-clientWidth)/2);
    }

}

// zoom2up(direction)
//______________________________________________________________________________
BookReader.prototype.zoom2up = function(direction) {

    // Hard stop autoplay
    this.stopFlipAnimations();
    
    // Recalculate autofit factors
    this.twoPageCalculateReductionFactors();
    
    // Get new zoom state
    var reductionFactor = this.nextReduce(this.reduce, direction, this.twoPage.reductionFactors);
    if ((this.reduce == reductionFactor.reduce) && (this.twoPage.autofit == reductionFactor.autofit)) {
        // Same zoom
        return;
    }
    this.twoPage.autofit = reductionFactor.autofit;
    this.reduce = reductionFactor.reduce;
    this.pageScale = this.reduce; // preserve current reduce

    // Preserve view center position
    var oldCenter = this.twoPageGetViewCenter();
    
    // If zooming in, reload imgs.  DOM elements will be removed by prepareTwoPageView
    // $$$ An improvement would be to use the low res image until the larger one is loaded.
    if (1 == direction) {
        for (var img in this.prefetchedImgs) {
            delete this.prefetchedImgs[img];
        }
    }
    
    // Prepare view with new center to minimize visual glitches
    this.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);
}

BookReader.prototype.zoomThumb = function(direction) {
    var oldColumns = this.thumbColumns;
    switch (direction) {
        case -1:
            this.thumbColumns += 1;
            break;
        case 1:
            this.thumbColumns -= 1;
            break;
    }
    
    // clamp
    if (this.thumbColumns < 2) {
        this.thumbColumns = 2;
    } else if (this.thumbColumns > 8) {
        this.thumbColumns = 8;
    }
    
    if (this.thumbColumns != oldColumns) {
        this.prepareThumbnailView();
    }
}

// Returns the width per thumbnail to display the requested number of columns
// Note: #BRpageview must already exist since its width is used to calculate the
//       thumbnail width
BookReader.prototype.getThumbnailWidth = function(thumbnailColumns) {
    var padding = (thumbnailColumns + 1) * this.padding;
    var width = ($('#BRpageview').width() - padding) / (thumbnailColumns + 0.5); // extra 0.5 is for some space at sides
    return parseInt(width);
}

// quantizeReduce(reduce)
//______________________________________________________________________________
// Quantizes the given reduction factor to closest power of two from set from 12.5% to 200%
BookReader.prototype.quantizeReduce = function(reduce, reductionFactors) {
    var quantized = reductionFactors[0].reduce;
    var distance = Math.abs(reduce - quantized);
    for (var i = 1; i < reductionFactors.length; i++) {
        newDistance = Math.abs(reduce - reductionFactors[i].reduce);
        if (newDistance < distance) {
            distance = newDistance;
            quantized = reductionFactors[i].reduce;
        }
    }
    
    return quantized;
}

// reductionFactors should be array of sorted reduction factors
// e.g. [ {reduce: 0.25, autofit: null}, {reduce: 0.3, autofit: 'width'}, {reduce: 1, autofit: null} ]
BookReader.prototype.nextReduce = function( currentReduce, direction, reductionFactors ) {

    // XXX add 'closest', to replace quantize function
    
    if (direction == 'in') {
        var newReduceIndex = 0;
    
        for (var i = 1; i < reductionFactors.length; i++) {
            if (reductionFactors[i].reduce < currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];
        
    } else if (direction == 'out') { // zoom out
        var lastIndex = reductionFactors.length - 1;
        var newReduceIndex = lastIndex;
        
        for (var i = lastIndex; i >= 0; i--) {
            if (reductionFactors[i].reduce > currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];
    }
    
    // Asked for specific autofit mode
    for (var i = 0; i < reductionFactors.length; i++) {
        if (reductionFactors[i].autofit == direction) {
            return reductionFactors[i];
        }
    }
    
    alert('Could not find reduction factor for direction ' + direction);
    return reductionFactors[0];

}

BookReader.prototype._reduceSort = function(a, b) {
    return a.reduce - b.reduce;
}

// jumpToPage()
//______________________________________________________________________________
// Attempts to jump to page.  Returns true if page could be found, false otherwise.
BookReader.prototype.jumpToPage = function(pageNum) {

    var pageIndex = this.getPageIndex(pageNum);

    if ('undefined' != typeof(pageIndex)) {
        var leafTop = 0;
        var h;
        this.jumpToIndex(pageIndex);
        $('#BRcontainer').attr('scrollTop', leafTop);
        return true;
    }
    
    // Page not found
    return false;
}

// jumpToIndex()
//______________________________________________________________________________
BookReader.prototype.jumpToIndex = function(index, pageX, pageY) {

    if (this.constMode2up == this.mode) {
        this.autoStop();
        
        // By checking against min/max we do nothing if requested index
        // is current
        if (index < Math.min(this.twoPage.currentIndexL, this.twoPage.currentIndexR)) {
            this.flipBackToIndex(index);
        } else if (index > Math.max(this.twoPage.currentIndexL, this.twoPage.currentIndexR)) {
            this.flipFwdToIndex(index);
        }

    } else if (this.constModeThumb == this.mode) {
        var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer
        var i;
        var leafWidth = 0;
        var leafHeight = 0;
        var rightPos = 0;
        var bottomPos = 0;
        var rowHeight = 0;
        var leafTop = 0;
        var leafIndex = 0;

        for (i=0; i<(index+1); i++) {
            leafWidth = this.thumbWidth;
            if (rightPos + (leafWidth + this.padding) > viewWidth){
                rightPos = 0;
                rowHeight = 0;
                leafIndex = 0;
            }

            leafHeight = parseInt((this.getPageHeight(leafIndex)*this.thumbWidth)/this.getPageWidth(leafIndex), 10);
            if (leafHeight > rowHeight) { rowHeight = leafHeight; }
            if (leafIndex==0) { leafTop = bottomPos; }
            if (leafIndex==0) { bottomPos += this.padding + rowHeight; }
            rightPos += leafWidth + this.padding;
            leafIndex++;
        }
        this.firstIndex=index;
        if ($('#BRcontainer').attr('scrollTop') == leafTop) {
            this.loadLeafs();
        } else {
            $('#BRcontainer').animate({scrollTop: leafTop },'fast');
        }
    } else {
        // 1up
        var i;
        var leafTop = 0;
        var leafLeft = 0;
        var h;
        for (i=0; i<index; i++) {
            h = parseInt(this._getPageHeight(i)/this.reduce); 
            leafTop += h + this.padding;
        }

        if (pageY) {
            //console.log('pageY ' + pageY);
            var offset = parseInt( (pageY) / this.reduce);
            offset -= $('#BRcontainer').attr('clientHeight') >> 1;
            //console.log( 'jumping to ' + leafTop + ' ' + offset);
            leafTop += offset;
        } else {
            // Show page just a little below the top
            leafTop -= this.padding / 2;
        }

        if (pageX) {
            var offset = parseInt( (pageX) / this.reduce);
            offset -= $('#BRcontainer').attr('clientWidth') >> 1;
            leafLeft += offset;
        } else {
            // Preserve left position
            leafLeft = $('#BRcontainer').scrollLeft();
        }
        //$('#BRcontainer').attr('scrollTop', leafTop);
        $('#BRcontainer').animate({scrollTop: leafTop, scrollLeft: leafLeft },'fast');
    }
}


// switchMode()
//______________________________________________________________________________
BookReader.prototype.switchMode = function(mode) {

    //console.log('  asked to switch to mode ' + mode + ' from ' + this.mode);
    
    if (mode == this.mode) {
        return;
    }
    
    if (!this.canSwitchToMode(mode)) {
        return;
    }

    this.autoStop();
    this.removeSearchHilites();

    this.mode = mode;
    this.switchToolbarMode(mode);

    // reinstate scale if moving from thumbnail view
    if (this.pageScale != this.reduce) {
        this.reduce = this.pageScale;
    }
    
    // $$$ TODO preserve center of view when switching between mode
    //     See https://bugs.edge.launchpad.net/gnubook/+bug/416682

    // XXX maybe better to preserve zoom in each mode
    if (1 == mode) {
        this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'), $('#BRcontainer').attr('clientHeight'));
        this.reduce = this.quantizeReduce(this.reduce, this.onePage.reductionFactors);
        this.prepareOnePageView();
    } else if (3 == mode) {
        this.reduce = this.quantizeReduce(this.reduce, this.reductionFactors);
        this.prepareThumbnailView();
    } else {
        // $$$ why don't we save autofit?
        this.twoPage.autofit = false; // Take zoom level from other mode
        this.twoPageCalculateReductionFactors();
        this.reduce = this.quantizeReduce(this.reduce, this.twoPage.reductionFactors);
        this.prepareTwoPageView();
        this.twoPageCenterView(0.5, 0.5); // $$$ TODO preserve center
    }

}

//prepareOnePageView()
//______________________________________________________________________________
BookReader.prototype.prepareOnePageView = function() {

    // var startLeaf = this.displayedIndices[0];
    var startLeaf = this.currentIndex();
        
    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });
        
    $("#BRcontainer").append("<div id='BRpageview'></div>");

    // Attaches to first child - child must be present
    $('#BRcontainer').dragscrollable();
    this.bindGestures($('#BRcontainer'));

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));
    
    this.resizePageView();    
    
    this.jumpToIndex(startLeaf);
    this.displayedIndices = [];
    
    this.drawLeafsOnePage();
}

//prepareThumbnailView()
//______________________________________________________________________________
BookReader.prototype.prepareThumbnailView = function() {
    
    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });
        
    $("#BRcontainer").append("<div id='BRpageview'></div>");
    
    $('#BRcontainer').dragscrollable();
    this.bindGestures($('#BRcontainer'));

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));
    
    this.thumbWidth = this.getThumbnailWidth(this.thumbColumns);
    this.reduce = this.getPageWidth(0)/this.thumbWidth;

    this.displayedRows = [];

    // Draw leafs with current index directly in view (no animating to the index)
    this.drawLeafsThumbnail( this.currentIndex() );
    
}

// prepareTwoPageView()
//______________________________________________________________________________
// Some decisions about two page view:
//
// Both pages will be displayed at the same height, even if they were different physical/scanned
// sizes.  This simplifies the animation (from a design as well as technical standpoint).  We
// examine the page aspect ratios (in calculateSpreadSize) and use the page with the most "normal"
// aspect ratio to determine the height.
//
// The two page view div is resized to keep the middle of the book in the middle of the div
// even as the page sizes change.  To e.g. keep the middle of the book in the middle of the BRcontent
// div requires adjusting the offset of BRtwpageview and/or scrolling in BRcontent.
BookReader.prototype.prepareTwoPageView = function(centerPercentageX, centerPercentageY) {
    $('#BRcontainer').empty();
    $('#BRcontainer').css('overflow', 'auto');
        
    // We want to display two facing pages.  We may be missing
    // one side of the spread because it is the first/last leaf,
    // foldouts, missing pages, etc

    //var targetLeaf = this.displayedIndices[0];
    var targetLeaf = this.firstIndex;

    if (targetLeaf < this.firstDisplayableIndex()) {
        targetLeaf = this.firstDisplayableIndex();
    }
    
    if (targetLeaf > this.lastDisplayableIndex()) {
        targetLeaf = this.lastDisplayableIndex();
    }
    
    //this.twoPage.currentIndexL = null;
    //this.twoPage.currentIndexR = null;
    //this.pruneUnusedImgs();
    
    var currentSpreadIndices = this.getSpreadIndices(targetLeaf);
    this.twoPage.currentIndexL = currentSpreadIndices[0];
    this.twoPage.currentIndexR = currentSpreadIndices[1];
    this.firstIndex = this.twoPage.currentIndexL;
    
    this.calculateSpreadSize(); //sets twoPage.width, twoPage.height and others

    this.pruneUnusedImgs();
    this.prefetch(); // Preload images or reload if scaling has changed

    //console.dir(this.twoPage);
    
    // Add the two page view
    // $$$ Can we get everything set up and then append?
    $('#BRcontainer').append('<div id="BRtwopageview"></div>');
    
    // Attaches to first child, so must come after we add the page view
    $('#BRcontainer').dragscrollable();
    this.bindGestures($('#BRcontainer'));

    // $$$ calculate first then set
    $('#BRtwopageview').css( {
        height: this.twoPage.totalHeight + 'px',
        width: this.twoPage.totalWidth + 'px',
        position: 'absolute'
        });
        
    // If there will not be scrollbars (e.g. when zooming out) we center the book
    // since otherwise the book will be stuck off-center
    if (this.twoPage.totalWidth < $('#BRcontainer').attr('clientWidth')) {
        centerPercentageX = 0.5;
    }
    if (this.twoPage.totalHeight < $('#BRcontainer').attr('clientHeight')) {
        centerPercentageY = 0.5;
    }
        
    this.twoPageCenterView(centerPercentageX, centerPercentageY);
    
    this.twoPage.coverDiv = document.createElement('div');
    $(this.twoPage.coverDiv).attr('id', 'BRbookcover').css({
        width:  this.twoPage.bookCoverDivWidth + 'px',
        height: this.twoPage.bookCoverDivHeight+'px',
        visibility: 'visible',
        position: 'absolute',
        left: this.twoPage.bookCoverDivLeft + 'px',
        top: this.twoPage.bookCoverDivTop+'px'
    }).appendTo('#BRtwopageview');
    
    this.leafEdgeR = document.createElement('div');
    this.leafEdgeR.className = 'BRleafEdgeR';
    $(this.leafEdgeR).css({
        width: this.twoPage.leafEdgeWidthR + 'px',
        height: this.twoPage.height-1 + 'px',
        left: this.twoPage.gutter+this.twoPage.scaledWR+'px',
        top: this.twoPage.bookCoverDivTop+this.twoPage.coverInternalPadding+'px'
    }).appendTo('#BRtwopageview');
    
    this.leafEdgeL = document.createElement('div');
    this.leafEdgeL.className = 'BRleafEdgeL';
    $(this.leafEdgeL).css({
        width: this.twoPage.leafEdgeWidthL + 'px',
        height: this.twoPage.height-1 + 'px',
        left: this.twoPage.bookCoverDivLeft+this.twoPage.coverInternalPadding+'px',
        top: this.twoPage.bookCoverDivTop+this.twoPage.coverInternalPadding+'px'
    }).appendTo('#BRtwopageview');

    div = document.createElement('div');
    $(div).attr('id', 'BRbookspine').css({
        width:           this.twoPage.bookSpineDivWidth+'px',
        height:          this.twoPage.bookSpineDivHeight+'px',
        left:            this.twoPage.bookSpineDivLeft+'px',
        top:             this.twoPage.bookSpineDivTop+'px'
    }).appendTo('#BRtwopageview');
    
    var self = this; // for closure
    
    /* Flip areas no longer used
    this.twoPage.leftFlipArea = document.createElement('div');
    this.twoPage.leftFlipArea.className = 'BRfliparea';
    $(this.twoPage.leftFlipArea).attr('id', 'BRleftflip').css({
        border: '0',
        width:  this.twoPageFlipAreaWidth() + 'px',
        height: this.twoPageFlipAreaHeight() + 'px',
        position: 'absolute',
        left:   this.twoPageLeftFlipAreaLeft() + 'px',
        top:    this.twoPageFlipAreaTop() + 'px',
        cursor: 'w-resize',
        zIndex: 100
    }).bind('click', function(e) {
        self.left();
    }).bind('mousedown', function(e) {
        e.preventDefault();
    }).appendTo('#BRtwopageview');
    
    this.twoPage.rightFlipArea = document.createElement('div');
    this.twoPage.rightFlipArea.className = 'BRfliparea';
    $(this.twoPage.rightFlipArea).attr('id', 'BRrightflip').css({
        border: '0',
        width:  this.twoPageFlipAreaWidth() + 'px',
        height: this.twoPageFlipAreaHeight() + 'px',
        position: 'absolute',
        left:   this.twoPageRightFlipAreaLeft() + 'px',
        top:    this.twoPageFlipAreaTop() + 'px',
        cursor: 'e-resize',
        zIndex: 100
    }).bind('click', function(e) {
        self.right();
    }).bind('mousedown', function(e) {
        e.preventDefault();
    }).appendTo('#BRtwopageview');
    */
    
    this.prepareTwoPagePopUp();
    
    this.displayedIndices = [];
    
    //this.indicesToDisplay=[firstLeaf, firstLeaf+1];
    //console.log('indicesToDisplay: ' + this.indicesToDisplay[0] + ' ' + this.indicesToDisplay[1]);
    
    this.drawLeafsTwoPage();
    this.updateToolbarZoom(this.reduce);
    
    this.prefetch();

    this.removeSearchHilites();
    this.updateSearchHilites();

}

// prepareTwoPagePopUp()
//
// This function prepares the "View Page n" popup that shows while the mouse is
// over the left/right "stack of sheets" edges.  It also binds the mouse
// events for these divs.
//______________________________________________________________________________
BookReader.prototype.prepareTwoPagePopUp = function() {

    this.twoPagePopUp = document.createElement('div');
    this.twoPagePopUp.className = 'BRtwoPagePopUp';
    $(this.twoPagePopUp).css({
        zIndex: '1000'
    }).appendTo('#BRcontainer');
    $(this.twoPagePopUp).hide();
    
    $(this.leafEdgeL).add(this.leafEdgeR).bind('mouseenter', this, function(e) {
        $(e.data.twoPagePopUp).show();
    });

    $(this.leafEdgeL).add(this.leafEdgeR).bind('mouseleave', this, function(e) {
        $(e.data.twoPagePopUp).hide();
    });

    $(this.leafEdgeL).bind('click', this, function(e) { 
        e.data.autoStop();
        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        e.data.jumpToIndex(jumpIndex);
    });

    $(this.leafEdgeR).bind('click', this, function(e) { 
        e.data.autoStop();
        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        e.data.jumpToIndex(jumpIndex);    
    });

    $(this.leafEdgeR).bind('mousemove', this, function(e) {

        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View ' + e.data.getPageName(jumpIndex));
        
        // $$$ TODO: Make sure popup is positioned so that it is in view
        // (https://bugs.edge.launchpad.net/gnubook/+bug/327456)        
        $(e.data.twoPagePopUp).css({
            left: e.pageX- $('#BRcontainer').offset().left + $('#BRcontainer').scrollLeft() + 20 + 'px',
            top: e.pageY - $('#BRcontainer').offset().top + $('#BRcontainer').scrollTop() + 'px'
        });
    });

    $(this.leafEdgeL).bind('mousemove', this, function(e) {
    
        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View '+ e.data.getPageName(jumpIndex));

        // $$$ TODO: Make sure popup is positioned so that it is in view
        //           (https://bugs.edge.launchpad.net/gnubook/+bug/327456)        
        $(e.data.twoPagePopUp).css({
            left: e.pageX - $('#BRcontainer').offset().left + $('#BRcontainer').scrollLeft() - $(e.data.twoPagePopUp).width() - 25 + 'px',
            top: e.pageY-$('#BRcontainer').offset().top + $('#BRcontainer').scrollTop() + 'px'
        });
    });
}

// calculateSpreadSize()
//______________________________________________________________________________
// Calculates 2-page spread dimensions based on this.twoPage.currentIndexL and
// this.twoPage.currentIndexR
// This function sets this.twoPage.height, twoPage.width

BookReader.prototype.calculateSpreadSize = function() {

    var firstIndex  = this.twoPage.currentIndexL;
    var secondIndex = this.twoPage.currentIndexR;
    //console.log('first page is ' + firstIndex);

    // Calculate page sizes and total leaf width
    var spreadSize;
    if ( this.twoPage.autofit) {    
        spreadSize = this.getIdealSpreadSize(firstIndex, secondIndex);
    } else {
        // set based on reduction factor
        spreadSize = this.getSpreadSizeFromReduce(firstIndex, secondIndex, this.reduce);
    }
    
    // Both pages together
    this.twoPage.height = spreadSize.height;
    this.twoPage.width = spreadSize.width;
    
    // Individual pages
    this.twoPage.scaledWL = this.getPageWidth2UP(firstIndex);
    this.twoPage.scaledWR = this.getPageWidth2UP(secondIndex);
    
    // Leaf edges
    this.twoPage.edgeWidth = spreadSize.totalLeafEdgeWidth; // The combined width of both edges
    this.twoPage.leafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    this.twoPage.leafEdgeWidthR = this.twoPage.edgeWidth - this.twoPage.leafEdgeWidthL;
    
    
    // Book cover
    // The width of the book cover div.  The combined width of both pages, twice the width
    // of the book cover internal padding (2*10) and the page edges
    this.twoPage.bookCoverDivWidth = this.twoPage.scaledWL + this.twoPage.scaledWR + 2 * this.twoPage.coverInternalPadding + this.twoPage.edgeWidth;
    // The height of the book cover div
    this.twoPage.bookCoverDivHeight = this.twoPage.height + 2 * this.twoPage.coverInternalPadding;
    
    
    // We calculate the total width and height for the div so that we can make the book
    // spine centered
    var leftGutterOffset = this.gutterOffsetForIndex(firstIndex);
    var leftWidthFromCenter = this.twoPage.scaledWL - leftGutterOffset + this.twoPage.leafEdgeWidthL;
    var rightWidthFromCenter = this.twoPage.scaledWR + leftGutterOffset + this.twoPage.leafEdgeWidthR;
    var largestWidthFromCenter = Math.max( leftWidthFromCenter, rightWidthFromCenter );
    this.twoPage.totalWidth = 2 * (largestWidthFromCenter + this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);
    this.twoPage.totalHeight = this.twoPage.height + 2 * (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);
        
    // We want to minimize the unused space in two-up mode (maximize the amount of page
    // shown).  We give width to the leaf edges and these widths change (though the sum
    // of the two remains constant) as we flip through the book.  With the book
    // cover centered and fixed in the BRcontainer div the page images will meet
    // at the "gutter" which is generally offset from the center.
    this.twoPage.middle = this.twoPage.totalWidth >> 1;
    this.twoPage.gutter = this.twoPage.middle + this.gutterOffsetForIndex(firstIndex);
    
    // The left edge of the book cover moves depending on the width of the pages
    // $$$ change to getter
    this.twoPage.bookCoverDivLeft = this.twoPage.gutter - this.twoPage.scaledWL - this.twoPage.leafEdgeWidthL - this.twoPage.coverInternalPadding;
    // The top edge of the book cover stays a fixed distance from the top
    this.twoPage.bookCoverDivTop = this.twoPage.coverExternalPadding;

    // Book spine
    this.twoPage.bookSpineDivHeight = this.twoPage.height + 2*this.twoPage.coverInternalPadding;
    this.twoPage.bookSpineDivLeft = this.twoPage.middle - (this.twoPage.bookSpineDivWidth >> 1);
    this.twoPage.bookSpineDivTop = this.twoPage.bookCoverDivTop;


    this.reduce = spreadSize.reduce; // $$$ really set this here?
}

BookReader.prototype.getIdealSpreadSize = function(firstIndex, secondIndex) {
    var ideal = {};

    // We check which page is closest to a "normal" page and use that to set the height
    // for both pages.  This means that foldouts and other odd size pages will be displayed
    // smaller than the nominal zoom amount.
    var canon5Dratio = 1.5;
    
    var first = {
        height: this._getPageHeight(firstIndex),
        width: this._getPageWidth(firstIndex)
    }
    
    var second = {
        height: this._getPageHeight(secondIndex),
        width: this._getPageWidth(secondIndex)
    }
    
    var firstIndexRatio  = first.height / first.width;
    var secondIndexRatio = second.height / second.width;
    // console.log('firstIndexRatio = ' + firstIndexRatio + ' secondIndexRatio = ' + secondIndexRatio);

    var ratio;
    if (Math.abs(firstIndexRatio - canon5Dratio) < Math.abs(secondIndexRatio - canon5Dratio)) {
        ratio = firstIndexRatio;
        //console.log('using firstIndexRatio ' + ratio);
    } else {
        ratio = secondIndexRatio;
        //console.log('using secondIndexRatio ' + ratio);
    }

    var totalLeafEdgeWidth = parseInt(this.numLeafs * 0.1);
    var maxLeafEdgeWidth   = parseInt($('#BRcontainer').attr('clientWidth') * 0.1);
    ideal.totalLeafEdgeWidth     = Math.min(totalLeafEdgeWidth, maxLeafEdgeWidth);
    
    var widthOutsidePages = 2 * (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding) + ideal.totalLeafEdgeWidth;
    var heightOutsidePages = 2* (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);
    
    ideal.width = ($('#BRcontainer').width() - widthOutsidePages) >> 1;
    ideal.width -= 10; // $$$ fudge factor
    ideal.height = $('#BRcontainer').height() - heightOutsidePages;
    ideal.height -= 20; // fudge factor
    // console.log('init idealWidth='+ideal.width+' idealHeight='+ideal.height + ' ratio='+ratio);

    if (ideal.height/ratio <= ideal.width) {
        //use height
        ideal.width = parseInt(ideal.height/ratio);
    } else {
        //use width
        ideal.height = parseInt(ideal.width*ratio);
    }
    
    // $$$ check this logic with large spreads
    ideal.reduce = ((first.height + second.height) / 2) / ideal.height;
    // console.log("init ideal reduce = ", ideal.reduce);
    
    return ideal;
}

// getSpreadSizeFromReduce()
//______________________________________________________________________________
// Returns the spread size calculated from the reduction factor for the given pages
BookReader.prototype.getSpreadSizeFromReduce = function(firstIndex, secondIndex, reduce) {
    var spreadSize = {};
    // $$$ Scale this based on reduce?
    var totalLeafEdgeWidth = parseInt(this.numLeafs * 0.1);
    var maxLeafEdgeWidth   = parseInt($('#BRcontainer').attr('clientWidth') * 0.1); // $$$ Assumes leaf edge width constant at all zoom levels
    spreadSize.totalLeafEdgeWidth     = Math.min(totalLeafEdgeWidth, maxLeafEdgeWidth);

    // $$$ Possibly incorrect -- we should make height "dominant"
    var nativeWidth = this._getPageWidth(firstIndex) + this._getPageWidth(secondIndex);
    var nativeHeight = this._getPageHeight(firstIndex) + this._getPageHeight(secondIndex);
    spreadSize.height = parseInt( (nativeHeight / 2) / this.reduce );
    spreadSize.width = parseInt( (nativeWidth / 2) / this.reduce );
    spreadSize.reduce = reduce;
    
    return spreadSize;
}

// twoPageGetAutofitReduce()
//______________________________________________________________________________
// Returns the current ideal reduction factor
BookReader.prototype.twoPageGetAutofitReduce = function() {
    var spreadSize = this.getIdealSpreadSize(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
    return spreadSize.reduce;
}

BookReader.prototype.onePageGetAutofitWidth = function() {
    var widthPadding = 20;
    return (this.getMedianPageSize().width + 0.0) / ($('#BRcontainer').attr('clientWidth') - widthPadding * 2);
}

BookReader.prototype.onePageGetAutofitHeight = function() {
    return (this.getMedianPageSize().height + 0.0) / ($('#BRcontainer').attr('clientHeight') - this.padding * 2); // make sure a little of adjacent pages show
}

BookReader.prototype.getMedianPageSize = function() {
    if (this._medianPageSize) {
        return this._medianPageSize;
    }
    
    // A little expensive but we just do it once
    var widths = [];
    var heights = [];
    for (var i = 0; i < this.numLeafs; i++) {
        widths.push(this.getPageWidth(i));
        heights.push(this.getPageHeight(i));
    }
    
    widths.sort();
    heights.sort();
    
    this._medianPageSize = { width: widths[parseInt(widths.length / 2)], height: heights[parseInt(heights.length / 2)] };
    return this._medianPageSize; 
}

// Update the reduction factors for 1up mode given the available width and height.  Recalculates
// the autofit reduction factors.
BookReader.prototype.onePageCalculateReductionFactors = function( width, height ) {
    this.onePage.reductionFactors = this.reductionFactors.concat(
        [ 
            { reduce: this.onePageGetAutofitWidth(), autofit: 'width' },
            { reduce: this.onePageGetAutofitHeight(), autofit: 'height'}
        ]);
    this.onePage.reductionFactors.sort(this._reduceSort);
}

BookReader.prototype.twoPageCalculateReductionFactors = function() {    
    this.twoPage.reductionFactors = this.reductionFactors.concat(
        [
            { reduce: this.getIdealSpreadSize( this.twoPage.currentIndexL, this.twoPage.currentIndexR ).reduce,
              autofit: 'auto' }
        ]);
    this.twoPage.reductionFactors.sort(this._reduceSort);
}

// twoPageSetCursor()
//______________________________________________________________________________
// Set the cursor for two page view
BookReader.prototype.twoPageSetCursor = function() {
    // console.log('setting cursor');
    if ( ($('#BRtwopageview').width() > $('#BRcontainer').attr('clientWidth')) ||
         ($('#BRtwopageview').height() > $('#BRcontainer').attr('clientHeight')) ) {
        $(this.prefetchedImgs[this.twoPage.currentIndexL]).css('cursor','move');
        $(this.prefetchedImgs[this.twoPage.currentIndexR]).css('cursor','move');
    } else {
        $(this.prefetchedImgs[this.twoPage.currentIndexL]).css('cursor','');
        $(this.prefetchedImgs[this.twoPage.currentIndexR]).css('cursor','');
    }
}

// currentIndex()
//______________________________________________________________________________
// Returns the currently active index.
BookReader.prototype.currentIndex = function() {
    // $$$ we should be cleaner with our idea of which index is active in 1up/2up
    if (this.mode == this.constMode1up || this.mode == this.constModeThumb) {
        return this.firstIndex; // $$$ TODO page in center of view would be better
    } else if (this.mode == this.constMode2up) {
        // Only allow indices that are actually present in book
        return BookReader.util.clamp(this.firstIndex, 0, this.numLeafs - 1);    
    } else {
        throw 'currentIndex called for unimplemented mode ' + this.mode;
    }
}

// setCurrentIndex(index)
//______________________________________________________________________________
// Sets the idea of current index without triggering other actions such as animation.
// Compare to jumpToIndex which animates to that index
BookReader.prototype.setCurrentIndex = function(index) {
    this.firstIndex = index;
}


// right()
//______________________________________________________________________________
// Flip the right page over onto the left
BookReader.prototype.right = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.next();
    } else {
        // RTL
        this.prev();
    }
}

// rightmost()
//______________________________________________________________________________
// Flip to the rightmost page
BookReader.prototype.rightmost = function() {
    if ('rl' != this.pageProgression) {
        this.last();
    } else {
        this.first();
    }
}

// left()
//______________________________________________________________________________
// Flip the left page over onto the right.
BookReader.prototype.left = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.prev();
    } else {
        // RTL
        this.next();
    }
}

// leftmost()
//______________________________________________________________________________
// Flip to the leftmost page
BookReader.prototype.leftmost = function() {
    if ('rl' != this.pageProgression) {
        this.first();
    } else {
        this.last();
    }
}

// next()
//______________________________________________________________________________
BookReader.prototype.next = function() {
    if (2 == this.mode) {
        this.autoStop();
        this.flipFwdToIndex(null);
    } else {
        if (this.firstIndex < this.lastDisplayableIndex()) {
            this.jumpToIndex(this.firstIndex+1);
        }
    }
}

// prev()
//______________________________________________________________________________
BookReader.prototype.prev = function() {
    if (2 == this.mode) {
        this.autoStop();
        this.flipBackToIndex(null);
    } else {
        if (this.firstIndex >= 1) {
            this.jumpToIndex(this.firstIndex-1);
        }    
    }
}

BookReader.prototype.first = function() {
    this.jumpToIndex(this.firstDisplayableIndex());
}

BookReader.prototype.last = function() {
    this.jumpToIndex(this.lastDisplayableIndex());
}

// scrollDown()
//______________________________________________________________________________
// Scrolls down one screen view
BookReader.prototype.scrollDown = function() {
    if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
            // Whole pages are visible, scroll whole page only
            return this.next();
        }
    
        $('#BRcontainer').animate(
            { scrollTop: '+=' + this._scrollAmount() + 'px'},
            400, 'easeInOutExpo'
        );
        return true;
    } else {
        return false;
    }
}

// scrollUp()
//______________________________________________________________________________
// Scrolls up one screen view
BookReader.prototype.scrollUp = function() {
    if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
            // Whole pages are visible, scroll whole page only
            return this.prev();
        }

        $('#BRcontainer').animate(
            { scrollTop: '-=' + this._scrollAmount() + 'px'},
            400, 'easeInOutExpo'
        );
        return true;
    } else {
        return false;
    }
}

// _scrollAmount()
//______________________________________________________________________________
// The amount to scroll vertically in integer pixels
BookReader.prototype._scrollAmount = function() {
    if (this.constMode1up == this.mode) {
        // Overlap by % of page size
        return parseInt($('#BRcontainer').attr('clientHeight') - this.getPageHeight(this.currentIndex()) / this.reduce * 0.03);
    }
    
    return parseInt(0.9 * $('#BRcontainer').attr('clientHeight'));
}


// flipBackToIndex()
//______________________________________________________________________________
// to flip back one spread, pass index=null
BookReader.prototype.flipBackToIndex = function(index) {
    
    if (1 == this.mode) return;

    var leftIndex = this.twoPage.currentIndexL;
    
    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }
    
    if (null == index) {
        index = leftIndex-2;
    }
    //if (index<0) return;
    
    var previousIndices = this.getSpreadIndices(index);
    
    if (previousIndices[0] < this.firstDisplayableIndex() || previousIndices[1] < this.firstDisplayableIndex()) {
        return;
    }
    
    this.animating = true;
    
    if ('rl' != this.pageProgression) {
        // Assume LTR and we are going backward    
        this.prepareFlipLeftToRight(previousIndices[0], previousIndices[1]);        
        this.flipLeftToRight(previousIndices[0], previousIndices[1]);
    } else {
        // RTL and going backward
        var gutter = this.prepareFlipRightToLeft(previousIndices[0], previousIndices[1]);
        this.flipRightToLeft(previousIndices[0], previousIndices[1], gutter);
    }
}

// flipLeftToRight()
//______________________________________________________________________________
// Flips the page on the left towards the page on the right
BookReader.prototype.flipLeftToRight = function(newIndexL, newIndexR) {

    var leftLeaf = this.twoPage.currentIndexL;
    
    var oldLeafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    var newLeafEdgeWidthL = this.leafEdgeWidth(newIndexL);    
    var leafEdgeTmpW = oldLeafEdgeWidthL - newLeafEdgeWidthL;
    
    var currWidthL   = this.getPageWidth2UP(leftLeaf);
    var newWidthL    = this.getPageWidth2UP(newIndexL);
    var newWidthR    = this.getPageWidth2UP(newIndexR);

    var top  = this.twoPageTop();
    var gutter = this.twoPage.middle + this.gutterOffsetForIndex(newIndexL);
    
    //console.log('leftEdgeTmpW ' + leafEdgeTmpW);
    //console.log('  gutter ' + gutter + ', scaledWL ' + scaledWL + ', newLeafEdgeWL ' + newLeafEdgeWidthL);
    
    //animation strategy:
    // 0. remove search highlight, if any.
    // 1. create a new div, called leafEdgeTmp to represent the leaf edge between the leftmost edge 
    //    of the left leaf and where the user clicked in the leaf edge.
    //    Note that if this function was triggered by left() and not a
    //    mouse click, the width of leafEdgeTmp is very small (zero px).
    // 2. animate both leafEdgeTmp to the gutter (without changing its width) and animate
    //    leftLeaf to width=0.
    // 3. When step 2 is finished, animate leafEdgeTmp to right-hand side of new right leaf
    //    (left=gutter+newWidthR) while also animating the new right leaf from width=0 to
    //    its new full width.
    // 4. After step 3 is finished, do the following:
    //      - remove leafEdgeTmp from the dom.
    //      - resize and move the right leaf edge (leafEdgeR) to left=gutter+newWidthR
    //          and width=twoPage.edgeWidth-newLeafEdgeWidthL.
    //      - resize and move the left leaf edge (leafEdgeL) to left=gutter-newWidthL-newLeafEdgeWidthL
    //          and width=newLeafEdgeWidthL.
    //      - resize the back cover (twoPage.coverDiv) to left=gutter-newWidthL-newLeafEdgeWidthL-10
    //          and width=newWidthL+newWidthR+twoPage.edgeWidth+20
    //      - move new left leaf (newIndexL) forward to zindex=2 so it can receive clicks.
    //      - remove old left and right leafs from the dom [pruneUnusedImgs()].
    //      - prefetch new adjacent leafs.
    //      - set up click handlers for both new left and right leafs.
    //      - redraw the search highlight.
    //      - update the pagenum box and the url.
    
    
    var leftEdgeTmpLeft = gutter - currWidthL - leafEdgeTmpW;

    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height-1 + 'px',
        left: leftEdgeTmpLeft + 'px',
        top: top+'px',
        zIndex:1000
    }).appendTo('#BRtwopageview');
    
    //$(this.leafEdgeL).css('width', newLeafEdgeWidthL+'px');
    $(this.leafEdgeL).css({
        width: newLeafEdgeWidthL+'px', 
        left: gutter-currWidthL-newLeafEdgeWidthL+'px'
    });   

    // Left gets the offset of the current left leaf from the document
    var left = $(this.prefetchedImgs[leftLeaf]).offset().left;
    // $$$ This seems very similar to the gutter.  May be able to consolidate the logic.
    var right = $('#BRtwopageview').attr('clientWidth')-left-$(this.prefetchedImgs[leftLeaf]).width()+$('#BRtwopageview').offset().left-2+'px';
    
    // We change the left leaf to right positioning
    // $$$ This causes animation glitches during resize.  See https://bugs.edge.launchpad.net/gnubook/+bug/328327
    $(this.prefetchedImgs[leftLeaf]).css({
        right: right,
        left: ''
    });

    $(this.leafEdgeTmp).animate({left: gutter}, this.flipSpeed, 'easeInSine');    
    //$(this.prefetchedImgs[leftLeaf]).animate({width: '0px'}, 'slow', 'easeInSine');
    
    var self = this;

    this.removeSearchHilites();

    //console.log('animating leafLeaf ' + leftLeaf + ' to 0px');
    $(this.prefetchedImgs[leftLeaf]).animate({width: '0px'}, self.flipSpeed, 'easeInSine', function() {
    
        //console.log('     and now leafEdgeTmp to left: gutter+newWidthR ' + (gutter + newWidthR));
        $(self.leafEdgeTmp).animate({left: gutter+newWidthR+'px'}, self.flipSpeed, 'easeOutSine');

        //console.log('  animating newIndexR ' + newIndexR + ' to ' + newWidthR + ' from ' + $(self.prefetchedImgs[newIndexR]).width());
        $(self.prefetchedImgs[newIndexR]).animate({width: newWidthR+'px'}, self.flipSpeed, 'easeOutSine', function() {
            $(self.prefetchedImgs[newIndexL]).css('zIndex', 2);
            
            $(self.leafEdgeR).css({
                // Moves the right leaf edge
                width: self.twoPage.edgeWidth-newLeafEdgeWidthL+'px',
                left:  gutter+newWidthR+'px'
            });

            $(self.leafEdgeL).css({
                // Moves and resizes the left leaf edge
                width: newLeafEdgeWidthL+'px',
                left:  gutter-newWidthL-newLeafEdgeWidthL+'px'
            });

            // Resizes the brown border div
            $(self.twoPage.coverDiv).css({
                width: self.twoPageCoverWidth(newWidthL+newWidthR)+'px',
                left: gutter-newWidthL-newLeafEdgeWidthL-self.twoPage.coverInternalPadding+'px'
            });
            
            $(self.leafEdgeTmp).remove();
            self.leafEdgeTmp = null;

            // $$$ TODO refactor with opposite direction flip
            
            self.twoPage.currentIndexL = newIndexL;
            self.twoPage.currentIndexR = newIndexR;
            self.twoPage.scaledWL = newWidthL;
            self.twoPage.scaledWR = newWidthR;
            self.twoPage.gutter = gutter;
            
            self.firstIndex = self.twoPage.currentIndexL;
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();            
            self.animating = false;
            
            self.updateSearchHilites2UP();
            self.updatePageNumBox2UP();
            
            // self.twoPagePlaceFlipAreas(); // No longer used
            self.setMouseHandlers2UP();
            self.twoPageSetCursor();
            
            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });        
    
}

// flipFwdToIndex()
//______________________________________________________________________________
// Whether we flip left or right is dependent on the page progression
// to flip forward one spread, pass index=null
BookReader.prototype.flipFwdToIndex = function(index) {

    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }

    if (null == index) {
        index = this.twoPage.currentIndexR+2; // $$$ assumes indices are continuous
    }
    if (index > this.lastDisplayableIndex()) return;

    this.animating = true;
    
    var nextIndices = this.getSpreadIndices(index);
    
    //console.log('flipfwd to indices ' + nextIndices[0] + ',' + nextIndices[1]);

    if ('rl' != this.pageProgression) {
        // We did not specify RTL
        var gutter = this.prepareFlipRightToLeft(nextIndices[0], nextIndices[1]);
        this.flipRightToLeft(nextIndices[0], nextIndices[1], gutter);
    } else {
        // RTL
        var gutter = this.prepareFlipLeftToRight(nextIndices[0], nextIndices[1]);
        this.flipLeftToRight(nextIndices[0], nextIndices[1]);
    }
}

// flipRightToLeft(nextL, nextR, gutter)
// $$$ better not to have to pass gutter in
//______________________________________________________________________________
// Flip from left to right and show the nextL and nextR indices on those sides
BookReader.prototype.flipRightToLeft = function(newIndexL, newIndexR) {
    var oldLeafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    var oldLeafEdgeWidthR = this.twoPage.edgeWidth-oldLeafEdgeWidthL;
    var newLeafEdgeWidthL = this.leafEdgeWidth(newIndexL);  
    var newLeafEdgeWidthR = this.twoPage.edgeWidth-newLeafEdgeWidthL;

    var leafEdgeTmpW = oldLeafEdgeWidthR - newLeafEdgeWidthR;

    var top = this.twoPageTop();
    var scaledW = this.getPageWidth2UP(this.twoPage.currentIndexR);

    var middle = this.twoPage.middle;
    var gutter = middle + this.gutterOffsetForIndex(newIndexL);
    
    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height-1 + 'px',
        left: gutter+scaledW+'px',
        top: top+'px',    
        zIndex:1000
    }).appendTo('#BRtwopageview');

    //var scaledWR = this.getPageWidth2UP(newIndexR); // $$$ should be current instead?
    //var scaledWL = this.getPageWidth2UP(newIndexL); // $$$ should be current instead?
    
    var currWidthL = this.getPageWidth2UP(this.twoPage.currentIndexL);
    var currWidthR = this.getPageWidth2UP(this.twoPage.currentIndexR);
    var newWidthL = this.getPageWidth2UP(newIndexL);
    var newWidthR = this.getPageWidth2UP(newIndexR);
    
    $(this.leafEdgeR).css({width: newLeafEdgeWidthR+'px', left: gutter+newWidthR+'px' });

    var self = this; // closure-tastic!

    var speed = this.flipSpeed;

    this.removeSearchHilites();
    
    $(this.leafEdgeTmp).animate({left: gutter}, speed, 'easeInSine');    
    $(this.prefetchedImgs[this.twoPage.currentIndexR]).animate({width: '0px'}, speed, 'easeInSine', function() {
        $(self.leafEdgeTmp).animate({left: gutter-newWidthL-leafEdgeTmpW+'px'}, speed, 'easeOutSine');    
        $(self.prefetchedImgs[newIndexL]).animate({width: newWidthL+'px'}, speed, 'easeOutSine', function() {
            $(self.prefetchedImgs[newIndexR]).css('zIndex', 2);
            
            $(self.leafEdgeL).css({
                width: newLeafEdgeWidthL+'px', 
                left: gutter-newWidthL-newLeafEdgeWidthL+'px'
            });
            
            // Resizes the book cover
            $(self.twoPage.coverDiv).css({
                width: self.twoPageCoverWidth(newWidthL+newWidthR)+'px',
                left: gutter - newWidthL - newLeafEdgeWidthL - self.twoPage.coverInternalPadding + 'px'
            });
            
            $(self.leafEdgeTmp).remove();
            self.leafEdgeTmp = null;
            
            self.twoPage.currentIndexL = newIndexL;
            self.twoPage.currentIndexR = newIndexR;
            self.twoPage.scaledWL = newWidthL;
            self.twoPage.scaledWR = newWidthR;
            self.twoPage.gutter = gutter;

            self.firstIndex = self.twoPage.currentIndexL;
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();
            self.animating = false;


            self.updateSearchHilites2UP();
            self.updatePageNumBox2UP();
            
            // self.twoPagePlaceFlipAreas(); // No longer used
            self.setMouseHandlers2UP();     
            self.twoPageSetCursor();
            
            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });    
}

// setMouseHandlers2UP
//______________________________________________________________________________
BookReader.prototype.setMouseHandlers2UP = function() {
    this.setClickHandler2UP( this.prefetchedImgs[this.twoPage.currentIndexL],
        { self: this },
        function(e) {
            e.data.self.left();
            e.preventDefault();
        }
    );
        
    this.setClickHandler2UP( this.prefetchedImgs[this.twoPage.currentIndexR],
        { self: this },
        function(e) {
            e.data.self.right();
            e.preventDefault();
        }
    );
}

// prefetchImg()
//______________________________________________________________________________
BookReader.prototype.prefetchImg = function(index) {
    var self = this;
    var pageURI = this._getPageURI(index);

    if ( this.twoPage.queue_halted ) {
      // console.log("PREFETCHIMG HALTED; SKIPPING", index);
      this.twoPage.queue.push(index);
      return;
    }

    // Load image if not loaded or URI has changed (e.g. due to scaling)
    var loadImage = false;
    if (undefined == this.prefetchedImgs[index]) {
        //console.log('no image for ' + index);
        loadImage = true;
    } else if (pageURI != this.prefetchedImgs[index].uri || this.prefetchedImgs[index].choked) {
        //console.log('uri changed for ' + index);
        loadImage = true;
    }
    
    if (loadImage) {
        //console.log('prefetching ' + index);
        var img = document.createElement("img");
        img.className = 'BRpageimage';
        if (index < 0 || index > (this.numLeafs - 1) ) {
            // Facing page at beginning or end, or beyond
            $(img).css({
                'background-color': 'transparent'
            });
        } else {
          var lazy = new Image();
          $(lazy).one('load', function() {
            if ( this.height == HT.config.CHOKE_DIM && this.width == HT.config.CHOKE_DIM ) {
              $(img).addClass("choked");
              HT.monitor.run(this.src);
            }
            img.src = this.src;
            self.processPrefetchQueue();
          })
          .attr('src', pageURI);
        }
        // UM
        var title = "image of page " + this.getPageNum(index);
        img.src = pageURI;
        img.uri = pageURI; // browser may rewrite src so we stash raw URI here
        $(img).attr({ title : title, alt : title });
        this.prefetchedImgs[index] = img;
    }
    
    if ( $(this.prefetchedImgs[index]).hasClass("choked") ) {
      this.prefetchedImgs[index].src = this.imagesBaseURL + 'transparent.png';
      this.prefetchedImgs[index].src = pageURI;
    }
    
}


// prepareFlipLeftToRight()
//
//______________________________________________________________________________
//
// Prepare to flip the left page towards the right.  This corresponds to moving
// backward when the page progression is left to right.
BookReader.prototype.prepareFlipLeftToRight = function(prevL, prevR) {

    //console.log('  preparing left->right for ' + prevL + ',' + prevR);

    this.prefetchImg(prevL);
    this.prefetchImg(prevR);
    
    var height  = this._getPageHeight(prevL); 
    var width   = this._getPageWidth(prevL);    
    var middle = this.twoPage.middle;
    var top  = this.twoPageTop();                
    var scaledW = this.twoPage.height*width/height; // $$$ assumes height of page is dominant

    // The gutter is the dividing line between the left and right pages.
    // It is offset from the middle to create the illusion of thickness to the pages
    var gutter = middle + this.gutterOffsetForIndex(prevL);
    
    //console.log('    gutter for ' + prevL + ' is ' + gutter);
    //console.log('    prevL.left: ' + (gutter - scaledW) + 'px');
    //console.log('    changing prevL ' + prevL + ' to left: ' + (gutter-scaledW) + ' width: ' + scaledW);
    
    leftCSS = {
        position: 'absolute',
        left: gutter-scaledW+'px',
        right: '', // clear right property
        top:    top+'px',
        height: this.twoPage.height,
        width:  scaledW+'px',
        borderRight: '1px solid black',
        zIndex: 1
    }
    
    $(this.prefetchedImgs[prevL]).css(leftCSS);

    $('#BRtwopageview').append(this.prefetchedImgs[prevL]);

    //console.log('    changing prevR ' + prevR + ' to left: ' + gutter + ' width: 0');

    rightCSS = {
        position: 'absolute',
        left:   gutter+'px',
        right: '',
        top:    top+'px',
        height: this.twoPage.height,
        width:  '0px',
        borderLeft: '1px solid black',
        zIndex: 2
    }
    
    $(this.prefetchedImgs[prevR]).css(rightCSS);

    $('#BRtwopageview').append(this.prefetchedImgs[prevR]);
            
}

// $$$ mang we're adding an extra pixel in the middle.  See https://bugs.edge.launchpad.net/gnubook/+bug/411667
// prepareFlipRightToLeft()
//______________________________________________________________________________
BookReader.prototype.prepareFlipRightToLeft = function(nextL, nextR) {

    //console.log('  preparing left<-right for ' + nextL + ',' + nextR);

    // Prefetch images
    this.prefetchImg(nextL);
    this.prefetchImg(nextR);

    var height  = this._getPageHeight(nextR); 
    var width   = this._getPageWidth(nextR);    
    var middle = this.twoPage.middle;
    var top  = this.twoPageTop();               
    var scaledW = this.twoPage.height*width/height;

    var gutter = middle + this.gutterOffsetForIndex(nextL);
        
    //console.log(' prepareRTL changing nextR ' + nextR + ' to left: ' + gutter);
    $(this.prefetchedImgs[nextR]).css({
        position: 'absolute',
        left:   gutter+'px',
        top:    top+'px',
        height: this.twoPage.height,
        width:  scaledW+'px',
        borderLeft: '1px solid black',
        zIndex: 1
    });

    $('#BRtwopageview').append(this.prefetchedImgs[nextR]);

    height  = this._getPageHeight(nextL); 
    width   = this._getPageWidth(nextL);      
    scaledW = this.twoPage.height*width/height;

    //console.log(' prepareRTL changing nextL ' + nextL + ' to right: ' + $('#BRcontainer').width()-gutter);
    $(this.prefetchedImgs[nextL]).css({
        position: 'absolute',
        right:   $('#BRtwopageview').attr('clientWidth')-gutter+'px',
        top:    top+'px',
        height: this.twoPage.height,
        width:  0+'px', // Start at 0 width, then grow to the left
        borderRight: '1px solid black',
        zIndex: 2
    });

    $('#BRtwopageview').append(this.prefetchedImgs[nextL]);    
            
}

// getNextLeafs() -- NOT RTL AWARE
//______________________________________________________________________________
// BookReader.prototype.getNextLeafs = function(o) {
//     //TODO: we might have two left or two right leafs in a row (damaged book)
//     //For now, assume that leafs are contiguous.
//     
//     //return [this.twoPage.currentIndexL+2, this.twoPage.currentIndexL+3];
//     o.L = this.twoPage.currentIndexL+2;
//     o.R = this.twoPage.currentIndexL+3;
// }

// getprevLeafs() -- NOT RTL AWARE
//______________________________________________________________________________
// BookReader.prototype.getPrevLeafs = function(o) {
//     //TODO: we might have two left or two right leafs in a row (damaged book)
//     //For now, assume that leafs are contiguous.
//     
//     //return [this.twoPage.currentIndexL-2, this.twoPage.currentIndexL-1];
//     o.L = this.twoPage.currentIndexL-2;
//     o.R = this.twoPage.currentIndexL-1;
// }

// pruneUnusedImgs()
//______________________________________________________________________________
BookReader.prototype.pruneUnusedImgs = function() {
    //console.log('current: ' + this.twoPage.currentIndexL + ' ' + this.twoPage.currentIndexR);
    for (var key in this.prefetchedImgs) {
        //console.log('key is ' + key);
        if ((key != this.twoPage.currentIndexL) && (key != this.twoPage.currentIndexR)) {
            // console.log('removing key '+ key);
            $(this.prefetchedImgs[key]).detach();
        }
        if ((key < this.twoPage.currentIndexL-4) || (key > this.twoPage.currentIndexR+4)) {
            // console.log('deleting key '+ key);
            delete this.prefetchedImgs[key];
        }
    }
}

BookReader.prototype.queuePrefetchImg = function(index) {
  var self = this;
  
  if ( this.twoPage.queue === undefined ) {
    this.twoPage.queue = [];
  }
  this.twoPage.queue.push(index);
  
  // if ( this.twoPage.queueTimer === undefined ) {
  //   this.twoPage.queueTimer = setInterval(function() {
  //     self.processPrefetchQueue();
  //   }, 500);
  // }
}

BookReader.prototype.processPrefetchQueue = function() {
  if ( this.twoPage.queue === undefined ) {
    return;
  }
  if ( this.twoPage.queue.length == 0 ) {
    return;
  }
  if ( this.twoPage.queue_halted ) {
    // just in case we're halted?
    console.log("PREFETCH IS HALTED!!");
    return;
  }
  
  var n = $(".prefetch2up").length;
  if ( n >= 2 ) {
    // don't fetch too many at once!
    console.log("TOO MANY BEING FETCHED: ", n);
    return;
  }
  
  var index = this.twoPage.queue.pop();
  console.log("PREFETCHING:", index, n);
  this.prefetchImg(index);
}

BookReader.prototype.suspendQueue = function() {
  this.twoPage.queue_halted = true;
}

BookReader.prototype.resumeQueue = function() {
  this.twoPage.queue_halted = false;
}

// prefetch()
//______________________________________________________________________________
BookReader.prototype.prefetch = function() {

    // $$$ We should check here if the current indices have finished
    //     loading (with some timeout) before loading more page images
    //     See https://bugs.edge.launchpad.net/bookreader/+bug/511391

    // prefetch visible pages first
    this.prefetchImg(this.twoPage.currentIndexL);
    this.prefetchImg(this.twoPage.currentIndexR);
        
    var adjacentPagesToLoad = 3;
    
    var lowCurrent = Math.min(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
    var highCurrent = Math.max(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
        
    var start = Math.max(lowCurrent - adjacentPagesToLoad, 0);
    var end = Math.min(highCurrent + adjacentPagesToLoad, this.numLeafs - 1);
    
    // Load images spreading out from current
    for (var i = 1; i <= adjacentPagesToLoad; i++) {
        var goingDown = lowCurrent - i;
        if (goingDown >= start) {
            //this.prefetchImg(goingDown);
            this.queuePrefetchImg(goingDown);
        }
        var goingUp = highCurrent + i;
        if (goingUp <= end) {
            //this.prefetchImg(goingUp);
            this.queuePrefetchImg(goingUp);
        }
    }
    
    this.processPrefetchQueue();

    /*
    var lim = this.twoPage.currentIndexL-4;
    var i;
    lim = Math.max(lim, 0);
    for (i = lim; i < this.twoPage.currentIndexL; i++) {
        this.prefetchImg(i);
    }
    
    if (this.numLeafs > (this.twoPage.currentIndexR+1)) {
        lim = Math.min(this.twoPage.currentIndexR+4, this.numLeafs-1);
        for (i=this.twoPage.currentIndexR+1; i<=lim; i++) {
            this.prefetchImg(i);
        }
    }
    */
}

// getPageWidth2UP()
//______________________________________________________________________________
BookReader.prototype.getPageWidth2UP = function(index) {
    // We return the width based on the dominant height
    var height  = this._getPageHeight(index); 
    var width   = this._getPageWidth(index);
    
    var r;
    // if ( height > width ) {
    // } else {
    //     r = this.twoPage.
    // }
    r = this.twoPage.height * width / height;
    
    return Math.floor(this.twoPage.height*width/height); // $$$ we assume width is relative to current spread
}    

// search()
//______________________________________________________________________________
BookReader.prototype.search = function(term) {
    term = term.replace(/\//g, ' '); // strip slashes
    this.searchTerm = term;
    $('#BookReaderSearchScript').remove();
    var script  = document.createElement("script");
    script.setAttribute('id', 'BookReaderSearchScript');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", 'http://'+this.server+'/BookReader/flipbook_search_br.php?url='+escape(this.bookPath + '_djvu.xml')+'&term='+term+'&format=XML&callback=br.BRSearchCallback');
    document.getElementsByTagName('head')[0].appendChild(script);
    $('#BookReaderSearchBox').val(term);
    $('#BookReaderSearchResults').html('Searching...');
}

// BRSearchCallback()
//______________________________________________________________________________
BookReader.prototype.BRSearchCallback = function(txt) {
    //alert(txt);
    if (jQuery.browser.msie) {
        var dom=new ActiveXObject("Microsoft.XMLDOM");
        dom.async="false";
        dom.loadXML(txt);    
    } else {
        var parser = new DOMParser();
        var dom = parser.parseFromString(txt, "text/xml");    
    }
    
    $('#BookReaderSearchResults').empty();    
    $('#BookReaderSearchResults').append('<ul>');
    
    for (var key in this.searchResults) {
        if (null != this.searchResults[key].div) {
            $(this.searchResults[key].div).remove();
        }
        delete this.searchResults[key];
    }
    
    var pages = dom.getElementsByTagName('PAGE');
    
    if (0 == pages.length) {
        // $$$ it would be nice to echo the (sanitized) search result here
        $('#BookReaderSearchResults').append('<li>No search results found</li>');
    } else {    
        for (var i = 0; i < pages.length; i++){
            //console.log(pages[i].getAttribute('file').substr(1) +'-'+ parseInt(pages[i].getAttribute('file').substr(1), 10));
    
            
            var re = new RegExp (/_(\d{4})\.djvu/);
            var reMatch = re.exec(pages[i].getAttribute('file'));
            var index = parseInt(reMatch[1], 10);
            //var index = parseInt(pages[i].getAttribute('file').substr(1), 10);
            
            var children = pages[i].childNodes;
            var context = '';
            for (var j=0; j<children.length; j++) {
                //console.log(j + ' - ' + children[j].nodeName);
                //console.log(children[j].firstChild.nodeValue);
                if ('CONTEXT' == children[j].nodeName) {
                    context += children[j].firstChild.nodeValue;
                } else if ('WORD' == children[j].nodeName) {
                    context += '<b>'+children[j].firstChild.nodeValue+'</b>';
                    
                    var index = this.leafNumToIndex(index);
                    if (null != index) {
                        //coordinates are [left, bottom, right, top, [baseline]]
                        //we'll skip baseline for now...
                        var coords = children[j].getAttribute('coords').split(',',4);
                        if (4 == coords.length) {
                            this.searchResults[index] = {'l':parseInt(coords[0]), 'b':parseInt(coords[1]), 'r':parseInt(coords[2]), 't':parseInt(coords[3]), 'div':null};
                        }
                    }
                }
            }
            var pageName = this.getPageName(index);
            var middleX = (this.searchResults[index].l + this.searchResults[index].r) >> 1;
            var middleY = (this.searchResults[index].t + this.searchResults[index].b) >> 1;
            //TODO: remove hardcoded instance name
            $('#BookReaderSearchResults').append('<li><b><a href="javascript:br.jumpToIndex('+index+','+middleX+','+middleY+');">' + pageName + '</a></b> - ' + context + '</li>');
        }
    }
    $('#BookReaderSearchResults').append('</ul>');

    // $$$ update again for case of loading search URL in new browser window (search box may not have been ready yet)
    $('#BookReaderSearchBox').val(this.searchTerm);

    this.updateSearchHilites();
}

// updateSearchHilites()
//______________________________________________________________________________
BookReader.prototype.updateSearchHilites = function() {
    if (2 == this.mode) {
        this.updateSearchHilites2UP();
    } else {
        this.updateSearchHilites1UP();
    }
}

// showSearchHilites1UP()
//______________________________________________________________________________
BookReader.prototype.updateSearchHilites1UP = function() {

    for (var key in this.searchResults) {
        
        if (jQuery.inArray(parseInt(key), this.displayedIndices) >= 0) {
            var result = this.searchResults[key];
            if (null == result.div) {
                result.div = document.createElement('div');
                $(result.div).attr('className', 'BookReaderSearchHilite').appendTo('#pagediv'+key);
                //console.log('appending ' + key);
            }    
            $(result.div).css({
                width:  (result.r-result.l)/this.reduce + 'px',
                height: (result.b-result.t)/this.reduce + 'px',
                left:   (result.l)/this.reduce + 'px',
                top:    (result.t)/this.reduce +'px'
            });

        } else {
            //console.log(key + ' not displayed');
            this.searchResults[key].div=null;
        }
    }
}

// twoPageGutter()
//______________________________________________________________________________
// Returns the position of the gutter (line between the page images)
BookReader.prototype.twoPageGutter = function() {
    return this.twoPage.middle + this.gutterOffsetForIndex(this.twoPage.currentIndexL);
}

// twoPageTop()
//______________________________________________________________________________
// Returns the offset for the top of the page images
BookReader.prototype.twoPageTop = function() {
    return this.twoPage.coverExternalPadding + this.twoPage.coverInternalPadding; // $$$ + border?
}

// twoPageCoverWidth()
//______________________________________________________________________________
// Returns the width of the cover div given the total page width
BookReader.prototype.twoPageCoverWidth = function(totalPageWidth) {
    return totalPageWidth + this.twoPage.edgeWidth + 2*this.twoPage.coverInternalPadding;
}

// twoPageGetViewCenter()
//______________________________________________________________________________
// Returns the percentage offset into twopageview div at the center of container div
// { percentageX: float, percentageY: float }
BookReader.prototype.twoPageGetViewCenter = function() {
    var center = {};

    var containerOffset = $('#BRcontainer').offset();
    var viewOffset = $('#BRtwopageview').offset();
    center.percentageX = (containerOffset.left - viewOffset.left + ($('#BRcontainer').attr('clientWidth') >> 1)) / this.twoPage.totalWidth;
    center.percentageY = (containerOffset.top - viewOffset.top + ($('#BRcontainer').attr('clientHeight') >> 1)) / this.twoPage.totalHeight;
    
    return center;
}

// twoPageCenterView(percentageX, percentageY)
//______________________________________________________________________________
// Centers the point given by percentage from left,top of twopageview
BookReader.prototype.twoPageCenterView = function(percentageX, percentageY) {
    if ('undefined' == typeof(percentageX)) {
        percentageX = 0.5;
    }
    if ('undefined' == typeof(percentageY)) {
        percentageY = 0.5;
    }

    var viewWidth = $('#BRtwopageview').width();
    var containerClientWidth = $('#BRcontainer').attr('clientWidth');
    var intoViewX = percentageX * viewWidth;
    
    var viewHeight = $('#BRtwopageview').height();
    var containerClientHeight = $('#BRcontainer').attr('clientHeight');
    var intoViewY = percentageY * viewHeight;
    
    if (viewWidth < containerClientWidth) {
        // Can fit width without scrollbars - center by adjusting offset
        $('#BRtwopageview').css('left', (containerClientWidth >> 1) - intoViewX + 'px');    
    } else {
        // Need to scroll to center
        $('#BRtwopageview').css('left', 0);
        $('#BRcontainer').scrollLeft(intoViewX - (containerClientWidth >> 1));
    }
    
    if (viewHeight < containerClientHeight) {
        // Fits with scrollbars - add offset
        $('#BRtwopageview').css('top', (containerClientHeight >> 1) - intoViewY + 'px');
    } else {
        $('#BRtwopageview').css('top', 0);
        $('#BRcontainer').scrollTop(intoViewY - (containerClientHeight >> 1));
    }
}

// twoPageFlipAreaHeight
//______________________________________________________________________________
// Returns the integer height of the click-to-flip areas at the edges of the book
BookReader.prototype.twoPageFlipAreaHeight = function() {
    return parseInt(this.twoPage.height);
}

// twoPageFlipAreaWidth
//______________________________________________________________________________
// Returns the integer width of the flip areas 
BookReader.prototype.twoPageFlipAreaWidth = function() {
    var max = 100; // $$$ TODO base on view width?
    var min = 10;
    
    var width = this.twoPage.width * 0.15;
    return parseInt(BookReader.util.clamp(width, min, max));
}

// twoPageFlipAreaTop
//______________________________________________________________________________
// Returns integer top offset for flip areas
BookReader.prototype.twoPageFlipAreaTop = function() {
    return parseInt(this.twoPage.bookCoverDivTop + this.twoPage.coverInternalPadding);
}

// twoPageLeftFlipAreaLeft
//______________________________________________________________________________
// Left offset for left flip area
BookReader.prototype.twoPageLeftFlipAreaLeft = function() {
    return parseInt(this.twoPage.gutter - this.twoPage.scaledWL);
}

// twoPageRightFlipAreaLeft
//______________________________________________________________________________
// Left offset for right flip area
BookReader.prototype.twoPageRightFlipAreaLeft = function() {
    return parseInt(this.twoPage.gutter + this.twoPage.scaledWR - this.twoPageFlipAreaWidth());
}

// twoPagePlaceFlipAreas
//______________________________________________________________________________
// Readjusts position of flip areas based on current layout
BookReader.prototype.twoPagePlaceFlipAreas = function() {
    // We don't set top since it shouldn't change relative to view
    $(this.twoPage.leftFlipArea).css({
        left: this.twoPageLeftFlipAreaLeft() + 'px',
        width: this.twoPageFlipAreaWidth() + 'px'
    });
    $(this.twoPage.rightFlipArea).css({
        left: this.twoPageRightFlipAreaLeft() + 'px',
        width: this.twoPageFlipAreaWidth() + 'px'
    });
}
    
// showSearchHilites2UP()
//______________________________________________________________________________
BookReader.prototype.updateSearchHilites2UP = function() {

    for (var key in this.searchResults) {
        key = parseInt(key, 10);
        if (jQuery.inArray(key, this.displayedIndices) >= 0) {
            var result = this.searchResults[key];
            if (null == result.div) {
                result.div = document.createElement('div');
                $(result.div).attr('className', 'BookReaderSearchHilite').css('zIndex', 3).appendTo('#BRtwopageview');
                //console.log('appending ' + key);
            }

            // We calculate the reduction factor for the specific page because it can be different
            // for each page in the spread
            var height = this._getPageHeight(key);
            var width  = this._getPageWidth(key)
            var reduce = this.twoPage.height/height;
            var scaledW = parseInt(width*reduce);
            
            var gutter = this.twoPageGutter();
            var pageL;
            if ('L' == this.getPageSide(key)) {
                pageL = gutter-scaledW;
            } else {
                pageL = gutter;
            }
            var pageT  = this.twoPageTop();
            
            $(result.div).css({
                width:  (result.r-result.l)*reduce + 'px',
                height: (result.b-result.t)*reduce + 'px',
                left:   pageL+(result.l)*reduce + 'px',
                top:    pageT+(result.t)*reduce +'px'
            });

        } else {
            //console.log(key + ' not displayed');
            if (null != this.searchResults[key].div) {
                //console.log('removing ' + key);
                $(this.searchResults[key].div).remove();
            }
            this.searchResults[key].div=null;
        }
    }
}

// removeSearchHilites()
//______________________________________________________________________________
BookReader.prototype.removeSearchHilites = function() {
    for (var key in this.searchResults) {
        if (null != this.searchResults[key].div) {
            $(this.searchResults[key].div).remove();
            this.searchResults[key].div=null;
        }        
    }
}

// printPage
//______________________________________________________________________________
BookReader.prototype.printPage = function() {
    window.open(this.getPrintURI(), 'printpage', 'width=400, height=500, resizable=yes, scrollbars=no, toolbar=no, location=no');
}

// Get print URI from current indices and mode
BookReader.prototype.getPrintURI = function() {
    var indexToPrint;
    if (this.constMode2up == this.mode) {
        indexToPrint = this.twoPage.currentIndexL;        
    } else {
        indexToPrint = this.firstIndex; // $$$ the index in the middle of the viewport would make more sense
    }
    
    var options = 'id=' + this.subPrefix + '&server=' + this.server + '&zip=' + this.zip
        + '&format=' + this.imageFormat + '&file=' + this._getPageFile(indexToPrint)
        + '&width=' + this._getPageWidth(indexToPrint) + '&height=' + this._getPageHeight(indexToPrint);
   
    if (this.constMode2up == this.mode) {
        options += '&file2=' + this._getPageFile(this.twoPage.currentIndexR) + '&width2=' + this._getPageWidth(this.twoPage.currentIndexR);
        options += '&height2=' + this._getPageHeight(this.twoPage.currentIndexR);
        options += '&title=' + encodeURIComponent(this.shortTitle(50) + ' - Pages ' + this.getPageNum(this.twoPage.currentIndexL) + ', ' + this.getPageNum(this.twoPage.currentIndexR));
    } else {
        options += '&title=' + encodeURIComponent(this.shortTitle(50) + ' - Page ' + this.getPageNum(indexToPrint));
    }

    return '/bookreader/print.php?' + options;
}

/* iframe implementation
BookReader.prototype.getPrintFrameContent = function(index) {    
    // We fit the image based on an assumed A4 aspect ratio.  A4 is a bit taller aspect than
    // 8.5x11 so we should end up not overflowing on either paper size.
    var paperAspect = 8.5 / 11;
    var imageAspect = this._getPageWidth(index) / this._getPageHeight(index);
    
    var rotate = 0;
    
    // Rotate if possible and appropriate, to get larger image size on printed page
    if (this.canRotatePage(index)) {
        if (imageAspect > 1 && imageAspect > paperAspect) {
            // more wide than square, and more wide than paper
            rotate = 90;
            imageAspect = 1/imageAspect;
        }
    }
    
    var fitAttrs;
    if (imageAspect > paperAspect) {
        // wider than paper, fit width
        fitAttrs = 'width="95%"';
    } else {
        // taller than paper, fit height
        fitAttrs = 'height="95%"';
    }

    var imageURL = this._getPageURI(index, 1, rotate);
    var iframeStr = '<html style="padding: 0; border: 0; margin: 0"><head><title>' + this.bookTitle + '</title></head><body style="padding: 0; border:0; margin: 0">';
    iframeStr += '<div style="text-align: center; width: 99%; height: 99%; overflow: hidden;">';
    iframeStr +=   '<img src="' + imageURL + '" ' + fitAttrs + ' />';
    iframeStr += '</div>';
    iframeStr += '</body></html>';
    
    return iframeStr;
}

BookReader.prototype.updatePrintFrame = function(delta) {
    var newIndex = this.indexToPrint + delta;
    newIndex = BookReader.util.clamp(newIndex, 0, this.numLeafs - 1);
    if (newIndex == this.indexToPrint) {
        return;
    }
    this.indexToPrint = newIndex;
    var doc = BookReader.util.getIFrameDocument($('#printFrame')[0]);
    $('body', doc).html(this.getPrintFrameContent(this.indexToPrint));
}
*/

// showEmbedCode()
//______________________________________________________________________________
BookReader.prototype.showEmbedCode = function() {
    if (null != this.embedPopup) { // check if already showing
        return;
    }
    this.autoStop();
    this.embedPopup = document.createElement("div");
    $(this.embedPopup).css({
        position: 'absolute',
        top:      '20px',
        left:     ($('#BRcontainer').attr('clientWidth')-400)/2 + 'px',
        width:    '400px',
        padding:  "20px",
        border:   "3px double #999999",
        zIndex:   3,
        backgroundColor: "#fff"
    }).appendTo('#BookReader');

    htmlStr =  '<p style="text-align:center;"><b>Embed Bookreader in your blog!</b></p>';
    htmlStr += '<p>The bookreader uses iframes for embedding. It will not work on web hosts that block iframes. The embed feature has been tested on blogspot.com blogs as well as self-hosted Wordpress blogs. This feature will NOT work on wordpress.com blogs.</p>';
    htmlStr += '<p>Embed Code: <input type="text" size="40" value="' + this.getEmbedCode() + '"></p>';
    htmlStr += '<p style="text-align:center;"><a href="" onclick="br.embedPopup = null; $(this.parentNode.parentNode).remove(); return false">Close popup</a></p>';    

    this.embedPopup.innerHTML = htmlStr;
    $(this.embedPopup).find('input').bind('click', function() {
        this.select();
    })
}

// autoToggle()
//______________________________________________________________________________
BookReader.prototype.autoToggle = function() {

    var bComingFrom1up = false;
    if (2 != this.mode) {
        bComingFrom1up = true;
        this.switchMode(2);
    }
    
    // Change to autofit if book is too large
    if (this.reduce < this.twoPageGetAutofitReduce()) {
        this.zoom2up('auto');
    }

    var self = this;
    if (null == this.autoTimer) {
        this.flipSpeed = 2000;
        
        // $$$ Draw events currently cause layout problems when they occur during animation.
        //     There is a specific problem when changing from 1-up immediately to autoplay in RTL so
        //     we workaround for now by not triggering immediate animation in that case.
        //     See https://bugs.launchpad.net/gnubook/+bug/328327
        if (('rl' == this.pageProgression) && bComingFrom1up) {
            // don't flip immediately -- wait until timer fires
        } else {
            // flip immediately
            this.flipFwdToIndex();        
        }

        $('#BRtoolbar .play').hide();
        $('#BRtoolbar .pause').show();
        this.autoTimer=setInterval(function(){
            if (self.animating) {return;}
            
            if (Math.max(self.twoPage.currentIndexL, self.twoPage.currentIndexR) >= self.lastDisplayableIndex()) {
                self.flipBackToIndex(1); // $$$ really what we want?
            } else {            
                self.flipFwdToIndex();
            }
        },5000);
    } else {
        this.autoStop();
    }
}

// autoStop()
//______________________________________________________________________________
// Stop autoplay mode, allowing animations to finish
BookReader.prototype.autoStop = function() {
    if (null != this.autoTimer) {
        clearInterval(this.autoTimer);
        this.flipSpeed = 'fast';
        $('#BRtoolbar .pause').hide();
        $('#BRtoolbar .play').show();
        this.autoTimer = null;
    }
}

// stopFlipAnimations
//______________________________________________________________________________
// Immediately stop flip animations.  Callbacks are triggered.
BookReader.prototype.stopFlipAnimations = function() {

    this.autoStop(); // Clear timers

    // Stop animation, clear queue, trigger callbacks
    if (this.leafEdgeTmp) {
        $(this.leafEdgeTmp).stop(false, true);
    }
    jQuery.each(this.prefetchedImgs, function() {
        $(this).stop(false, true);
        });

    // And again since animations also queued in callbacks
    if (this.leafEdgeTmp) {
        $(this.leafEdgeTmp).stop(false, true);
    }
    jQuery.each(this.prefetchedImgs, function() {
        $(this).stop(false, true);
        });
   
}

// keyboardNavigationIsDisabled(event)
//   - returns true if keyboard navigation should be disabled for the event
//______________________________________________________________________________
BookReader.prototype.keyboardNavigationIsDisabled = function(event) {
    if (event.target.tagName == "INPUT") {
        return true;
    }   
    return false;
}

// gutterOffsetForIndex
//______________________________________________________________________________
//
// Returns the gutter offset for the spread containing the given index.
// This function supports RTL
BookReader.prototype.gutterOffsetForIndex = function(pindex) {

    // To find the offset of the gutter from the middle we calculate our percentage distance
    // through the book (0..1), remap to (-0.5..0.5) and multiply by the total page edge width
    var offset = parseInt(((pindex / this.numLeafs) - 0.5) * this.twoPage.edgeWidth);
    
    // But then again for RTL it's the opposite
    if ('rl' == this.pageProgression) {
        offset = -offset;
    }
    
    return offset;
}

// leafEdgeWidth
//______________________________________________________________________________
// Returns the width of the leaf edge div for the page with index given
BookReader.prototype.leafEdgeWidth = function(pindex) {
    // $$$ could there be single pixel rounding errors for L vs R?
    if ((this.getPageSide(pindex) == 'L') && (this.pageProgression != 'rl')) {
        return parseInt( (pindex/this.numLeafs) * this.twoPage.edgeWidth + 0.5);
    } else {
        return parseInt( (1 - pindex/this.numLeafs) * this.twoPage.edgeWidth + 0.5);
    }
}

// jumpIndexForLeftEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the left page edge div)
BookReader.prototype.jumpIndexForLeftEdgePageX = function(pageX) {
    if ('rl' != this.pageProgression) {
        // LTR - flipping backward
        var jumpIndex = this.twoPage.currentIndexL - ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;

        // browser may have resized the div due to font size change -- see https://bugs.launchpad.net/gnubook/+bug/333570        
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexL - 2);
        return jumpIndex;

    } else {
        var jumpIndex = this.twoPage.currentIndexL + ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexL + 2, this.lastDisplayableIndex());
        return jumpIndex;
    }
}

// jumpIndexForRightEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the right page edge div)
BookReader.prototype.jumpIndexForRightEdgePageX = function(pageX) {
    if ('rl' != this.pageProgression) {
        // LTR
        var jumpIndex = this.twoPage.currentIndexR + (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexR + 2, this.lastDisplayableIndex());
        return jumpIndex;
    } else {
        var jumpIndex = this.twoPage.currentIndexR - (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexR - 2);
        return jumpIndex;
    }
}

BookReader.prototype.initToolbar = function(mode, ui) {

    $("#BookReader").append("<div id='BRtoolbar'>"
        + "<span id='BRtoolbarbuttons' style='float: right'>"
        +   "<button class='BRicon print rollover' /> <button class='BRicon rollover embed' />"
        +   "<form class='BRpageform' action='javascript:' onsubmit='br.jumpToPage(this.elements[0].value)'> <span class='label'>Page:<input id='BRpagenum' type='text' size='3' onfocus='br.autoStop();'></input></span></form>"
        +   "<div class='BRtoolbarmode2' style='display: none'><button class='BRicon rollover book_leftmost' /><button class='BRicon rollover book_left' /><button class='BRicon rollover book_right' /><button class='BRicon rollover book_rightmost' /></div>"
        +   "<div class='BRtoolbarmode1' style='display: none'><button class='BRicon rollover book_top' /><button class='BRicon rollover book_up' /> <button class='BRicon rollover book_down' /><button class='BRicon rollover book_bottom' /></div>"
        +   "<div class='BRtoolbarmode3' style='display: none'><button class='BRicon rollover book_top' /><button class='BRicon rollover book_up' /> <button class='BRicon rollover book_down' /><button class='BRicon rollover book_bottom' /></div>"
        +   "<button class='BRicon rollover play' /><button class='BRicon rollover pause' style='display: none' />"
        + "</span>"
        
        + "<span>"
        +   "<a class='BRicon logo rollover' href='" + this.logoURL + "'>&nbsp;</a>"
        +   " <button class='BRicon rollover zoom_out' onclick='br.zoom(-1); return false;'/>" 
        +   "<button class='BRicon rollover zoom_in' onclick='br.zoom(1); return false;'/>"
        +   " <span class='label'>Zoom: <span id='BRzoom'>"+parseInt(100/this.reduce)+"</span></span>"
        +   " <button class='BRicon rollover one_page_mode' onclick='br.switchMode(1); return false;'/>"
        +   " <button class='BRicon rollover two_page_mode' onclick='br.switchMode(2); return false;'/>"
        +   " <button class='BRicon rollover thumbnail_mode' onclick='br.switchMode(3); return false;'/>"
        + "</span>"
        
        + "<span id='#BRbooktitle'>"
        +   "&nbsp;&nbsp;<a class='BRblack title' href='"+this.bookUrl+"' target='_blank'>"+this.bookTitle+"</a>"
        + "</span>"
        + "</div>");
    
    this.updateToolbarZoom(this.reduce); // Pretty format
        
    if (ui == "embed" || ui == "touch") {
        $("#BookReader a.logo").attr("target","_blank");
    }

    // $$$ turn this into a member variable
    var jToolbar = $('#BRtoolbar'); // j prefix indicates jQuery object
    
    // We build in mode 2
    jToolbar.append();

    this.bindToolbarNavHandlers(jToolbar);
    
    // Setup tooltips -- later we could load these from a file for i18n
    var titles = { '.logo': 'Go to Archive.org',
                   '.zoom_in': 'Zoom in',
                   '.zoom_out': 'Zoom out',
                   '.one_page_mode': 'One-page view',
                   '.two_page_mode': 'Two-page view',
                   '.thumbnail_mode': 'Thumbnail view',
                   '.print': 'Print this page',
                   '.embed': 'Embed bookreader',
                   '.book_left': 'Flip left',
                   '.book_right': 'Flip right',
                   '.book_up': 'Page up',
                   '.book_down': 'Page down',
                   '.play': 'Play',
                   '.pause': 'Pause',
                   '.book_top': 'First page',
                   '.book_bottom': 'Last page'
                  };
    if ('rl' == this.pageProgression) {
        titles['.book_leftmost'] = 'Last page';
        titles['.book_rightmost'] = 'First page';
    } else { // LTR
        titles['.book_leftmost'] = 'First page';
        titles['.book_rightmost'] = 'Last page';
    }
                  
    for (var icon in titles) {
        jToolbar.find(icon).attr('title', titles[icon]);
    }
    
    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
        jToolbar.find('.two_page_mode, .play, .pause').hide();
    }
    if ( !this.canSwitchToMode(this.constModeThumb) ) {
        jToolbar.find('.thumbnail_mode').hide();
    }
    
    // Hide one page button if it is the only mode available
    if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
        jToolbar.find('.one_page_mode').hide();
    }

    // Switch to requested mode -- binds other click handlers
    this.switchToolbarMode(mode);
    
}


// switchToolbarMode
//______________________________________________________________________________
// Update the toolbar for the given mode (changes navigation buttons)
// $$$ we should soon split the toolbar out into its own module
BookReader.prototype.switchToolbarMode = function(mode) { 
    if (1 == mode) {
        // 1-up
        $('#BRtoolbar .BRtoolbarzoom').show().css('display', 'inline');
        $('#BRtoolbar .BRtoolbarmode2').hide();
        $('#BRtoolbar .BRtoolbarmode3').hide();
        $('#BRtoolbar .BRtoolbarmode1').show().css('display', 'inline');
    } else if (2 == mode) {
        // 2-up
        $('#BRtoolbar .BRtoolbarzoom').show().css('display', 'inline');
        $('#BRtoolbar .BRtoolbarmode1').hide();
        $('#BRtoolbar .BRtoolbarmode3').hide();
        $('#BRtoolbar .BRtoolbarmode2').show().css('display', 'inline');
    } else {
        // 3-up    
        $('#BRtoolbar .BRtoolbarzoom').hide();
        $('#BRtoolbar .BRtoolbarmode2').hide();
        $('#BRtoolbar .BRtoolbarmode1').hide();
        $('#BRtoolbar .BRtoolbarmode3').show().css('display', 'inline');
    }
}

// bindToolbarNavHandlers
//______________________________________________________________________________
// Binds the toolbar handlers
BookReader.prototype.bindToolbarNavHandlers = function(jToolbar) {

    var self = this; // closure

    jToolbar.find('.book_left').bind('click', function(e) {
        self.left();
        return false;
    });
         
    jToolbar.find('.book_right').bind('click', function(e) {
        self.right();
        return false;
    });
        
    jToolbar.find('.book_up').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollUp();
        } else {
            self.prev();
        }
        return false;
    });        
        
    jToolbar.find('.book_down').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollDown();
        } else {
            self.next();
        }
        return false;
    });

    jToolbar.find('.print').bind('click', function(e) {
        self.printPage();
        return false;
    });
        
    jToolbar.find('.embed').bind('click', function(e) {
        self.showEmbedCode();
        return false;
    });

    jToolbar.find('.play').bind('click', function(e) {
        self.autoToggle();
        return false;
    });

    jToolbar.find('.pause').bind('click', function(e) {
        self.autoToggle();
        return false;
    });
    
    jToolbar.find('.book_top').bind('click', function(e) {
        self.first();
        return false;
    });

    jToolbar.find('.book_bottom').bind('click', function(e) {
        self.last();
        return false;
    });
    
    jToolbar.find('.book_leftmost').bind('click', function(e) {
        self.leftmost();
        return false;
    });
  
    jToolbar.find('.book_rightmost').bind('click', function(e) {
        self.rightmost();
        return false;
    });
}

// updateToolbarZoom(reduce)
//______________________________________________________________________________
// Update the displayed zoom factor based on reduction factor
BookReader.prototype.updateToolbarZoom = function(reduce) {
    var value;
    var autofit = null;

    // $$$ TODO preserve zoom/fit for each mode
    if (this.mode == this.constMode2up) {
        autofit = this.twoPage.autofit;
    } else {
        autofit = this.onePage.autofit;
    }
    
    if (autofit && isNaN(autofit)) {
        // value = String(autofit).slice(0,1).toUpperCase() + String(autofit).slice(1);
        value = autofit.slice(0,1).toUpperCase() + autofit.slice(1);
    } else {
        value = (100 / reduce).toFixed(2);
        // Strip trailing zeroes and decimal if all zeroes
        value = value.replace(/0+$/,'');
        value = value.replace(/\.$/,'');
        value += '%';
    }
    $('#BRzoom').text(value);
}

// firstDisplayableIndex
//______________________________________________________________________________
// Returns the index of the first visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as part of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.firstDisplayableIndex = function() {
    if (this.mode != this.constMode2up) {
        return 0;
    }
    
    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(0) == 'L') {
            return 0;
        } else {
            return -1;
        }
    } else {
        // RTL
        if (this.getPageSide(0) == 'R') {
            return 0;
        } else {
            return -1;
        }
    }
}

// lastDisplayableIndex
//______________________________________________________________________________
// Returns the index of the last visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as pa  rt of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.lastDisplayableIndex = function() {

    var lastIndex = this.numLeafs - 1;
    
    if (this.mode != this.constMode2up) {
        return lastIndex;
    }

    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(lastIndex) == 'R') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    } else {
        // RTL
        if (this.getPageSide(lastIndex) == 'L') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    }
}

// shortTitle(maximumCharacters)
//________
// Returns a shortened version of the title with the maximum number of characters
BookReader.prototype.shortTitle = function(maximumCharacters) {
    if (this.bookTitle.length < maximumCharacters) {
        return this.bookTitle;
    }
    
    var title = this.bookTitle.substr(0, maximumCharacters - 3);
    title += '...';
    return title;
}

// Parameter related functions

// updateFromParams(params)
//________
// Update ourselves from the params object.
//
// e.g. this.updateFromParams(this.paramsFromFragment(window.location.hash))
BookReader.prototype.updateFromParams = function(params) {
    if ('undefined' != typeof(params.mode)) {
        this.switchMode(params.mode);
    }

    // process /search
    if ('undefined' != typeof(params.searchTerm)) {
        if (this.searchTerm != params.searchTerm) {
            this.search(params.searchTerm);
        }
    }
    
    // $$$ process /zoom
    
    // We only respect page if index is not set
    if ('undefined' != typeof(params.index)) {
        if (params.index != this.currentIndex()) {
            this.jumpToIndex(params.index);
        }
    } else if ('undefined' != typeof(params.page)) {
        // $$$ this assumes page numbers are unique
        if (params.page != this.getPageNum(this.currentIndex())) {
            this.jumpToPage(params.page);
        }
    }
    
    // $$$ process /region
    // $$$ process /highlight
}

// paramsFromFragment(urlFragment)
//________
// Returns a object with configuration parametes from a URL fragment.
//
// E.g paramsFromFragment(window.location.hash)
BookReader.prototype.paramsFromFragment = function(urlFragment) {
    // URL fragment syntax specification: http://openlibrary.org/dev/docs/bookurls

    var params = {};
    
    // For convenience we allow an initial # character (as from window.location.hash)
    // but don't require it
    if (urlFragment.substr(0,1) == '#') {
        urlFragment = urlFragment.substr(1);
    }
    
    // Simple #nn syntax
    var oldStyleLeafNum = parseInt( /^\d+$/.exec(urlFragment) );
    if ( !isNaN(oldStyleLeafNum) ) {
        params.index = oldStyleLeafNum;
        
        // Done processing if using old-style syntax
        return params;
    }
    
    // Split into key-value pairs
    var urlArray = urlFragment.split('/');
    var urlHash = {};
    for (var i = 0; i < urlArray.length; i += 2) {
        urlHash[urlArray[i]] = urlArray[i+1];
    }
    
    // Mode
    if ('1up' == urlHash['mode']) {
        params.mode = this.constMode1up;
    } else if ('2up' == urlHash['mode']) {
        params.mode = this.constMode2up;
    } else if ('thumb' == urlHash['mode']) {
        params.mode = this.constModeThumb;
    }
    
    // Index and page
    if ('undefined' != typeof(urlHash['page'])) {
        // page was set -- may not be int
        params.page = urlHash['page'];
    }
    
    // $$$ process /region
    // $$$ process /search
    
    if (urlHash['search'] != undefined) {
        params.searchTerm = BookReader.util.decodeURIComponentPlus(urlHash['search']);
    }
    
    // $$$ process /highlight
        
    return params;
}

// paramsFromCurrent()
//________
// Create a params object from the current parameters.
BookReader.prototype.paramsFromCurrent = function() {

    var params = {};
    
    var index = this.currentIndex();
    var pageNum = this.getPageNum(index);
    if ((pageNum === 0) || pageNum) {
        params.page = pageNum;
    }
    
    params.index = index;
    params.mode = this.mode;
    
    // $$$ highlight
    // $$$ region

    // search    
    if (this.searchHighlightVisible()) {
        params.searchTerm = this.searchTerm;
    }
    
    return params;
}

// fragmentFromParams(params)
//________
// Create a fragment string from the params object.
// See http://openlibrary.org/dev/docs/bookurls for an explanation of the fragment syntax.
BookReader.prototype.fragmentFromParams = function(params) {
    var separator = '/';

    var fragments = [];
    
    if ('undefined' != typeof(params.page)) {
        fragments.push('page', params.page);
    } else {
        // Don't have page numbering -- use index instead
        fragments.push('page', 'n' + params.index);
    }
    
    // $$$ highlight
    // $$$ region
    
    // mode
    if ('undefined' != typeof(params.mode)) {    
        if (params.mode == this.constMode1up) {
            fragments.push('mode', '1up');
        } else if (params.mode == this.constMode2up) {
            fragments.push('mode', '2up');
        } else if (params.mode == this.constModeThumb) {
            fragments.push('mode', 'thumb');
        } else {
            throw 'fragmentFromParams called with unknown mode ' + params.mode;
        }
    }
    
    // search
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }
    
    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
}

// getPageIndex(pageNum)
//________
// Returns the *highest* index the given page number, or undefined
BookReader.prototype.getPageIndex = function(pageNum) {
    var pageIndices = this.getPageIndices(pageNum);
    
    if (pageIndices.length > 0) {
        return pageIndices[pageIndices.length - 1];
    }

    return undefined;
}

// getPageIndices(pageNum)
//________
// Returns an array (possibly empty) of the indices with the given page number
BookReader.prototype.getPageIndices = function(pageNum) {
    var indices = [];

    // Check for special "nXX" page number
    if (pageNum.slice(0,1) == 'n') {
        try {
            var pageIntStr = pageNum.slice(1, pageNum.length);
            var pageIndex = parseInt(pageIntStr);
            indices.push(pageIndex);
            return indices;
        } catch(err) {
            // Do nothing... will run through page names and see if one matches
        }
    }

    var i;
    for (i=0; i<this.numLeafs; i++) {
        if (this.getPageNum(i) == pageNum) {
            indices.push(i);
        }
    }
    
    return indices;
}

// getPageName(index)
//________
// Returns the name of the page as it should be displayed in the user interface
BookReader.prototype.getPageName = function(index) {
    return 'Page ' + this.getPageNum(index);
}

// updateLocationHash
//________
// Update the location hash from the current parameters.  Call this instead of manually
// using window.location.replace
BookReader.prototype.updateLocationHash = function() {
    var newHash = '#' + this.fragmentFromParams(this.paramsFromCurrent());
    window.location.replace(newHash);
    
    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;
}

// startLocationPolling
//________
// Starts polling of window.location to see hash fragment changes
BookReader.prototype.startLocationPolling = function() {
    var self = this; // remember who I am
    self.oldLocationHash = window.location.hash;
    
    if (this.locationPollId) {
        clearInterval(this.locationPollID);
        this.locationPollId = null;
    }
    
    this.locationPollId = setInterval(function() {
        var newHash = window.location.hash;
        if (newHash != self.oldLocationHash) {
            if (newHash != self.oldUserHash) { // Only process new user hash once
                //console.log('url change detected ' + self.oldLocationHash + " -> " + newHash);
                
                // Queue change if animating
                if (self.animating) {
                    self.autoStop();
                    self.animationFinishedCallback = function() {
                        self.updateFromParams(self.paramsFromFragment(newHash));
                    }                        
                } else { // update immediately
                    self.updateFromParams(self.paramsFromFragment(newHash));
                }
                self.oldUserHash = newHash;
            }
        }
    }, 500);
}

// canSwitchToMode
//________
// Returns true if we can switch to the requested mode
BookReader.prototype.canSwitchToMode = function(mode) {
    if (mode == this.constMode2up || mode == this.constModeThumb) {
        // check there are enough pages to display
        // $$$ this is a workaround for the mis-feature that we can't display
        //     short books in 2up mode
        if (this.numLeafs < 2) {
            return false;
        }
    }
    
    return true;
}

// searchHighlightVisible
//________
// Returns true if a search highlight is currently being displayed
BookReader.prototype.searchHighlightVisible = function() {
    if (this.constMode2up == this.mode) {
        if (this.searchResults[this.twoPage.currentIndexL]
                || this.searchResults[this.twoPage.currentIndexR]) {
            return true;
        }
    } else { // 1up
        if (this.searchResults[this.currentIndex()]) {
            return true;
        }
    }
    return false;
}

// _getPageWidth
//--------
// Returns the page width for the given index, or first or last page if out of range
BookReader.prototype._getPageWidth = function(index) {
    // Synthesize a page width for pages not actually present in book.
    // May or may not be the best approach.
    // If index is out of range we return the width of first or last page
    index = BookReader.util.clamp(index, 0, this.numLeafs - 1);
    return this.getPageWidth(index);
}

// _getPageHeight
//--------
// Returns the page height for the given index, or first or last page if out of range
BookReader.prototype._getPageHeight= function(index) {
    index = BookReader.util.clamp(index, 0, this.numLeafs - 1);
    return this.getPageHeight(index);
}

// _getPageURI
//--------
// Returns the page URI or transparent image if out of range
BookReader.prototype._getPageURI = function(index, reduce, rotate) {
    if (index < 0 || index >= this.numLeafs) { // Synthesize page
        return this.imagesBaseURL + "/transparent.png";
    }

    if ('undefined' == typeof(reduce)) {
        // reduce not passed in
        // $$$ this probably won't work for thumbnail mode
        var ratio = this.getPageHeight(index) / this.twoPage.height;
        var scale;
        // $$$ we make an assumption here that the scales are available pow2 (like kakadu)
        if (ratio < 2) {
            scale = 1;
        } else if (ratio < 4) {
            scale = 2;
        } else if (ratio < 8) {
            scale = 4;
        } else if (ratio < 16) {
            scale = 8;
        } else  if (ratio < 32) {
            scale = 16;
        } else {
            scale = 32;
        }
        reduce = scale;
    }
    
    return this.getPageURI(index, reduce, rotate);
}

// Library functions
BookReader.util = {
    disableSelect: function(jObject) {        
        // Bind mouse handlers
        // Disable mouse click to avoid selected/highlighted page images - bug 354239
        jObject.bind('mousedown', function(e) {
            // $$$ check here for right-click and don't disable.  Also use jQuery style
            //     for stopping propagation. See https://bugs.edge.launchpad.net/gnubook/+bug/362626
            return false;
        });
        // Special hack for IE7
        jObject[0].onselectstart = function(e) { return false; };
    },
    
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    notInArray: function(value, array) {
        // inArray returns -1 or undefined if value not in array
        return ! (jQuery.inArray(value, array) >= 0);
    },

    getIFrameDocument: function(iframe) {
        // Adapted from http://xkr.us/articles/dom/iframe-document/
        var outer = (iframe.contentWindow || iframe.contentDocument);
        return (outer.document || outer);
    },
    
    decodeURIComponentPlus: function(value) {
        // Decodes a URI component and converts '+' to ' '
        return decodeURIComponent(value).replace(/\+/g, ' ');
    },
    
    encodeURIComponentPlus: function(value) {
        // Encodes a URI component and converts ' ' to '+'
        return encodeURIComponent(value).replace(/%20/g, '+');
    }
    // The final property here must NOT have a comma after it - IE7
}

/* /htapps/roger.babel/pt/web/bookreader/BookReader/BookReader.js */
subclass(HTBookReader, BookReader);

function HTBookReader() {
    BookReader.call(this);
    this.constModeText = 4;
    this.flags = {};
    this.defaultReduce = 4;
    this.savedReduce = {'1.text' : 1};
    this.total_slices = 9999;
    this.cache_age = -1;
    this.restricted_width = this.restricted_height = 75;
    this.catalog_method = 'unzip';
    // Object to hold parameters related to 1up mode
    this.onePage = {
        autofit: 680                                     // valid values are height, width, none
    };

}

HTBookReader.prototype.sliceFromIndex = function(index) {
  return { slice : Math.floor(index / this.slice_size), index : index % this.slice_size };
}

HTBookReader.prototype.getMetaUrlParams = function(start) {
    // var params = { id : this.bookId, noscale: 0, format: "list", limit : this.slice_size };
    var params = { id : this.bookId, size: '100', format: "list", limit : this.slice_size, method : this.catalog_method };
    if ( this.flags.force !== undefined ) {
        params["force"] = this.force
    }
    params['force'] = 1;
    params['start'] = start;
    
    if ( this.flags.debug ) {
      params['debug'] = 'local';
    }
    
    return params;
}

HTBookReader.prototype.hasPageFeature = function(index, feature) {
    var slice = this.sliceFromIndex(index);
    if ( this.bookData[slice.slice] != undefined ) {
        var features = this.bookData[slice.slice]['features'][slice.index];
        if ( features == undefined ) {
          return ( feature == "MISSING_PAGE" );
        }
        return ( features.indexOf(feature) >= 0 );
    }
    return false;
}

HTBookReader.prototype.removePageFeature = function(index, feature) {
    var slice = this.sliceFromIndex(index);
    if ( this.bookData[slice.slice] != undefined ) {
        var features = this.bookData[slice.slice]['features'][slice.index];
        if ( features == undefined ) {
          return ( feature == "MISSING_PAGE" );
        }
        var feature_idx = features.indexOf(feature);
        if ( feature_idx >= 0 ) {
          features.splice(feature_idx, 1);
        }
    }
    return false;
}

HTBookReader.prototype.getPageWidth = function(index) {
    var r = this.rotationCache[index] || 0;
    var w = this.__getPageWidth(index);
    return w;
}

HTBookReader.prototype.getPageHeight = function(index) {
    var r = this.rotationCache[index] || 0;
    var h = this.__getPageHeight(index);
    if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
        var w = this.__getPageWidth(index);
        h = Math.ceil(w * ( w / h ));
    }
    return h;
}

HTBookReader.prototype.__getPageWidth = function(index) {
    var slice = this.sliceFromIndex(index);
    var w;
    
    if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['width'][slice.index]) == 'number'){
        w = this.bookData[slice.slice]['width'][slice.index];
    }else{
        if (typeof(this.widthAvg) != 'undefined'){
            w = this.widthAvg;
        }else{
            w = this.widthAvg = this.getAvgDimension('width');
        }
    }
    return w;
}

HTBookReader.prototype.__getPageHeight = function(index) {
    // calculate slice from index
    var slice = this.sliceFromIndex(index);
    
    var h;
    if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['height'][slice.index]) == 'number'){
        h = this.bookData[slice.slice]['height'][slice.index];
    } else{
        if (typeof(this.heightAvg) != 'undefined'){
            h =  this.heightAvg;
        }else{
            h = this.heightAvg = this.getAvgDimension('height');
        }
    }
    return h;
}

// Calculate averaged dimensions (used if not actual dimensions not specified)
HTBookReader.prototype.getAvgDimension = function(dimType) {
   sum = 0;
   count = 0;
   for(var slice_index = 0; slice_index < this.slices.length; slice_index++) {
       var slice = this.slices[slice_index];
       for (var index = 0; index < this.bookData[slice][dimType].length; index++) {
           if (typeof(this.bookData[slice][dimType][index]) == 'number') {
               sum += this.bookData[slice][dimType][index];
               count++;
           }
       }
       // performance: punt after 1 slice
       break;
   }
   return sum / count;
}

HTBookReader.prototype.getPingStatus = function() {
    var self = this;
    var ping_uri = this.pingURL + '?id='+this.bookId+';seq='+(this.currentIndex()+1) + ';test=' + ( new Date() ).getMinutes();
    $.get(ping_uri, function(data) {
       // look at response text; if "-" then we are no longer logged in
       if ( data == "-" ) {
           self.alertSessionExpired();
       } else {
           setTimeout(function() { self.getPingStatus() ; }, 1000);
       }
    });
}

HTBookReader.prototype.alertSessionExpired = function() {
    $.pnotify({
       pnotify_title: "Login expired",
       pnotify_notice_icon: "",
       pnotify_hide: false,
       pnotify_closer: true,
       pnotify_opacity: 1.0,
       pnotify_width: "250px",
       pnotify_history: false,
       pnotify_text: "Your authentication session has expired."
    });
}
 
// reduce defaults to 1 (no reduction)
// rotate defaults to 0 (no rotation)
HTBookReader.prototype.getPageURI = function(index, reduce, rotate) {
    var _reduce;
    var _rotate;

    if ('undefined' == typeof(reduce)) {
        _reduce = 1;
    } else {
        _reduce = reduce;
    }
    if ('undefined' == typeof(rotate)) {
        _rotate = 0;
    } else {
        _rotate = rotate;
    }
    if ( _rotate == null || _rotate == 0 ) {
        _rotate = this.rotationCache[index] || 0;
    }
    if ( this.mode == 2 ) { _rotate = 0 ; }
    
    // convert to imgsrv orient
    var _orient = 0;
    if ( _rotate == 90 ) { _orient = 1; }
    else if ( _rotate == 180 ) { _orient = 2 ; }
    else if ( _rotate == 270 ) { _orient = 3 ; }
    
    var q1 = this.getURLParameter("q1");

    var _targetWidth = Math.round(this.getMedianPageSize().width / _reduce);
    var page_uri;
    if ( this.displayMode == 'text' && this.mode == 1 ) {
        page_uri = this.url_config.text;
    } else if ( this.mode == 3 ) {
        // thumbnail
        page_uri = this.url_config.thumb;
    } else {
        page_uri = this.url_config.image;
    }
    page_uri += '?id='+this.bookId+';seq='+(index+1);
    
    if ( this.mode == 1 && this.displayMode == "text" ) {
        if ( this.q1 ) {
            page_uri += ";q1=" + this.q1;
        }
    } else {
        page_uri += ';width=' + _targetWidth + ';height=' + _targetWidth + ';orient=' + _orient;
    }
    
    if ( this.flags.debug ) {
        page_uri += ';debug=' + this.flags.debug;
    }
    if ( this.flags.attr ) {
        page_uri += ';attr=' + this.flags.attr;
    }
    
    return page_uri
}

// Returns true if page image is available rotated
HTBookReader.prototype.canRotatePage = function(index) {
    //return 'jp2' == this.imageFormat; // Assume single format for now
    return true;
}

HTBookReader.prototype.getPageSide = function(index) {
    //assume the book starts with a cover (right-hand leaf)
    //we should really get handside from scandata.xml
    
        
    // $$$ we should get this from scandata instead of assuming the accessible
    //     leafs are contiguous
    if ('rl' != this.pageProgression) {
        // If pageProgression is not set RTL we assume it is LTR
        if (0 == (index & 0x1)) {
            // Even-numbered page
            return 'R';
        } else {
            // Odd-numbered page
            return 'L';
        }
    } else {
        // RTL
        if (0 == (index & 0x1)) {
            return 'L';
        } else {
            return 'R';
        }
    }
}
 
HTBookReader.prototype.getPageNum = function(index) {
    if(index < 0) { return ; }
    var slice = this.sliceFromIndex(index);
    var pageNum = this.bookData[slice.slice]['page_num'][slice.index];
    if (pageNum) {
        return pageNum;
    } else {
        return 'n' + index;
    }
}

HTBookReader.prototype.leafNumToIndex = function(leafNum) {
    for (var slice_idx = 0; slice_idx < this.slices.length; slice_idx++) {
      var slice = this.slices[slice_idx];
      for (var index = 0; index < this.bookData[slice]['seq'].length; index++) {
          if (this.bookData[slice]['seq'][index] == leafNum) {
              return index+1;
          }
      }
    }

    return null;
}
 
// This function returns the left and right indices for the user-visible
// spread that contains the given index.  The return values may be
// null if there is no facing page or the index is invalid.
HTBookReader.prototype.getSpreadIndices = function(pindex) {
    // $$$ we could make a separate function for the RTL case and
    //      only bind it if necessary instead of always checking
    // $$$ we currently assume there are no gaps
    
    var spreadIndices = [null, null]; 
    if ('rl' == this.pageProgression) {
        // Right to Left
        if (this.getPageSide(pindex) == 'R') {
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex + 1;
        } else {
            // Given index was LHS
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex - 1;
        }
    } else {
        // Left to right
        if (this.getPageSide(pindex) == 'L') {
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex + 1;
        } else {
            // Given index was RHS
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex - 1;
        }
    }
    
    //console.log("   index %d mapped to spread %d,%d", pindex, spreadIndices[0], spreadIndices[1]);
    
    return spreadIndices;
}
 
// Remove the page number assertions for all but the highest index page with
// a given assertion.  Ensures there is only a single page "{pagenum}"
// e.g. the last page asserted as page 5 retains that assertion.
HTBookReader.prototype.uniquifyPageNums = function() {
    var seen = {};

    for (var slice_idx = this.slices.length - 1; slice_idx--; slice_idx >= 0) {
      var slice = this.slices[slice_idx];
      for (var i = this.bookData[slice]['page_num'].length - 1; i--; i >= 0) {
          var pageNum = this.bookData[slice]['page_num'][i];
          if ( !seen[pageNum] ) {
              seen[pageNum] = true;
          } else {
              this.bookData[slice]['page_num'][i] = null;
          }
      }
    }


}
 
HTBookReader.prototype.cleanupMetadata = function() {
    if ( this.numLeafs > this.total_items ) {
      this.numLeafs = this.total_items;
    }
    this.uniquifyPageNums();
}

HTBookReader.prototype.updateViewSettings = function() {
    var viewHeight = 0;
    var viewWidth  = $('#BRcontainer').attr('clientWidth');   
    for (i=0; i<this.numLeafs; i++) {
        viewHeight += parseInt(this._getPageHeight(i)/this.reduce) + this.padding; 
        var width = parseInt(this._getPageWidth(i)/this.reduce);
        if (width>viewWidth) viewWidth=width;
    }
    $('#BRpageview').height(viewHeight);
    $('#BRpageview').width(viewWidth);
    
    if(3 == this.mode) {
        // thumb view needs to be told to keep painting
        this.drawLeafsThumbnail();
    }
}

// getEmbedURL
//________
// Returns a URL for an embedded version of the current book
HTBookReader.prototype.getEmbedURL = function() {
    // We could generate a URL hash fragment here but for now we just leave at defaults
    var url = 'http://' + window.location.host + '/stream/'+this.bookId;
    if (this.subPrefix != this.bookId) { // Only include if needed
        url += '/' + this.subPrefix;
    }
    url += '?ui=embed';
    return url;
}
 
// getEmbedCode
//________
// Returns the embed code HTML fragment suitable for copy and paste
HTBookReader.prototype.getEmbedCode = function() {
    return "<iframe src='" + this.getEmbedURL() + "' width='480px' height='430px'></iframe>";
}


// OVERRIDE

// installBookDataSlice()
//______________________________________________________________________________
// Handle slices.
HTBookReader.prototype.installBookDataSlice = function(slice_index, data, do_cache) {
    if ( this.bookData == null ) {
        this.bookData = {};
        this.slices = [];
        this.numLeafs = 0;
    }
    
    if ( this.bookData[slice_index] != null ) {
      return;
    }
    
    this.bookData[slice_index] = data;
    this.slices.push(slice_index);
    
    if ( do_cache && this.cache_age > 0 ) {
        lscache.set(this.bookId + "-" + slice_index, data, this.cache_age);
    }
    
    if ( slice_index == 0 ) {
        this.titleLeaf = this.bookData[0]['first_page_sequence'];
        this.total_slices = Math.ceil(data['total_items'] / this.slice_size);
        this.total_items = data['total_items'];
        this.flags.download_progress_base = data['download_progress_base'];
        if ( this.bookData[0]['readingOrder'] == 'right-to-left' ) {
            this.pageProgression = 'rl';
        }
    }
    
    // console.log("INSTALLING", this.numLeafs, "/", slice_index, "/", this.bookData[slice_index]['seq'].length);
    this.numLeafs += this.bookData[slice_index]['seq'].length;
    this.cleanupMetadata();
    this.complete = this.slices.length == this.total_slices;
}

HTBookReader.prototype.loadBookDataSlice = function(next_slice, callback) {
    var self = this;
    
    var post_data_callback = function(next_slice, data, do_cache) {
        self.installBookDataSlice(next_slice, data, do_cache);
        if ( next_slice == 0 ) {
            self.init();
        } else {
            self.updateViewSettings();
        }
        // console.log("GRABBING NEXT SLICE", next_slice);
        self.loadBookDataSlice(next_slice + 1);
    }
    
    if(next_slice < self.total_slices) {
        var data = lscache.get(self.bookId + "-" + next_slice);
        if (data) {
            post_data_callback(next_slice, data, false);
        } else {
            var start = next_slice * this.slice_size;
            var params = self.getMetaUrlParams(start);
            
            $.getJSON(self.url_config.meta, params,
                function(data) {
                    post_data_callback(next_slice, data, true);
                }
            );
        }
    } else {
        self.complete = true;
    }
}

HTBookReader.prototype.init = function(callback) {
    var self = this;
    var startIndex = undefined;
    var params = this.paramsFromFragment(window.location.hash);
    
    var do_wait = false;
    if ('undefined' != typeof(params.index)) {
        startIndex = params.index;
        do_wait = true;
    } else if ('undefined' != typeof(params.page)) {
        startIndex = this.getPageIndex(params.page);
        do_wait = true;
    }
    
    if ( params.displayMode ) {
      this.displayMode = params.displayMode;
      if ( this.displayMode == "text" ) {
          // this.reduce = 1;
          this.onePage.autofit = 'width';
      }
    }
    
    var now = Date();

    if (! this.complete && do_wait) {
        console.log("INIT: WAITING FOR", now, startIndex, "/", this.complete, "/", do_wait, "/", this.sliceFromIndex(startIndex), ":", this.total_slices);
        if ( 'undefined' == typeof(startIndex) || this.sliceFromIndex(startIndex).slice < this.total_slices ) {
             var self = this;

             setTimeout(function() {
                 if ( self.notice ) {
                     self.notice.setContent("<span>Loading: " + (self.numLeafs) + " / " + self.total_items + "</span>");
                 }
                 self.init();
             }, 500);
             console.log("WAITING:", now);
             return;
        }
    }
    
    console.log("BOOK READER INIT", now);
    
    var init_delay = 0;

    if ('undefined' != typeof(params.mode)) {
        this.mode = params.mode;
    }
    
    var origMaxLoading = this.thumbMaxLoading;
    var origLazyDelay = this.lazyDelay;
    // if ( (this.mode == this.constModeThumb) && (window.location.href.indexOf("size=105") < 0) ) {
    //   init_delay = 2500;
    //   this.lazyDelay = origLazyDelay * 4;
    //   this.thumbMaxLoading = Math.round(origMaxLoading / 2);
    // }
    
    if ( init_delay ) {
      setTimeout(function() {
        self.lazyDelay = origLazyDelay;
        self.thumbMaxLoading = origMaxLoading;
      }, init_delay * 10);
    }

    if ( self.notice != null ){
        self.notice.setTitle("&#160;").setContent("<span>All finished</span>");
        setTimeout(function() {
          self.notice.unload();
        }, init_delay + 1000);
    }
    
    setTimeout(function() {
      self.initializing = true;
      BookReader.prototype.init.call(self);
      self.initializing = false;
      self.saveReduce();
      if ( callback !== undefined ) {
        callback();
      }
    }, init_delay)

    if ( this.ui == 'full' ) {        
        this.bindPageControlHandlers();
    }
    
}

HTBookReader.prototype.shortTitle = function(n) {
    return this.bookTitle;
}

HTBookReader.prototype.openNotice = function() {
  var self = this;
  
  if ( self.notice == null ) {
      
      //        "left": ($("#BookReader").width() / 2) - ($notice.width() / 2) + $("#BookReader").offset().left // ($(window).width() / 2) - (pnotify.width() / 2)
      var $notice = new Boxy("<span>Loading book data</span>", {
         show : true,
         modal : false,
         draggable : true,
         closeable : false,
         title : "Please wait" 
      });

      self.notice = $notice;
  }

}

HTBookReader.prototype.getURLParameter = function(name, href) {
    if ( href == null ) {
      href = location.search;
    }
    return unescape(
        (RegExp(name + '=' + '(.+?)(;|&|$)').exec(href)||[,null])[1]
    );
}

HTBookReader.prototype.onePageCalculateReductionFactors = function( width, height ) {
    BookReader.prototype.onePageCalculateReductionFactors.call(this, width, height);
    var autoFit = this.onePage.reductionFactors[this.onePage.reductionFactors.length - 1];
    var prefFit = this.reductionFactors[this.reductionFactors.length - 1];
    
    if ( autoFit.reduce > prefFit.reduce ) {
      // pop off
      this.onePage.reductionFactors.pop();
      this.onePage.reductionFactors[this.onePage.reductionFactors.length - 1].autofit = 'height';
    }
}


// initToolbar
HTBookReader.prototype.initToolbar = function(mode, ui) {
    // bind view buttons
    var self = this;
    $("#btnBookReader1up").click(function() {
        self.switchMode(1, this);
        self.toggleDisplayMode("image");
        return false;
    })
    
    $("#btnBookReaderText").click(function() {
        if ( ! $(this).hasClass("PTbuttonDisabled") ) {
            self.switchMode(1, this);
            self.toggleDisplayMode("text");
        }
        return false;
    })

    $("#btnBookReader2up").click(function() {
        if ( ! $(this).hasClass("PTbuttonDisabled") ) {
            try {
                self.switchMode(2, this);
            } catch(err) {
                console.log(err);
            }
        }
        return false;
    })

    $("#btnBookReaderThumbnail").click(function() {
        if ( ! $(this).hasClass("PTbuttonDisabled") ) {
            self.switchMode(3, this);
        }
        return false;
    })
    
    // zoom buttons
    $("#mdpZoomOut").click(function() {
        self.zoom(-1);
        return false;
    })

    $("#mdpZoomIn").click(function() {
        self.zoom(1);
        return false;
    })
    
    $("#mdpZoomStatus").html('<span id="BRzoom">' + parseInt(100/self.reduce) + '</span>');
    self.updateToolbarZoom(self.reduce); // Pretty format
    
    // Nav handlers
    $("#mdpLastPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.rightmost();
        } else {
            self.last();
        }
        return false;
    })

    $("#mdpFirstPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.leftmost();
        } else {
            self.first();
        }
        return false;
    })
    
    $("#mdpPreviousPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.left();
        } else {
            // self.constMode1up, self.constModeThumb
            if ($.inArray(self.mode, [self.constModeThumb]) >= 0) {
                self.scrollUp();
            } else {
                self.prev();
            }
        }
        return false;
    })
    
    $("#mdpNextPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.right();
        } else {
            // self.constMode1up, self.constModeThumb
            if ($.inArray(self.mode, [self.constModeThumb]) >= 0) {
                self.scrollDown();
            } else {
                self.next();
            }
        }
        return false;
    })


    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
        $("#btnBookReader2up").addClass("PTbuttonDisabled");
    }

    if ( !this.canSwitchToMode(this.constModeThumb) ) {
        $("#btnBookReaderThumbnail").addClass("PTbuttonDisabled");
    }

    if ( !this.flags.has_ocr ) {
        $("#btnBookReaderText").addClass("PTbuttonDisabled");
    }
    
    // // Hide one page button if it is the only mode available
    // if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
    //     jToolbar.find('.one_page_mode').hide();
    // }
    
    // re-bind jump-to-section
    $("#mdpJumpToSectionSubmit").bind('click', function() {
        var $sel = $("#mdpJumpToSection");
        var val = parseInt($sel.val());
        if ( val && val > 0 ) {
            self.jumpToIndex(val - 1);
        }
        return false;
    })
    
    $("#mdpPageForm").unbind('submit').bind('submit', function() {
        var $form = $(this);
        if ( ! FormValidation($form.get(0).num, "Please enter a page number in the box.") ) {
            return false;
        }
        var num = $form.get(0).num.value;
        // if ( num.substr(0, 1) == "n" ) {
        //     // technically a seq
        //     $form.get(0).seq.value = num.substr(1);
        //     $form.get(0).num.disabled = true;
        // }
        self.jumpToPage(num);
        return false;
    })
    
    if ( this.flags.final_access_status != 'allow' ) {
        $("#mdpToolbar").css('opacity', 0.4);
    }

    // Switch to requested mode -- binds other click handlers
    this.switchToolbarMode(mode);
    this.switchCurrentPageDownloadLinks();
    
}

// switchToolbarMode
//______________________________________________________________________________
// Update the toolbar for the given mode (changes navigation buttons)
// $$$ we should soon split the toolbar out into its own module
HTBookReader.prototype.switchToolbarMode = function(mode) { 
    
    var $e;
    $e = $(".PTbuttonActive").removeClass("PTbuttonActive").attr('title', '');
    
    if ( 1 == mode ) {
        if ( this.displayMode == 'text' ) {
            $e = $("#btnBookReaderText").addClass("PTbuttonActive");
            this.toggleZoomHandlers(false);
            this.toggleRotateHandlers(false);
            
        } else {
            $e = $("#btnBookReader1up").addClass("PTbuttonActive");
            this.toggleZoomHandlers(true);
            this.toggleRotateHandlers(true);
        }
    } else if ( 2 == mode ) {
        $e = $("#btnBookReader2up").addClass("PTbuttonActive");
        this.toggleZoomHandlers(true);
        this.toggleRotateHandlers(false);
    } else if ( 3 == mode ) {
        $e = $("#btnBookReaderThumbnail").addClass("PTbuttonActive");
        this.toggleZoomHandlers(true);
        this.toggleRotateHandlers(false);
    }
    var title = "current view";
    $e.attr('title', title);
    this.updateViewportHeader(mode);
}

HTBookReader.prototype.updateViewportHeader = function(mode) {
    var $h2 = $("h2.viewport")
    var key;
    if ( mode == 1 ) {
        key = 'header-1up';
    } else if ( mode == 2 ) {
        key = 'header-2up';
    } else {
        key = 'header-thumb';
    }
    var text = $h2.data(key) + " " + $h2.data('default-tail');
    $h2.text(text);
}

// Update titles on the magnifying glasses
HTBookReader.prototype.updateToolbarZoom = function(reduce) {
    BookReader.prototype.updateToolbarZoom.call(this, reduce);
    var reduction_factors = ( this.mode == this.constMode2up ) ? this.twoPage.reductionFactors : this.onePage.reductionFactors;
    if ( reduction_factors ) {
        var zoom_labels = [];
        zoom_labels.push(this.nextReduce(this.reduce, 'out', reduction_factors));
        zoom_labels.push(this.nextReduce(this.reduce, 'in', reduction_factors));
        for(var i = 0; i < zoom_labels.length; i++) {
            var value;
            if ( zoom_labels[i].autofit ) {
                value = zoom_labels[i].autofit;
                value = value.slice(0,1).toUpperCase() + value.slice(1); 
            } else {
                value = zoom_labels[i].reduce;
                value = (100 / value).toFixed(2);
                // Strip trailing zeroes and decimal if all zeroes
                value = value.replace(/0+$/,'');
                value = value.replace(/\.$/,'');
                value += '%';
            }
            zoom_labels[i] = value;
        }
        // $("#mdpZoomOut, #mdpZoomOut img").attr('title', "Zoom Out: " + zoom_labels[0]);
        // $("#mdpZoomIn, #mdpZoomIn img").attr('title', "Zoom In: " + zoom_labels[1]);
        $(".mdpZoomOut").text("Zoom Out: " + zoom_labels[0]);
        $(".mdpZoomIn").text("Zoom In: " + zoom_labels[1]);
    } else if ( this.mode == this.constModeThumb ) {
        $(".mdpZoomOut").text("Zoom Out: " + (this.thumbColumns + 1) );
        $(".mdpZoomIn").text("Zoom In: " + (this.thumbColumns > 1 ? this.thumbColumns - 1 : 1) );
    }
}

// Returns the width per thumbnail to display the requested number of columns
// Note: #BRpageview must already exist since its width is used to calculate the
//       thumbnail width
HTBookReader.prototype.getThumbnailWidth = function(thumbnailColumns) {
    var width = BookReader.prototype.getThumbnailWidth.call(this, thumbnailColumns);
    if ( this.flags.final_access_status != 'allow' ) {
        // calculate what the height _would_ be at this width
        var avg_height = this.getAvgDimension("height");
        var avg_width = this.getAvgDimension("width");
        var r = avg_width / avg_height;
        return this.restricted_height * r;
    }
    return width;
}

HTBookReader.prototype.getThumbnailHeight = function(thumbnailColumns) {
    var height = BookReader.prototype.getThumbnailHeight.call(this, thumbnailColumns);
    if ( this.flags.final_access_status != 'allow' ) {
        // keep this at 150
        return this.restricted_height;
    }
    return width;
}


HTBookReader.prototype.saveReduce = function() {
    var key = this.mode;
    if ( this.mode == 1 ) {
        key += "." + this.displayMode;
    }
    this.savedReduce[key] = this.reduce;
}

HTBookReader.prototype.getSavedReduce = function() {
    var key = this.mode;
    if ( this.mode == 1 ) {
        key += "." + this.displayMode;
    }
    var reduce = this.savedReduce[key];
    if ( reduce == null ) {
        if ( this.mode == 1 && this.displayMode == 'text' ) {
            reduce = 1;
        } else {
            reduce = this.defaultReduce; // default
        }
    }
    return reduce;
}

HTBookReader.prototype.switchMode = function(mode, btn) {

    if (mode == this.mode) {
        return;
    }
    
    if (!this.canSwitchToMode(mode)) {
        return;
    }

    // $(".PTbuttonActive").removeClass("PTbuttonActive");
    // $(btn).addClass("PTbuttonActive");

    this.autoStop();
    this.removeSearchHilites();
    
    // cache the existing reduce before we change mode
    this.saveReduce();

    this.mode = mode;
    this.switchToolbarMode(mode);
    this.reduce = this.getSavedReduce();
    
    // reinstate scale if moving from thumbnail view
    // $$$ TODO obsoleted by savedReduce tracking??
    // if (this.pageScale != this.reduce) {
    //     this.reduce = this.pageScale;
    // }
    
    // $$$ TODO preserve center of view when switching between mode
    //     See https://bugs.edge.launchpad.net/gnubook/+bug/416682

    // XXX maybe better to preserve zoom in each mode
    if (1 == mode) {
      
        this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'), $('#BRcontainer').attr('clientHeight'));
        // this.reduce = this.quantizeReduce(this.reduce, this.onePage.reductionFactors);
        
        // if ( this.displayMode == "text" ) {
        //   this.savedReduce[mode] = this.reduce;
        //   this.reduce = 1;
        // }
        
        this.prepareOnePageView();
    } else if (3 == mode) {
        this.reduce = this.quantizeReduce(this.reduce, this.reductionFactors);
        this.prepareThumbnailView();
    } else {
        // $$$ why don't we save autofit?
        this.twoPage.autofit = "auto"; // Take zoom level from other mode; RRE: we'd rather it didn't
        this.twoPageCalculateReductionFactors();
        
        if ( this.savedReduce[this.mode] == null ) {
            // no zoom recorded yet; default to the autofit version
            for(var i = 0; i < this.twoPage.reductionFactors.length; i++) {
                if ( this.twoPage.reductionFactors[i].autofit != null ) {
                    this.reduce = this.twoPage.reductionFactors[i].reduce;
                    this.twoPage.autofit = this.twoPage.reductionFactors[i].autofit;
                    break;
                }
            }
        } else {
            this.reduce = this.quantizeReduce(this.reduce, this.twoPage.reductionFactors);
        }
        
        this.prepareTwoPageView();
        this.twoPageCenterView(0.5, 0.5); // $$$ TODO preserve center
    }
    this.switchCurrentPageDownloadLinks();
    this.updateViewFields();

}

HTBookReader.prototype.updateViewFields = function() {
  var view = this.getViewParam({ mode : this.mode });
  $("input[name=view]").val(view);
}

HTBookReader.prototype.switchCurrentPageDownloadLinks = function() {
    var $link = $("#pagePdfLink");
    var caption = $link.text();
    $link.removeClass("disabled").fadeTo(0, 1.0);
    if ( this.mode == this.constMode2up ) {
        // add left/right download links
        var $rightLink = $link.clone().insertAfter($link).text(caption.replace("this page", "right page")).attr("id", "pageRightPdfLink");
        $link.text(caption.replace("this page", "left page"));
        
        var href = $rightLink.attr('href');
        if ( href ) {
          href = this._updateUrlFromParams(href, { seq : this.currentIndex() }, { id : '#' + $link.attr('id') });
          $rightLink.attr('href', href);
        }
    } else if ( this.mode == this.constMode1up ) {
        $("#pageRightPdfLink").remove();
        $link.text(caption.replace("left page", "this page"));
    } else {
        $("#pageRightPdfLink").remove();
        $link.text(caption.replace("left page", "this page"));
        $link.addClass('disabled').fadeTo(0, 0.4);
    }
}

// updateLocationHash
//________
// Update the location hash from the current parameters.  Call this instead of manually
// using window.location.replace

HTBookReader.prototype._updateUrlFromParams = function(href, params, options) {
    
    if ( options === null ) {
        options = {};
    }
    
    was_escaped = null;
    if ( href.indexOf("target=") > -1 ) {
        // escaped href, like the login link
        var tmp = href.split("target=");
        was_escaped = tmp.shift();
        href = unescape(tmp.join("target=")); // long shot
    }
    
    if ( params.page && ( typeof(params.page) == "number" || params.page.slice(0,1) != 'n' ) && ( options.id != '#pageRightPdfLink') ) {
        var pageParam;
        pageParam = "num=" + params.page;
        if ( href.indexOf("num=") > -1 ) {
            href = href.replace(/num=[^;]+(;?)/, pageParam + "$1");
        } else {
            href += ";" + pageParam;
        }
    } else {
        href = href.replace(/num=[^;]+(;?)/, "");
    }
    
    if ( typeof(params.index) != 'undefined' ) {
        var indexParam;
        var seq = params.index + 1;
        if ( options && options.id == "#pageRightPdfLink" ) {
            seq += 1;
        }
        indexParam = "seq=" + seq;
        if ( href.indexOf("seq=") > -1 ) {
            href = href.replace(/seq=\d+(;?)/, indexParam + "$1");
        } else {
            href += ";" + indexParam;
        }
    } else {
        href = href.replace(/seq=\d+(;?)/, "");
    }
    
    if ( options && options.view && params.mode ) {
        var viewParam;
        viewParam = "view=" + this.getViewParam(params);
        if ( href.indexOf("view=") > -1 ) {
            href = href.replace(/view=\w+(;?)/, viewParam + "$1");
        } else {
            href += ";" + viewParam;
        }
    }

    if ( was_escaped != null ) {
        href = was_escaped + "target=" + escape(href);
    } else if ( options.id == "#fullPdfLink" ) {
        // strip the seq and num from this link
        href = href.replace(/seq=\d+(;?)/, "");
        href = href.replace(/num=\w+(;?)/, "");
    }
    
    href = href.replace(/;+$/g, "");

    return href;
}

HTBookReader.prototype.updateLocationHash = function() {
    var self = this;
    
    // update the classic view link to reflect the current page number
    var params = this.paramsFromCurrent();
    
    $.each([ "#btnClassicView", "#btnClassicText", "#pagePdfLink", "#pageRightPdfLink", "#fullPdfLink", ".loginLink" ], function(idx, id) {
        var $a = $(id);
        var href = $a.attr('href');
        if ( href != null ) {
            var options = { id : id };
            if ( ( id == ".loginLink" ) || ( id == "#fullPdfLink") ) {
              options.view = true;
            }
            href = self._updateUrlFromParams(href, params, options);
            $a.attr('href', href);
        }
    })
    
    var $pageURL = $("#pageURL");
    if ( $pageURL.length ) {
      var pageurl_text = $pageURL.val();
      $pageURL.val(pageurl_text.replace(/seq=\d+/, "seq=" + (params.index + 1)));
    }

    var $input = $("input[name='return']");
    $input.val(self._updateUrlFromParams($input.val(), params, { view : true }));
    $input = $("input[name='SeqNo']");
    $input.val(params.index);

    
    if ( window.history && window.history.replaceState != null) {
        var new_href = this._updateUrlFromParams(window.location.search, params, { view : true });
        window.history.replaceState(null, document.title, new_href);
    } else {
        var newHash = '#' + this.fragmentFromParams(params);
        window.location.replace(newHash); // replace blocks the back button!
        // window.location.hash = newHash; // clutters the browser history?
    }
    
    if ( this.last_index != params.index ) {
        if ( this.last_index != null ) {
            if ( pageTracker != null ) {
                // window.location.origin?
                var params_ = this.paramsForTracking(params);
                // var href = window.location.protocol + "//" + window.location.host + window.location.pathname + "?";
                var href = window.location.pathname + "?";
                var args = ["id=" + params_.id];
                args.push("view=" + params_.view);
                args.push("orient=" + params_.orient);
                args.push("size=" + params_.size);
                
                var num = this.getPageNum(params_.seq);
                if ( typeof(num) == "number" ) {
                    args.push("num=", num);
                }
                
                args.push("seq=" + ( params_.seq + 1 ));
                href += args.join(";");
                // _gaq.push(["_trackPageview", href])
                _gaq.push(
                    ['_setAccount', pageTracker._getAccount() ],
                    ['_trackPageview', href]
                );
            }

            if ( nextTracker != null ) {
                var params_ = this.paramsForTracking(params);
                var href = window.location.protocol + "//" + window.location.host + window.location.pathname + "?";
                var href = [ location.pathname ];
                // href.push("id=" + params_.id.replace(/\//g, '|'));
                href.push("id=" + encodeURIComponent(params_.id));
                href.push("view=" + params_.view);
                href.push("seq=" + ( params_.seq + 1 ));
                href = href.join("/");
                _gaq.push(
                    ['_setAccount', nextTracker._getAccount() ],
                    ['_trackPageview', href]
                )
            }

        }
        this.last_index = params.index;
    }
    
    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;
}

HTBookReader.prototype.paramsForTracking = function(params) {
    var self = this;
    var retval = {};
    if ( params == null ) {
        params = self.paramsFromCurrent();
    }
    var orient = self.rotationCache[params.index] == null ? 0 : self.rotationCache[params.index];
    if ( orient == 90 ) { orient = 1; }
    else if ( orient == 180 ) { orient = 2 ; }
    else if ( orient == 270 ) { orient = 3 ; }
    var size = (100 / self.reduce).toFixed(2);
    
    retval.id = self.bookId;
    retval.seq = params.index;
    retval.size = size;
    retval.orient = orient;

    var $btn = $(".PTbuttonActive");
    if ( $btn.length ) {
      retval.view = $(".PTbuttonActive").attr('href').replace(/.*view=(\w+).*/, '$1');
    } else {
      retval.view = document.location.href.replace(/.*view=(\w+).*/, '$1');
    }
    
    return retval;
}

HTBookReader.prototype.paramsFromFragment = function(urlFragment) {
    var params = BookReader.prototype.paramsFromFragment.call( this, urlFragment );
    // and again
    // Split into key-value pairs
    var urlArray = urlFragment.split('/');
    var urlHash = {};
    for (var i = 0; i < urlArray.length; i += 2) {
        urlHash[urlArray[i]] = urlArray[i+1];
    }
    
    params.displayMode = 'image';
    
    if (urlHash['mode'] && urlHash['mode'] == 'text') {
        params.displayMode = 'text';
        params.mode = this.constMode1up;
    }

    params.debug = urlHash['debug'];

    return params;
}

HTBookReader.prototype.paramsFromCurrent = function() {
    var params = BookReader.prototype.paramsFromCurrent.call(this);
    params.displayMode = this.displayMode;
    return params;
}


HTBookReader.prototype.toggleDisplayMode = function(mode) {
    
    if ( this.displayMode == mode ) {
        return;
    }

    this.displayMode = mode;
    this.switchToolbarMode(this.mode);
    
    if ( this.displayMode == "text" ) {
      this.saved1upReduce = this.reduce;
      
      for(var i = 0; i < this.onePage.reductionFactors.length; i++) {
        if ( this.onePage.reductionFactors[i].reduce == 1 ) {
          this.reduce = 1;
          this.onePage.autofit = this.onePage.reductionFactors[i].autofit;
          break;
        }
      }
      
    } else {
      if ( this.saved1upReduce ) {
        for(var i = 0; i < this.onePage.reductionFactors.length; i++) {
          if ( this.onePage.reductionFactors[i].reduce == this.saved1upReduce ) {
            this.reduce = this.saved1upReduce;
            this.onePage.autofit = this.onePage.reductionFactors[i].autofit;
            break;
          }
        }
      }
    }
    
    this.prepareOnePageView();
    // this.displayedIndices = [];
    // this.drawLeafs();
}

//prepareOnePageView()
//______________________________________________________________________________
BookReader.prototype.prepareOnePageView = function() {

    // var startLeaf = this.displayedIndices[0];
    var startLeaf = this.currentIndex();
    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });
    
    $("#BRcontainer").append("<div id='BRpageview'></div>");
    var options = { ignoreTargets:['ocrText', 'rotateAction']};
    
    $('#BRcontainer').dragscrollable(options); // {preventDefault:true, ignoreTargets:['ocrText']}

    this.bindGestures($('#BRcontainer'));

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));
    
    this.resizePageView();    
    
    this.jumpToIndex(startLeaf);

    this.displayedIndices = [];
    
    this.drawLeafsOnePage();
}

HTBookReader.prototype.nextReduce = function( currentReduce, direction, reductionFactors ) {
  // if ( this.mode == this.constMode1up && this.displayMode == "text" && ( direction == "height" || direction == "width" ) ) {
  //   return { reduce : 1.0 };
  // }

    var targetWidth = parseInt(direction);
    if ( isNaN(targetWidth) ) {
        return BookReader.prototype.nextReduce.call( this, currentReduce, direction, reductionFactors );
    }

    if ( targetWidth > $("#BRcontainer").width() ) {
        targetWidth = $("#BRcontainer").width() - 10;
    }

    // Asked for specific width
    var avgW = this.getAvgDimension("width");
    var dims = {};
    for (var i = 0; i < reductionFactors.length; i++) {
        dims[i] = parseInt(avgW / reductionFactors[i].reduce);
        if ( dims[i] < targetWidth ) {
            if ( dims[i - 1] < $("#BRcontainer").width() ) {
                return reductionFactors[i - 1];
            }
            return reductionFactors[i];
        }
    }

    alert('Could not find reduction factor for direction ' + direction);
    return reductionFactors[0];
}

// fragmentFromParams(params)
//________
// Create a fragment string from the params object.
// See http://openlibrary.org/dev/docs/bookurls for an explanation of the fragment syntax.
HTBookReader.prototype.getViewParam = function(params) {
    var retval;
    if (params.mode == this.constMode1up) {
        if ( params.displayMode == "text" ) {
            retval = 'text';
        } else {
            retval = '1up';
        }
    } else if (params.mode == this.constMode2up) {
        retval = '2up';
    } else if (params.mode == this.constModeThumb) {
        retval = 'thumb';
    } else {
        throw 'getMode called with unknown mode ' + params.mode;
    }
    return retval;
}

HTBookReader.prototype.fragmentFromParams = function(params) {
    var separator = '/';

    var fragments = [];
    
    if ('undefined' != typeof(params.page)) {
        fragments.push('page', params.page);
    } else {
        // Don't have page numbering -- use index instead
        fragments.push('page', 'n' + params.index);
    }
    
    // $$$ highlight
    // $$$ region
    
    // mode
    if ('undefined' != typeof(params.mode)) {   
        fragments.push("mode", this.getViewParam(params)) ;
    }
    
    // search
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }
    
    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
}


// jumpToIndex()
//______________________________________________________________________________
HTBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
    
    if ( ! this.inTextMode ) {
        BookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
        return;
    }

    this.firstIndex=index;
    var ocr_url = this.getOcrURI(index);
    var $iframe = $('#MdpOcrFrame');
    
    var left = $iframe.css('left');
    // $iframe.animate({left: -5000}, 1000, function() {
    //     $iframe.attr('src', ocr_url);
    //     $iframe.css('left', '5000px')
    //         .animate({left : left}, 1000);
    // })
    
    $iframe.attr('src', ocr_url).addClass('loading');
    this.updatePageNumBox();
    this.updateLocationHash();
    
}

HTBookReader.prototype.updatePageNumBox = function() {
  var num = this.getPageNum(this.currentIndex());
  if ( (typeof(num) == "string") && (num.substr(0, 1) == "n" )) {
    num = '';
  }
  $("#BRpagenum").val(num);
}


function fireEvent(element,event) {
   if (document.createEvent) {
       // dispatch for firefox + others
       var evt = document.createEvent("HTMLEvents");
       evt.initEvent(event, true, true ); // event type,bubbling,cancelable
       return !element.dispatchEvent(evt);
   } else {
       // dispatch for IE
       var evt = document.createEventObject();
       return element.fireEvent('on'+event,evt)
   }
}

HTBookReader.prototype.printPage = function(index) {
    if ( index == null ) {
        index = this.currentIndex();
    }
    
    fireEvent($("a#pagePdfLink").get(0), "click");
    
    return false;
}

// reflowText()
//______________________________________________________________________________
// Reflow text within iframe. Not used.
HTBookReader.prototype.reflowText = function(div) {
    var maxFontSize = ( 40 / Math.round(this.reduce ));
    var minFontSize = ( 14 / Math.round(this.reduce ));
    if ( minFontSize < 9 ) { minFontSize = 9; }

    $(div).textfill({minFontSize:minFontSize, maxFontSize:maxFontSize});
}

// drawLeafsThumbnail()
//______________________________________________________________________________
// If seekIndex is defined, the view will be drawn with that page visible (without any
// animated scrolling)
HTBookReader.prototype.drawLeafsThumbnail = function( seekIndex ) {
    //alert('drawing leafs!');
    this.timer = null;
    
    var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer

    //console.log('top=' + scrollTop + ' bottom='+scrollBottom);

    var i;
    var leafWidth;
    var leafHeight;
    var rightPos = 0;
    var bottomPos = 0;
    var maxRight = 0;
    var currentRow = 0;
    var leafIndex = 0;
    var leafMap = [];
    
    var self = this;
    
    // Will be set to top of requested seek index, if set
    var seekTop;

    // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
    for (i=0; i<this.numLeafs; i++) {
        leafWidth = this.thumbWidth;
        if (rightPos + (leafWidth + this.padding) > viewWidth){
            currentRow++;
            rightPos = 0;
            leafIndex = 0;
        }

        if (leafMap[currentRow]===undefined) { leafMap[currentRow] = {}; }
        if (leafMap[currentRow].leafs===undefined) {
            leafMap[currentRow].leafs = [];
            leafMap[currentRow].height = 0;
            leafMap[currentRow].top = 0;
        }
        leafMap[currentRow].leafs[leafIndex] = {};
        leafMap[currentRow].leafs[leafIndex].num = i;
        leafMap[currentRow].leafs[leafIndex].left = rightPos;

        leafHeight = parseInt((this.getPageHeight(leafMap[currentRow].leafs[leafIndex].num)*this.thumbWidth)/this.getPageWidth(leafMap[currentRow].leafs[leafIndex].num), 10);
        if (leafHeight > leafMap[currentRow].height) {
            leafMap[currentRow].height = leafHeight;
        }
        if (leafIndex===0) { bottomPos += this.padding + leafMap[currentRow].height; }
        rightPos += leafWidth + this.padding;
        if (rightPos > maxRight) { maxRight = rightPos; }
        leafIndex++;
        
        if (i == seekIndex) {
            seekTop = bottomPos - this.padding - leafMap[currentRow].height;
        }
    }

    // reset the bottom position based on thumbnails
    $('#BRpageview').height(bottomPos);

    var pageViewBuffer = Math.floor(($('#BRcontainer').attr('scrollWidth') - maxRight) / 2) - 14;

    // If seekTop is defined, seeking was requested and target found
    if (typeof(seekTop) != 'undefined') {
        $('#BRcontainer').scrollTop( seekTop );
    }
        
    var scrollTop = $('#BRcontainer').attr('scrollTop');
    var scrollBottom = scrollTop + $('#BRcontainer').height();

    var leafTop = 0;
    var leafBottom = 0;
    var rowsToDisplay = [];

    // Visible leafs with least/greatest index
    var leastVisible = this.numLeafs - 1;
    var mostVisible = 0;
    
    // Determine the thumbnails in view
    for (i=0; i<leafMap.length; i++) {
        leafBottom += this.padding + leafMap[i].height;
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        if (topInView | bottomInView | middleInView) {
            //console.log('row to display: ' + j);
            rowsToDisplay.push(i);
            if (leafMap[i].leafs[0].num < leastVisible) {
                leastVisible = leafMap[i].leafs[0].num;
            }
            if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
                mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
            }
        }
        if (leafTop > leafMap[i].top) { leafMap[i].top = leafTop; }
        leafTop = leafBottom;
    }

    // create a buffer of preloaded rows before and after the visible rows
    var firstRow = rowsToDisplay[0];
    var lastRow = rowsToDisplay[rowsToDisplay.length-1];
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (lastRow+i < leafMap.length) { rowsToDisplay.push(lastRow+i); }
    }
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (firstRow-i >= 0) { rowsToDisplay.push(firstRow-i); }
    }

    // Create the thumbnail divs and images (lazy loaded)
    var j;
    var row;
    var left;
    var index;
    var div;
    var link;
    var img;
    var page;
    for (i=0; i<rowsToDisplay.length; i++) {
        if (BookReader.util.notInArray(rowsToDisplay[i], this.displayedRows)) {    
            row = rowsToDisplay[i];

            for (j=0; j<leafMap[row].leafs.length; j++) {
                index = j;
                leaf = leafMap[row].leafs[j].num;
                
                leafWidth = this.thumbWidth;
                leafHeight = parseInt((this.getPageHeight(leaf)*this.thumbWidth)/this.getPageWidth(leaf), 10);
                leafTop = leafMap[row].top;
                left = leafMap[row].leafs[index].left + pageViewBuffer;
                if ('rl' == this.pageProgression){
                    left = viewWidth - leafWidth - left;
                }
                
                var check = $("div#pagediv" + leaf);
                if(check.length > 0) { continue; }

                div = document.createElement("div");
                div.id = 'pagediv'+leaf;
                div.style.position = "absolute";
                div.className = "BRpagedivthumb";

                left += this.padding;
                $(div).css('top', leafTop + 'px');
                $(div).css('left', left+'px');
                $(div).css('width', leafWidth+'px');
                $(div).css('height', leafHeight+'px');
                //$(div).text('loading...');

                // link to page in single page mode
                link = document.createElement("a");
                $(link).data('leaf', leaf);
                $(link).bind('click', function(event) {
                    self.firstIndex = $(this).data('leaf');
                    self.switchMode(self.constMode1up);
                    event.preventDefault();
                });
                
                // $$$ we don't actually go to this URL (click is handled in handler above)
                var title = "image of page " + this.getPageNum(leaf);
                link.href = '#page/' + (this.getPageNum(leaf)) +'/mode/1up' ;
                $(link).attr({ title : title });
                $(div).append(link);
                
                $('#BRpageview').append(div);

                img = document.createElement("img");
                var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);
                
                $(img).attr('src', this.imagesBaseURL + 'transparent.png')
                    .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                    .addClass('BRlazyload')
                    // Store the URL of the image that will replace this one
                    .data('srcURL',  this._getPageURI(leaf, thumbReduce))
                    .data('index', leaf).
                    data('reduce', thumbReduce);
                $(link).append(img);
                //console.log('displaying thumbnail: ' + leaf);
            }   
        }
    }
    
    // Remove thumbnails that are not to be displayed
    var k;
    for (i=0; i<this.displayedRows.length; i++) {
        if (BookReader.util.notInArray(this.displayedRows[i], rowsToDisplay)) {
            row = this.displayedRows[i];
            
            // $$$ Safari doesn't like the comprehension
            //var rowLeafs =  [leaf.num for each (leaf in leafMap[row].leafs)];
            //console.log('Removing row ' + row + ' ' + rowLeafs);
            
            for (k=0; k<leafMap[row].leafs.length; k++) {
                index = leafMap[row].leafs[k].num;
                //console.log('Removing leaf ' + index);
                $('#pagediv'+index).remove();
            }
        } else {
            /*
            var mRow = this.displayedRows[i];
            var mLeafs = '[' +  [leaf.num for each (leaf in leafMap[mRow].leafs)] + ']';
            console.log('NOT Removing row ' + mRow + ' ' + mLeafs);
            */
        }
    }
    
    // Update which page is considered current to make sure a visible page is the current one
    var currentIndex = this.currentIndex();
    // console.log('current ' + currentIndex);
    // console.log('least visible ' + leastVisible + ' most visible ' + mostVisible);
    if (currentIndex < leastVisible) {
        this.setCurrentIndex(leastVisible);
    } else if (currentIndex > mostVisible ) {
      this.setCurrentIndex(mostVisible);
    }
    
    // if ( this.currentIndex() >= this.numLeafs ) {
    //   console.log("REDUCING THE CURRENT INDEX!!!");
    //   this.currentIndex(this.numLeafs - 1);
    // }

    this.displayedRows = rowsToDisplay.slice();
    
    // Update hash, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedRows.length > 0) {
        this.updateLocationHash();
    }

    // remove previous highlights
    $('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');
    
    // highlight current page
    $('#pagediv'+this.currentIndex()).addClass('BRpagedivthumb_highlight');
    
    this.lazyLoadThumbnails();

    // Update page number box.  $$$ refactor to function
    if (null !== this.getPageNum(this.currentIndex()))  {
      this.updatePageNumBox();
      // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
      $("#BRpagenum").val('');
    }

    this.updateToolbarZoom(this.reduce); 
}

HTBookReader.prototype._createTextElement = function(width, height) {
    e = document.createElement("div");
    $(e).addClass("ocrTextContainer");
    $(e).css('height', height + 'px');
    $(e).css('width', width + 'px');

    var ee = document.createElement("div");
    $(ee).addClass("ocrScrollBar");
    $(e).append(ee);
    
    return e;
}

HTBookReader.prototype._insertTextPane = function(data, index, e, sel) {
    var maxFontSize = ( 5 / Math.round(this.reduce ));
    var minFontSize = ( 1 / Math.round(this.reduce ));
    if ( minFontSize < 1 ) { minFontSize = 1; }
    
    var $e = $(e);

    var width = $e.width();

    var gutter = Math.floor(width / 8);

    $(data)
        .addClass('ocrText')
        .attr("id", "ocr" + index)
        .appendTo($e)
        .css({ left : gutter + 'px', width : ( gutter * 6 ) + 'px' })
        .textfill({maxFontSize : 40, sel:sel})
        
    $e
        .animate({ backgroundColor : '#ffffff', opacity: 1.0 }, "fast", function() {
            $(".ocrScrollBar", $e).css('backgroundColor', 'white');
        });
}

HTBookReader.prototype.createContentElement = function(index, reduce, width, height) {
    var self = this;
    var e;
    var url = this._getPageURI(index, reduce, 0);
    
    if ( 0 && this.hasPageFeature(index, "MISSING_PAGE") ) {

        e = this._createTextElement(width, height);
        
        // have to add the text AFTER the element is attached 
        // to the DOM
        setTimeout(function() {
            var data = 
                '<div class="noText ocrText">' +
                    '<div class="noTextAlert">MISSING PAGE</div>' +
                    '<span>This page is missing in the original.</span><br />' + 
                    '<span>Please continue to available pages.</span><br />' +
                    '<span><a target="_blank" href="http://www.hathitrust.org/help_digital_library#PageNotAvailable">See the Help page for more information.</a></span>' + 
                '</div>';

            self._insertTextPane(data, index, e);
        }, 200);

    } else if ( this.displayMode == 'image' ) {

      e = document.createElement("img");
      $(e).css('width', width+'px');
      $(e).css('height', height+'px');
      
      var lazy = new Image();
      $(lazy).one('load', function() {
        
        if ( this.height == HT.config.CHOKE_DIM && this.width == HT.config.CHOKE_DIM ) {
          $(e).addClass("choked");
          HT.monitor.run(this.src);
        }
        
        e.src = this.src;
      })
      .attr('src', url);

      var title = "image of page " + this.getPageNum(index);
      $(e).attr({ alt : title, title : title});
      e.src = this.imagesBaseURL + 'transparent.png';

      $.data(e, 'index', index);

    } else {

        var sel = 'span';
        
        e = this._createTextElement(width, height);
        
        $.get(url, null, function(data) {
            
            if ( ! data ) {
                data = 
                    '<div class="noText ocrText">' +
                        '<div class="noTextAlert">NO TEXT ON PAGE</div>' +
                        '<span>This page does not contain any text</span><br />' +
                        '<span>recoverable by the OCR engine</span>' + 
                    '</div>';
                sel = null;
            }
            
            self._insertTextPane(data, index, e, sel);

        })
        
    }
    return e;
}

HTBookReader.prototype.tweakDragParams = function() {
    $('#BRcontainer').dragscrollable({dragSelector : '.ocrScrollBar', acceptPropagatedEvent : false, preventDefault : false});
}

// ROTATE SUPPORT
$(window).scroll(function() {
    var $controls = $("#BRpageControls");
    if ( $controls.is(":visible") ) {
        $("div#BRpageControls").fadeOut(250);
    }
})

HTBookReader.prototype.rotationCache = {};
HTBookReader.prototype.rotatePage = function(idx, delta) {
    
    if (idx == null) {
        idx = this.currentIndex();
    }
    if ( delta == null ) {
        delta = 90;
    }
    var r = this.rotationCache[idx];
    if ( r == null ) {
        r = 0;
    }
    r += delta;
    
    if ( r < 0 ) {
        r += 360;
    }
    
    if ( r == 360 ) { r = 0 ; }
    this.rotationCache[idx] = r;

    // $("div.BRpagediv1up").remove();
    $("#BRpageview").empty();
    this.displayedIndices = [];
    
    this.drawLeafs();
    var self = this;
    setTimeout(function() { self.jumpToIndex(idx); }, 150);
}

HTBookReader.prototype.toggleZoomHandlers = function(on) {
  var self = this;
  var $buttons = $(".zoomAction");
  if ( on === undefined ) {
    on = ! $buttons.hasClass("PTbuttonDisabled");
  }
  if ( on ) {
    $buttons.removeClass("PTbuttonDisabled");
  } else {
    $buttons.addClass("PTbuttonDisabled");
  }
}

HTBookReader.prototype.toggleRotateHandlers = function(on) {
  var self = this;
  var $buttons = $(".rotateAction");
  if ( on === undefined ) {
    on = ! $buttons.hasClass("PTbuttonDisabled");
  }
  if ( on ) {
    $buttons.removeClass("PTbuttonDisabled");
  } else {
    $buttons.addClass("PTbuttonDisabled");
  }
}

HTBookReader.prototype.bindPageControlHandlers = function($pageControl) {
    var self = this;
    var $pageControl = $("#BRpageControls");
    
    $("a#rotate-counterclockwise").click(function(e) {
      var index = self.currentIndex();
      self.rotatePage(index, -90);
      return false;
    });

    // $("a#rotate-left").click(function(e) {
    //     var index = self._pageTarget.attr("id").replace("pagediv", "");
    //     // $pageControl.fadeOut(250, function() { $pageControl.appendTo("body") });
    //     $pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //     self.rotatePage(index, -90);
    //     return false;
    // });
    //     
    // $("a#rotate-right").click(function(e) {
    //     var index = self._pageTarget.attr("id").replace("pagediv", "");
    //     $pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //     self.rotatePage(index, 90);
    //     return false;
    // });

    $("a#rotate-clockwise").click(function(e) {
      var index = self.currentIndex();
      self.rotatePage(index, 90);
      return false;
    });
    
    // $("a#print-page").click(function(e) {
    //     var index = self._pageTarget.attr("id").replace("pagediv", "");
    //     $pageControl.fadeOut(250).appendTo("body");
    //     
    //     var pdf_uri = $("#pagePdfLink").attr('href');
    //     pdf_uri = pdf_uri.replace(/seq=\d+/, "seq=" + ( parseInt(index) + 1 )).replace(/num=\w+(;?)/, "");
    //     
    //     $(this).attr('href', pdf_uri);
    //     $pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //     
    //     return true;
    // })
    // 
    // $("#BRpageControls").hover(
    //     function() { $(this).addClass("hovered"); },
    //     function() { $(this).removeClass("hovered"); }
    // );
    // 
    // $("div.BRpagediv1up:has(img)").live("mouseover mouseleave", function(event) {
    //     var h = $(this).height();
    //     var w = $(this).width();
    //     // var $pageControl = $("#BRpageControls");
    //     if ( event.type == 'mouseover' ) {
    //         
    //         if ( $("#BRpageControls", this).length > 0 ) {
    //             // already appended, ignore...
    //             return true;
    //         }
    //         
    //         // var top = offset.top + h - 75;
    //         // var left = offset.left + w - 75;
    //         // var top = h - 75;
    //         // var left = w - 150;
    //         var left = w - $pageControl.width() - 20; // vertical
    //         var top = h - $pageControl.height() - 20; // vertical
    //         
    // 
    //         // if top is below the fold, pull back
    //         var $bookReaderDiv = $("#BookReader");
    //         
    //         var offset = $(this).offset();
    //         // console.log("TOP", top, "/", ooffset.top, "/", $bookReaderDiv.offset().top + $bookReaderDiv.height());
    //         
    //         while (( top + offset.top + $pageControl.height() ) > ($bookReaderDiv.offset().top + $bookReaderDiv.height()) ) {
    //             top -= 100;
    //         }
    //         
    //         //br._rotateWidget.appendTo($(this)).css("top", top).css("left", left).fadeIn(500)
    //         //$pageControl.css("top", top).css("left", left).fadeIn(250);
    //         //$pageControl.appendTo($(this)).css("top", top).css("left", left).addClass("waiting").fadeIn(250);
    //         //$pageControl.appendTo($(this)).css("top", top).css("left", left).css({ opacity: 0, display: 'block' }).animate({ opacity: 0.3 }, 250);
    //         $pageControl.appendTo($(this)).css("top", top).css("left", left);
    //         self._pageTarget = $(this);
    //         
    //     } else {
    //         // if ( ! (( event.pageX >= position.left && event.pageX <= ( offset.left + w ) ) && 
    //         //      ( event.pageY >= offset.top && event.pageY <= offset.top + h )) ) {
    //         //      $pageControl.fadeOut(250);
    //         //      self._pageTarget = null;
    //         // }
    //         
    //         if ( $("#BRpageControls", this).length > 0 ) {
    //             //$pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //             $pageControl.css("left", -1000).appendTo("body");
    //             self._pageTarget = null;
    //         }
    //         
    //     }
    //     return true;
    // })
    
}


/* /htapps/roger.babel/pt/web/js/HTBookReader.js */
// var fudgingMonkeyPatch = true;
// if ( navigator.appVersion.indexOf("MSIE 7.") != -1 ) {
//   fudgingMonkeyPatch = false;
// } else if ( navigator.userAgent.indexOf("Firefox/") != -1 ) {
//   var version = navigator.userAgent.split("/");
//   version = version.pop()
//   if ( version < "3.6" ) {
//     fudgingMonkeyPatch = false;
//   }
// }

var fudgingMonkeyPatch = false;
if ( navigator.appVersion.indexOf("MSIE 7.") == -1 && navigator.appVersion.indexOf("MSIE 6") == -1 ) {
  // IE 8+
  fudgingMonkeyPatch = true;
} else if ( navigator.userAgent.indexOf("Gecko/") != -1 ) {
  var match = navigator.userAgent.match(/rv:([\w+\.])\)/)
  if ( match != null && match[1] >= "1.9" ) {
    // FF3.6+
    fudgingMonkeyPatch = true;
  }
} else if ( navigator.userAgent.indexOf("WebKit") != -1 ) {
  // Webkit
  fudgingMonkeyPatch = true;
} else if ( navigator.userAgent.indexOf("Opera") != -1 ) {
  fudgingMonkeyPatch = true;
}

// fudgingMonkeyPatch = false;
if ( fudgingMonkeyPatch && window.HTBookReader !== undefined ) {

  HTBookReader.prototype.resizePageView1up = function() {
      var i;
      var viewHeight = 0;
      //var viewWidth  = $('#BRcontainer').width(); //includes scrollBar
      var viewWidth  = $('#BRcontainer').attr('clientWidth');   

      var oldScrollTop  = $('#BRcontainer').attr('scrollTop');
      var oldScrollLeft = $('#BRcontainer').attr('scrollLeft');
      var oldPageViewHeight = $('#BRpageview').height();
      var oldPageViewWidth = $('#BRpageview').width();

      var oldCenterY = this.centerY1up();
      var oldCenterX = this.centerX1up();

      if (0 != oldPageViewHeight) {
          var scrollRatio = oldCenterY / oldPageViewHeight;
      } else {
          var scrollRatio = 0;
      }

      // Recalculate 1up reduction factors
      this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'),
                                             $('#BRcontainer').attr('clientHeight') );                                        
      // Update current reduce (if in autofit)
      if (this.onePage.autofit) {
          var reductionFactor = this.nextReduce(this.reduce, this.onePage.autofit, this.onePage.reductionFactors);
          this.reduce = reductionFactor.reduce;
      }

      this.setupPageLeafs();

      var newCenterY = scrollRatio*viewHeight;
      var newTop = Math.max(0, Math.floor( newCenterY - $('#BRcontainer').height()/2 ));
      $('#BRcontainer').attr('scrollTop', newTop);

      var newPageWidth = $("#BRpageview").width();
      var newLeft = ( newPageWidth / 2 ) - ( viewWidth / 2);
      newLeft = Math.max(newLeft, 0);
      $("#BRcontainer").attr('scrollLeft', newLeft);

      // // We use clientWidth here to avoid miscalculating due to scroll bar
      // var newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
      // 
      // // if ($('#BRpageview').width() < $('#BRcontainer').attr('clientWidth')) { // fully shown
      // //     centerX = $('#BRpageview').width();
      // // } else {
      // //     centerX = $('#BRcontainer').attr('scrollLeft') + $('#BRcontainer').attr('clientWidth') / 2;
      // // }
      // // centerX = Math.floor(centerX);
      // var newLeft = newCenterX - $('#BRcontainer').attr('clientWidth') / 2;
      // newLeft = Math.max(newLeft, 0);
      // $('#BRcontainer').attr('scrollLeft', newLeft);
      // //console.log('oldCenterX ' + oldCenterX + ' newCenterX ' + newCenterX + ' newLeft ' + newLeft);

      //this.centerPageView();
      this.loadLeafs();

      this.removeSearchHilites();
      this.updateSearchHilites();
  }

  HTBookReader.prototype.setupPageLeafs = function() {
    
    if ( $(".page1up").length ) {
      return;
    }

    var leafs = [];
    var i;
    var viewHeight = 0;
    var viewWidth  = $('#BRcontainer').attr('clientWidth');   
    for (i=0; i<this.numLeafs; i++) {
      var dimensions = this.getAdjustedDimensions(i);
      var height = dimensions.height;
      var width = dimensions.width;
        viewHeight += height + this.padding; 
        leafs.push(
          '<div class="page1up" id="pagediv{i}" style="height: {height}px; width: {width}px"><div class="debugIndex">{i}</div></div>'
          .replace(/{i}/g, i).replace('{height}', height).replace('{width}', width)
        );
        if (width>viewWidth) viewWidth=width;
    }
    // $('#BRpageview').height(viewHeight);
    $('#BRpageview').width(viewWidth).css('margin', '0 auto');

    // what does rl mean with scroll??
    
    $('#BRpageview').get(0).innerHTML = leafs.join("\n");
    //$(leafs.join("\n")).appendTo($("#BRpageview"));

  }

  HTBookReader.prototype.getViewWidth = function() {
    var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer
    return viewWidth;
  }

  HTBookReader.prototype.getAdjustedDimensions = function(index) {
    var viewWidth = this.getViewWidth();
    var height = Math.floor(this._getPageHeight(index)/this.reduce);
    var width = Math.floor(this._getPageWidth(index)/this.reduce);
    if ( width > viewWidth && this.onePage.autofit == "height" ) {
      var r = ( viewWidth - 20 ) / width;
      width = ( viewWidth - 20 );
      height = Math.floor(height * r);
    }
    return { height : height, width : width, fudged : true };
  }

  // drawLeafsOnePage()
  //______________________________________________________________________________
  HTBookReader.prototype.drawLeafsOnePage = function() {
      //alert('drawing leafs!');

      this.timer = null;

      this.setupPageLeafs();

      var scrollTop = $('#BRcontainer').attr('scrollTop');
      var scrollBottom = scrollTop + $('#BRcontainer').height();
      var $container = $("#BRcontainer");

      var indicesToDisplay = [];
      var portionVisible = {};

      var viewWidth = this.getViewWidth();

      var i;
      var leafTop = 0;
      var leafBottom = 0;
      for (i=0; i<this.numLeafs; i++) {
          var dimensions = this.getAdjustedDimensions(i);
          var height  = dimensions.height;
          var width  = dimensions.width;

          var $pagediv = $("#pagediv" + i);
          var leafTop = scrollTop + $pagediv.offset().top - $("#mdpToolbar").height() - $("#mdpHeader").height();
          leafBottom = leafTop + height;

          // console.log('leafTop = '+leafTop+ ' pageH = ' + this.pageH[i] + 'leafTop>=scrollTop=' + (leafTop>=scrollTop));
          var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
          var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
          var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
          // console.log('LEAF', i, scrollTop, leafTop, height, topInView, bottomInView, middleInView);
          if (topInView | bottomInView | middleInView) {
              //console.log('displayed: ' + this.displayedIndices);
              //console.log('to display: ' + i);
              // console.log("DISPLAY:", i, topInView, bottomInView, middleInView, ":", leafTop, "x", leafBottom, "/", scrollTop, "x", scrollBottom, indicesToDisplay.join(":"));
              indicesToDisplay.push(i);
              if ( leafTop <= scrollTop ) {
                // leaf is scrolling off
                portionVisible[i] = (height - ( scrollTop - leafTop )) / height;
              } else if ( leafBottom >= scrollBottom ) {
                portionVisible[i] = (height - ( leafBottom - scrollBottom )) / height;
              } else {
                portionVisible[i] = 1;
              }
          }
          leafTop += height +10;      
          leafBottom += 10;
      }
      
      var firstIndexToDraw  = indicesToDisplay[0];
      this.firstIndex      = firstIndexToDraw;

      var now = new Date;
      console.log(now.getSeconds(), "SET CURRENT INDEX", this.firstIndex, indicesToDisplay.join("/"));

      for(i=0; i < indicesToDisplay.length; i++) {
        var index = indicesToDisplay[i];
        if (portionVisible[index] > portionVisible[this.firstIndex] && portionVisible[this.firstIndex] < 0.4) {
          this.firstIndex = index;
          if ( this.firstIndex != this.lastUpdatedIndex ) {
            this.lastUpdatedIndex = this.firstIndex;
          }
        }
      }

      // // Update hash, but only if we're currently displaying a leaf
      // // Hack that fixes #365790
      // if (this.displayedIndices.length > 0) {
      //     this.updateLocationHash();
      // }
      // 
      if ((0 != firstIndexToDraw) && (1 < this.reduce)) {
          firstIndexToDraw--;
          indicesToDisplay.unshift(firstIndexToDraw);
      }

      var lastIndexToDraw = indicesToDisplay[indicesToDisplay.length-1];
      if ( ((this.numLeafs-1) != lastIndexToDraw) && (1 < this.reduce) ) {
          indicesToDisplay.push(lastIndexToDraw+1);
      }

      this.onePage.firstIndexToDraw = firstIndexToDraw;

      for (i = 0; i < indicesToDisplay.length; i++) {
        var index = indicesToDisplay[i];
        var dimensions = this.getAdjustedDimensions(index);
        var width = dimensions.width;
        var height = dimensions.height;

        var $pagediv = $("#pagediv" + index);
        if ( $pagediv.height() != height ) {
          // $pagediv.css({ height : height + 'px', width : width + 'px'});
          $pagediv.animate({ height : height + 'px', width : width + 'px'}, "fast");
        }

        if ( ! $pagediv.has(".content").length || $pagediv.has(".choked").length ) {
          var content = this.createContentElement(index, this.reduce, width, height);
          if ( $pagediv.has(".choked").length ) {
            $(content).replaceAll($pagediv.find(".choked"));
          } else {
            $(content).appendTo($pagediv).addClass("content");
          }
        }
      }

      for (i=0; i<this.displayedIndices.length; i++) {
          if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
              var index = this.displayedIndices[i];
              //console.log('Removing leaf ' + index);
              //console.log('id='+'#pagediv'+index+ ' top = ' +$('#pagediv'+index).css('top'));
              $('#pagediv'+index).find(".content").remove();
          } else {
              //console.log('NOT Removing leaf ' + this.displayedIndices[i]);
          }
      }

      this.displayedIndices = indicesToDisplay.slice();

      // Update hash, but only if we're currently displaying a leaf
      // Hack that fixes #365790
      // update after we finally determine the visible pages?
      if (this.displayedIndices.length > 0) {
          this.updateLocationHash();
      }

      this.updateSearchHilites();

      if (null != this.getPageNum(firstIndexToDraw))  {
          this.updatePageNumBox();
          // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
      } else {
          $("#BRpagenum").val('');
      }

      this.updateToolbarZoom(this.reduce);

  }

  //prepareOnePageView()
  //______________________________________________________________________________
  HTBookReader.prototype.prepareOnePageView = function() {

      // var startLeaf = this.displayedIndices[0];
      var startLeaf = this.currentIndex();
      $('#BRcontainer').empty();
      $('#BRcontainer').css({
          overflowY: 'auto',
          overflowX: 'auto',
          'text-align' : 'center'
      });
      
      // needed?
      // position: 'static',

      $("#BRcontainer").height($("#BookReader").height());

      $("#BRcontainer").append("<div id='BRpageview'></div>");
      var options = { ignoreTargets:['ocrText', 'rotateAction']};

      $('#BRcontainer').dragscrollable(options); // {preventDefault:true, ignoreTargets:['ocrText']}

      this.bindGestures($('#BRcontainer'));

      // $$$ keep select enabled for now since disabling it breaks keyboard
      //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
      // BookReader.util.disableSelect($('#BRpageview'));

      this.resizePageView();    

      this.jumpToIndex(startLeaf);

      this.displayedIndices = [];

      this.drawLeafsOnePage();
  }

  HTBookReader.prototype.onePageGetAutofitHeight = function() {
      var clientHeight = $('#BRcontainer').attr('clientHeight') || $("#BookReader").attr("clientHeight");
      return (this.getMedianPageSize().height + 0.0) / (clientHeight - this.padding * 2); // make sure a little of adjacent pages show
  }
  
  // drawLeafsThumbnail()
  //______________________________________________________________________________
  // If seekIndex is defined, the view will be drawn with that page visible (without any
  // animated scrolling)
  HTBookReader.prototype.drawLeafsThumbnail = function( seekIndex ) {
      //alert('drawing leafs!');
      this.timer = null;
      
      var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer

      //console.log('top=' + scrollTop + ' bottom='+scrollBottom);

      var i;
      var leafWidth;
      var leafHeight;
      var rightPos = 0;
      var bottomPos = 0;
      var maxRight = 0;
      var currentRow = 0;
      var leafIndex = 0;
      var leafMap = [];

      var self = this;

      // Will be set to top of requested seek index, if set
      var seekTop;
      
      var $container = $('#BRpageview');
      var leafs = [];
      var rowLeafs = [];

      var viewHeight = 0;
      var rowHeights = [];
      // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
      for (i=0; i<this.numLeafs; i++) {
          leafWidth = this.thumbWidth;

          // if ( i % this.thumbColumns == 0 ) {
          //   leafs.push('<div class="thumbRow">');
          // }
          
          if (leafMap[currentRow]===undefined) { leafMap[currentRow] = {}; }
          if (leafMap[currentRow].leafs===undefined) {
              leafMap[currentRow].leafs = [];
              leafMap[currentRow].height = 0;
              leafMap[currentRow].top = 0;
          }
          leafMap[currentRow].leafs[leafIndex] = {};
          leafMap[currentRow].leafs[leafIndex].num = i;
          leafMap[currentRow].leafs[leafIndex].left = rightPos;

          leafHeight = parseInt((this.getPageHeight(leafMap[currentRow].leafs[leafIndex].num)*this.thumbWidth)/this.getPageWidth(leafMap[currentRow].leafs[leafIndex].num), 10);
          if (leafHeight > leafMap[currentRow].height) {
              leafMap[currentRow].height = leafHeight;
          }
          if (leafIndex===0) { bottomPos += this.padding + leafMap[currentRow].height; }
          rightPos += leafWidth + this.padding;
          if (rightPos > maxRight) { maxRight = rightPos; }
          leafIndex++;

          if (i == seekIndex) {
              seekTop = bottomPos - this.padding - leafMap[currentRow].height;
          }

          rowHeights.push(leafHeight);
          
          rowLeafs.push(
            '<div class="pageThumb BRpagedivthumb" id="pagediv{i}" style="height: {height}px; width: {width}px"><div class="debugIndex">{i}</div></div>'
            .replace(/{i}/g, i).replace('{height}', leafHeight).replace('{width}', leafWidth)
          );
          
          if ( i % this.thumbColumns == ( this.thumbColumns - 1 ) ) {
            
            if ( this.pageProgression == "rl" ) {
              rowLeafs.reverse();
            }
            
            // leafs.push('<div id="thumbrow{currentRow}" class="thumbRow">'.replace('{currentRow}', currentRow) + rowLeafs.join("\n") + '<br clear="both" /></div>');
            leafs.push('<div id="thumbrow{currentRow}" data-rowIndex="{currentRow}" class="thumbRow">'.replace(/{currentRow}/g, currentRow) + rowLeafs.join("\n") + '<br clear="both" />' + '<div class="debugIndex">' + currentRow + '</div>'  +  '</div>');
            
            // leafs.push(rowLeafs.join("\n"));
            // leafs.push('<br clear="both" /></div>');

            viewHeight += Math.max.apply(Math, rowHeights) + 20; // css padding
            rowHeights = [];
            rowLeafs = [];
            currentRow += 1;
            leafIndex = 0;
          }
          
      }

      if ( rowHeights.length ) {
        if ( this.pageProgression == "rl" ) {
          rowLeafs.reverse();
        }
        //leafs.push('<div class="thumbRow">' + rowLeafs.join("\n") + '<br clear="both" /></div>');
        leafs.push('<div id="thumbrow{currentRow}" data-rowIndex="{currentRow}" class="thumbRow">'.replace(/{currentRow}/g, currentRow) + rowLeafs.join("\n") + '<br clear="both" />' + '<div class="debugIndex">' + currentRow + '</div>'  +  '</div>');
        
        // leafs.push(rowLeafs.join("\n"));
        // leafs.push('<br clear="both" /></div>');

        viewHeight += Math.max.apply(Math, rowHeights);
      }
      
      leafs.push('<br clear="both" />');

      // reset the bottom position based on thumbnails
      $('#BRpageview').height(viewHeight);
      
      if ( ! $(".pageThumb").length ) {
        $container.get(0).innerHTML = leafs.join("\n");
      }

      var pageViewBuffer = Math.floor(($('#BRcontainer').attr('scrollWidth') - maxRight) / 2) - 14;

      // If seekTop is defined, seeking was requested and target found
      if (typeof(seekTop) != 'undefined') {
          $('#BRcontainer').scrollTop( seekTop );
      }

      var scrollTop = $('#BRcontainer').attr('scrollTop');
      var scrollBottom = scrollTop + $('#BRcontainer').height();

      var leafTop = 0;
      var leafBottom = 0;
      var rowsToDisplay = [];

      // Visible leafs with least/greatest index
      var leastVisible = this.numLeafs - 1;
      var mostVisible = 0;

      // Determine the thumbnails in view
      for (i=0; i<leafMap.length; i++) {
        
          var $row = $("#thumbrow" + i);
          var leafTop = scrollTop + $row.offset().top - $("#BRcontainer").offset().top;
          var leafBottom = leafTop + $row.height();
        
          // leafBottom += this.padding + leafMap[i].height;
          var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
          var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
          var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
          
          // console.log("THUMB", i, leafTop, leafBottom, "|", scrollTop, scrollBottom, "|", topInView, middleInView, bottomInView);
          
          if (topInView | bottomInView | middleInView) {
              //console.log('row to display: ' + j);
              rowsToDisplay.push(i);
              if (leafMap[i].leafs[0].num < leastVisible) {
                  leastVisible = leafMap[i].leafs[0].num;
              }
              if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
                  mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
              }
          }
          if (leafTop > leafMap[i].top) { leafMap[i].top = leafTop; }
          leafTop = leafBottom;
      }
      // create a buffer of preloaded rows before and after the visible rows
      var firstRow = rowsToDisplay[0];
      var lastRow = rowsToDisplay[rowsToDisplay.length-1];
      for (i=1; i<this.thumbRowBuffer+1; i++) {
          if (lastRow+i < leafMap.length) { rowsToDisplay.push(lastRow+i); }
      }
      for (i=1; i<this.thumbRowBuffer+1; i++) {
          if (firstRow-i >= 0) { rowsToDisplay.push(firstRow-i); }
      }

      // Create the thumbnail divs and images (lazy loaded)
      var j;
      var row;
      var left;
      var index;
      var div;
      var link;
      var img;
      var page;
      
      $(".thumbRow:has(.choked)").each(function() {
        var i = $(this).data('rowIndex');
        console.log("CHECKING DISPLAY OF", i);
        if ( BookReader.util.notInArray(i, rowsToDisplay) ) {
          console.log("ADDING TO ROWS TO DISPLAY", i);
          rowsToDisplay.push(i);
        }
      })
      
      console.log("ROWS TO DISPLAY", rowsToDisplay.join(" / "));
      
      for (i=0; i<rowsToDisplay.length; i++) {
        row = rowsToDisplay[i];
        var $thumbrow = $("#thumbrow" + row);
          if (BookReader.util.notInArray(rowsToDisplay[i], this.displayedRows) || $thumbrow.has(".choked").length ) {    

              for (j=0; j<leafMap[row].leafs.length; j++) {
                  index = j;
                  leaf = leafMap[row].leafs[j].num;
                  
                  leafWidth = this.thumbWidth;
                  leafHeight = parseInt((this.getPageHeight(leaf)*this.thumbWidth)/this.getPageWidth(leaf), 10);
                  // if ('rl' == this.pageProgression){
                  //     left = viewWidth - leafWidth - left;
                  // }

                  var $pagediv = $("#pagediv" + leaf);
                  if ( $pagediv.find(".content").length && ! $pagediv.has(".choked").length ) {
                    // already has image...
                    continue;
                  }
                  // $pagediv.addClass("BRpagedivthumb");
                  
                  if ( $pagediv.has(".choked").length ) {
                    $pagediv.find("a").remove();
                  }

                  // link to page in single page mode
                  link = document.createElement("a");
                  $(link).data('leaf', leaf).addClass("content");
                  $(link).bind('click', function(event) {
                      self.firstIndex = $(this).data('leaf');
                      self.switchMode(self.constMode1up);
                      event.preventDefault();
                  });

                  // $$$ we don't actually go to this URL (click is handled in handler above)
                  var title = "image of page " + this.getPageNum(leaf);
                  link.href = '#page/' + (this.getPageNum(leaf)) +'/mode/1up' ;
                  // $(link).attr({ title : title });
                  $pagediv.append(link);

                  img = document.createElement("img");
                  var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);
                  
                  var srcURL = this._getPageURI(leaf, thumbReduce);

                  $(img).attr('src', this.imagesBaseURL + 'transparent.png')
                      .attr('alt', title)
                      .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                      .addClass('BRlazyload')
                      // Store the URL of the image that will replace this one
                      .data('srcURL',  srcURL)
                      .data('index', leaf).
                      data('reduce', thumbReduce);
                  $(link).append(img);
                  //console.log('displaying thumbnail: ' + leaf);
              }   
          }
      }
      
      // Remove thumbnails that are not to be displayed
      var k;
      for (i=0; i<this.displayedRows.length; i++) {
          if (BookReader.util.notInArray(this.displayedRows[i], rowsToDisplay)) {
              row = this.displayedRows[i];

              // $$$ Safari doesn't like the comprehension
              //var rowLeafs =  [leaf.num for each (leaf in leafMap[row].leafs)];
              //console.log('Removing row ' + row + ' ' + rowLeafs);

              for (k=0; k<leafMap[row].leafs.length; k++) {
                  index = leafMap[row].leafs[k].num;
                  //console.log('Removing leaf ' + index);
                  $('#pagediv'+index).find(".content").remove();
              }
          } else {
              /*
              var mRow = this.displayedRows[i];
              var mLeafs = '[' +  [leaf.num for each (leaf in leafMap[mRow].leafs)] + ']';
              console.log('NOT Removing row ' + mRow + ' ' + mLeafs);
              */
          }
      }

      // Update which page is considered current to make sure a visible page is the current one
      var currentIndex = this.currentIndex();
      // console.log('current ' + currentIndex);
      // console.log('least visible ' + leastVisible + ' most visible ' + mostVisible);
      if (currentIndex < leastVisible) {
          this.setCurrentIndex(leastVisible);
      } else if (currentIndex > mostVisible ) {
        this.setCurrentIndex(mostVisible);
      }

      // if ( this.currentIndex() >= this.numLeafs ) {
      //   console.log("REDUCING THE CURRENT INDEX!!!");
      //   this.currentIndex(this.numLeafs - 1);
      // }

      this.displayedRows = rowsToDisplay.slice();

      // Update hash, but only if we're currently displaying a leaf
      // Hack that fixes #365790
      if (this.displayedRows.length > 0) {
          this.updateLocationHash();
      }

      // remove previous highlights
      $('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');

      // highlight current page
      $('#pagediv'+this.currentIndex()).addClass('BRpagedivthumb_highlight');

      this.lazyLoadThumbnails();

      // Update page number box.  $$$ refactor to function
      if (null !== this.getPageNum(this.currentIndex()))  {
        this.updatePageNumBox();
        // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
      } else {
        $("#BRpagenum").val('');
      }

      this.updateToolbarZoom(this.reduce); 
  }

  HTBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
    if ( this.mode == this.constMode1up ) {
      var $div = $("#pagediv" + index);
      if ( ! $div.length ) {
        // no div, so punt
        return;
      }
      var top = $div.length ? $div.offset().top : 0;
      var $container = $("#BRcontainer");
      $container.animate({ scrollTop : ($container.scrollTop() + top - $container.offset().top ) }, "fast");
    } else {
      // HTBookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
      // HTBookReader jumpToIndex obsessed with text mode
      BookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
    }
  }

  HTBookReader.prototype.createContentElement = function(index, reduce, width, height) {
      var self = this;
      var e;
      var url = this._getPageURI(index, reduce, 0);

      if ( 0 && this.hasPageFeature(index, "MISSING_PAGE") ) {
        // don't generate the text version; use the image served by imgsrv

          e = this._createTextElement(width, height);

          // have to add the text AFTER the element is attached 
          // to the DOM
          setTimeout(function() {
              var data = 
                  '<div class="noText ocrText">' +
                      '<div class="noTextAlert">MISSING PAGE</div>' +
                      '<span>This page is missing in the original.</span><br />' + 
                      '<span>Please continue to available pages.</span><br />' +
                      '<span><a target="_blank" href="http://www.hathitrust.org/help_digital_library#PageNotAvailable">See the Help page for more information.</a></span>' + 
                  '</div>';

              self._insertTextPane(data, index, e);
          }, 200);

      } else if ( this.displayMode == 'image' ) {

          e = document.createElement("img");
          $(e).css('width', width+'px');
          $(e).css('height', height+'px');
          $(e).data('index', index);

          var title = "image of page " + this.getPageNum(index);
          // $(e).attr({ alt : title, title : title});
          $(e).attr({ alt : title });
          e.src = this.imagesBaseURL + 'transparent.png';

          var viewWidth = self.getViewWidth();

          var lazy = new Image();
          
          lazy.onerror = function(evt) {
            console.log("ERROR: ", this, evt);
          }
          
          lazy.e = e;
          lazy.index = index;
          $(lazy).one('load', function() {
            console.log("LOADING", this.index);
            var index = this.index;
            var e = this.e;
            this.e = null;
            var natural_height = this.height;
            var natural_width = this.width;
            
            // check for a throttled image
            // this is so lame
            if ( natural_height == HT.config.CHOKE_DIM && natural_width == HT.config.CHOKE_DIM ) {
              // start the choke timer
              console.log("TREAT THIS AS AN ERROR:", this);
              // but show this image
              $(e).addClass("choked");
              e.src = this.src;
              HT.monitor.run(this.src);
              return;
            }
            
            var fudged = false;
            if ( self.hasPageFeature(index, "FUDGED") ) {
              var slice = self.sliceFromIndex(index);
              var true_height = natural_height * self.reduce;
              var true_width = natural_width * self.reduce;
              self.bookData[slice.slice]['height'][slice.index] = true_height;
              self.bookData[slice.slice]['width'][slice.index] = true_width;
              self.removePageFeature(index, 'FUDGED');
              fudged = true;
            }
            
            if ( ! $(e).length ) {
              // image is gone
              return;
            }

            var width = natural_width;
            var height = natural_height;
            var left;

            if ( viewWidth < width ) {
              var r = ( viewWidth - 20 ) / width;
              width = ( viewWidth - 20 );
              height = Math.floor(height * r);
            }

            if ( fudged ) {
              $(e).parent().andSelf().animate({ height : height + 'px', width : width + 'px'}, "fast", function() {
                // did this scroll off screen? that's the question
                if ($("#BRcontainer").height() > 350) {
                  if ( index == self.firstIndex ) {
                    self.jumpToIndex(index);
                  }                  
                }
              });
            }
            e.src = this.src;
          })
          .attr({ src : url, title : title });

          lazy = null;

      } else {

          var sel = 'span';

          e = this._createTextElement(width, height);

          $.get(url, null, function(data) {

              if ( ! data ) {
                  data = 
                      '<div class="noText ocrText">' +
                          '<div class="noTextAlert">NO TEXT ON PAGE</div>' +
                          '<span>This page does not contain any text</span><br />' +
                          '<span>recoverable by the OCR engine</span>' + 
                      '</div>';
                  sel = null;
              }

              self._insertTextPane(data, index, e, sel);

          })

      }
      return e;
  }

  HTBookReader.prototype.getPageWidth = function(index) {
      var r = this.rotationCache[index] || 0;
      if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
          var h = this.__getPageHeight(index);
          // h = Math.ceil(w * ( w / h ));
          return h;
      }
      var w = this.__getPageWidth(index);
      return w;
  }

  HTBookReader.prototype.getPageHeight = function(index) {
      var r = this.rotationCache[index] || 0;
      var h = this.__getPageHeight(index);
      if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
          var w = this.__getPageWidth(index);
          // h = Math.ceil(w * ( w / h ));
          return w;
      }
      return h;
  }

  HTBookReader.prototype.__getPageWidth = function(index) {
      var slice = this.sliceFromIndex(index);
      var w;

      if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['width'][slice.index]) == 'number'){
          w = this.bookData[slice.slice]['width'][slice.index];
      }else{
          if (typeof(this.widthAvg) != 'undefined'){
              w = this.widthAvg;
          }else{
              w = this.widthAvg = this.getAvgDimension('width');
          }
      }
      return w;
  }

  HTBookReader.prototype.__getPageHeight = function(index) {
      // calculate slice from index
      var slice = this.sliceFromIndex(index);

      var h;
      if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['height'][slice.index]) == 'number'){
          h = this.bookData[slice.slice]['height'][slice.index];
      } else{
          if (typeof(this.heightAvg) != 'undefined'){
              h =  this.heightAvg;
          }else{
              h = this.heightAvg = this.getAvgDimension('height');
          }
      }
      return h;
  }

  // 2UP MODIFICATIONS

  // prefetchImg()
  //______________________________________________________________________________
  HTBookReader.prototype.prefetchImg = function(index) {
      var self = this;
      
      if ( this.twoPage.queue_halted ) {
        // console.log("PREFETCHIMG HALTED; SKIPPING", index);
        this.twoPage.queue.push(index);
        return;
      }
      
      var pageURI = this._getPageURI(index);

      // track this?
      var ratio = this.getPageHeight(index) / this.twoPage.height;
      var scale;
      // $$$ we make an assumption here that the scales are available pow2 (like kakadu)
      if (ratio < 2) {
          scale = 1;
      } else if (ratio < 4) {
          scale = 2;
      } else if (ratio < 8) {
          scale = 4;
      } else if (ratio < 16) {
          scale = 8;
      } else  if (ratio < 32) {
          scale = 16;
      } else {
          scale = 32;
      }
      var reduce = scale;

      // Load image if not loaded or URI has changed (e.g. due to scaling)
      var loadImage = false;
      var chokedImage = false;
      if (undefined == this.prefetchedImgs[index]) {
          // console.log('no image for ' + index);
          loadImage = true;
      } else if (pageURI != this.prefetchedImgs[index].uri ) {
          // console.log('uri changed for ' + index, pageURI, this.prefetchedImgs[index].uri);
          loadImage = true;
      } else if ( this.prefetchedImgs[index].choked ) {
          // console.log('image is choked for ' + index);
          chokedImage = true;
      }

// if ( chokedImage ) {
//   alert("CHOKED: " + index);
// }
      if (loadImage || chokedImage) {
          //console.log('prefetching ' + index);
          var img = $("#pagediv" + index).get(0);
          if ( img === undefined ) {
            img = document.createElement("img");
            img.className = 'BRpageimage';
            $(img).attr('id', "pagediv" + index);
          }
          if (index < 0 || index > (this.numLeafs - 1) ) {
              // Facing page at beginning or end, or beyond
              $(img).css({
                  'background-color': 'transparent'
              });
          } else {
            var lazy = new Image();
            lazy.e = img;
            lazy.index = index;
            lazy.reduce = reduce;
            
            var suffix = "";
            if ( chokedImage ) {
              suffix += ";_=" + ( new Date ).getTime();
            }
            
            $(lazy).one('error', function() {
                console.log("WHAT? ACTUAL 503 ERROR?", arguments);
              }).one('load', function() {
              var index = this.index;
              var e = this.e;
              var reduce = this.reduce || self.reduce;
              var natural_height = this.height;
              var natural_width = this.width;
              var fudged = false;

              // check for a throttled image
              // this is so lame
              if ( natural_height == HT.config.CHOKE_DIM && natural_width == HT.config.CHOKE_DIM ) {
                // start the choke timer
                // console.log("TREAT THIS AS AN ERROR (2UP):", this);
                // but show this image
                $(e).addClass("choked");
                e.choked = true;
                e.src = this.src;
                self.suspendQueue();
                HT.monitor.run(this.src);
                return;
              }
              
              // console.log("LOADING", index, natural_height, natural_width);

              if ( self.hasPageFeature(index, "FUDGED") ) {
                var slice = self.sliceFromIndex(index);
                var old_height = self.getPageHeight(index);
                var old_width = self.getPageWidth(index);
                var true_height = natural_height * reduce;
                var true_width = natural_width * reduce;
                var delta = { height : natural_height * 0.25 , width : natural_width * 0.25 };
                self.bookData[slice.slice]['height'][slice.index] = true_height;
                self.bookData[slice.slice]['width'][slice.index] = true_width;
                self.removePageFeature(index, 'FUDGED');
                // console.log("FUDGED TRUE HEIGHT", index, self.reduce, old_height, true_height);
                if ( Math.abs(old_width - true_width) > delta.width || Math.abs(old_height - true_height) > delta.width ) {
                  // only fudge if we're really going to notice it...
                  fudged = true;
                }
              }
              
              if ( fudged ) {
                self.fudge2up(index);
              }
              
              if ( e.choked === true ) {
                // was a choked image...
                console.log("RESETTING IMAGE TO TRANSPARENT");
                e.src = self.imagesBaseURL + 'transparent.png';
              }
              
              e.src = this.src; // updates the img in the prefetch
              $(e).removeClass("prefetch2up");
              
              self.processPrefetchQueue();
              
              this.e = null;
            }).attr('src', pageURI + suffix);
          }
          // UM
          var title = "image of page " + this.getPageNum(index);
          img.uri = pageURI;
          img.src = this.imagesBaseURL + 'transparent.png'; // pageURI; // browser may rewrite src so we stash raw URI here
          $(img).attr({ alt : title }).addClass('prefetch2up');
          this.prefetchedImgs[index] = img;
      } else if ( index > -1 ) {
        var $pagediv = $("#pagediv" + index);
        if ( $pagediv.length &&  $pagediv.attr('src').indexOf("transparent.png") > -1 ) {
          $pagediv.attr('src', pageURI);
        }
        console.log("NOT LOADING IMAGE", index, $pagediv.attr('src'), pageURI, chokedImage);
      }
  }

  HTBookReader.prototype.fudge2up = function(index, lazy) {
    var self = this;

    if ( index != self.twoPage.currentIndexL && index != self.twoPage.currentIndexR ) {
      return;
    }

    // redraw the page
    var oldCenter = this.twoPageGetViewCenter();
    self.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);
    return;

    // // this works, but can mess up the twoPage reduction --- fits this
    // // instance, but the clicking punts
    // var $pagediv = $("#pagediv" + index);
    // if ( ! $pagediv.length ) {
    //   return;
    // }
    // $("#pagediv" + index).attr('src', lazy.src);
    // 
    // var oldCenter = this.twoPageGetViewCenter();
    // self.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);

  }

  
}


/* /htapps/roger.babel/pt/web/js/FudgingBookReader.js */
/*
 * jQuery dragscrollable Plugin
 * version: 1.0 (25-Jun-2009)
 * Copyright (c) 2009 Miquel Herrera
 *
 * Portions Copyright (c) 2010 Reg Braithwaite
 *          Copyright (c) 2010 Internet Archive / Michael Ang
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */
;(function($){ // secure $ jQuery alias

/**
 * Adds the ability to manage elements scroll by dragging
 * one or more of its descendant elements. Options parameter
 * allow to specifically select which inner elements will
 * respond to the drag events.
 * 
 * options properties:
 * ------------------------------------------------------------------------		
 *  dragSelector         | jquery selector to apply to each wrapped element 
 *                       | to find which will be the dragging elements. 
 *                       | Defaults to '>:first' which is the first child of 
 *                       | scrollable element
 * ------------------------------------------------------------------------		
 *  acceptPropagatedEvent| Will the dragging element accept propagated 
 *	                     | events? default is yes, a propagated mouse event 
 *	                     | on a inner element will be accepted and processed.
 *	                     | If set to false, only events originated on the
 *	                     | draggable elements will be processed.
 * ------------------------------------------------------------------------
 *  preventDefault       | Prevents the event to propagate further effectivey
 *                       | dissabling other default actions. Defaults to true
 * ------------------------------------------------------------------------
 *  
 *  usage examples:
 *
 *  To add the scroll by drag to the element id=viewport when dragging its 
 *  first child accepting any propagated events
 *	$('#viewport').dragscrollable(); 
 *
 *  To add the scroll by drag ability to any element div of class viewport
 *  when dragging its first descendant of class dragMe responding only to
 *  evcents originated on the '.dragMe' elements.
 *	$('div.viewport').dragscrollable({dragSelector:'.dragMe:first',
 *									  acceptPropagatedEvent: false});
 *
 *  Notice that some 'viewports' could be nested within others but events
 *  would not interfere as acceptPropagatedEvent is set to false.
 *		
 */
 
var append_namespace = function (string_of_events, ns) {
    
    /* IE doesn't have map
	return string_of_events
		.split(' ')
			.map(function (name) { return name + ns; })
				.join(' ');
    */
    var pieces = string_of_events.split(' ');
    var ret = new Array();
    for (var i = 0; i < pieces.length; i++) {
        ret.push(pieces[i] + ns);
    }
    return ret.join(' ');
};

var left_top = function(event) {
	
	var x;
	var y;
	if (typeof(event.clientX) != 'undefined') {
		x = event.clientX;
		y = event.clientY;
	}
	else if (typeof(event.screenX) != 'undefined') {
		x = event.screenX;
		y = event.screenY;
	}
	else if (typeof(event.targetTouches) != 'undefined') {
		x = event.targetTouches[0].pageX;
		y = event.targetTouches[0].pageY;
	}
	else if (typeof(event.originalEvent) == 'undefined') {
		var str = '';
		for (i in event) {
			str += ', ' + i + ': ' + event[i];
		}
		console.error("don't understand x and y for " + event.type + ' event: ' + str);
	}
	else if (typeof(event.originalEvent.clientX) != 'undefined') {
		x = event.originalEvent.clientX;
		y = event.originalEvent.clientY;
	}
	else if (typeof(event.originalEvent.screenX) != 'undefined') {
		x = event.originalEvent.screenX;
		y = event.originalEvent.screenY;
	}
	else if (typeof(event.originalEvent.targetTouches) != 'undefined') {
		x = event.originalEvent.targetTouches[0].pageX;
		y = event.originalEvent.targetTouches[0].pageY;
	}
	
	return {left: x, top:y};
};

$.fn.dragscrollable = function( options ) {
	
	var handling_element = $(this);
   
	var settings = $.extend(
		{   
			dragSelector:'>:first',
			acceptPropagatedEvent: true,
            preventDefault: true,
			dragstart: 'mousedown touchstart',
			dragcontinue: 'mousemove touchmove',
			dragend: 'mouseup mouseleave touchend',
			dragMinDistance: 5,
			namespace: '.ds',
			ignoreTargets : null
		},options || {});
	
	settings.dragstart = append_namespace(settings.dragstart, settings.namespace);
	settings.dragcontinue = append_namespace(settings.dragcontinue, settings.namespace);
	settings.dragend = append_namespace(settings.dragend, settings.namespace);

	var dragscroll= {
		dragStartHandler : function(event) {
			//console.log("dragscrollable START");
			//console.log("Start Scrolling... Target ID: " + $(event.target).attr('id') );
			//console.log("Start Scrolling... HTML: " + $(event.target).html());
			
			// mousedown, left click, check propagation
      // console.log("TARGET", event.target);
			if (event.which > 1 ||
				(!event.data.acceptPropagatedEvent && event.target != this)){ 
				return false; 
			}
			
			var do_continue = true;
			if (settings.ignoreTargets !== null && event.target != this) {
			    $.each(settings.ignoreTargets, function() {
            // console.log("IGNORE", this, "/", $(event.target).hasClass(this), "/", $(event.target).parents("." + this));
			        if ( $(event.target).hasClass(this) || $(event.target).parents("." + this).size() > 0 ) {
                  // console.log("IGNORE", this, "/", $(event.target).hasClass(this), "/", $(event.target).parents("." + this));
			            do_continue = false;
			        }
			    })
			}
			
			if ( ! do_continue && ! event.shiftKey ) {
          // console.log("RETURNING? short-circuit dragcontinue?", event.target, this, handling_element);
			    // unbind the events from handling_element to short-circuit drag/scrolling
			    event.stopPropagation();
                // handling_element
                //  .unbind(settings.dragcontinue)
                //  .unbind(settings.dragend);
          // console.log("UNBOUND");
	            return;
			}
			
			event.data.firstCoord = left_top(event);
			// Initial coordinates will be the last when dragging
			event.data.lastCoord = event.data.firstCoord;
			
			handling_element
				.bind(settings.dragcontinue, event.data, dragscroll.dragContinueHandler)
				.bind(settings.dragend, event.data, dragscroll.dragEndHandler);
		
			if (event.data.preventDefault) {
                event.preventDefault();
                return false;
            }
		},
		dragContinueHandler : function(event) { // User is dragging
			//console.log("dragscrollable MOVE : " + event.type);
			
			var lt = left_top(event);
			
			//console.log("dragscrollable MOVE : " + event.type + " ..... " + lt.left + "/" + lt.top);			
			
			if((lt.left==0) &&  (lt.top==0)){ // this is a kluge fix for ipad - kept getting 0/0 coordinate event which was screwing
				// up the scrolling
				//console.log("Error Event: " + $(event.currentTarget).attr('id'));
				return false;
			}
			
			// How much did the mouse move?
			var delta = {left: (lt.left - event.data.lastCoord.left),
						 top: (lt.top - event.data.lastCoord.top)};
			
			var newtop=(event.data.scrollable.scrollTop() - delta.top);			
			var maxTop= $(event.data.scrollable).attr("scrollHeight") - $(event.data.scrollable).height();

			if(newtop<0){
				newtop=0;
			}else if(newtop>=maxTop){
				newtop=maxTop;
			}
			
			// Set the scroll position relative to what ever the scroll is now
			event.data.scrollable.scrollLeft(
							event.data.scrollable.scrollLeft() - delta.left);
			/*
			event.data.scrollable.scrollTop(
							event.data.scrollable.scrollTop() - delta.top);
		    */
			
			if(delta.top!=0){
				event.data.scrollable.scrollTop(newtop);
			}
			
			// Save where the cursor is
			event.data.lastCoord = lt;
			
			if (event.data.preventDefault) {
                event.preventDefault();
                return false;
            }

		},
		dragEndHandler : function(event) { // Stop scrolling
			//console.log("dragscrollable END");
			
			
			handling_element
				.unbind(settings.dragcontinue)
				.unbind(settings.dragend);
				
			// How much did the mouse move total?
			var delta = {left: Math.abs(event.data.lastCoord.left - event.data.firstCoord.left),
						 top: Math.abs(event.data.lastCoord.top - event.data.firstCoord.top)};
			var distance = Math.max(delta.left, delta.top);
						
			// Trigger 'tap' if did not meet drag distance
			// $$$ does not differentiate single vs multi-touch
			if (distance < settings.dragMinDistance) {
			    //$(event.originalEvent.target).trigger('tap');
			    $(event.target).trigger('tap'); // $$$ always the right target?
			}
			
			// Allow event to propage if min distance was not achieved
			if (event.data.preventDefault && distance > settings.dragMinDistance) {
                event.preventDefault();
                return false;
            }
		}
	}
	
	// set up the initial events
	return this.each(function() {
		// closure object data for each scrollable element
		var data = {scrollable : $(this),
					acceptPropagatedEvent : settings.acceptPropagatedEvent,
                    preventDefault : settings.preventDefault }
		// Set mouse initiating event on the desired descendant
        // $(this).find(settings.dragSelector).
        //              bind(settings.dragstart, data, dragscroll.dragStartHandler);
		$(this).undelegate().delegate(settings.dragSelector, settings.dragstart, data, dragscroll.dragStartHandler);
	});
}; //end plugin dragscrollable

$.fn.removedragscrollable = function (namespace) {
	if (typeof(namespace) == 'undefined')
		namespace = '.ds';
	return this.each(function() {
		var x = $(document).find('*').andSelf().unbind(namespace);
	});
};

})( jQuery ); // confine scope

/* /htapps/roger.babel/pt/web/bookreader/BookReader/dragscrollable.js */
// Apache 2.0 license

var lscache = function() {
  var CACHESUFFIX = '-cacheexpiration';
  
  function supportsStorage() {
    return ('localStorage' in window) && window['localStorage'] !== null;
  }
  
  function supportsJSON() {
    return ('JSON' in window) && window['JSON'] !== null;
  }
  
  function expirationKey(key) {
    return key + CACHESUFFIX;
  }
  
  function currentTime() {
    // Get number of minutes since epoch
    return Math.floor((new Date().getTime())/60000);
  }
  
  return {
  
    /**
     * Stores the value in localStorage. Expires after specified number of minutes.
     * @param {string} key
     * @param {Object|string} value
     * @param {number} time 
     */
    set: function(key, value, time) {
      if (!supportsStorage()) return;
      
      // If we don't get a string value, try to stringify
      // In future, localStorage may properly support storing non-strings
      // and this can be removed.
      if (typeof value != 'string') {
        if (!supportsJSON()) return;
        try {
          value = JSON.stringify(value);
        } catch (e) {
          // Sometimes we can't stringify due to circular refs
          // in complex objects, so we won't bother storing then.
          return;
        }
      }
      
      try {
        localStorage[key] = value;
      } catch (e) {
        if (e.name === 'QUOTA_EXCEEDED_ERR') {
          // If we exceeded the quota, then we will sort
          // by the expire time, and then remove the N oldest
          var storedKeys = [];
          for (var key in localStorage) {
            if (key.indexOf(CACHESUFFIX) > -1) {
              var mainKey = key.split(CACHESUFFIX)[0];
              storedKeys.push({key: mainKey, expiration: parseInt(localStorage[key])}); 
            }
          }
          storedKeys.sort(function(a, b) { return (a-b); });
          
          for (var i = 0, len=Math.min(30, storedKeys.length); i < len; i++) {
            localStorage.removeItem(storedKeys[i].key);
            localStorage.removeItem(expirationKey(storedKeys[i].key));
          }          
        } else {
          // If it was some other error, just give up.
          return;
        }
      }
      
      if (time) {
        localStorage[expirationKey(key)] = currentTime() + time;
      } else {
        // In case they set a time earlier, remove it.
        localStorage.removeItem(expirationKey(key));
      }
    },
    
    /**
     * Retrieves specified value from localStorage, if not expired.
     * @param {string} key
     * @return {string|Object}
     */
    get: function(key) {
      if (!supportsStorage()) return null;
      
      if (localStorage[expirationKey(key)]) {
        var expirationTime = parseInt(localStorage[expirationKey(key)]);
        if (currentTime() > expirationTime) {
          localStorage.removeItem(key);
          localStorage.removeItem(expirationKey(key));
          return null;
        } else {
          if (supportsJSON()) {
            try {
              // We can't tell if its JSON or a string, so we try to parse
              var value = JSON.parse(localStorage[key]);
              return value;
            } catch(e) {
              // If we can't parse, it's probably because it isn't an object
              return localStorage[key];
            }
          } else {
            return localStorage[key];
          }
        }
      }
      return null;
    }, 
    
    /**
     * Removes a value from localStorage.
     * Equivalent to 'delete' in memcache, but that's a keyword in JS.
     * @param {string} key
     */
    remove: function(key) {
      if (!supportsStorage()) return null;
      localStorage.removeItem(key);
      localStorage.removeItem(expirationKey(key));
    }
  }
}();

/* /htapps/roger.babel/pt/web/js/lscache.js */
