head.ready(function() {

    var $window;
    var $sidebar;
    var $sidebar_scrollable;
    var $menu;
    var $navbar;

    $window = $(window);
    $sidebar = $(".sidebar-wrap");
    $sidebar_scrollable = $sidebar.find(".scrollable");

    if ( ! $sidebar.length ) {
        return;
    }

    if ( $("body").is(".view-image") || $("body").is(".view-plaintext") || $("body").is(".view-epub") ) {
        return; // don't bother
    }

    HT.x = 10;

    var calculate_height = function() {
        $navbar  = $(".navbar-static-top");
        var window_h = $(window).height();
        var h = $(window).height() - $navbar.height() - $(".toolbar-horizontal").outerHeight() - 20;
        var main_h = $("#scrolling").height();
        if ( h > main_h ) { h = main_h ; }
        var h2 = h - $(".bibLinks").height() - HT.x;
        console.log("CALCULATING SCROLLABLE HEIGHT", h, main_h, h2);
        return h2;
    }


    // if ( $.browser.msie && parseInt($.browser.version) < 9 ) {
    //     return;
    // }

    $.subscribe("action.toggle.fullscreen.sidebar", function() {
        if ( $sidebar.parent().is(":visible") ) {
            // $sidebar.trigger("sticky_kit:recalc");
            console.log("SIDEBAR PARENT IS VISIBLE");
            $sidebar.trigger("sticky_kit:detach");
            $sidebar.stick_in_parent({ inner_scrolling : false, offset_top : $navbar.height() + 10, recalc_every: 500 });
        } else {
            console.log("SIDEBAR PARENT IS HIDDEN");
            $sidebar.trigger("sticky_kit:detach");
            $sidebar.css("left", "auto");
        }
    })

    var original_left = $sidebar.position().left;
    $sidebar.data('original-left', $sidebar.position().left);

    $sidebar.on('sticky_kit:stick', function(e) {
        // console.log("STUCK", e.target, $sidebar.css('top'));
        $sidebar.css('left', 'auto');
    }).on('sticky_kit:unstick', function(e) {
        // console.log("UNSTUCK", e.target);
        $sidebar.css('left', 'auto');
    }).on('sticky_kit:bottom', function(e) {
        // console.log("BOTTOM", e.target);
        $sidebar.css('left', 'auto');            
    }).on('sticky_kit:unbottom', function(e) {
        // console.log("UNBOTTOM", e.target);
    })

    $window.scroll(function() {
        var left = $sidebar.css('left');
        if ( $sidebar.css('position') == 'fixed' ) {
            if ( left == 'auto' ) { left = $sidebar.position().left ; }
            $sidebar.css('left', ( - $window.scrollLeft() + original_left ) + 'px' );
        } else {
            $sidebar.css("left", 'auto');
        }
    });

    $.subscribe("view.ready.sidebar", function() {

        $sidebar.trigger("sticky_kit:detach");
        $sidebar_scrollable.height(calculate_height());
        $sidebar.stick_in_parent({ inner_scrolling : false, offset_top : $navbar.height() + 10, recalc_every: 500 });

        // console.log("STICKING SIDEBAR");

    });

});
