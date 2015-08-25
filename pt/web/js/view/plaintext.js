var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.PlainText = {
    name : 'plaintext',

    init : function(options) {
        var self = this;
        return this;
    },

    options: {},

    start: function() {
        $body.addClass("view-plaintext");
        this.bindEvents();
        $.publish("view.ready");
    },

    bindEvents: function() {
        var self = this;
        $.publish("disable.toggle.fullscreen");
        $.publish("disable.zoom.in");
        $.publish("disable.zoom.out");
        $.publish("disable.rotate.clockwise");
        $.publish("disable.rotate.counterclockwise");
    },

    _gotoLink: function(link)  {
        window.location.href = $(link).attr("href");
    },

    EOT : true

};
