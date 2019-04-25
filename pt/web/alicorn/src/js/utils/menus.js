head.ready(function() {

    var $menu = $("nav > ul > li:has(ul)");
    $menu.data('selected_idx', -1);
    $menu.on('focusin', function(event) {
        $menu.find("> a").get(0).dataset.expanded = true;
    })
    $menu.prev().find("> a").on('focusin', function() {
        $menu.find("> a").get(0).dataset.expanded = false;
    })
    $menu.find("ul > li > a:last").on('focusout', function(event) {
        $menu.find("> a").get(0).dataset.expanded = false;
    })
    $menu.on('keydown', function(event) {
        var code = event.code;
        var $items = $menu.find("ul > li > a");
        var selected_idx = $menu.data('selected_idx');
        var delta = 0;
        if ( code == 'ArrowDown' ) {
            delta = 1;
        } else if ( code == 'ArrowUp' ) {
            delta = -1;
        }
        if ( delta == 0 ) { return ; }
        selected_idx = ( selected_idx + delta ) % $items.length;
        console.log("AHOY MENU KEYDOWN", selected_idx);
        $selected = $items.slice(selected_idx, selected_idx + 1);
        $selected.focus();
        $menu.data('selected_idx', selected_idx);
    })

});
