// Script: access_banner.js 

// Only called when an element with id=accessBannerID is present and
// we need to test for exposure

$(document).ready(function() {
    if ($('#accessBannerID').length > 0) {
        var debug = $('html').hasClass('htdev');
        var idarr = JSON.parse($.cookie('access.hathitrust.org'));
        var url = $.url(); // parse the current page URL
        var id = url.param('id');
        if (idarr == null) {
            idarr = new Array;
        }
        if ((idarr.indexOf(id) < 0) || debug) {
            idarr.push(id);
            // session cookie
            var jsonIdStr = JSON.stringify(idarr);
            $.cookie('access.hathitrust.org', jsonIdStr, { path: '/', domain: '.hathitrust.org' });

            function showAlert() {
                var html = $('#accessBannerID').html();
	    	var alert = new Boxy(html, {
	            show : true,
	            modal : true,
	            draggable : true,
	            closeable : true,
	            title : "Special access",
                    closeText : "<span class='accessBannerCloseText'>close</span> <span class='accessBannerClose'>X</span></span>"
                });
            }
            window.setTimeout(showAlert, 3000, true);
        }
    }
});
