// scroll

var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.PlainText = {

    init : function(options) {
        var self = this;
        this.options = $.extend({}, this.options, options);
        this.zoom = this.options.zoom;
        this.zoom_levels = [ 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00 ];
        this.reset_zoom = this.zoom;

        return this;
    },

    options: {
        is_dynamic: true,
        zoom: 1
    },

    start : function() {
        $("body").addClass("view-plaintext"); // needs to correspond to our parameter. MM.
        $.publish("enable.download.page");
        this.options.seq = this.options.reader.getCurrentSeq();
        this.bindEvents();
        this.bindScroll();

        this.drawPages();
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".plaintext");
        $.publish("view.end");
        $("#content").empty();
        $(window).unbind(".plaintext");
        $("body").unbind(".plaintext");
        $(window).scrollTop(0);
        $("body").removeClass("view-plaintext");
    },

    bindEvents: function() {
        var self = this;

        $.subscribe("action.go.next.plaintext", function(e) {
            self.gotoPage(null, 1);
        })

        $.subscribe("action.go.prev.plaintext", function(e) {
            self.gotoPage(null, -1);
        })

        $.subscribe("action.go.first.plaintext", function(e) {
            self.gotoPage(1);
        })

        $.subscribe("action.go.last.plaintext", function(e) {
            self.gotoPage(self.options.manager.num_pages);
        })

        $.subscribe("action.go.page.plaintext", function(e, seq) {
            self.gotoPage(seq);
        })

        $.subscribe("action.zoom.in.plaintext", function(e) {
            self.incrementZoom(1);
        })

        $.subscribe("action.zoom.out.plaintext", function(e) {
            self.incrementZoom(-1);
        })

        $.subscribe("action.zoom.reset.plaintext", function(e) {
            self.updateZoom(self.reset_zoom);
        })

        $("body").on('text.loaded.plaintext', "div.ocr_page", function() {
            var $page = $(this).parent();
            // fix the height so we stay this tall even when fading text
            var h = $(this).height();
            if ( h > $page.height() ) {
                // $page.css({ height : h + 25 }).addClass("fuzzy");
                if ( $page.is(".current") || $page.position().top > $(window).scrollTop() ) {
                    $page.height(h + 25);
                    // console.log("AHOY LOADED", $page.length, $page.attr("id"), h, $page.find(".ocr_page").height(), $page.height(), h + 25);
                } else {
                    $page.addClass("fuzzy");
                }
            }
            $page.addClass("loaded"); // .css({ height : $(this).height() + 25 });
        });

        // var _lazyResize = _.debounce(function() {
        //     if ( self._resizing ) { return ; }
        //     self._resizing = true;

        //     self._calculateBestFitZoom();

        //     self.drawPages();
        //     self._resizing = false;
        // }, 250);

        // var $e = get_resize_root();
        // $e.on('resize.viewer.scroll', _lazyResize);

    },

    incrementZoom: function(delta) {
        var self = this;
        var current_index = self.zoom_levels.indexOf(self.zoom);
        var new_index = current_index + delta;
        if ( new_index >= self.zoom_levels.length || new_index < 0 ) {
            // do not update
            return;
        }
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

        function _zoomify(n) {
            return "zoom" + parseInt(n * 100);
        }

        $("body").removeClass(_zoomify(self.zoom)).addClass(_zoomify(zoom));
        self.zoom = zoom;
        self.gotoPage();
        // self.w = self.options.default_w * self.zoom;

        // self.drawPages();
        $(".page-item.fuzzy").each(function() {
            // might need recalculating
            var h = $(this).find(".ocr_page").height();
            // if ( h > $(this).height() ) {
            //     $()
            // }
        })

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

                if ( $new.is(".loaded.fuzzy") ) {
                    var h = $new.find(".ocr_page").height();
                    // console.log("AHOY CURRENT", $new.attr("id", h));
                    $new.height(h + 25).removeClass("fuzzy");
                }

                $.publish("update.go.page", ( $new.data('seq') ));
            }

            // load the previous and next for caching
            var $previous = $visible.slice(0,1).prev();
            var $next = $visible.slice(-1).next();
            self.loadPage($previous);
            self.loadPage($next);
            // console.log($visible.length, $previous.length, $next.length, _dump_list($visible.slice(0,1)), $visible.slice(0,1).data('idx'), $visible[0].data('idx'));
            // console.log("VISIBLE:", _dump_list($visible), "PREVIOUS:", _dump_list($previous), "NEXT:", _dump_list($next));

            $(".page-item.checking").removeClass("imaged").removeClass("loaded").removeClass("checking").find("div.ocr_page").remove();

            self.checkPageStatus();

        }, 250);

        $(window).on('scroll.viewer.plaintext', lazyLayout);

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

            $(window).trigger('scroll.viewer.plaintext');

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
            var $div = this.options.manager.get_text({ seq : seq });

            $page.append($div);
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
            // var meta = this.options.manager.get_page_meta({ seq : seq, width : self.w, orient : self.getPageOrient(seq) });
            var $page = $('<div class="page-item" aria-hidden="true"><div class="page-num">{SEQ}</div>'.replace('{SEQ}', seq)).appendTo($(fragment));
            $page.attr('id', 'page' + seq);

            // $page.css({ height : h + 2, width : w + 4 });
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
