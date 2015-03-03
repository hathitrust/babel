head.ready(function() {
    var $form = $(".search-form form");

    var $input = $form.find("input.search-input-text");
    var $select = $form.find("select");
    var $select_div = $form.find(".search-input-options");
    var $ft = $form.find("span.funky-full-view");

    var $backdrop = null;

    $form.delegate(':input', 'focus change', function(e) {
        console.log("FOCUSING", this);
        $form.addClass("focused");
        if ( $backdrop == null ) {
            $backdrop = $('<div class="modal-backdrop invisible"></div>');
            $backdrop.on('click', function() {
                close_search_form();
            });
        }
        $backdrop.appendTo($("body")).show();
    })

    $("body").on('focus', ':input,a', function(e) {
        var $this = $(this);
        if ( ! $this.closest(".search-form").length ) {
            close_search_form();
        }
    });

    var close_search_form = function() {
        $form.removeClass("focused");
        if ( $backdrop != null ) {
            $backdrop.detach();
            $backdrop.hide();
        }
    }

    window.focus_form = function() {
        $form.toggleClass("focused");
    }

})