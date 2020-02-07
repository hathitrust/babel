head.ready(function() {
  var $form = $(".form-search-volume");
  HT.$search_form = null;

  var $body = $("body");

  var section_view = function(view) {
    // $body.get(0).dataset.sectionView = view;
    document.documentElement.dataset.sidebarExpanded = false;
    document.documentElement.dataset.sectionView = view;
    $(".sidebar-container").find("button[aria-expanded]").attr('aria-expanded', false);
  }

  if ( $("#toolbar-vertical").length ) {
    // $iframe.on("load", function() {
    //   $(window).trigger('undo-loading');
    //   $iframe.show();

    //   var $check = $("#mdpBackToResults");
    //   if ( ! $check.length ) {
    //     var href = $iframe.get(0).contentWindow.location.href;
    //     $check = $(`<div id="mdpBackToResults"></div>`);
    //     $(".bibLinks").before($check);
    //     $("#mdpBackToResults").append(`<p><a data-toggle="tracking" data-tracking-category="PT" data-tracking-action="PT Back to In Item Results" href="${href}">&#171; Back to "Search in this text" results</a></p>`);
    //   }

    //   // actually this *is* the current URL. Hmm.
    //   HT.params.q1 = $iframe.get(0).contentWindow.HT.params.q1;
    //   $("input[name=q1]").val(HT.params.q1);

    //   $(this).contents().on('click', '.back-to-beginning-link a', function(event) {
    //     // just close this iframe
    //     event.preventDefault();
    //     event.stopPropagation();
    //     $iframe.hide();
    //   })

    //   $(this).contents().on('click', 'article.result a', function(event) {
    //     event.preventDefault();
    //     var $link = $(event.target).closest("a");
    //     var href = $link.attr('href');

    //     var fragment = href.split('#');
    //     var cfi = `epubcfi(${fragment.pop()})`;
    //     setTimeout(() => {

    //       $iframe.hide();
    //       HT.reader.emit('updateHighlights');
    //       HT.reader._updateHistoryUrl({});

    //       HT.reader.view.rendition.display(cfi).then(() => {
    //         console.log("AHOY gotoPage", cfi, HT.reader.view.currentLocation());
    //       });
    //     }, 100);
    //   })
    // })

    $("body").on('click', '.back-to-beginning-link a', function(event) {
      // just close this iframe
      event.preventDefault();
      event.stopPropagation();
      section_view('reader');
    })

    $("body").on('click', 'article.result a', function(event) {
      event.preventDefault();
      var $link = $(event.target).closest("a");
      var href = $link.attr('href');

      var fragment = href.split('#');
      var cfi = `epubcfi(${fragment.pop()})`;

      var highlight = $link.data('highlight');
      sessionStorage.setItem('highlight', JSON.stringify(highlight));
      section_view('reader');

      setTimeout(() => {

        HT.$search_form.scrollTop(0);

        HT.reader.emit('updateHighlights');
        HT.reader._updateHistoryUrl({});

        setTimeout(() => {
          console.log("AHOY RESULTS gotoPage CLICK X", cfi);
          HT.reader.view.rendition.display(cfi).then(() => {
            console.log("AHOY RESULTS gotoPage DONE X", cfi, HT.reader.view.currentLocation());
          });
        }, 100);
      }, 100);
    })

    $("body").on('click', '#mdpBackToResults a[data-tracking-action="PT Back to In Item Results"]', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      section_view('search-results');

      return false;
    })
  }

  $(window).on('undo-loading', function() {
    $("button.btn-loading").removeAttr("disabled").removeClass("btn-loading");
  })

  // $form.submit(function(event) {
  $("body").on('submit', 'form.form-search-volume', function(event) {
    HT.beforeUnloadTimeout = 15000;
    var $form_ = $(this);

    var $submit = $form_.find("button[type=submit]");
    if ( $submit.hasClass("btn-loading") ) {
      alert("Your search query has been submitted and is currently being processed.");
      return false;
    }
    var $input = $form_.find("input[type=text]")
    if ( ! $.trim($input.val()) ) {
      bootbox.alert("Please enter a term in the search box.");
      return false;
    }
    $submit.addClass("btn-loading").attr("disabled", "disabled");

    if ( $form_.data('q') == $.trim($input.val()) && HT.$search_form ) {
      // same query, just show the dang iframe
      $(window).trigger('undo-loading');
      event.preventDefault();
      section_view('search-results');
      // HT.$reader.hide();
      // HT.$search_form.show();
      return false;
    }

    $form_.data('q', $.trim($input.val()));
    HT.params.q1 = $form_.data('q');
    $("input[name='q1']").val(HT.params.q1);

    $(window).on('unload', function() {
      // $submit.removeAttr('disabled');
      $(window).trigger('undo-loading');
    })

    // return true;
    event.preventDefault();

    $.ajax({
      url: '/cgi/pt/search',
      method: 'GET',
      data: $form_.serialize()
    }).done(function (response) {
      $(window).trigger('undo-loading');
      var $response = $(response);

      var $results = $response.find("main");
      $results.attr('id', 'search-results');
      HT.$reader = $("main#main");
      if ( HT.$search_form ) {
        HT.$search_form.replaceWith($results);
        HT.$search_form = $("main#search-results");
      } else {
        HT.$search_form = $results;
        HT.$reader.after(HT.$search_form);
      }

      // var $results = $response.find("section#section");
      // HT.$reader = $("section#section");
      // if ( HT.$search_form ) {
      //   HT.$search_form.replaceWith($results);
      //   HT.$search_form = $("section.search-results-container");
      // } else {
      //   HT.$search_form = $results;
      //   HT.$reader.after(HT.$search_form);
      // }

      section_view('search-results');

      // this is why?
      var $btn = HT.$search_form.find(".sidebar-toggle-button");
      if ( $btn.height() == 0 && ( $("html").is(".ios") || $("html").is(".safari") ) ) {
        $btn.addClass("stupid-hack");
      }


    })


  })

  $("#action-start-jump").on('change', function() {
    var sz = parseInt($(this).data('sz'), 10);
    var value = parseInt($(this).val(), 10);
    var start = ( value - 1 ) * sz + 1;
    var $form_ = $("#form-search-volume");
    $form_.append(`<input name='start' type="hidden" value="${start}" />`);
    $form_.append(`<input name='sz' type="hidden" value="${sz}" />`);
    $form_.submit();
  })

  // handling EPUB-related links
  // --- renable this
  // $("body").on('click', "[data-highlight]", function() {
  //   var highlight = $(this).data('highlight');
  //   sessionStorage.setItem('highlight', JSON.stringify(highlight));
  // })

  // setInterval(() => {
  //   var main = document.querySelector('main');
  //   console.log("AHOY MAIN", main.offsetHeight, main.scrollTop);
  // }, 10);

});
