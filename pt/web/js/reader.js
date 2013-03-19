// reader.js

window.console||(console={log:function(){}});

var HT = HT || {};
var $body = $("body");

HT.Reader = {
    init: function(options) {
        this.options = $.extend({}, this.options, options);
        this.view = this._getView(); 
        this.id = this.options.params.id;
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

    bindEvents: function() {
        // catch disabled items
        $("body").on('click', 'a', function(e) {
            if ( $(this).attr("disabled") ) {
                e.preventDefault();
                return false;
            }
        });

        $("#action-go-prev").click(function() {
            $.publish("action.go.prev");
        })

        $("#action-go-next").click(function() {
            $.publish("action.go.next");
        })

        $("#action-go-first").click(function() {
            $.publish("action.go.start");
        })

        $("#action-go-last").click(function() {
            $.publish("action.go.last");
        })

        $("#action-zoom-in").click(function() {
            // publish zoom
        }).subscribe("disable.zoom.in", function() {
            $(this).attr("disabled", "disabled");
        }).subscribe("enable.zoom.in", function() {
            $(this).attr("disabled", null);
        })

        $("#action-zoom-out").click(function() {
            // publish zoom
        }).subscribe("disable.zoom.out", function() {
            $(this).attr("disabled", "disabled");
        }).subscribe("enable.zoom.out", function() {
            $(this).attr("disabled", null);
        });

        $("#action-rotate-clockwise").click(function() {
            // publish zoom
        }).subscribe("disable.rotate.clockwise", function() {
            $(this).attr("disabled", "disabled");
        }).subscribe("enable.rotate.clockwise", function() {
            $(this).attr("disabled", null);
        });

        $("#action-rotate-counterclockwise").click(function() {
            // publish zoom
        }).subscribe("disable.rotate.counterclockwise", function() {
            $(this).attr("disabled", "disabled");
        }).subscribe("enable.rotate.counterclockwise", function() {
            $(this).attr("disabled", null);
        });

        $("#action-toggle-fullscreen").click(function() {
            // publish zoom
        }).subscribe("disable.toggle.fullscreen", function() {
            $(this).attr("disabled", "disabled");
        }).subscribe("enable.toggle.fullscreen", function() {
            $(this).attr("disabled", null);
        });

        $("#versionIcon").click(function(e) {
            e.preventDefault();
            bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"mailto:feedback@issues.hathitrust.org\">Contact us</a> for more information.</p>")
        });

        // and then disable buttons without links
        $(".btn-toolbar").find("a[href='']").attr("disabled", "disabled");

    },

    _getView: function() {
        var views = {
            '1up' : 'Scroll',
            '2up' : 'Flip',
            'thumb' : 'Thumbnail',
            'image' : 'Image',
            'plaintext' : 'Plaintext'
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
})

