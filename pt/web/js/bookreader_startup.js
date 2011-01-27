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
  $("#BookReader").height(viewportHeight - chromeHeight - textDenyHeight - 25);
  
  var checkHeight = viewportHeight - innerHeight - $("div.bibLinks").height() - 50;
  $("div.mdpScrollableContainer").removeAttr('style');
  if ( $("div.mdpScrollableContainer").height() > checkHeight ) {
    $("div.mdpScrollableContainer").height(checkHeight);
  }
}


$(window).bind("resize", function() {
  HT.resizeBookReader();
})

// PREPPING AND LOADING SECTION

// Check for config object
// $$$ change this to use the newer params object
if (typeof(brConfig) != 'undefined') {
    if (typeof(brConfig["ui"]) != 'undefined') {
        HT.reader.ui = brConfig["ui"];
    }
    if (brConfig['mode'] == 1) {
        HT.reader.mode = 1;
        if (typeof(brConfig['reduce'] != 'undefined')) {
            HT.reader.reduce = brConfig['reduce'];
        }
    } else if (brConfig['mode'] == 2) {
        HT.reader.mode = 2;  
    }
} // brConfig

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
    
    // seed hash based on URL parameters as needed
    if ( ! window.location.hash ) {
      var hash = "mode/" + HT.params.mode;
      if ( HT.params.seq ) {
        hash = "page/n" + HT.params.seq + "/" + hash;
      }
      window.location.hash = "#" + hash;
    }
    
    // Load bookreader
    // delay loading metaURL - BAH HUMBUG
    
    var data = lscache.get(HT.reader.bookId + "-0");
    console.log("CACHE:", HT.reader.bookId, "0", data);
    if ( data ) {
      HT.reader.init();
    } else {
      HT.reader.openNotice();
      HT.reader.loadBookDataSlice(0);
      // var params = HT.reader.getMetaUrlParams(0);
      // setTimeout(function() {
      //     $.getJSON(HT.reader.metaURL, params, function(data) {
      //       HT.reader.installBookDataSlice(0, data, true);
      //       HT.reader.init();
      //     });
      // }, 500);
    }
    
})
