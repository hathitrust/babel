// reader.js

var HT = HT || {};
var $body = $("body");

HT.Reader = {
    init: function(options) {
        this.options = $.extend({}, this.options, options);
        // this.view = this._getView(); 
        this.id = this.options.params.id;
        HT.engines.imgsrv = Object.create(HT.ImgSrv).init({ 
            base : window.location.pathname.replace("/pt", "/imgsrv")
        });
        this._tracking = false;
        this._startup = true;
        return this;
    },

    options: {

    },

    start : function() {
        var self = this;
        this._handleView(this.getView(), 'start');
        this.bindEvents();

        var zooms = {};
        if ( HT.params.size && HT.params.size != "100" ) {
            var size = parseInt(HT.params.size);
            zooms[this.getView()] = size;
        }

        HT.engines.manager = Object.create(HT.Manager).init({
            id : self.id,
            seq : self.options.params.seq,
            zooms : zooms
        })

        HT.engines.manager.start();

        if ( this.options.params.ui == 'fullscreen' ) {
            var $btn = $("#action-toggle-fullscreen");
            if ( ! $btn.is(":disabled") ) {
                setTimeout(function() {
                    // self._toggleFullScreen($btn);
                    self._manageFullScreen(true);
                }, 250);
            }
        }

        self._trackPageview();
        HT.analytics.deQ();
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
        HT.engines.manager.restart();
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

        $("body").on('click', '.page-link', function(e) {
            console.log("PAGE LINK CLICK", e.ctrlKey);
            if ( e.ctrlKey ) {
                // select this item
                self._addPageToSelection($(this).parents(".page-item"), false, true);
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        })

        $("body").on('click', '.page-item', function(e) {
            if ( e.metaKey || e.ctrlKey ) {
                console.log("AHOY : PAGE ITEM CLICK");
                self._addPageToSelection($(this), e, true);
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        })

        $("#content").on('mousedown', function(e) {
            if ( e.ctrlKey || e.shiftKey ) {
                e.preventDefault();
            }
        })

        $("body").on('click', "input.selectable,label.selectable", function(e) {
            var $page = $(this).parents(".page-item");
            // self._addPageToSelection($page, e.shiftKey, ! $page.is(".selected"));
            self._addPageToSelection($page, e, ! $page.is(".selected"));
            e.preventDefault();
            e.stopPropagation();
        })

        $("body").on('focusin', "input.selectable", function(e) {
            $(this).parents("label.selectable").addClass("focused").tooltip('show');
        }).on('focusout', 'input.selectable', function(e) {
            $(this).parents("label.selectable").removeClass("focused").tooltip('hide');
        })

        $("body").on('mouseenter', 'label.selectable', function(e) {
            $(this).tooltip('show');
        }).on('mouseleave', 'label.selectable', function(e) {
            $(this).tooltip('hide');
        })

        $("#selectedPagesPdfLink").on('click', function(e) {
            e.preventDefault();

            var printable = self._getPageSelection();

            if ( printable.length == 0 ) {
                var buttons = [];

                var msg = [ "<p>You haven't selected any pages to print.</p>" ];
                if ( self.getView() == '2up' ) {
                    msg.push("<p>To select pages, click in the upper left or right corner of the page.");
                    msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-flip.gif\" /></p>");
                } else {
                    msg.push("<p>To select pages, click in the upper right corner of the page.");
                    if ( self.getView() == 'thumb' ) {
                        msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-thumb.gif\" /></p>");
                    } else {
                        msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-scroll.gif\" /></p>");
                    }
                }
                msg.push("<p><tt>shift + click</tt> to de/select the pages between this page and a previously selected page.");
                msg.push("<p>Pages you select will appear in the selection contents <button style=\"background-color: #666; border-color: #eee\" class=\"btn square\"><i class=\"icomoon icomoon-attachment\" style=\"color: white; font-size: 14px;\" /></button>");

                msg = msg.join("\n");

                buttons.push({
                    label: "OK"
                });
                bootbox.dialog(msg, buttons);
                return false;
            }


            var seq = self._getFlattenedSelection(printable);

            $(this).data('seq', seq);
            HT.downloader.downloadPdf(this);
        });

        // dyanmic in every view

        var $btn_fullScreen = $("#action-toggle-fullscreen");
        this._bindAction("toggle.fullscreen", this._toggleFullScreen);
        $(window).bind('fullscreen-toggle', function(e, state) { self._manageFullScreen(state); })
                 .bind('fullscreen-on',     function(e)        { self._manageFullScreen(true)  })
                 .bind('fullscreen-off',    function(e)        { self._manageFullScreen(false); })
                 .bind('fullscreen-key',    function(e, k, a)  { self._manageFullScreen() });



        $("#action-clear-selection").on('click', function(e) {
            e.preventDefault();
            self._clearSelection();
            $(this).css('visibility', 'hidden');
        })

        $.subscribe("view.ready.reader", function() {
            self._tracking = true;
            if ( self.getView() == '2up' ) {
                setTimeout(function() {
                    self.buildSlider();
                }, 250);
            }

            self.setupPageSelection();

            // and center the display
            self._centerContentDisplay();

            console.log("AHOY: VIEW READY");
            self._updateSocialLinks();
            self._startup = false;
        });

        // don't bind dynamic controls for the static views
        if ( this.getView() == 'image' || this.getView() == 'plaintext' ) {
            // and then disable buttons without links
            $(".toolbar").find("a[href='']").attr("disabled", "disabled").attr('tabindex', '-1');
            $(".action-views").on("click", "a", function() {
                var target = $(this).data('target');
                HT.prefs.set({ pt : { view : target } });
            })
            // self._updateSocialLinks();
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

        // $(".table-of-contents").on("click", "a", function(e) {
        $("body").on("click", ".table-of-contents a", function(e) {            
            e.preventDefault();
            var seq = $(this).data('seq');
            $.publish("action.go.page", (seq));
            $(".bb-bookblock").removeClass("lowered");
        })

        // $("html").on("click.dropdown.reader", function() {
        //     console.log("REMOVING LOWERED");
        //     $(".bb-bookblock").toggleClass("lowered", $(".btn-group").is(".open"));
        // })

        $("#action-go-page").click(function(e) {
            e.preventDefault();
            var value = $.trim($("#input-go-page").val());
            var seq;
            if ( ! value ) { return ; }
            if ( value.match(/^\d+/) ) {
                // look up num -> seq in manager
                seq = HT.engines.manager.getSeqForPageNum(value);
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

        $.subscribe("update.go.page", function(e, seq, action) {
            var orig = seq;

            if ( action ) { self._logPageview(orig); }

            if ( $.isArray(seq) ) {
                // some views return multiple pages, which we use for
                // other interface elements
                seq = seq[0] != null ? seq[0] : seq[1];
            }
            var value = HT.engines.manager.getPageNumForSeq(seq);
            if ( ! value ) {
                // value = "n" + seq;
                // don't display this for the end user
                value = "";
            }
            $("#input-go-page").val(value);
            self.setCurrentSeq(seq, orig);

            if ( self.$slider && HT.engines.view ) {
                self.$slider.slider('setValue', self.getView() == '2up' ? HT.engines.view._seq2page(seq) : seq);
            }

        })

        $.subscribe("update.zoom.size", function(e, zoom) {
            if ( self._animating ) { return ; }
            var size = Math.ceil(zoom * 100);
            HT.params.size = size;
            HT.engines.manager.update_zoom(self.getView(), size);
            self._logPageview(null, "zoom:" + size);
        })

        $.subscribe("update.rotate.orient", function(e, orient) {
            HT.params.orient = orient;
            self._logPageview(null, "rotate:" + orient);
        })

        $.subscribe("update.focus.page", function(e, seq) {
            // we define the focus
            self.setCurrentSeq(seq);
            self.updateView("1up");
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

        $("a[data-tracking-category='outLinks']").on('click', function(e) {
            self._logPageview(null, "out:" + $(this).attr('href'));
        })

        var $e = get_resize_root();
        var last_size = { width : $e.width(), height: $e.height() };
        var lazyResize = _.debounce(function(e) {
            console.log("POSTING RESIZE EVENT", $e.width(), "x", $e.height());
            $.publish("action.resize");
        }, 500);
        $e.on('resize.reader', lazyResize);
        // $e.on('debouncedresize.reader', function() { console.log("POSTING RESIZE EVENT"); $.publish("action.resize"); });
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

        this._updateSocialLinks();
    },

    _centerContentDisplay: function() {
        // try to horizontally center content
        var $content = $("#content");
        var $window = $(window);
        var right_edge = $content.position().left + $content.width();
        // console.log("CENTERING", $window.scrollLeft(), $window.width(), right_edge);
        if ( right_edge > $window.width() && $window.scrollLeft() == 0 ) {
            $window.scrollLeft(right_edge - $window.width() - ( $("#sidebar").width() * 0.4 ) );
        }
    },

    _toggleFullScreen: function(btn) {
        var self = this;
        var $btn = $(btn);
        if ( $btn.hasClass("active") ) {
            // exitFullscreen();
            self._manageFullScreen(false);
        } else {
            console.log("LAUNCHING FULL SCREEN");
            // launchFullscreen(document.documentElement);
            self._manageFullScreen(true);
        }
    },

    _manageFullScreen: function(state) {
        var self = this;
        
        var $btn = $("#action-toggle-fullscreen");
        var $sidebar = $(".sidebar");
        if ( state == null ) { state = ! $btn.hasClass("active"); }
        // set this EARLY
        self._full_screen_state = state;
        self._animating = true;
        if ( ! state ) {
            $sidebar.show("fast", function() {
                //$("#sidebar").css("visibility", "hidden") //.show();
                $(window).scroll();
                //$("#sidebar").css('visibility', 'visible').show("fast");
                $btn.removeClass("active");
                $btn.find(".icomoon-fullscreen-exit").removeClass("icomoon-fullscreen-exit").addClass("icomoon-fullscreen");
                $.publish("action.toggle.fullscreen");
                // $(window).trigger("resize");
                setTimeout(function() {
                    self._animating = false;
                }, 500);
            })
        } else {
            $sidebar.hide( "fast", function() {
                $(window).scroll();
                $btn.addClass("active");
                $btn.find(".icomoon-fullscreen").removeClass("icomoon-fullscreen").addClass("icomoon-fullscreen-exit");
                $.publish("action.toggle.fullscreen");
                self._animating = false;
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
                fn.apply(self, [$btn]);
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
        this._updateState({ view : view, size : HT.engines.manager.get_zoom(view) });
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

     _getCurrentURL: function(seq) {
        var new_href = window.location.pathname;
        new_href += "?id=" + HT.params.id;
        new_href += ";view=" + this.getView();
        new_href += ";seq=" + ( seq || this.getCurrentSeq() );
        var size = HT.engines.manager.get_zoom(this.getView());
        if ( size && size != 100 ) {
            new_href += ";size=" + size;
        }
        if ( HT.params.debug ) {
            new_href += ";debug=" + HT.params.debug;
        }
        if ( HT.params.skin ) {
            new_href += ";skin=" + HT.params.skin;
        }
        return new_href;
    },

    _updateState: function(params) {
        var new_href = this._getCurrentURL();
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
            var size = HT.engines.manager.get_zoom(this.getView());
            if ( size && size != 100 ) {
                new_hash += ";size=" + size;
            }
            window.location.replace(new_hash); // replace blocks the back button!
        }
        this._trackPageview(new_href);

    },

    _logPageview: function(seq, action) {
        // log to babel
        var self = this;
        if ( this._startup ) { return ; }
        if ( ! action ) { action = '-'; }
        if ( $.isArray(seq) ) { seq = seq.join(','); }
        var new_href = self._getCurrentURL(seq);
        new_href += ";a=" + action;
        $.get(new_href);
    },

    _trackPageview: function(href) {
        // if ( this._tracking && HT.analytics && HT.analytics.enabled ) {
        if ( this._tracking && HT.analytics ) {
    				console.log("AHOY AM TRACKING", this._tracking, HT.analytics.enabled, HT.analytics._simplifyPageHref(href));
            HT.analytics.trackPageview(HT.analytics._simplifyPageHref(href));
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

    _updateSocialLinks: function() {

        var canonical_url = $("#pageURL").val();
        var image_url = this.getCurrentImageURL();

        // twitter
        $("meta[name='twitter:image:src']").attr('content', image_url);
        $("meta[name='twitter:url']").attr('content', canonical_url);

        // facebook
        $("meta[property='og:image']").attr('content', image_url);
        $("meta[property='og:url']").attr('content', canonical_url);

        $(".social-links button[data-media]").data('media', image_url);
        $(".social-links button").data('url', canonical_url);
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
        } else if ( view == 'thumb' ) {
            this._handleThumb(stage);
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

    _handleThumb: function(stage) {
        var self = this;
    },

    _parseParams: function() {

    },

    setupPageSelection: function() {
        var self = this;

        // do nothing if we can't download the full PDF!
        if ( $("#fullPdfLink").attr('rel') != 'allow' ) {
            return;
        }

        $("html").addClass("selectable");

        var printable = self._getPageSelection();
        var w = $(".page-item:visible").width(); w = parseInt(w * 0.08);
        if ( ! $("html").is('.eq-ie8') ) {
            vein.inject('.page-item.selected .page-wrap:before', { 'border-width' : '0 ' + w + 'px ' + w + 'px 0 !important' });
            vein.inject('.page-item:not(.selected):hover .page-wrap:before', { 'border-width' : w + 'px ' + ' 0 0 ' + w + 'px !important' });

            vein.inject('.page-item.page-left.selected .page-wrap:before', { 'border-width' : '0 0 ' + w + 'px ' + w + 'px !important' });
            vein.inject('.page-item.page-left:not(.selected):hover .page-wrap:before', { 'border-width' : w + 'px ' + w + 'px 0 0 !important' });
        }

        $(".page-item").each(function() {
            var $page = $(this);
            var seq = $page.data('seq');
            var num = HT.engines.manager.getPageNumForSeq(seq) || "n" + seq;
            $page.data('num', num);
            if ( ! $page.data('selectified') ) {
                $page.append('<label class="selectable" data-toggle="tooltip" data-placement="bottom"><span class="offscreen directions" data-num="{NUM}">Select page {NUM} to download</span><input type="checkbox" name="selected" class="selectable offscreen" id="print-{SEQ}" value="{SEQ}" /></label>'.replace(/\{SEQ\}/g, seq).replace(/\{NUM\}/g, num));
                $page.find("label").tooltip({
                    trigger: 'manual',
                    title: function() {
                        return $(this).find("span").text()
                    }
                })
                $page.data('selectified', true);
            }
            if ( _.indexOf(printable, seq) > -1 ) {
                $page.find("input.selectable").prop('checked', true);
                var $span = $page.find("label.selectable span.directions");
                $page.addClass('selected');
                $page.attr('aria-label', "Page " + num + " is selcted for download");
            }
        });

        if ( printable.length ) {
            self._updateSelectionLabel(_.keys(printable).length);
            self._updateSelectionContents(printable);
        }
    },

    _addPageToSelection: function($page, evt, toggle) {
        var self = this;
        var $input = $page.find("input.selectable");
        var checked = ! $page.is(".selected");

        if ( toggle ) {
            $input.prop('checked', checked); // ! $input.prop('checked'));
        }

        var seq = parseInt($input.val(), 10);
        // now deal with processing 
        var printable = self._getPageSelection();

        var is_adding = checked; // $input.prop('checked');
        var to_process = [ seq ];

        $page.toggleClass("selected", checked );
        $page.attr('aria-label', checked ? ( "Page " + $page.data('num') + " is selcted for download" ) : null);
        if ( evt && evt.shiftKey && self._last_selected_seq ) {
            // there should be an earlier selection
            var prev_until;
            var fn = checked ? function(seq) { return _.indexOf(printable, seq) > -1 } : function(seq) { return _.indexOf(printable, seq) < 0 };

            var start_seq; var end_seq; var delta;
            if ( seq > self._last_selected_seq ) {
                start_seq = seq;
                end_seq = self._last_selected_seq;
            } else {
                start_seq = self._last_selected_seq;
                end_seq = seq;
            }

            for(var prev_until_ = start_seq - 1; prev_until_ > end_seq; prev_until_--) {
                // console.log("CHECKING:", checked, prev_until_, fn(prev_until_));
                prev_until = prev_until_;
                if ( fn(prev_until_) ) {
                    break;
                }
            }

            if ( prev_until == 1 && _.indexOf(printable, 1) < 0 ) {
                bootbox.alert("<p>Sorry.</p><p>Shift-click selects the pages between this page and an earlier selection, and we didn't find an earlier selected page.</p>");
            } else {
                for(var prev=start_seq; prev >= prev_until; prev--) {
                    var $page_prev = $("#page" + prev);
                    if ( $page_prev.length ) {
                        $page_prev.toggleClass('selected', checked).find("input.selectable").prop('checked', checked);
                        $page_prev.attr('aria-label', checked ? ( "Page " + $page_prev.data('num') + " is selcted for download" ) : null);
                    }
                    to_process.push(prev);
                }
            }
        }

        // if ( evt && evt.metaKey ) {
        //     // select the chapter
        //     var next_seq = seq + 1;
        //     while ( next_seq <= HT.engines.manager.getLastSeq() ) {
        //         var meta = HT.engines.manager.get_page_meta({ seq : next_seq });
        //         if ( _.indexOf(meta.features, 'FIRST_CONTENT_CHAPTER_START') > -1 || _.indexOf(meta.features, 'CHAPTER_START') > -1 ) {
        //             break;
        //         }
        //         to_process.push(next_seq);
        //         $("#page" + next_seq).toggleClass('selected', checked).find("input.selectable").prop('checked', checked);
        //         next_seq += 1;
        //     }
        // }

        if ( is_adding ) {
            printable = _.union(printable, to_process);
        } else {
            printable = _.difference(printable, to_process)
        }

        self._setSelection(printable);
        console.log(printable, to_process);

        var num_printable = printable.length;
        self._updateSelectionLabel(num_printable);
        self._updateSelectionContents(printable);

        self._last_selected_seq = seq;
    },

    _updateSelectionLabel: function(num_printable) {
        var $link = $("#selectedPagesPdfLink");
        var msg = num_printable;
        if ( msg == 0 ) {
            msg = 'pages';
        } else if ( msg == 1 ) {
            msg = "1 page";
        } else {
            msg = msg + " pages";
        }

        $link.text($link.data('template').replace('{PAGES}', msg));
        $link.data('total', num_printable);

        $("#action-clear-selection").css('visibility', num_printable == 0 ? 'hidden' : 'visible');
        return msg;
    },

    _getPageSelection: function() {
        var key = "selection-" + HT.params.id;
        var printable = [];
        try {
            printable = JSON.parse(sessionStorage.getItem(key) || "[]");
        } catch (e) {
        }
        return printable;
    },

    _setSelection: function(printable) {
        var key = "selection-" + HT.params.id;
        if ( printable === null ) {
            sessionStorage.removeItem(key);
            return;
        }
        sessionStorage.setItem(key, JSON.stringify(printable.sort(function(a, b) { return a - b; })));
    },

    _getFlattenedSelection: function(printable) {
        var seq = [];
        _.each(printable.sort(function(a, b) { return a - b; }), function(val) {
            if ( seq.length == 0 ) {
                seq.push([val, -1]);
            } else {
                var last = seq[seq.length - 1];
                if ( last[1] < 0 && val - last[0] == 1 ) {
                    last[1] = val;
                } else if ( val - last[1] == 1 ) {
                    last[1] = val;
                } else {
                    seq.push([val, -1]);
                }
            }
        })

        for(var i = 0; i < seq.length; i++) {
            var tmp = seq[i];
            if ( tmp[1] < 0 ) {
                seq[i] = tmp[0];
            } else {
                seq[i] = tmp[0] + "-" + tmp[1];
            }
        }
        return seq;
    },

    _updateSelectionContents: function(printable) {
        var self = this;

        var $menu = $("#selection-contents");

        if ( printable.length == 0 ) {
            $menu.find("li").remove();
            $menu.find(".msg").text('');
            $menu.find("button").addClass('disabled');
            return;
        }

        $menu.find("button").removeClass('disabled');
        $menu.find(".msg").text(printable.length + " pages");
        var $ul = $menu.find("ul.dropdown-menu");
        $ul.find("li").remove();
        var list = self._getFlattenedSelection(printable);
        _.each(list, function(args) {
            var seq = args;
            var postscript = "";
            if ( typeof(args) == "string" ) {
                var tmp = args.split("-");
                seq = tmp[0];
                postscript = "<br /><span>(" + ( parseInt(tmp[1], 10) - parseInt(tmp[0], 10) + 1 ) + " pages)</span>";
            }
            $ul.append('<li><a href="{URL}" data-seq="{SEQ}"><img src="//babel.hathitrust.org/cgi/imgsrv/thumbnail?id={ID};seq={SEQ};width=75" />{POSTSCRIPT}</a></li>'
                .replace('{URL}', window.location.href.replace(/seq=\d+/, "seq=" + seq))
                .replace(/{SEQ}/g, seq)
                .replace(/{ARGS}/g, args)
                .replace(/num=\d+/, '')
                .replace('{ID}', HT.params.id)
                .replace('{POSTSCRIPT}', postscript)
            );
        })
    },

    _clearSelection: function() {
        var self = this;

        $("input.selectable:checked").prop('checked', false);
        $(".page-item.selected").toggleClass('selected', false);
        // var $link = $("#selectedPagesPdfLink");
        // $link.text($link.data('template').replace('{PAGES}', 'pages'));

        self._setSelection(null);
        self._updateSelectionContents([]);
        self._updateSelectionLabel(0);
    },

    buildSlider: function() {
        var self = this;
        if ( ! HT.engines.manager ) {
            return;
        }
        var $nob = $(".nob");
        if ( ! $nob.length ) {
            $nob = $('<input type="text" class="nob" value="1" />').appendTo($("#content"));
        }
        var manager = HT.engines.manager;
        var last_seq = manager.getLastSeq();
        var last_num = manager.getPageNumForSeq(last_seq);
        if ( last_num === undefined ) { last_num = "n" + last_seq ; }
        var current = self.getCurrentSeq();
        var this_view = self.getView();
        if ( this_view == '2up' ) { current = HT.engines.view._seq2page(current); }
        // console.log("INIT SLIDER", this_view, current, HT.engines.view.pages.length - 1);
        self.$slider = $nob.slider({
            min : 0,
            max : this_view == '2up' ? HT.engines.view.pages.length - 1 : last_seq - 1,
            value : current,
            selection : 'none',
            tooltip : 'show',
            formater : function(seq) {
                if ( this_view == '2up' ) {
                    var old_seq = seq;
                    seq = HT.engines.view._page2seq(seq);
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
                seq = HT.engines.view._page2seq(seq);
                if ( seq[0] !== null ) {
                    seq = seq[0]
                } else {
                    seq = seq[1];
                }
            }
            $.publish("action.go.page", (seq));
        })
    }, 

    getCurrentImageURL: function() {
        var image_url = window.location.origin + HT.engines.imgsrv.get_action_url('image', { id : HT.params.id, idth: 400, seq: this.getCurrentSeq() });
        image_url = image_url.replace('roger-full.', '');
        return image_url;
    },

    EOT: true

}

head.ready(function() {

    if ( window.location.href.indexOf("skin=mobile") > -1 ) {
        return;
    }

    var test = window.getComputedStyle(document.getElementById('toolbar-horizontal'));
    var testBackgroundColor = test.backgroundColor == 'rgba(0, 0, 0, 0)';
    if ( testBackgroundColor ) {
        // no style
        var new_href = location.href;
        if ( new_href.indexOf('view=') > -1 ) {
            new_href = new_href.replace(/view=\w+/, 'view=image');
        } else {
            new_href += ( ( new_href.indexOf('&') > -1 ) ? '&' : ';' ) + 'view=image';
        }
        window.location.href = new_href;
        return;
    }

    // update HT.params based on the hash
    if ( window.location.hash ) {
        var tmp1 = window.location.hash.substr(1).split(";");
        for(var i = 0; i < tmp1.length; i++) {
            var tmp2 = tmp1[i].split("=");
            HT.params[tmp2[0]] = tmp2[1];
        }
    }

    HT.engines = {};

    HT.engines.reader = Object.create(HT.Reader).init({
        params : HT.params
    })

    HT.engines.reader.start();

    $(".toolbar-vertical .btn").each(function() {
        var $btn = $(this);
        var title = $btn.text();
        $btn.tooltip({ title : title, placement : 'left', container : '#main', delay : { show : 250, hide: 50 }, xtrigger : 'hover focus', animation: false })
    })

    $(".toolbar-horizontal .btn").each(function() {
        var $btn = $(this);
        var title = $btn.find(".toolbar-label").text();
        if ( title ) {
            $btn.tooltip({ title : title, placement : 'bottom', container : '.toolbar-horizontal', delay : { show : 250, hide: 50 }, xtrigger: 'hover focus', animation : false })
        }
    })

    $("#action-clear-selection").tooltip({ title: "Clear Selection", placement : 'left', container: 'body', delay : { show : 250, hide: 50 } });

    // $('html').on('click.dropdown.reader', '.table-of-contents .btn', function(e) {
    //     // $(".bb-bookblock").css('z-index', 100);
    //     var toggle = ! $(this).parent().is(".open");
    //     console.log("HEY", $(this).parent(), toggle);
    //     $(".bb-bookblock").toggleClass("lowered", toggle);
    // });

    HT.analytics.getTrackingLabel = function($link) {
        //var params = ( HT.reader != null ) ? HT.reader.paramsForTracking() : HT.params;

        var label = HT.params.id + " " + HT.params.seq + " " + HT.params.size + " " + HT.params.orient + " " + HT.params.view;
        return label;
    };

})

// Find the right method, call on correct element
function launchFullscreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}
