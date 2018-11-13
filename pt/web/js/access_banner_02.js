// Script: was access_banner.js: renamed to access_banner_02.js

// Only called when an element with id=accessBannerID is present and
// we need to test for exposure

$(document).ready(function() {
    if ($('#accessBannerID').length > 0) {
        var suppress = $('html').hasClass('supaccban');
        if (suppress) {
            return;
        }
        var debug = $('html').hasClass('htdev');
        var idhash = $.cookie('access.hathitrust.org', undefined, {json : true});
        var url = $.url(); // parse the current page URL
        var currid = url.param('id');
        if (idhash == null) {
            idhash = {};
        }

        var ids = [];
        for (var id in idhash) {
            if (idhash.hasOwnProperty(id)) {
                ids.push(id);
            }
        }

        if ((ids.indexOf(currid) < 0) || debug) {
            idhash[currid] = 1;
            // session cookie
            $.cookie('access.hathitrust.org', idhash, { json : true, path: '/', domain: '.hathitrust.org' });

            function showAlert() {
                var html = $('#accessBannerID').html();
                var $alert = bootbox.dialog(html, [{ label: "OK", "class" : "btn-primary btn-dismiss" }], { header : 'Special access', role: 'alertdialog' });
            }
            window.setTimeout(showAlert, 3000, true);
        }
    }
});
