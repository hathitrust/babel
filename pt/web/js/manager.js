// manager.js

var HT = HT || {};

HT.Manager = {
    init : function(options, callback) {
        this.options = $.extend({}, this.options, options);
        this.data = {};
        self.page_num_map = {};
        self.num_seq_map = {};
        self.seq_num_map = {};

        return this;
    },

    options: {

    },

    start : function() {
        var self = this;

        this.view = Object.create(self.options.reader.getViewModule()).init({
            manager : self,
            reader : self.options.reader
        });

        if ( ! self.view.options.is_dynamic ) {
            self.view.start();
            return;
        }

        var href = this.options.reader.imgsrv.get_action_url("meta", {});
        $.ajaxSetup({ async : false });
        $.getJSON(href + "callback=?", 
            { id : this.options.id, format : 'items', limit : 1000002, method : 'fudged', start : 0, debug : HT.params.debug || ''  },
            function(data) {
                // console.log("processing", data.items.length);
                self.data = data;
                self.num_pages = data.items.length;
                self.reading_order = data.readingOrder;
                self.parse_page_numbers();
                // console.log("ready");
                $.ajaxSetup({ async: true });
                // callback();
                self.view.start();
            }, 
            'json')

    },

    restart: function() {
        var self = this;

        self.view.end();
        delete self.view;
        // delete this.options.view;
        self.view = Object.create(self.options.reader.getViewModule()).init({
            manager : self,
            reader : self.options.reader
        });
        setTimeout(function() {
            self.view.start();
            $(window).trigger('reset');
        }, 100);
    },

    /* METHODS */

    parse_page_numbers: function() {
        var self = this;
        self.num_seq_map = {};
        self.seq_num_map = {};
        for(var i = 0; i < self.data.items.length; i++) {
            var item = self.data.items[i];
            if ( item.page_num ) {
                if ( self.num_seq_map[item.page_num] === undefined ) {
                    // first page number wins this mapping!
                    self.num_seq_map[item.page_num] = item.seq;
                }
                // but we can still keep this
                self.seq_num_map[item.seq] = item.page_num;
            }
        }
    },

    getSeqForPageNum: function(num) {
        return this.num_seq_map[num];
    },

    getPageNumForSeq: function(seq) {
        return this.seq_num_map ? this.seq_num_map[seq] : null;
    },

    getLastSeq: function() {
        var end_seq = this.num_pages;
        if ( this.has_feature(end_seq, "BACK_COVER") || ( this.has_feature(1, "COVER") && this.has_feature(1, "LEFT") ) ) {
            end_seq -= 1;           
        }
        return end_seq; 
    },

    getAltTextForSeq: function(seq) {
        var alt_text = "";
        var num = this.getPageNumForSeq(seq);
        if ( num ) {
            alt_text += "page " + num;
        } else {
            alt_text += "sequence " + seq;
        }
        return alt_text;
    },

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
            var h = w * 1.294;
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

    get_text : function(params) {
        // params : seq, orient, size
        var self = this;
        var meta = this.get_page_meta(params);

        args = { seq : params.seq, id : this.options.id }
        var src = this.options.reader.imgsrv.get_action_url(params.action || 'ocr', args);
        var is_missing = false;

        var p = $.ajax({
            url : src,
            dataType: 'html'
        })

        var $div = $("<div class='ocr_page'></div>");

        $.when(p.promise()).done(function(data) {
            $div.append($(data).children());
            if ( ! $.trim($div.text()) ) {
                $div.addClass("empty").empty().append('<div class="ocr_page"><div class="ocrx_block"><div class="ocr_par"><div class="alert alert-block alert-info alert-headline"><p>NO TEXT ON PAGE</p></div><p>This page does not contain any text recoverable by the OCR engine.</p></div></div>');
            }
            $div.trigger("text.loaded");
        })

        return $div;
    },

    get_image : function(params) {
        // params : seq, orient, size
        var self = this;
        var meta = this.get_page_meta(params);

        args = { seq : params.seq, id : this.options.id, width : params.width }
        if ( params.height ) {
            args.height = params.height;
        }
        if ( params.orient ) {
            args.orient = params.orient;
        }
        var src = this.options.reader.imgsrv.get_action_url(params.action || 'image', args);
        var is_missing = false;
        // if ( self.has_feature(meta, 'MISSING_PAGE') ) {
        //     console.log("MISSING");
        //     src = "holder.js/" + meta.width + "x" + meta.height + "/text:MISSING PAGE";
        //     is_missing = true;
        // }


        var p = $.Deferred();

        var $img = $("<img/>"); // .addClass("loading");
        $img.load(p.resolve);
        $img.error(p.reject);
        $img.get(0).src = src;
        $.when(p.promise()).done(function() {
            // $(this).removeClass("loading");
            var check = new Image();
            // check.src = $img.get(0).src;

            // console.log("-- image:", check.src, params.seq, $img.get(0).width, "x", $img.get(0).height, ":", check.width, "x", check.height);

            $(check).load(function() {
                var r; var h; var w;
                if ( params.orient == 1 || params.orient == 3 ) {
                    h = check.width;
                    w = check.height;
                } else {
                    w = check.width;
                    h = check.height;
                }
                r = 680 / w;
                h = h * r;

                self.data.items[params.seq] = { width : 680, height : h };
                //$img.parent().css({ height: '100%' });
                // $img.parent().animate({ height : '100%' });

                $img.data('seq', params.seq);
                $img.data('natural-height', check.height);
                $img.data('natural-width', check.width);
                $img.trigger("image.fudge");
            }).attr('src', $img.get(0).src);

        }).fail(function(status) {
            $img.get(0).src = '/imgsrv/common-web/graphics/503_image_distorted.jpg';
            $img.data('natural-width', 320);
            $img.data('natural-height', 480);
            $img.trigger("image.fudge");
        })
        return $img;

    },

    EOT : true
}
