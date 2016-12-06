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
        // $.publish("disable.download.page");
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
            $parent.css('height', Math.ceil(h1) + 8);
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
            $(".page-item.checking").removeClass("imaged checking loaded loading").find(".page-wrap img").remove();

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
                    // var $img = HT.engines.manager.get_image({ seq : seq, width : self.w, height: h, action : 'thumbnail' });
                    var $img = HT.engines.manager.get_image({ seq : seq, height: h, action : 'thumbnail' });
                    $img.attr("alt", "image of " + HT.engines.manager.getAltTextForSeq(seq));
                    // var $wrap = $('<div class="page-wrap"></div>').appendTo($page);
                    // $wrap.append($img);
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

            var $page = $('<div class="page-item"><div class="page-num">{SEQ}</div><div class="page-wrap"><a class="page-link" href="#{SEQ}" aria-label="Link to sequence {SEQ}"></a></div></div>'.replace(/\{SEQ\}/g, seq)).appendTo($(fragment));
            $page.attr('id', 'page' + seq);
            $page.css({ 'height' : Math.ceil(self.w) + 8, width : self.w });
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
