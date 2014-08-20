// reader.js

var HT = HT || {};

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
        // this._handleView(this.getView(), 'start');

        // this.bindEvents();
        // this.manager = Object.create(HT.Manager).init({
        //     reader : self,
        //     id : self.id,
        //     seq : self.options.params.seq
        // })

        // this.manager.start();

        // if ( this.options.params.ui == 'fullscreen' ) {
        //     var $btn = $("#action-toggle-fullscreen");
        //     if ( ! $btn.is(":disabled") ) {
        //         setTimeout(function() {
        //             self._toggleFullScreen($btn);
        //         }, 250);
        //     }
        // }
        alert("STARTING");
    },

    EOT: true
}