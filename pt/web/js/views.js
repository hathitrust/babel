// views.js

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
        $.subscribe("action.go.start.image", function(e, link) { self._gotoLink(link); });
        $.subscribe("action.go.prev.image", function(e, link) { self._gotoLink(link); });
        $.subscribe("action.go.next.image", function(e, link) { self._gotoLink(link); });
        $.subscribe("action.go.last.image", function(e, link) { self._gotoLink(link); });
        $.subscribe("action.zoom.in.image", function(e, link) { self._gotoLink(link); });
        $.subscribe("action.zoom.out.image", function(e, link) { self._gotoLink(link); });

        $body.find(".page-item img").load(function() {
            $(window).scroll();
        })
    },

    _gotoLink: function(link)  {
        window.location.href = $(link).attr("href");
    },

    EOT : true

};

HT.Viewer.Thumb = {

    init : function(options) {
        var self = this;
        this.options = $.extend({}, this.options, options);
        this.w = this.options.default_w;
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
        this.bindEvents();
        this.bindScroll();
        this.drawPages();
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".thumb");
        $.publish("view.end");
        $("#content").empty();
        $body.removeClass("view-thumb");
        $(window).unbind("scroll.viewer.thumb");
        $(window).unbind("resize.thumb");
    },

    bindEvents: function() {
        var self = this;

        $.subscribe("action.go.start.thumb", function(e) {
            $("html,body").animate({ scrollTop : 0 });
        })

        $.subscribe("action.go.last.thumb", function(e) {
            $("html,body").animate({ scrollTop : $("body").height() - $(window).height() });
        })

        $.subscribe("action.go.next.thumb", function(e) {
            console.log("RECEIVED EVENT", e)

            var $body = $("body");
            var $window = $(window);

            var step = $window.height() / 3;
            $("html,body").animate({ scrollTop : $body.scrollTop() + step });
        })

        $.subscribe("action.go.prev.thumb", function(e) {
            console.log("RECEIVED EVENT", e)

            var $body = $("body");
            var $window = $(window);

            var step = $window.height() / 3;
            $("html,body").animate({ scrollTop : $body.scrollTop() - step });

        })

        $.subscribe("action.zoom.thumb", function(e, zoom, next_zoom) {
            self.w = self.options.default_w * zoom;
            console.log("ZOOM", e, zoom, next_zoom);
            if ( next_zoom * self.options.default_w > self.options.max_w ) {
                $.publish("disable.zoom.in");
            } else {
                $.publish("enable.zoom.in");
            }

            if ( next_zoom * self.options.default_w < self.options.min_w ) {
                $.publish("disable.zoom.out");
            } else {
                $.publish("enable.zoom.out");
            }
            self.drawPages();
        })

        $body.on('image:fudge.thumb', "img", function() {
            var h1 = $(this).data('natural-height');
            var h2 = $(this).parent().height();

            $(this).parent().addClass("loaded");

            // var t = parseInt($("#t").val());
            // // console.log("FUDGE", h1, h2, Math.abs(h1 - h2), ">", t);

            // if ( Math.abs(h1 - h2) > t ) {
            //  // $(this).parent().animate({ height: h1 }, 100);
            //  $(this).parent().height(h1);
            //  $(this).parent().addClass("imaged").addClass("expanded");
            // }
        });

        $(window).on("resize.thumb", function() {
            self.$container.css({ width : '' }).hide();
            setTimeout(function() {
                self.$container.width(self.$container.parent().width()).show();
                $(window).scroll();
            }, 100);
        })
    },

    bindScroll: function() {
        var self = this;

        var lazyLayout = _.debounce(function() {

            console.log("UPDATING THUMBNAIL VIEWS");
            var t0 = Date.now();

            if ( ! $(".page-item").length ) { return ; }

            var $imaged = $(".page-item.imaged");
            $imaged.addClass("checking");

            var $visible = $(".page-item:in-viewport");
            self.loadPage($visible);

            // load the previous and next for caching
            var $previous = $visible.slice(0,1).prevAll().slice(0,6);
            var $next = $visible.slice(-1).nextAll().slice(0,6);
            self.loadPage($previous);
            self.loadPage($next);

            $(".page-item.checking").removeClass("imaged").removeClass("checking").removeClass("loaded").find("img").remove();

        }, 250);

        $(window).on('scroll.viewer.thumb', lazyLayout);
        console.log("DEFINED SCROLL EVENT");

    },

    gotoPage: function(current) {
        if ( ! current ) { return; }
        if ( ! $(current).length ) { return ; }
        $('html,body').animate({
            scrollTop : $(current).offset().top
        }, "fast", function() {
            // console.log("IN VIEW:", $(".page:in-viewport"));

            $(".page-item:in-viewport").each(function() {
                var $page = $(this);
                if ( ! $page.is(".imaged") ) {
                    $page.addClass("imaged");
                    var seq = $page.data('seq');
                    var $img = this.options.manager.get_image({ seq : seq, width : HT.w });
                    $page.append($img);
                }
            })

        });
    },

    loadPage: function($pages) {
        var self = this;
        _.each($pages, function(page) {
            var $page = $(page);
            if ( ! $page.is(".imaged")) {
                $page.addClass("imaged");
                var seq = $page.data('seq');
                var $a = $("<a class='page-link' href='#{SEQ}'></a>".replace('{SEQ}', seq)).appendTo($page);
                console.log("LOAD PAGE", self.id, self.w);
                var $img = self.options.manager.get_image({ seq : seq, width : self.w, height: self.w, action : 'thumbnail' });
                $a.append($img);
            } else {
                $page.removeClass("checking");

            }
        })
    },

    drawPages : function() {
        var self = this;

        console.log("DRAWING:", self.w);

        $("#content").empty();
        self.$container = $('<div class="thumbnails"></div>').appendTo($("#content"));

        var total_w = self.$container.width();
        // really, how many thumbnails can we fit at self.w?
        self.$container.width(self.$container.width());


        if ( self.options.manager.reading_order == 'right-to-left' ) {
            self.$container.addClass("rtl");
        }

        var current = window.location.hash;

        var fragment = document.createDocumentFragment();

        for(var seq=1; seq <= self.options.manager.num_pages; seq++) {
            var meta = self.options.manager.get_page_meta({ seq : seq, width : 680 });

            var r = self.w / meta.width;
            var h = meta.height * r;

            var $page = $('<div class="page-item"><div class="page-num">{SEQ}</div></div>'.replace('{SEQ}', seq)).appendTo($(fragment));
            $page.attr('id', 'page' + seq);
            $page.css({ height : h, width : self.w });
            $page.data('seq', seq);
            $page.addClass("loading");

            // need to bind clicking the thumbnail to open to that page; so wrap in an anchor!!
        }

        self.$container.append(fragment);

        $(window).scroll();


    },

    EOT : true

};