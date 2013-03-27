// reader.js

var HT = HT || {};
var $body = $("body");

HT.Reader = {
    init: function(options) {
        this.options = $.extend({}, this.options, options);
        this.view = this._getView(); 
        this.id = this.options.params.id;
        this.imgsrv = Object.create(HT.ImgSrv).init({ 
            base : window.location.pathname.replace("/pt", "/imgsrv")
        });
        return this;
    },

    options: {

    },

    start : function() {
        var self = this;
        this._handleView(this._getView(), 'start');

        this.bindEvents();
        this.manager = Object.create(HT.Manager).init({
            reader : self,
            id : self.id,
            seq : self.options.params.seq
        })

        this.manager.start();
    },

    switchView: function(view) {
        this._handleView(this.current_view, 'exit');
        this._handleView(view, 'start');
        this.setView(view);
        this.manager.switch_view(view);
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

        $("#versionIcon").click(function(e) {
            e.preventDefault();
            bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"mailto:feedback@issues.hathitrust.org\">Contact us</a> for more information.</p>")
        });

        // don't bind dynamic controls for the static views
        if ( this.view == 'Image' || this.view == 'PlainText' ) {
            // and then disable buttons without links
            $(".toolbar").find("a[href='']").attr("disabled", "disabled");
            return;
        }

        var $views = $(".action-views");
        $views.on("click", "a", function(e) {
            e.preventDefault();
            var $this = $(this);
            var target = $this.data('target');
            if ( target != $views.attr('current') ) {

                if ( target == 'Page by Page' || target == 'Plain Text' ) {
                    window.location.href = $this.attr('href');
                    return;
                }

                $views.find("a.active").removeClass("active");
                $this.addClass("active");
                self.switchView($(this).data('target'));
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
            self._updatePDFLinks(seq);
            if ( $.isArray(seq) ) {
                // some views return multiple pages, which we use for
                // other interface elements
                seq = seq[0] != null ? seq[0] : seq[1];
            }
            var value = self.manager.getPageNumForSeq(seq);
            if ( ! value ) {
                value = "n" + seq;
            }
            $("#input-go-page").val(value);
            self._current_seq = seq;
        })

        $.subscribe("disable.download.page.pdf", function() {
            $(".page-pdf-link").attr("disabled", "disabled").addClass("disabled");
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

    },

    getCurrentSeq: function() {
        return this._current_seq || this.options.params.seq || 1;
    },

    _toggleFullScreen: function(btn) {
        console.log("TOGGLE", this, btn);
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
            $(this).attr("disabled", "disabled");
        }).subscribe("enable." + action, function() {
            $(this).attr("disabled", null);
        })
    },

    _getView: function() {
        var views = {
            '1up' : 'Scroll',
            '2up' : 'Flip',
            'thumb' : 'Thumbnail',
            'image' : 'Image',
            'plaintext' : 'PlainText'
        }
        this.current_view = views[this.options.params.view];
        return views[this.options.params.view];
    },

    setView: function(view) {
        var views = {
            'Scroll' : '1up',
            'Flip' : '2up',
            'Thumbnail' : 'thumb',
            'Image' : 'image',
            'PlainText' : 'plaintext'
        }
        this.current_view = view;
        // and upate the reverse
        this.options.params.view = views[view];
    },

    _updatePDFLinks: function(seq) {
        var self = this;
        if ( $.isArray(seq) ) {
            // we have multiple links, but what do we label them?
            if ( this.current_view == 'Flip' ) {
                _.each(seq, function(seq, i) {
                    var $link = $("#pagePdfLink" + ( i + 1 ));
                    self._updateLinkSeq($link, seq);
                })
            }
        } else {
            var $link = $("#pagePdfLink");
            self._updateLinkSeq($link, seq);
        }
    },

    _updateLinkSeq: function($link, seq) {
        if ( seq == null ) {
            $link.attr("disabled", "disabled");
        } else {
            if ( ! $link.hasClass("disabled") ) {
                $link.attr("disabled", null);
            }
            var href = $link.attr("href");
            $link.attr("href", href.replace(/seq=\d+/, "seq=" + seq));
        }
    },

    _handleView: function(view, stage) {
        if ( view == 'Flip' ) {
            this._handleFlip(stage);
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

head.ready(function() {
    HT.reader = Object.create(HT.Reader).init({
        params : HT.params
    })

    HT.reader.start();
    // $(".toolbar-vertical").tooltip({ placement : 'right', selector : '.btn' });
    // $(".toolbar-horizontal").tooltip({ placement : 'top', selector : '.btn' });

    $(".toolbar-vertical .btn").each(function() {
        var $btn = $(this);
        var title = $btn.text();
        $btn.tooltip({ title : title, placement : 'left', container : '.toolbar-vertical' })
    })

    $(".toolbar-horizontal .btn").each(function() {
        var $btn = $(this);
        var title = $btn.find(".label").text();
        if ( title ) {
            $btn.tooltip({ title : title, placement : 'top', container : '.toolbar-horizontal' })
        }
    })

    $('html').on('click.dropdown.data-api', '.table-of-contents .btn', function(e) {
        // $(".bb-bookblock").css('z-index', 100);
        $(".bb-bookblock").toggleClass("lowered");
    });


})