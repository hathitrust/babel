var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Thumbnail = {

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
        $.publish("disable.rotate");
        $.publish("disable.download.page");
    },

    end : function() {
        // unsubscribe all handlers for this view
        $.unsubscribe(".thumb");
        $.publish("view.end");
        $("#content").empty();
        $body.removeClass("view-thumb");
        $(window).unbind("scroll.viewer.thumb");
        $(window).unbind("resize.thumb");
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

        $body.on('image:fudge.thumb', "img", function() {
            var h1 = $(this).data('natural-height');
            var h2 = $(this).parent().height();

            $(this).parent().addClass("loaded");
        });

        $(window).on("resize.thumb", function() {
            self.$container.css({ width : '' }).hide();
            setTimeout(function() {
                self.$container.width(self.$container.parent().width()).show();
                $(window).scroll();
            }, 100);
        })
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