var HT = HT || {};

HT.resizeBookReader = function() {
  
  var $container = $("#mdpContentContainer");
  var $body = $("body");

  var w = $body.width() - $(".mdpControlContainer").width() - HT.config.ARBITRARY_PADDING;
  $container.width(w);
}


$(window).bind("resize", function() {
  HT.resizeBookReader();
})

$(document).ready(function() {
  HT.resizeBookReader();
  
  $("#mdpImage").load(function() {
    var $container = $("#mdpContentContainer");
    var height = $(this).height();
    var width = $(this).width();
    if ( height == HT.config.CHOKE_DIM && width == HT.config.CHOKE_DIM ) {
      // throttled!!
      height = 930;
      width = 640;
      $(this).css({ height : height, width : width });
    }
    if ( height < $container.height() ) {
      var h = height + 10;
      $container.height($container.height())
                .css('min-height', '')
                .removeClass('fakeContentLoader')
                .animate({ height: h }, 150);
    }
  })
  
})