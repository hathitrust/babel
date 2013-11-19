head.ready(function() {

    var $html = $("html");
    var profile_id = 'UA-39581946-1';

    var generate_url = function() {
        var parts = [];
        parts.push("id=" + HT.params.id.replace(/\//g, '___'));
        if ( window.location.href.indexOf("/pt/search") > -1 ) {
            parts.push("view=search");
        } else {
            parts.push("view=" + HT.params.view);
        }
        if ( HT.params.seq ) {
            parts.push("seq=" + HT.params.seq);
        }
        return "/"+ parts.join("/");
    }

    $.subscribe("update.reader.state", function() {
        HT.analytics.trackPageview(generate_url(), profile_id);        
    });

    if ( $.trim($html.data('analytics-skip')) == 'true' ) {
        return;
    }

    // add delay so this fires after analytics is done being setup
    setTimeout(function() {
        if ( HT.analytics.enabled ) {
            HT.analytics.trackPageview(generate_url(), profile_id);
        }
    }, 500);

})