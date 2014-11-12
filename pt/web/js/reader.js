// reader.js

var HT = HT || {};
var $body = $("body");

HT.Reader = {
    init: function(options) {
        this.options = $.extend({}, this.options, options);
        // this.view = this._getView(); 
        this.id = this.options.params.id;
        this.imgsrv = Object.create(HT.ImgSrv).init({ 
            base : window.location.pathname.replace("/pt", "/imgsrv")
        });
        this._tracking = false;
        return this;
    },

    options: {

    },

    start : function() {
        var self = this;
        this._handleView(this.getView(), 'start');

        this.bindEvents();
        this.manager = Object.create(HT.Manager).init({
            id : self.id,
            seq : self.options.params.seq
        })

        // passing reader in the init seemed to clone reader
        this.manager.options.reader = this;

        this.manager.start();

        if ( this.options.params.ui == 'fullscreen' ) {
            var $btn = $("#action-toggle-fullscreen");
            if ( ! $btn.is(":disabled") ) {
                setTimeout(function() {
                    self._toggleFullScreen($btn);
                }, 250);
            }
        }
    },

    updateView: function(view) {
        if ( view == this.getView() ) {
            return;
        }

        HT.prefs.set({ pt : { view : view } })

        if ( view == 'image' || view == 'plaintext' ) {
            window.location.href = this.$views.find("a[data-target=" + view + "]").attr('href');
            return;
        }

        this.$views.find("a.active").removeClass("active");
        this.$views.find("a[data-target=" + view + "]").addClass("active");

        this._tracking = false;
        this._handleView(this.getView(), 'exit');
        this._handleView(view, 'start');
        this._updateViews(view);
        this.setView(view);
        this.manager.restart();
    },

    bindEvents: function() {
        var self = this;

        // catch disabled items
        $("body").on('click', 'a', function(e) {
            if ( $(this).attr("disabled") ) {
                e.preventDefault();
                return false;
            }
        });

        // dyanmic in every view

        this._bindAction("toggle.fullscreen", this._toggleFullScreen);

        // don't bind dynamic controls for the static views
        if ( this.getView() == 'image' || this.getView() == 'plaintext' ) {
            // and then disable buttons without links
            $(".toolbar").find("a[href='']").attr("disabled", "disabled").attr('tabindex', '-1');
            $(".action-views").on("click", "a", function() {
                var target = $(this).data('target');
                HT.prefs.set({ pt : { view : target } });
            })
            return;
        }

        self.$views = $(".action-views");
        self.$views.on("click", "a", function(e) {
            e.preventDefault();
            var $this = $(this);
            var target = $this.data('target');
            self.updateView(target);
        })
        self.$views.find("a.active").removeClass("active").end().find("a[data-target='" + self.getView() + "']").addClass("active");

        // make the toolbar buttons "tracking-actions"
        // so they don't refresh the page
        $(".toolbar .btn[data-toggle*=tracking]").each(function() {
            if ( $(this).data('target') == 'image' || $(this).data('target') == 'plaintext' ) {
                // don't update these
                return;
            }
            var toggle = $(this).data('toggle');
            if ( toggle.indexOf("tracking-action") < 0 ) {
                $(this).data('toggle', toggle.replace('tracking', 'tracking-action'));
            }
        })

        this._bindAction("go.first");
        this._bindAction("go.prev");
        this._bindAction("go.next");
        this._bindAction("go.last");

        this._bindAction("zoom.in");
        this._bindAction("zoom.out");
        this._bindAction("rotate.clockwise");
        this._bindAction("rotate.counterclockwise");

        $(".table-of-contents").on("click", "a", function(e) {
            e.preventDefault();
            var seq = $(this).data('seq');
            $.publish("action.go.page", (seq));
            $(".bb-bookblock").removeClass("lowered");
        })

        $("#action-go-page").click(function(e) {
            e.preventDefault();
            var value = $.trim($("#input-go-page").val());
            var seq;
            if ( ! value ) { return ; }
            if ( value.match(/^\d+/) ) {
                // look up num -> seq in manager
                seq = self.manager.getSeqForPageNum(value);
                if ( ! seq ) {
                    // just punt
                    seq = value;
                }
            } else if ( value.substr(0, 1) == 'n' ) {
                seq = value.substr(1);
            }
            if ( seq ) {
                $.publish("action.go.page", (seq));
            }
        })

        $.subscribe("update.go.page", function(e, seq) {
            var orig = seq;
            if ( $.isArray(seq) ) {
                // some views return multiple pages, which we use for
                // other interface elements
                seq = seq[0] != null ? seq[0] : seq[1];
            }
            var value = self.manager.getPageNumForSeq(seq);
            if ( ! value ) {
                // value = "n" + seq;
                // don't display this for the end user
                value = "";
            }
            $("#input-go-page").val(value);
            self.setCurrentSeq(seq, orig);
            if ( self.$slider ) {
                self.$slider.slider('setValue', self.getView() == '2up' ? self.manager.view._seq2page(seq) : seq);
            }
        })

        $.subscribe("update.zoom.size", function(e, size) {
            HT.params.size = size;
        })

        $.subscribe("update.rotate.orient", function(e, orient) {
            HT.params.orient = orient;
        })

        $.subscribe("update.focus.page", function(e, seq) {
            // we define the focus
            self.setCurrentSeq(seq);
            self.updateView("1up");
        });

        $.subscribe("view.ready.reader", function() {
            self._tracking = true;
            if ( self.getView() == '2up' ) {
                setTimeout(function() {
                    self.buildSlider();
                }, 250);
            }
            $(window).trigger('reset');
        });

        $.subscribe("disable.download.page.pdf", function() {
            $(".page-pdf-link").attr("disabled", "disabled").addClass("disabled").attr('tabindex', -1);
        })

        $.subscribe("enable.download.page.pdf", function() {
            $(".page-pdf-link").attr("disabled", null).removeClass("disabled").attr('tabindex', null);
        })

        $.subscribe("enable.download.page.pdf", function() {
            $(".page-pdf-link").attr("disabled", null).removeClass("disabled");
        })

        $.subscribe("view.end.reader", function() {
            // enable everything when we switch views;
            // the views can update the state when they're initialized
            $.publish("enable.zoom");
            $.publish("enable.rotate");
            $.publish("enable.download.page");
            $.publish("enable.toggle.fullscreen");
        })

        $(document).on("webkitfullscreenchange mozfullscreenchange fullscreenchange", function() {
            console.log("FULLSCREEN?", $(document).fullScreen());
            // var $main = $(".main");
            // if ( $(".main").fullScreen() ) {
            //     $main.data('original-width', $main.css('width'));
            //     $main.data('original-height', $main.css('height'));
            //     $main.css({ height: $(window).height() - 50, width : $(window).width() - 50 });

            //     $("#toolbar-horizontal").data('original-top', $("#toolbar-horizontal").css('top'));
            //     $("#toolbar-horizontal").css("top", 50);
            // } else {
            //     $(".main").css({ 
            //         height : $main.data('original-height'),
            //         width : $main.data('original-width')
            //     });
            //     $("#toolbar-horizontal").css('top', $("#toolbar-horizontal").data('original-top'));
            // }
            $.publish("action.toggle.fullscreen");
            $(window).resize();
        })

        var $e = get_resize_root();
        $e.on('resize.reader', function(e) {
            $.publish("action.resize");
        })

    },

    getCurrentSeq: function() {
        return this._current_seq || this.options.params.seq || 1;
    },

    setCurrentSeq: function(seq) {
        var self = this;

        this._current_seq = seq;
        HT.params.seq = seq;

        this._updateState();
        this._updateLinks.apply(this, arguments);

        $(".action-views").find("a").each(function() {
            self._updateLinkSeq($(this), seq);
        })
    },

    _toggleFullScreen: function(btn) {

        var $btn = $(btn);
        var $sidebar = $(".sidebar");
        if ( $btn.hasClass("active") ) {
            $(".sidebar.dummy").show("fast", function() {
                $("#sidebar").css("visibility", "hidden") //.show();
                $(window).scroll();
                $("#sidebar").css('visibility', 'visible').show("fast");
                $btn.removeClass("active");
                $btn.find(".icomoon-fullscreen-exit").removeClass("icomoon-fullscreen-exit").addClass("icomoon-fullscreen");
                $.publish("action.toggle.fullscreen");
            })
        } else {
            $(".sidebar").hide( "fast", function() {
                $(window).scroll();
                $btn.addClass("active");
                $btn.find(".icomoon-fullscreen").removeClass("icomoon-fullscreen").addClass("icomoon-fullscreen-exit");
                $.publish("action.toggle.fullscreen");
            })
        }
    },

    _bindAction: function(action, fn) {
        var self = this;
        var id = "#action-" + action.replace(".", "-");
        var $btn = $(id);
        $btn.click(function(e) {
            e.preventDefault();
            // HT.analytics.trackEvent({ category : "PT", action : "PT "+ action});
            if ( fn == null ) {
                $.publish("action." + action, (this));
            } else {
                fn.apply(self, $btn);
            }
        }).subscribe("disable." + action, function() {
            $(this).attr("disabled", "disabled").attr('tabindex', -1);
        }).subscribe("enable." + action, function() {
            $(this).attr("disabled", null).attr("tabindex", null);
        })
    },

    getView: function() {
        return this._current_view || this.options.params.view;
    },

    setView: function(view) {
        var views = {
            'Scroll' : '1up',
            'Flip' : '2up',
            'Thumbnail' : 'thumb',
            'Image' : 'image',
            'PlainText' : 'plaintext'
        }
        this._current_view = view;
        // and upate the reverse
        this.options.params.view = view;
        this._updateState({ view : view });
    },

    getViewModule: function() {
        var views = {
            '1up' : 'Scroll',
            '2up' : 'Flip',
            'thumb' : 'Thumbnail',
            'image' : 'Image',
            'plaintext' : 'PlainText'
        }
        return HT.Viewer[views[this.getView()]];
    },

    _updateState: function(params) {
        var new_href = window.location.pathname;
        new_href += "?id=" + HT.params.id;
        new_href += ";view=" + this.getView();
        new_href += ";seq=" + this.getCurrentSeq();
        if ( HT.params.debug ) {
            new_href += ";debug=" + HT.params.debug;
        }
        if ( HT.params.skin ) {
            new_href += ";skin=" + HT.params.skin;
        }

        // if ( HT.params.size ) {
        //     new_href += ";size=" + HT.params.size;
        // }

        if ( window.history && window.history.replaceState != null ) {
            // create a whole new URL
            window.history.replaceState(null, document.title, new_href);

        } else {
            // update the hash
            var new_hash = '#view=' + this.getView();
            new_hash += ';seq=' + this.getCurrentSeq();
            window.location.replace(new_hash); // replace blocks the back button!
        }
        this._trackPageview(new_href);
        $.publish("update.reader.state");
    },

    _trackPageview: function(href) {
        if ( this._tracking && HT.analytics && HT.analytics.enabled ) {
            HT.analytics.trackPageview(href);
            // if we were still doing the experiment, we'd do it here
            // HT.analytics.trackPageview(alternate_href, alternate_profile_id);
        }
    },

    _updateLinks: function(seq, seqs) {
        var self = this;
        if ( ! seq ) { seq = this.getCurrentSeq(); }
        if ( this.getView() == '2up' ) {
            _.each(seqs, function(seq, i) {
                var $link = $("#pagePdfLink" + ( i + 1 ));
                self._updateLinkSeq($link, seq);
            })
        } else {
            var $link = $("#pagePdfLink");
            self._updateLinkSeq($link, seq);
        }
        self._updateLinkSeq($("#pageURL"), seq);
        self._updateLinkSeq($("input[name=seq]"), seq);
        self._updateLinkSeq($("#login-button"), seq);
    },

    _updateLinkSeq: function($link, seq) {
        if ( ! $link.length ) { return ; }
        if ( seq == null ) {
            $link.attr("disabled", "disabled").attr('tabindex', -1);
        } else {
            if ( ! $link.hasClass("disabled") ) {
                $link.attr("disabled", null).attr("tabindex", null);
            }
            if ( $link.is("input") && $link.attr("name") == "seq" ) {
                $link.val(seq);
            } else if ( $link.is("input") ) {
                var href = $link.val();
                $link.val(href.replace(/seq=\d+/, "seq=" + seq))
            } else {
                this._updateLinkAttribute($link, "seq", seq);
            }
        }
    },

    _updateViews: function(view) {
        var self = this;
        if ( ! view ) { view = this.getView(); }
        self._updateLinkAttribute($("#login-button"), "view", view);
        $("input[name=view]").val(view);
    },

    _updateLinkAttribute: function($link, key, value) {
        if ( ! $link.length ) { return ; }
        var href = $link.attr("href");
        var regex = new RegExp(key + "(=|%3D)");
        if ( ! regex.test(href) ) {
            // key not in href
            var text = key + "=" + value;
            var target_href = href;
            var idx;
            if ( ( idx = target_href.indexOf('target=') ) > -1 ) {
                // extract the target url
                idx += "target=".length;
                target_href = decodeURIComponent(href.substr(idx));
            }
            var sep = ';';
            if ( target_href.indexOf("&") > -1 ) {
                // add to parameters - semicolon
                sep = '&';
            }
            target_href += sep + text;
            if ( idx > -1 ) {
                // re-encode
                target_href = href.substr(0, idx) + encodeURIComponent(target_href);
            }
            $link.attr("href", target_href);
        } else {
            // replace existing key
            regex = new RegExp(key + "(=|%3D)" + "\\w+(;|&|%3B|%26)?");
            $link.attr("href", href.replace(regex, key + "$1" + value + "$2"));
        }
    },

    _handleView: function(view, stage) {
        if ( view == '2up' ) {
            this._handleFlip(stage);
        }
    },

    _handleFlip: function(stage) {
        var self = this;

        var $link = $("#pagePdfLink").parent();
        if ( stage == 'start' ) {
            // recto verso vs. rtl, BLEH!
            var $link1 = $link.clone(true).find("a").attr("id", "pagePdfLink1").text("Download left page (PDF)").end().insertAfter($link);
            var $link2 = $link.clone(true).find("a").attr("id", "pagePdfLink2").text("Download right page (PDF)").end().insertAfter($link1);
            $link.hide();

        } else {
            $("#pagePdfLink1").parent().remove();
            $("#pagePdfLink2").parent().remove();
            $link.show();
        }
    },

    _parseParams: function() {

    },

    buildSlider: function() {
        var self = this;
        if ( ! self.manager ) {
            return;
        }
        var $nob = $(".nob");
        if ( ! $nob.length ) {
            $nob = $('<input type="text" class="nob" value="1" />').appendTo($("#content"));
        }
        var manager = self.manager;
        var last_seq = manager.getLastSeq();
        var last_num = manager.getPageNumForSeq(last_seq);
        var current = self.getCurrentSeq();
        var this_view = self.getView();
        if ( this_view == '2up' ) { current = manager.view._seq2page(current); }
        // console.log("INIT SLIDER", this_view, current, manager.view.pages.length - 1);
        self.$slider = $nob.slider({
            min : 0,
            max : this_view == '2up' ? manager.view.pages.length - 1 : last_seq - 1,
            value : current,
            selection : 'none',
            tooltip : 'show',
            formater : function(seq) {
                if ( this_view == '2up' ) {
                    var old_seq = seq;
                    seq = manager.view._page2seq(seq);
                    if ( seq[0] == null ) {
                        seq = seq[1];
                    } else {
                        seq = seq[0];
                    }
                }
                var num = manager.getPageNumForSeq(seq);
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
            var seq = ev.value;
            if ( this_view == '2up' ) {
                seq = manager.view._page2seq(seq);
                if ( seq[0] !== null ) {
                    seq = seq[0]
                } else {
                    seq = seq[1];
                }
            }
            $.publish("action.go.page", (seq));
        })
    }, 

    EOT: true

}

head.ready(function() {

    // update HT.params based on the hash
    if ( window.location.hash ) {
        var tmp1 = window.location.hash.substr(1).split(";");
        for(var i = 0; i < tmp1.length; i++) {
            var tmp2 = tmp1[i].split("=");
            HT.params[tmp2[0]] = tmp2[1];
        }
    }

    HT.reader = Object.create(HT.Reader).init({
        params : HT.params
    })

    HT.reader.start();

    $(".toolbar-vertical .btn").each(function() {
        var $btn = $(this);
        var title = $btn.text();
        $btn.tooltip({ title : title, placement : 'left', container : '#main', delay : { show : 250, hide: 50 }, xtrigger : 'hover focus', animation: false })
    })

    $(".toolbar-horizontal .btn").each(function() {
        var $btn = $(this);
        var title = $btn.find(".label").text();
        if ( title ) {
            $btn.tooltip({ title : title, placement : 'top', container : '.toolbar-horizontal', delay : { show : 250, hide: 50 }, xtrigger: 'hover focus', animation : false })
        }
    })

    $('html').on('click.dropdown.reader', '.table-of-contents .btn', function(e) {
        // $(".bb-bookblock").css('z-index', 100);
        $(".bb-bookblock").toggleClass("lowered");
    });

    HT.analytics.getTrackingLabel = function($link) {
        //var params = ( HT.reader != null ) ? HT.reader.paramsForTracking() : HT.params;

        var label = HT.params.id + " " + HT.params.seq + " " + HT.params.size + " " + HT.params.orient + " " + HT.params.view;
        return label;
    }

})
