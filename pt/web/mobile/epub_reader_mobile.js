head.ready(function() {
    var $toggle = $("#action-toggle-toolbars");

    var _hide_toolbars = function() {
        setTimeout(function() {
            $(".cbp-spmenu").removeClass("cbp-spmenu-open");
        }, 250);
    };

    $toggle.click(function(e) {
        e.preventDefault();
        $(".cbp-spmenu").toggleClass("cbp-spmenu-open");
    })

    $("#action-info").click(function(e) {
        e.preventDefault();
        $("#info-panel").modal();
        _hide_toolbars();
    })

    $("#action-settings").click(function(e) {
        e.preventDefault();
        var $panel = $("#settings-panel");
        $panel.modal();
        _hide_toolbars();
    })

    $("#action-get-item").click(function(e) {
        e.preventDefault();
        $("#get-book-panel").modal();
        _hide_toolbars();
    })

    $("#toolbar-back-to-item").click(function(e) {
        e.preventDefault();
        if ( $("#search-page").is(":visible") ) {
            $("#action-search-inside").click();
        } else {
            $("#action-table-of-contents").click();
        }
    })

    $("#action-table-of-contents").click(function(e) {
        e.preventDefault();
        var $toc = $("#contents-page");
        var $page = $("#main");
        if ( ! $toc.is(":visible") ) {
            // activate search form
            // HT.engines.reader._last_seq = HT.engines.reader.getCurrentSeq();
            // $page.hide();
            $toc.show();
            $("#toolbar-footer").removeClass("cbp-spmenu-open").hide();
            $("#toolbar-header").addClass("cbp-spmenu-open do-search-inside");
        } else {
            // active page
            $toc.hide();
            // $page.show();
            // $.publish("action.go.page", (HT.engines.reader._last_seq));
            $("#toolbar-header").removeClass("cbp-spmenu-open do-search-inside");
            $("#toolbar-footer").show();
        }
    })

    $("#action-search-inside").click(function(e) {
        e.preventDefault();
        var $form = $("#search-page");
        var $page = $("#main");
        if ( ! $form.is(":visible") ) {
            // activate search form
            if ( $("body").is(".view-restricted") ) {
                // do something else
            } else {
                // HT.engines.reader._last_seq = HT.engines.reader.getCurrentSeq();
            }
            // $page.hide();
            $form.show();
            // window.scrollTo(0,0);
            $("#toolbar-footer").removeClass("cbp-spmenu-open").hide();
            $("#toolbar-header").addClass("cbp-spmenu-open do-search-inside");
        } else {
            // active page
            $form.hide();
            // $page.show();
            // $.publish("action.go.page", (HT.engines.reader._last_seq));
            $("#toolbar-header").removeClass("cbp-spmenu-open do-search-inside");
            $("#toolbar-footer").show();
        }
    })

    $("body").on('click', '.search-results > li', function(e) {
        e.preventDefault();
        if ( $("body").is(".view-restricted") ) {
            return;
        }

        var seq = $(this).data('seq');
        if ( $("#contents-page").is(":visible") ) {
            $("#action-table-of-contents").click();
        } else {
            $("#action-search-inside").click();
        }
        $.publish("action.go.page", (seq));
    });

    $("#mdpTextDeny form").on('submit', function(e) {
        e.preventDefault();
        var $form = $(this);
        var value = $.trim($form.find("input[name=q1]").val());
        if ( ! value ) { return ; }
        $("#search-page input[name=q1]").val(value);
        $("#action-search-inside").click();
        $("#form-search-volume").submit();
    });

    $(".form-search-inside").on('submit', function(e) {
        e.preventDefault();
        var $form = $(this);
        var $status = $("#search-page .message");
        var $results = $("#search-page .search-results");

        $form.find("button").addClass("btn-loading");

        var start = 1;

        // construct search URL
        HT.engines = HT.engines || {};
        HT.engines.reader = HT.engines.reader || {};
        HT.engines.reader.base_search_url = window.location.pathname + "/search?id=" + HT.params.id + ";q1=" + $form.find("input[type=text]").val();
        HT.engines.reader.base_search_url += ";sz=25;skin=mobile;start=";
        HT.engines.reader.search_start = 1;

        $results.empty();

        $.ajax({
            url : HT.engines.reader.base_search_url + HT.engines.reader.search_start,
            cache : true,
            success : function(data) {
                if ( ! data ) {
                    // no results
                } else {
                    var $data = $(data);
                    var total = $data.find("#mdpResultsContainer").data("total");
                    HT.engines.reader.search_total = total;
                    $status.empty();
                    $data.find(".mdpSearchSummary:first").appendTo($status);
                    $data.find("#mdpOuterList > li").each(function() {
                        $results.append(this);
                    })
                    if ( total > 25 ) {
                        $("#action-more-results").show();
                    }
                    $form.find("button").removeClass("btn-loading");
                    $form.find("input[name=q1]").blur();
                }
            }
        })

    })

    $("#action-more-results").click(function(e) {
        e.preventDefault();
        var $button = $(this).addClass("btn-loading");
        var $results = $("#search-page .search-results");
        HT.engines.reader.search_start += 25;
        $.ajax({
            url : HT.engines.reader.base_search_url + HT.engines.reader.search_start,
            cache : true,
            success : function(data) {
                if ( ! data ) {
                    // no results
                } else {
                    $button.removeClass("btn-loading");
                    var $data = $(data);
                    var N = 0;
                    $data.find("#mdpOuterList > li").each(function() {
                        $results.append(this);
                        N += 1;
                    })
                    if ( N < 25 ) {
                        $button.hide();
                    }
                }
            }
        })
    })

    // if ( ! $("body").is(".view-restricted") ) {

    //     setTimeout(function() {
    //         $("#action-toggle-toolbars").click();
    //     }, 500);

    //     HT.engines = {};

    //     HT.engines.reader = Object.create(HT.Reader).init({
    //         params : HT.params
    //     })

    //     HT.engines.reader.start();

    // } else {
    //     HT = HT || {};
    //     HT.engines = {};
    //     HT.engines.reader = {};
    //     HT.engines.reader.params = HT.params;
    // }


    setTimeout(function() {
        $("#action-toggle-toolbars").click();
    }, 500);

    setTimeout(function() {
        window.scrollTo(0,1);
    }, 1);

    // HT.analytics.getTrackingLabel = function($link) {
    //     //var params = ( HT.reader != null ) ? HT.reader.paramsForTracking() : HT.params;

    //     var label = HT.params.id + " " + HT.params.seq + " " + HT.params.size + " " + HT.params.orient + " " + HT.params.view;
    //     return label;
    // };


})