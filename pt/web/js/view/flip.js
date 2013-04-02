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

        $.subscribe("action.zoom.in.thumb", function(e) {
            self.updateZoom(1);
        })

        $.subscribe("action.zoom.out.thumb", function(e) {
            self.updateZoom(-1);
        })

        $.subscribe("action.rotate.clockwise", function(e) {
            self.rotateBook(1);
        })

        $.subscribe("action.rotate.counterclockwise", function(e) {
            self.rotateBook(-1);
        })

        $.subscribe("action.toggle.fullscreen", function(e) {
            self.w = -1;
            self.drawPages();
        })

        $("body").on('image:fudge.flip', "img", function() {
            var $img = $(this);
            var seq = $(this).data('seq');

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
                    $('<button href="{SRC}" class="btn btn-mini"><i class="icon-eye-open" /></button>'.replace('{SRC}', $img.attr('src')))
                        .appendTo($(this).parent())
                        .click(function() {
                            $.fancybox.open([ { href : $img.attr('src'), type : 'image' }])
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
        console.log("LOADING", page);
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
            console.log("UNLOADING IMAGE", seq);
            $page.find("img").remove();
        })
    },

    XXloadPage: function(seq) {
        var self = this;
        _.each([ seq, seq + 1], function(seq) {
            var $page = $("#page" + seq);
            if ( ! $page.size() ) {
                console.log("NO PAGE", seq);
                return;
            }
            if ( $page.find('img').size() ) {
                console.log("HAS IMAGE", seq);
                return;
            }
            console.log("LOADING", seq, self.w, self.h, $page.width());
            var $img = self.options.manager.get_image({ seq : seq, height: Math.ceil(self.h / 2) });
            $img.appendTo($page);
        })
    },

    removeImage : function(seq) {
        var $page = $("#page" + seq);
        if ( ! $page.size() ) {
            return;
        }
        console.log("UNLOADING IMAGE", seq);
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

        // which size bets fit the content width?
        if ( self.w < 0 ) {
            var best_w = -1; var best_zoom = 0;
            for(var i = 0; i < self.zoom_levels.length; i++) {
                var zoom = self.zoom_levels[i];
                if ( self.options.default_w * zoom * 1.2 > fit_w ) {
                    break;
                }
                self.w = self.options.default_w * zoom;
                self.zoom = zoom;
            }

            // console.log("STARTUP", self.w, self.zoom);
        }

        var meta = self.options.manager.get_page_meta({ seq : 1 });
        var r = self.w / meta.width;
        self.h = meta.height * r;
        var h = self.h / 2;

        self.$wrapper.css({ 'min-width' : ( self.w * 1.2 ) });

        // var h = ( self.w * 1.3 ) / 2;

        self.$wrapper.height(h); // .width(HT.w);
        $container.height(h);
        // console.log("SETTING HEIGHT", h, $container.height(), self.h);

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

        pages.push(last_page);

        if ( self.options.manager.reading_order == 'right-to-left' ) {
            pages.reverse();
        }

        self._seq2page_map = {}; self._page2seq_map = {};
        _.each(pages, function(page, i) {
            if ( ! page ) { return ; }
            var left_page_seq = page[0];
            var right_page_seq = page[1];
            var html = '<div class="bb-item">';
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

        this.book = $container.bookblock( {
                    speed               : 800,
                    shadowSides : 0.8,
                    shadowFlip  : 0.7,
                    perspective: 1300,
                    n : pages.length,
                    onBeforeFlip : function ( page, isLimit ) {
                        console.log("PRE FLIP:", page, isLimit);
                        // load images a couple of pages in the future
                    },
                    onEndFlip : function ( page, isLimit ) {
                        console.log("FLIPPED:", page, isLimit);
                        self.loadPage(page - 1);
                        self.loadPage(page - 2);
                        self.loadPage(page + 1);
                        self.loadPage(page + 2);

                        self.unloadPage(page - 8);
                        self.unloadPage(page + 8);

                        // self.loadPage(seq + 2);
                        // self.loadPage(seq + 4);
                        // self.loadPage(seq - 2);
                        // self.loadPage(seq - 4);
                        // self.removeImage(seq - 8);
                        // self.removeImage(seq + 8);
                    }
                } );

        this.book.n = pages.length;
        HT.bb = this.book;

        if ( self.options.seq ) {
            current = self._seq2page(self.options.seq);
            delete self.options.seq;
        } else {
            if ( current < 0 ) {
                current = pages.length;
            }
        }

        self.loadPage(current);
        self.loadPage(current + 1);
        self.loadPage(current - 1);
        // self.loadPage(self._page2seq(current)); self.loadPage(self._page2seq(current) + 1);
        self.book.jump(current + 1);

        $(window).scroll();
        self.checkPageStatus();

        $container.on('click', '.page-right', function() {
            self.book.next();
        }).on('click', '.page-left', function() {
            self.book.prev();
        })

        $.publish("view.ready");

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