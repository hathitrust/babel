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
            $.notifyBar(
                {
                    cls: "accessBanner",
                    closecls: "accessBannerClose",
                    html: $('#accessBannerID').html(),
                    close: true,
                    delay: 2000000,
                    animationSpeed: "normal"
                });
        }
    }
});
