
var HT = HT || {};
HT.scrolling = {};

head.ready(function() {

    var last_top = $(window).scrollTop();
    var last_left = $(window).scrollLeft();

    var rebuild_sidebar = function() {
        var h = $(window).height() - $(".header.fixed").height() - $(".navbar-static-top").height();
        var h2 = h - $(".bibLinks").height() - HT.x;
        $("#sidebar").height(h).find(".scrollable").height(h2).addClass("nano");
        $(".scrollable.nano").nanoScroller({ alwaysVisible : true });
    }

    HT.scrolling.rebuild_sidebar = rebuild_sidebar;

    $(".header").addClass("fixed").addClass("fixed-x").data('extra-height', 40).data('shadow', '#navbar-inner');

    var $fixed = $(".fixed");
    var $fixed_x = $(".fixed.fixed-x");
    var $fixed_y = $(".fixed.fixed-y");
    var dummies = {}

    var $bottom = $(".main");

    rebuild_sidebar();

    var idx = 0;
    $fixed.each(function() {
        var $original = $(this);

        var xy = $original.offset();
        var w = $original.outerWidth();

        // console.log("ORIGINAL", w);

        if ( ! $original.attr("id") ) {
            idx += 1;
            $original.attr("id", "id" + idx);
        }

        $original.css({ position: 'fixed', top : xy.top, left : xy.left, width : w }).addClass("stuck");

        // if ( $original.hasClass("sidebar") ) {
        //     $original.height($(window).height());
        // }

        if ( ! $original.is(".no-dummy") ) {
            var extra_h = $original.data('extra-height') || 0;
            var $dummy = $("<div><div></div></div>").attr('class', $original.attr('class')).addClass("dummy").removeClass("stuck").css({ height: $original.outerHeight() + extra_h, width : w });
            $original.before($dummy).addClass('fixed-placed');
            $original.css('top', $dummy.offset().top).width($dummy.outerWidth()).addClass("static");
            if ( $original.is(".fixed-x") ) {
                $original.css('left', $dummy.offset().left);
            }
            dummies[$original.attr('id')] = $dummy;
        }


    })

    var handle_scroll_horizontal = function() {

        var current_left = $(window).scrollLeft();
        $fixed.filter(".fixed-y").each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr('id')];
            $original.css({ left : $dummy.offset().left - current_left });
        })
    }

    var handle_scroll_vertical = function() {
        var current_top = $(window).scrollTop();

        //console.log("-- scrolling", current_top, last_top);
        // console.log($("#sidebar").fracs().rects.viewport.bottom, " / ", $(".main").fracs().rects.viewport.bottom);
        if ( current_top == last_top ) {
            return;
        }

        $fixed_y.each(function() {
            var $original = $(this);
            var margin_top = $original.data('margin-top') || 0;
            var $dummy = dummies[$original.attr("id")];
            var top = parseInt($original.css('top'));

            if ( ! $original.is(":visible") ) { return ; }

            var original_bottom = top + $original.height();

            if ( last_top < current_top ) {
                // scrolling window content up, toward bottom
                var check_top, next_top;
                next_top = check_top = top + ( last_top - current_top );
                if ( ! $original.is(".unlocked") && next_top <= margin_top ) {
                    next_top = margin_top;
                }
                if ( ( next_top >= 0 || $original.is(".unlocked")  ) && next_top < top) {
                    $original.css({ top : next_top });
                }

                // track the bottom; can't use the dummies, need a container
                var f1 = $original.fracs(); var f2 = $bottom.fracs();
                if ( f1.rects.viewport.bottom - f2.rects.viewport.bottom > 0 ) {
                    // console.log("UNLOCKING:", f1.rects.viewport.bottom, f2.rects.viewport.bottom);
                    var delta = f1.rects.viewport.bottom - f2.rects.viewport.bottom;
                    $original.css({ top : check_top });
                    $original.addClass("unlocked");
                }

            } else {

                var next_top = $dummy.offset().top - current_top;
                if ( next_top >= margin_top ) {
                    $original.css({ top : next_top });
                    $original.removeClass("unlocked");
                } else if ( $original.is(".unlocked") ) {
                    next_top = top - ( current_top - last_top );
                    if ( next_top >= margin_top ) {
                        next_top = margin_top;
                        $original.removeClass("unlocked");
                    }
                    $original.css({ top : next_top });
                }

            }

            if ( top <= margin_top  ) {
                $original.addClass("locked");
            } else {
                $original.removeClass("locked");
            }

        })

        $fixed_x.each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr("id")];
            $original.css({ top : $dummy.offset().top - current_top });
            if ( $original.attr("id") == 'header' ) {
                var $menu = $("#menu-toggle");
                if ( $original.fracs().visible < 0.5 ) {
                    if ( ! $menu.length ) {
                        // var $ul = $("#person-nav");
                        // if ( ! $ul.length ) {
                        //     // we are not logged in; bugger.
                        //     $ul = $('<ul id="person-nav" class="nav pull-right"></ul>').appendTo("#navbar-inner");
                        // }

                        // $menu = $("<li><a id='menu-toggle' href='#'><span class='offscreen'>Toggle Header</span><i class='icomoon-reorder'></i></a></li>").appendTo($ul);
                        $menu = $('<div id="menu-toggle"><a href="#"><span class="offscreen">Toggle Header</span><i class="icomoon-reorder"></i></a></div>').appendTo("#navbar-inner");
                        $menu.find("a").click(function(e) {
                            e.preventDefault();
                            handle_drop($(this));
                        })
                    }
                    $menu.show();
                } else {
                    $menu.hide();
                }
            }
        })

        last_top = current_top;
    }

    var handle_resize_fn = function() {
        var scroll_left = $(window).scrollLeft();
        $fixed_y.each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr("id")];
            var new_left = $dummy.offset().left + scroll_left;
            $original.css({ left : new_left });
        })

        $fixed_x.each(function() {
            var $original = $(this);
            var $dummy = dummies[$original.attr("id")];
            //$dummy.css({ width : ''  });
            var new_left = $dummy.offset().left + parseInt($dummy.css('margin-left'));;
            //console.log("ER:", $dummy.offset().left, $dummy.width(), $dummy.css('margin-left'));
            // console.log("ER:", $original.offset().left, $dummy.offset().left, scroll_left);
            // $original.css({ left : new_left, xwidth : $dummy.width() });

            var $shadow = $($original.data('shadow'));
            //new_left = ( $(window).width() - $shadow.width() ) / 2;
            var new_left = ( $(window).width() - $shadow.width() ) / 2;
            $original.css({ width : $shadow.width(), left : new_left });
            $dummy.width( $original.outerWidth() );

        })

        var $uber = $(".container.page.centered");
        $uber.removeClass("page");
        setTimeout(function() {
            $uber.addClass("page");
            rebuild_sidebar();
        }, 100);
    }

    var handle_resize =  _.debounce(handle_resize_fn, 250);

    var handle_drop = function($btn) {
        var $header = $("#header");
        if ( $header.is(".dropped") ) {
            var pos = $header.data('pos');
            $header.animate({ top : pos.top }, function() {
                $header.removeClass("dropped");
                $btn.removeClass("active");
            });
        } else {
            var pos = { top : $header.css('top') };
            $header.data('pos', pos);
            $header.addClass("dropped").animate({ top : 40 }, function() { $btn.addClass("active"); });
        }        
    }

    $(window).on('scroll', handle_scroll_vertical);
    $(window).on('scroll', handle_scroll_horizontal);
    $(window).on('resize', handle_resize);

    $(window).on('reset', function() {
        setTimeout(function() {
            $fixed.removeClass("locked");
            $(window).scroll();
        }, 100);
    })

})


