// UTILITIES

HT.resizeBookReader = function() {
  var viewportHeight = window.innerHeight ? window.innerHeight : $(window).height();
  var innerHeight = $("#mbFooter").height() + $("#mbHeader").height();
  var textDenyHeight = 0;
  var $textDeny = $("#mdpTextDeny");
  if ( $textDeny.length > 0 ) {
    textDenyHeight = $textDeny.outerHeight() + 8;
  }
  var chromeHeight = innerHeight;
  if ( $("#mdpToolbar").is(":visible")) {
    chromeHeight += $("#mdpToolbar").height();
  }
  
  var bookreader_height = viewportHeight - chromeHeight - textDenyHeight - 25;
  if ( HT.reader.ui == 'embed' ) {
    bookreader_height -= 32; // crollbar
  }
  $("#BookReader").height(bookreader_height);
  
  var $scrollable = $("div.mdpScrollableContainer");
  if ( $scrollable.length > 0 ) {
      var checkHeight = viewportHeight - innerHeight - $("div.bibLinks").height() - 50;
      $scrollable.removeAttr('style');
      if ( $scrollable.height() > checkHeight ) {
        $scrollable.height(checkHeight);
      }
  }

  var $body = $("body");
  var $container = $("#mdpContentContainer");

  if ( $.browser.msie && parseInt($.browser.version) < 8 ) {
    var $window = $(window);
    if ( $window.width() >= HT.config.ARBITRARY_WINDOW_WIDTH ) {
      $body.width($window.width());
    } else if ( $body.width() < HT.config.ARBITRARY_WINDOW_WIDTH ) {
      $body.width(HT.config.ARBITRARY_WINDOW_WIDTH);
    }
  }

  var container_w = $body.width() - HT.config.ARBITRARY_WIDTH;
  
  if ( HT.reader.ui == 'embed' ) {
      var $branding = $(".branding");
      var $embedLink = $(".embedLink");
      var $pageOptions = $("#mdpPageOptions");
      var w = $(window).width();
      var fixed = $branding.width() + $pageOptions.width() + 50;
      while (  fixed + $embedLink.width()  > w ) {
          $embedLink.width( $embedLink.width() - 5 );
          // console.log("MUST NARROW:", $embedLink.width(), w);
      }
      // restore the ARBITRARY_WIDTH
      container_w = $body.width();
  }
  
  $container.width(container_w);

}


$(window).bind("resize", function() {
  HT.resizeBookReader();
})

// PREPPING AND LOADING SECTION
// override slice size from params
var newHash = window.location.hash.substr(1);
if(newHash.indexOf("slice/") >= 0) {
    var parts = newHash.split('/');
    var slice_size;
    for(var i = 0; i < parts.length; i += 2) {
        if(parts[i] == 'slice') {
            slice_size = parts[i+1];
            break;
        }
    }
    HT.reader.slice_size = parseInt(slice_size);
}

// update slice_size to match thumbColumns
while ( HT.reader.slice_size % HT.reader.thumbColumns != 0 ) {
    HT.reader.slice_size += 1;
}

$(document).ready(function() {
    
    $("#mdpImage").hide();
    HT.resizeBookReader();
        
    // Load bookreader
    // delay loading metaURL - BAH HUMBUG
    
    HT.reader.openNotice();
    HT.reader.loadBookDataSlice(0);
    
    // if(false) {
    //     var data = lscache.get(HT.reader.bookId + "-0");
    //     console.log("CACHE:", HT.reader.bookId, "0", data);
    //     if ( data ) {
    //       HT.reader.init();
    //     } else {
    //       HT.reader.openNotice();
    //       HT.reader.loadBookDataSlice(0);
    //       // var params = HT.reader.getMetaUrlParams(0);
    //       // setTimeout(function() {
    //       //     $.getJSON(HT.reader.metaURL, params, function(data) {
    //       //       HT.reader.installBookDataSlice(0, data, true);
    //       //       HT.reader.init();
    //       //     });
    //       // }, 500);
    //     }
    // }
    
})
