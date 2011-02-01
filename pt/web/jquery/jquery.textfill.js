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
        step: 1,
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
            
            //console.log(innerWidth, innerHeight, "/", maxWidth, maxHeight, "/", fontSize);
            
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

        //console.log("FIXED TO =", fontSize);
        
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
