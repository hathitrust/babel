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
