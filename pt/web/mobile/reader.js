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

        var view = this.options.params.view;
        if ( window.location.search.indexOf("view=" + view) < 0 ) {
            // view was inferred by cgi/pt; ignore
            view = null;
        }

        if ( this.options.params.ui == 'embed' ) {
            if ( view == 'plaintext' ) {
                // don't allow plaintext to be a default view in embedding
                view = null;
            }
        } else {
            // normal; null if not plaintext
            if ( view != 'plaintext' ) { view = null; }
        }

        if ( view == null ) {
            view = this._calculateOptimalView();
        }

        this.options.params.view = view;

        return this;
    },

    options: {

    },

    _calculateOptimalView: function() {
        var $window = $(window);
        return $window.height() < $window.width() ? '2up' : '1up';
    },

    start : function() {
        var self = this;

        this._handleView(this.getView(), 'start');

        this.bindEvents();
        HT.engines.manager = Object.create(HT.Manager).init({
            reader : self,
            id : self.id,
            seq : self.options.params.seq
        })

        HT.engines.manager.start();
    },

    updateView: function(view) {
        if ( 0 && view == this.getView() ) {
            return;
        }

        // HT.prefs.set({ pt : { view : view } })

        // this.$views.find("a.active").removeClass("active");
        // this.$views.find("a[data-target=" + view + "]").addClass("active");

        this._tracking = false;
        this._handleView(this.getView(), 'exit');
        this._handleView(view, 'start');
        this._updateViews(view);
        this.setView(view);
        if ( this.$slider && this.$slider.length ) {
            this.$slider.parents('.slider').remove();
        }
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

        // // don't bind dynamic controls for the static views
        // if ( this.getView() == 'image' || this.getView() == 'plaintext' ) {
        //     // and then disable buttons without links
        //     $(".toolbar").find("a[href='']").attr("disabled", "disabled").attr('tabindex', '-1');
        //     $(".action-views").on("click", "a", function() {
        //         var target = $(this).data('target');
        //         console.log("SETTING PREFERENCE", target);
        //         HT.prefs.set({ pt : { view : target } });
        //     })
        //     return;
        // }


        $("#action-view-toggle").click(function(e) {
            e.preventDefault();
            var $button = $(this);
            if ( self.getView() == 'plaintext' ) {
                // plaintext -> image
                $button.removeClass("action-view-image").find(".label").text("Plain Text");
                self.updateView(self._last_image_view || ( $(window).height() > $(window).width() ? '1up' : '2up') );
            } else {
                // image -> plaintext
                $button.addClass("action-view-image").find(".label").text("Image");
                self._last_image_view = self.getView();
                self.updateView('plaintext');
            }
        });
        // and then set the initial view
        if ( self.getView() == 'plaintext' ) {
            // default is image -> plaintext, so only need to change this
            // if we're starting in plaintext
            $("#action-view-toggle").addClass("action-view-image").find(".label").text("Image");
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
        this._bindAction("zoom.reset");
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

        $.subscribe("update.go.page", function(e, seq, action ) {
            var orig = seq;
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
            if ( self.$slider ) {
                self.$slider.slider('setValue', self.getView() == '2up' ? HT.engines.view._seq2page(seq) : seq);
            }
            if ( action ) { self._logPageview(orig); }
        });

        $.subscribe("update.focus.page", function(e, seq) {
            // we define the focus
            self.setCurrentSeq(seq);
            self.updateView("1up");
        });

        $.subscribe("view.ready.reader", function() {
            self._tracking = true;
            // set up the slider as needed
            self.buildSlider();
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

        $(window).on('orientationchange', function() {
            if ( self.getView() == '1up' || self.getView() == '2up' ) {
                switch(window.orientation) {
                    case 90:
                    case -90:
                        self.updateView('2up');
                        break;
                    case 0:
                    case 180:
                        self.updateView('1up');
                        break;
                    default:
                        break;
                }
            }
        })

        $(window).on('resize', function() {
            console.log("RESIZE CHANGE");
            if ( self.getView() == '1up' || self.getView() == '2up' ) {
                if ( $(window).height() > $(window).width() ) {
                    self.updateView('1up');
                } else {
                    self.updateView('2up');
                }
            }
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
        var view = this._current_view || this.options.params.view;
        // if ( $(window).height() > $(window).width() && view == '2up' ) { return '1up'; }
        // else if ( $(window).width() > $(window).height() && view == '1up' ) { return '2up'; }
        return view;
    },

    setView: function(view) {
        var views = {
            'Scroll' : '1up',
            'Flip' : '2up',
            // 'Thumbnail' : 'thumb',
            // 'Image' : 'image',
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

    buildSlider: function() {
        var self = this;
        if ( ! HT.engines.manager ) {
            return;
        }

        if ( self.$slider != null && self.$slider.length ) {
            $(".slider-park").empty();
            self.$slider = null;
        }

        var $nob = $('<input type="text" class="nob" value="1" />').appendTo($(".slider-park"));
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

    buildSliderXX: function() {
        var self = this;
        var $nob = $('<input type="text" class="nob" value="1" />').appendTo($(".slider-park"));
        var manager = HT.engines.manager;
        var view = HT.engines.view;
        var last_seq = manager.getLastSeq();
        var last_num = manager.getPageNumForSeq(last_seq);
        var current = self.getCurrentSeq();
        var this_view = self.getView();
        if ( this_view == '2up ') { current = view._seq2page(current); }
        self.$slider = $nob.slider({
            min : 0,
            max : this_view == '2up' ? view.pages.length - 1 : last_seq - 1,
            value : current,
            selection : 'none',
            tooltip : 'show',
            orientation: 'right',
            formater : function(seq) {
                if ( this_view == '2up' ) {
                    seq = view._page2seq(seq);
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
                seq = view._page2seq(seq);
                if ( seq[0] !== null ) {
                    seq = seq[0];
                } else {
                    seq = seq[1];
                }
            }
            console.log("JUMPING TO", seq);
            $.publish("action.go.page", (seq));
        })
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

    _logPageview: function(seq, action) {
        // log to babel
        var self = this;
        if ( this._startup ) { return ; }
        if ( $.isArray(seq) ) { seq = seq.join(','); }
        if ( ! action ) { action = 'read'; }
        var new_href = self._getCurrentURL(seq);
        new_href += ";a=" + action;
        $.get(new_href);
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
        if ( stage == 'exit' ) {
            $(".slider-park").empty();
        }
    },

    _handleFlip: function(stage) {
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

    EOT: true

}

if ( HT.Viewer && HT.Viewer.Scroll ) {
    HT.Viewer.Scroll._getPageMargin = function() {
        return 1;
    }
}

head.ready(function() {
    var $toggle = $("#action-toggle-toolbars");

    var _hide_toolbars = function() {
        setTimeout(function() {
            $(".cbp-spmenu").removeClass("cbp-spmenu-open");
        }, 250);
    };

    $toggle.click(function(e) {
        e.preventDefault();
        $(".cbp-spmenu").toggleClass("cbp-spmenu-open");
    })

    $("#action-info").click(function(e) {
        e.preventDefault();
        $("#info-panel").modal();
        _hide_toolbars();
    })

    $("#action-settings").click(function(e) {
        e.preventDefault();
        var $panel = $("#settings-panel");
        $panel.modal();
        _hide_toolbars();
    })

    $("#action-get-item").click(function(e) {
        e.preventDefault();
        $("#get-book-panel").modal();
        _hide_toolbars();
    })

    $("#toolbar-back-to-item").click(function(e) {
        e.preventDefault();
        if ( $("#search-page").is(":visible") ) {
            $("#action-search-inside").click();
        } else {
            $("#action-table-of-contents").click();
        }
    })

    $("#action-table-of-contents").click(function(e) {
        e.preventDefault();
        var $toc = $("#contents-page");
        var $page = $("#main");
        if ( $page.is(":visible") ) {
            // activate search form
            HT.engines.reader._last_seq = HT.engines.reader.getCurrentSeq();
            $page.hide();
            $toc.show();
            window.scrollTo(0,0);
            $("#toolbar-footer").removeClass("cbp-spmenu-open").hide();
            $("#toolbar-header").addClass("cbp-spmenu-open do-search-inside");
        } else {
            // active page
            $toc.hide();
            $page.show();
            $.publish("action.go.page", (HT.engines.reader._last_seq));
            $("#toolbar-header").removeClass("cbp-spmenu-open do-search-inside");
            $("#toolbar-footer").show();
        }
    })

    $("#action-search-inside").click(function(e) {
        e.preventDefault();
        var $form = $("#search-page");
        var $page = $("#main");
        if ( $page.is(":visible") ) {
            // activate search form
            if ( $("body").is(".view-restricted") ) {
                // do something else
            } else {
                HT.engines.reader._last_seq = HT.engines.reader.getCurrentSeq();
            }
            $page.hide();
            $form.show();
            window.scrollTo(0,0);
            $("#toolbar-footer").removeClass("cbp-spmenu-open").hide();
            $("#toolbar-header").addClass("cbp-spmenu-open do-search-inside");
        } else {
            // active page
            $form.hide();
            $page.show();
            $.publish("action.go.page", (HT.engines.reader._last_seq));
            $("#toolbar-header").removeClass("cbp-spmenu-open do-search-inside");
            $("#toolbar-footer").show();
        }
    })

    $("body").on('click', '.search-results > li', function(e) {
        e.preventDefault();
        if ( $("body").is(".view-restricted") ) {
            return;
        }

        var seq = $(this).data('seq');
        if ( $("#contents-page").is(":visible") ) {
            $("#action-table-of-contents").click();
        } else {
            $("#action-search-inside").click();
        }
        $.publish("action.go.page", (seq));
    });

    $("#mdpTextDeny form").on('submit', function(e) {
        e.preventDefault();
        var $form = $(this);
        var value = $.trim($form.find("input[name=q1]").val());
        if ( ! value ) { return ; }
        $("#search-page input[name=q1]").val(value);
        $("#action-search-inside").click();
        $("#form-search-volume").submit();
    });

    $(".form-search-inside").on('submit', function(e) {
        e.preventDefault();
        var $form = $(this);
        var $status = $("#search-page .message");
        var $results = $("#search-page .search-results");

        $form.find("button").addClass("btn-loading");

        var start = 1;

        // construct search URL
        HT.engines.reader.base_search_url = window.location.pathname + "/search?id=" + HT.params.id + ";q1=" + $form.find("input[type=text]").val();
        HT.engines.reader.base_search_url += ";sz=25;skin=mobile;start=";
        HT.engines.reader.search_start = 1;

        $results.empty();

        $.ajax({
            url : HT.engines.reader.base_search_url + HT.engines.reader.search_start,
            cache : true,
            success : function(data) {
                if ( ! data ) {
                    // no results
                } else {
                    var $data = $(data);
                    var total = $data.find("#mdpResultsContainer").data("total");
                    HT.engines.reader.search_total = total;
                    $status.empty();
                    $data.find(".mdpSearchSummary").appendTo($status);
                    $data.find("#mdpOuterList > li").each(function() {
                        $results.append(this);
                    })
                    if ( total > 25 ) {
                        $("#action-more-results").show();
                    }
                    $form.find("button").removeClass("btn-loading");
                    $form.find("input[name=q1]").blur();
                }
            }
        })

    })

    $("#action-more-results").click(function(e) {
        e.preventDefault();
        var $button = $(this).addClass("btn-loading");
        var $results = $("#search-page .search-results");
        HT.engines.reader.search_start += 25;
        $.ajax({
            url : HT.engines.reader.base_search_url + HT.engines.reader.search_start,
            cache : true,
            success : function(data) {
                if ( ! data ) {
                    // no results
                } else {
                    $button.removeClass("btn-loading");
                    var $data = $(data);
                    var N = 0;
                    $data.find("#mdpOuterList > li").each(function() {
                        $results.append(this);
                        N += 1;
                    })
                    if ( N < 25 ) {
                        $button.hide();
                    }
                }
            }
        })
    })

    if ( ! $("body").is(".view-restricted") ) {

        setTimeout(function() {
            $("#action-toggle-toolbars").click();
        }, 500);

        HT.engines = {};

        HT.engines.reader = Object.create(HT.Reader).init({
            params : HT.params
        })

        HT.engines.reader.start();

    } else {
        HT = HT || {};
        HT.engines = {};
        HT.engines.reader = {};
        HT.engines.reader.params = HT.params;
    }

    setTimeout(function() {
        window.scrollTo(0,1);
    }, 1);

    // var $e = get_resize_root();
    // $e.on('resize.reader', function(e) {
    //     $.publish("action.resize");
    // })

    HT.analytics.getTrackingLabel = function($link) {
        //var params = ( HT.reader != null ) ? HT.reader.paramsForTracking() : HT.params;

        var label = HT.params.id + " " + HT.params.seq + " " + HT.params.size + " " + HT.params.orient + " " + HT.params.view;
        return label;
    };


})

var _dump_list = function($list) {
    var tmp = [];
    if ( $list.length == 0 ) {
        return "-";
    }
    $list.each(function() {
        tmp.push($(this).attr("id") || '?');
    })
    return tmp.join(" : ");
}

var FormValidation = function() {
    return true;
}

// head.ready(function() {

//     // update HT.params based on the hash
//     if ( window.location.hash ) {
//         var tmp1 = window.location.hash.substr(1).split(";");
//         for(var i = 0; i < tmp1.length; i++) {
//             var tmp2 = tmp1[i].split("=");
//             HT.params[tmp2[0]] = tmp2[1];
//         }
//     }

//     HT.reader = Object.create(HT.Reader).init({
//         params : HT.params
//     })

//     HT.reader.start();

//     HT.analytics.getTrackingLabel = function($link) {
//         //var params = ( HT.reader != null ) ? HT.reader.paramsForTracking() : HT.params;
//         var label = HT.params.id + " " + HT.params.seq + " " + HT.params.size + " " + HT.params.orient + " " + HT.params.view;
//         return label;
//     }

// })
