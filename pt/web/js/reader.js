// reader.js

window.console||(console={log:function(){}});

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
        this.bindEvents();
        this.manager = Object.create(HT.Manager).init({
            reader : self,
            id : self.id
        })

        this.manager.start();
    },

    switchView: function(view) {
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

        this._bindAction("toggle.fullscreen");

        $("#versionIcon").click(function(e) {
            e.preventDefault();
            bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"mailto:feedback@issues.hathitrust.org\">Contact us</a> for more information.</p>")
        });

        // don't bind dynamic controls for the static views
        if ( this.view == 'Image' || this.view == 'PlainText' ) {
            // and then disable buttons without links
            $(".btn-toolbar").find("a[href='']").attr("disabled", "disabled");
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
            var value = self.manager.getPageNumForSeq(seq);
            if ( ! value ) {
                value = "n" + seq;
            }
            $("#input-go-page").val(value);
        })

        $.subscribe("disable.download.page.pdf", function() {
            $("#pagePdfLink").attr("disabled", "disabled");
        })

        $.subscribe("enable.download.page.pdf", function() {
            $("#pagePdfLink").attr("disabled", null);
        })

        $.subscribe("view.end.reader", function() {
            // enable everything when we switch views;
            // the views can update the state when they're initialized
            $.publish("enable.zoom");
            $.publish("enaboe.rotate");
            $.publish("enable.download");
            $.publish("enable.toggle.fullscreen");
        })

    },

    _bindAction: function(action) {
        var id = "#action-" + action.replace(".", "-");
        var $btn = $(id);
        $btn.click(function(e) {
            e.preventDefault();
            $.publish("action." + action, (this));
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
        return views[this.options.params.view];
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

    // $(".table-of-contents .btn").click(function() {
    //     var z_index = $(this).parent().hasClass("open") ? 100 : 0;
    //     $(".bb-bookblock").css('z-index', z_index);
    // })

    $('html').on('click.dropdown.data-api', '.table-of-contents .btn', function(e) {
        // $(".bb-bookblock").css('z-index', 100);
        $(".bb-bookblock").toggleClass("lowered");
        console.log(e, $(".bb-bookblock").hasClass("lowered"));
    });


})