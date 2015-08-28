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

        this._startup = true;

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
        $("body").unbind("movestart"); // why?
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
            var h2 = $(this).parents('.bb-item').height();
            // var h2 = $(this).parent().height();

            var w1 = $(this).data('natural-width');
            // var w2 = $(this).parent().parent().width() / 2;
            var w2 = $(this).parents('.bb-item').width() / 2;

            var t = 100;

            $(this).parents(".page-item").addClass("loaded");

            if ( w1 - self.w > t ) {
                var $parent = $(this).parents('.page-item');
                $(this).parents('.page-item').addClass("untypical-page");
                if ( ! $parent.find("button").length ) {
                    $('<button href="{SRC}" class="btn btn-mini">View Larger</button>'.replace('{SRC}', $img.attr('src')))
                        .appendTo($parent)
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
        // console.log("FLIP RESIZE", do_rezoom, self.zoom, last_reset_zoom, self.reset_zoom);
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

        // console.log("UPDATE ZOOM", self.target_h, self.zoom);

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
                var $wrap = $('<div class="page-wrap"></div>').appendTo($page);
                $img.appendTo($wrap);
                // $img.appendTo($page);
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
            // $page.find("img").remove();
            $page.find(".page-wrap").remove();
        })
    },

    removeImage : function(seq) {
        var $page = $("#page" + seq);
        if ( ! $page.size() ) {
            return;
        }
        // console.log("UNLOADING IMAGE", seq);
        // $page.find("img").remove();
        $page.find(".page-wrap").remove();

        $page = $("#page" + (seq + 1));
        $page.find(".page-wrap").remove();
        // $page.find("img").remove();
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
                html += '<div id="page{SEQ}" class="bb-custom-side page-item page-left" data-seq="{SEQ}"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, left_page_seq);
                self._seq2page_map[left_page_seq] = i;
                self._page2seq_map[i][0] = left_page_seq;
            } else {
                html += '<div class="bb-custom-side page-item page-left empty"></div>';
            }
            if ( right_page_seq ) {
                // html += '<div id="page{SEQ}" class="page-item page-right"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, right_page_seq);
                html += '<div id="page{SEQ}" class="bb-custom-side page-item page-right" data-seq="{SEQ}"><div class="page-num">{SEQ}</div></div>'.replace(/{SEQ}/g, right_page_seq);
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
            self._startup = false;
        }, 100);

        $("body").on('click.flip', '.page-right', function(e) { // .page-right img?
            // self.book.bookblock('next');
            if ( e.metaKey || e.ctrlKey ) { return true; }
            self.gotoPage(null, 1);
        }).on('click.flip', '.page-left', function(e) { // .page-left img?
            // self.book.bookblock('prev');
            if ( e.metaKey || e.ctrlKey ) { return ; }
            self.gotoPage(null, -1);
        }).on('swipeleft.flip', function(e) { console.log("SWIPING"); self.gotoPage(null, 1); })
          .on('swiperight.flip', function(e) { self.gotoPage(null, -1); })

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

        var status = self.book.data('bookblock');
        if ( status === undefined ) { return ; }

        status = status.status();
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

        $(".page-item:visible").each(function() {
            var $page = $(this);
            var $img = $page.find("img");
            // console.log("#1 ", $page.width(), "x", $page.height(), " : ", $img.width(), "x", $img.height());
            // $img.height($page.height()).width($page.width());
            // console.log("#2 ", $page.width(), "x", $page.height(), " : ", $img.width(), "x", $img.height());
        })

        $.publish("update.go.page", [ seq, ! this._startup ]);

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

            // console.log("BEST FIT target_h", y, $(window).height(), $(".navbar").height(), $(".toolbar-horizontal").height());
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
        // console.log("BEST FIT", target_h, margin_w);
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
