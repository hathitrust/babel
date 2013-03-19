// views.js

var HT = HT || {};
HT.Viewer = HT.Viewer || {};

HT.Viewer.Image = {
    init : function(options) {
        var self = this;
        is_dynamic : false;
    },

    options: {},

    start: function() {
        $body.addClass("view-image");
        this.bindEvents();
    },

    bindEvents: function() {
        $.publish("disable.toggle.fullscreen");
        $body.find(".page-item img").load(function() {
            $(window).scroll();
        })
    }, 

    EOT : true

};