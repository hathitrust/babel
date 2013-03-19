// manager.js

var HT = HT || {};

HT.Manager = {
    init : function(options, callback) {
        this.options = $.extend({}, this.options, options);
        this.data = {};

        return this;
    },

    options: {

    },

    start : function() {
        var self = this;

        this.view = Object.create(HT.Viewer[self.options.reader.view]);

        if ( ! self.view.is_dynamic ) {
            self.view.start();
            return;
        }

        var href = this.options.imgsrv.get_action_url("meta", {});
        $.ajaxSetup({ async : false });
        $.getJSON(href + "callback=?", 
            { id : this.options.id, format : 'items', limit : 1000002, method : 'fudged', start : 0  },
            function(data) {
                console.log("processing", data.items.length);
                self.data = data;
                self.num_pages = data.items.length;
                self.reading_order = data.readingOrder;
                console.log("ready");
                $.ajaxSetup({ async: true });
                // callback();
                self.options.view.start();
            }, 
            'json')

    },

    switch_view: function(view) {
        this.options.view.end();
        delete this.options.view;
        this.options.view = view;
        this.options.view.init().start();
        $(window).trigger('reset');
    },

    /* METHODS */

    rotate_image: function(params) {
        var meta = this.get_page_meta(params);
        if ( ! meta.orient ) {
            meta.orient = 0;
        }
        meta.orient += 1;
        if ( meta.orient == 4 ) { meta.orient = 0; }
        this.set_page_meta({ seq : params.seq, meta : meta });
    },

    set_page_meta: function(params) {
        this.data.items[params.seq] = params.meta;
    },

    get_page_meta: function(params) {
        var meta;
        if ( this.data.items[params.seq - 1] ) {
            meta = this.data.items[params.seq - 1];
        } else {
            var w = 680; // default w
            var h = w * 1.3;
            meta = { width : w, height : h, orient : 0 };
        }
        if ( params.width ) {
            var r = params.width / meta.width;
            meta.width = params.width;
            meta.height = meta.height * r;
        }
        return meta;
    },

    has_feature : function(meta, feature) {
        if ( typeof(meta) == "number" ) {
            meta = this.get_page_meta({ seq : meta });
        }
        if ( meta.features && _.indexOf(meta.features, feature) > -1 ) {
            return true;
        }
        return false;
    },

    get_image : function(params) {
        // params : seq, orient, size
        var self = this;
        var meta = this.get_page_meta(params);

        args = { seq : params.seq, id : this.options.id, width : params.width, orient : meta.orient }
        if ( params.height ) {
            args.height = params.height;
        }
        var src = this.options.imgsrv.get_action_url(params.action || 'image', args);
        var is_missing = false;
        if ( self.has_feature(meta, 'MISSING_PAGE') ) {
            console.log("MISSING");
            src = "holder.js/" + meta.width + "x" + meta.height + "/text:MISSING PAGE";
            is_missing = true;
        }


        var p = $.Deferred();

        var $img = $("<img/>");
        $img.load(p.resolve);
        $img.error(p.resolve);
        $img.get(0).src = src;
        $.when(p.promise()).then(function() {
            if ( is_missing ) {
                Holder.run();
                return;
            }
            var check = new Image();
            check.src = $img.get(0).src;
            console.log("-- image:", params.seq, $img.get(0).width, "x", $img.get(0).height, ":", check.width, "x", check.height);

            var r = 680 / check.width;
            var h = check.height * r;

            self.data[params.seq] = { width : 680, height : h, orient : meta.orient };
            //$img.parent().css({ height: '100%' });
            // $img.parent().animate({ height : '100%' });

            $img.data('seq', params.seq);
            $img.data('natural-height', check.height);
            $img.data('natural-width', check.width);
            $img.trigger("image:fudge");
        })
        return $img;

    },

    EOT : true
}