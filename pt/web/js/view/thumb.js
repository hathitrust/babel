var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Thumbnail = {

    name : 'thumbnail',

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
        $.publish("update.zoom.size", ( "~" + HT.params.size ));
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
