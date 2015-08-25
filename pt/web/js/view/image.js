var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Image = {

    name : 'image',

    init : function(options) {
        var self = this;
        return this;
    },

    options: {},

    start: function() {
        $("body").addClass("view-image");
        this.bindEvents();
        $.publish("view.ready");
    },

    bindEvents: function() {
        var self = this;
        $.publish("disable.toggle.fullscreen");
        // $.subscribe("action.go.first.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.go.prev.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.go.next.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.go.last.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.zoom.in.image", function(e, link) { self._gotoLink(link); });
        // $.subscribe("action.zoom.out.image", function(e, link) { self._gotoLink(link); });



        var $img = $("body").find(".page-item img").load(function() {
            alert("LOADED");
            self._imageLoaded($(this));
        });

        setTimeout(function() {
            self._imageLoaded($img)
        }, 500);
    
    },

    _imageLoaded: function($img) {
        if ( $img.get(0).complete ) {
            $img.parents(".page-item").addClass("loaded");
            $(window).scroll();
        }
    },

    _gotoLink: function(link)  {
        window.location.href = $(link).attr("href");
    },

    EOT : true

};
