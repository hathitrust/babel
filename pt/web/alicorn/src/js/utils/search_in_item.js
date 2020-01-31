head.ready(function() {
  var $form = $(".form-search-volume");

  if ( $("#toolbar-vertical").length ) {
    var $iframe = $("<iframe name='search-results' id='search-results'></iframe>").appendTo($("body"));
    // $iframe.css({ width: '50vw', height: '50vh', border: '8px solid blue', position: 'fixed', bottom: 0 });
    $iframe.on("load", function() {
      $(window).trigger('undo-loading');
      $iframe.show();

      var $check = $("#mdpBackToResults");
      if ( ! $check.length ) {
        var href = $iframe.get(0).contentWindow.location.href;
        $check = $(`<div id="mdpBackToResults"></div>`);
        $(".bibLinks").before($check);
        $("#mdpBackToResults").append(`<p><a data-toggle="tracking" data-tracking-category="PT" data-tracking-action="PT Back to In Item Results" href="${href}">&#171; Back to "Search in this text" results</a></p>`);
      }

      // actually this *is* the current URL. Hmm.
      HT.params.q1 = $iframe.get(0).contentWindow.HT.params.q1;
      $("input[name=q1]").val(HT.params.q1);

      $(this).contents().on('click', '.back-to-beginning-link a', function(event) {
        // just close this iframe
        event.preventDefault();
        event.stopPropagation();
        $iframe.hide();
      })

      $(this).contents().on('click', 'article.result a', function(event) {
        event.preventDefault();
        var $link = $(event.target).closest("a");
        var href = $link.attr('href');

        var fragment = href.split('#');
        var cfi = `epubcfi(${fragment.pop()})`;
        setTimeout(() => {

          $iframe.hide();
          HT.reader.emit('updateHighlights');
          HT.reader._updateHistoryUrl({});
          // setTimeout(() => {
          //   HT.reader.display(cfi);
          //   setTimeout(() => {
          //     HT.reader.display(cfi);
          //   }, 500);
          // }, 100);

          // HT.reader.view.gotoPage(cfi, () => {
          //   // HT.reader.view.gotoPage(cfi);
          //   console.log("AHOY gotoPage", cfi, HT.reader.view.currentLocation());
          // })

          // var index = HT.reader.view.locations.locationFromCfi(cfi);
          // var new_cfi = HT.reader.view.locations.cfiFromLocation(index);
          // HT.reader.view.rendition.display(new_cfi).then(() => {
          //   console.log("AHOY gotoPage", cfi, index, new_cfi);
          // });

          HT.reader.view.rendition.display(cfi).then(() => {
            // setTimeout(() => {
            //   HT.reader.view.rendition.display(cfi).then(() => {
            //     console.log("AHOY gotoPage INNER", cfi, HT.reader.view.currentLocation());
            //   }, 1000);
            // })
            console.log("AHOY gotoPage", cfi, HT.reader.view.currentLocation());
          });
        }, 100);
      })
    })

    $("body").on('click', '#mdpBackToResults a[data-tracking-action="PT Back to In Item Results"]', function(event) {
      event.preventDefault();
      event.stopPropagation();
      $iframe.show();
      return false;
    })

    $form.attr('target', 'search-results');
  }

  $(window).on('undo-loading', function() {
    $("button.btn-loading").removeAttr("disabled").removeClass("btn-loading");
  })

  $form.submit(function(event) {
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

    if ( $form_.data('q') == $.trim($input.val()) && $iframe.length ) {
      // same query, just show the dang iframe
      $iframe.show();
      $(window).trigger('undo-loading');
      event.preventDefault();
      return false;
    }

    $form_.data('q', $.trim($input.val()));
    HT.params.q1 = $form_.data('q');

    $(window).on('unload', function() {
      // $submit.removeAttr('disabled');
      $(window).trigger('undo-loading');
    })

    return true;
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
    $("[data-highlight]").on('click', function() {
      var highlight = $(this).data('highlight');
      sessionStorage.setItem('highlight', JSON.stringify(highlight));
    })
});
