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

    HT.x = 10;

    $navbar  = $(".navbar-static-top");
    var h = $window.height() - $navbar.height();
    var h2 = h - $(".bibLinks").height() - HT.x;

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
        $sidebar_scrollable.height(h2);
        $sidebar.stick_in_parent({ inner_scrolling : false, offset_top : $navbar.height() + 10, recalc_every: 500 });

        // console.log("STICKING SIDEBAR");

    });

});