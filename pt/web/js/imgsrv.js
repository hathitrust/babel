var HT = HT || {};
HT.ImgSrv = {
	init : function(options) {
		this.options = $.extend({}, this.options, options);

		return this;
	},

	options: {

	},

	/* METHODS */

	get_action_url : function(action, params) {
		// var url = $.jurlp(this.options.base);
		// url.query(params);
		// url.path(action);
		// return url.url().toString();

		var action_url = this.options.base + "/" + action + "?";
		// if ( action == 'image' || action == 'thumbnail' ) {	
		// 	action_url = 'http://babel.hathitrust.org/cgi/imgsrv/' + action + '?';
		// }

		var args = [];
		if ( params.id ) {
			args.push("id=" + params.id);
		}
		if ( params.seq ) {
			args.push("seq=" + params.seq);
		}
		if ( params.width ) {
			args.push("width=" + Math.ceil(params.width));
		}
		if ( params.height ) {
			args.push("height=" + Math.ceil(params.height));
		}
		if ( params.orient !== undefined ) {
			args.push("orient=" + params.orient);
		}
		if ( params.format ) {
			args.push("format=" + params.format);
		}
		if ( params.limit ) {
			args.push("limit=" + params.limit);
		}
		if ( params.method ) {
			args.push("method=" + params.method);
		}
		if ( params.start ) {
			args.push("start=" + params.start);
		}

		if ( args.length && HT.params.debug ) {
			args.push("debug=" + HT.params.debug);
		}

		// https://roger-full.babel.hathitrust.org/cgi/imgsrv/meta?debug=supercallback=jQuery19104218266897369176_1366646687818&id=mdp.39015005503357&format=items&limit=1000002&method=fudged&start=0&_=1366646687819 

		return action_url + args.join(";");
	},

	EOT : true
}