
head.ready(function() {

  if ( location.pathname != '/cgi/pt/search' ) { return ; }

  var $form = $(".form-search-volume");
  var $input_q1 = $form.find("input[name='q1']");
  var $input_sort = $form.find("input[name='sort']");
  var $input_start = $form.find("input[name='start']");

  var $body = $("body");

  var submit_form = function(event) {
    HT.beforeUnloadTimeout = 15000;
    var $form_ = $form;

    var $submit = $form_.find("button[type=submit]");
    if ( $submit.hasClass("btn-loading") ) {
      alert("Your search query has been submitted and is currently being processed.");
      if ( event ) { event.preventDefault(); }
      return false;
    }
    var $input = $form_.find("input[type=text]")
    if ( ! $.trim($input.val()) ) {
      bootbox.alert("Please enter a term in the search box.");
      if ( event ) { event.preventDefault(); }
      return false;
    }
    $submit.addClass("btn-loading").attr("disabled", "disabled");

    $(window).on('unload', function() {
      $(window).trigger('undo-loading');
    })

    return true;
  }

  $(window).on('undo-loading', function() {
    $("button.btn-loading").removeAttr("disabled").removeClass("btn-loading");
  })

  $("body").on('submit', 'form.form-search-volume', function(event) {
    return submit_form(event);
  })

  $("button[data-action='sort']").on('click', function(event) {
    var target = this;
    var value = target.dataset.value;
    if ( value != $input_sort.val() ) {
      $input_sort.val(value);
      $form.submit();
    }
    return;
  })

  $("button[data-action='clear-search']").on('click', function(event) {
    event.stopPropagation();
    $input_q1.val('');
    $(".results-search-form").nextAll().remove();
  })

  $("#action-start-jump").on('change', function() {
    var sz = parseInt($(this).data('sz'), 10);
    var value = parseInt($(this).val(), 10);

    const max = parseInt(this.max);
    const min = parseInt(this.min);

    if ( isNaN(value) || value > max || value < min ) {
      this.value = this.dataset.value;
      $("#action-start-jump-error").show();
      alert(`Please enter a number between ${min} - ${max}`);
      return;
    }

    var start = ( value - 1 ) * sz + 1;
    $input_start.val(start);
    $form.submit();

    // var $form_ = $("#form-search-volume");
    // $form_.append(`<input name='start' type="hidden" value="${start}" />`);
    // $form_.append(`<input name='sz' type="hidden" value="${sz}" />`);
    // $form_.submit();
  })

});
