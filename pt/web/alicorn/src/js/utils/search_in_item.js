head.ready(function() {
  var $form = $(".form-search-volume");
  $form.submit(function() {
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

    $(window).on('unload', function() {
      $submit.removeAttr('disabled');
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
});
