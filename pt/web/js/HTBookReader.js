subclass(HTBookReader, BookReader);

function HTBookReader() {
    BookReader.call(this);
    this.constModeText = 4;
    this.flags = {};
    this.defaultReduce = 4;
    this.savedReduce = {'1.text' : 1};
    this.total_slices = 9999;
    this.cache_age = -1;
    this.restricted_width = this.restricted_height = 75;
    this.catalog_method = 'unzip';
    // Object to hold parameters related to 1up mode
    this.onePage = {
        autofit: 680                                     // valid values are height, width, none
    };

}

HTBookReader.prototype.sliceFromIndex = function(index) {
  return { slice : Math.floor(index / this.slice_size), index : index % this.slice_size };
}

HTBookReader.prototype.getMetaUrlParams = function(start) {
    // var params = { id : this.bookId, noscale: 0, format: "list", limit : this.slice_size };
    var params = { id : this.bookId, size: '100', format: "list", limit : this.slice_size, method : this.catalog_method };
    if ( this.flags.force !== undefined ) {
        params["force"] = this.force
    }
    params['force'] = 1;
    params['start'] = start;
    
    if ( this.flags.debug ) {
      params['debug'] = 'local';
    }
    
    return params;
}

HTBookReader.prototype.hasPageFeature = function(index, feature) {
    var slice = this.sliceFromIndex(index);
    if ( this.bookData[slice.slice] != undefined ) {
        var features = this.bookData[slice.slice]['features'][slice.index];
        if ( features == undefined ) {
          return ( feature == "MISSING_PAGE" );
        }
        return ( features.indexOf(feature) >= 0 );
    }
    return false;
}

HTBookReader.prototype.removePageFeature = function(index, feature) {
    var slice = this.sliceFromIndex(index);
    if ( this.bookData[slice.slice] != undefined ) {
        var features = this.bookData[slice.slice]['features'][slice.index];
        if ( features == undefined ) {
          return ( feature == "MISSING_PAGE" );
        }
        var feature_idx = features.indexOf(feature);
        if ( feature_idx >= 0 ) {
          features.splice(feature_idx, 1);
        }
    }
    return false;
}

HTBookReader.prototype.getPageWidth = function(index) {
    var r = this.rotationCache[index] || 0;
    var w = this.__getPageWidth(index);
    return w;
}

HTBookReader.prototype.getPageHeight = function(index) {
    var r = this.rotationCache[index] || 0;
    var h = this.__getPageHeight(index);
    if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
        var w = this.__getPageWidth(index);
        h = Math.ceil(w * ( w / h ));
    }
    return h;
}

HTBookReader.prototype.__getPageWidth = function(index) {
    var slice = this.sliceFromIndex(index);
    var w;
    
    if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['width'][slice.index]) == 'number'){
        w = this.bookData[slice.slice]['width'][slice.index];
    }else{
        if (typeof(this.widthAvg) != 'undefined'){
            w = this.widthAvg;
        }else{
            w = this.widthAvg = this.getAvgDimension('width');
        }
    }
    return w;
}

HTBookReader.prototype.__getPageHeight = function(index) {
    // calculate slice from index
    var slice = this.sliceFromIndex(index);
    
    var h;
    if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['height'][slice.index]) == 'number'){
        h = this.bookData[slice.slice]['height'][slice.index];
    } else{
        if (typeof(this.heightAvg) != 'undefined'){
            h =  this.heightAvg;
        }else{
            h = this.heightAvg = this.getAvgDimension('height');
        }
    }
    return h;
}

// Calculate averaged dimensions (used if not actual dimensions not specified)
HTBookReader.prototype.getAvgDimension = function(dimType) {
   sum = 0;
   count = 0;
   for(var slice_index = 0; slice_index < this.slices.length; slice_index++) {
       var slice = this.slices[slice_index];
       for (var index = 0; index < this.bookData[slice][dimType].length; index++) {
           if (typeof(this.bookData[slice][dimType][index]) == 'number') {
               sum += this.bookData[slice][dimType][index];
               count++;
           }
       }
       // performance: punt after 1 slice
       break;
   }
   return sum / count;
}

HTBookReader.prototype.getPingStatus = function() {
    var self = this;
    var ping_uri = this.pingURL + '?id='+this.bookId+';seq='+(this.currentIndex()+1) + ';test=' + ( new Date() ).getMinutes();
    $.get(ping_uri, function(data) {
       // look at response text; if "-" then we are no longer logged in
       if ( data == "-" ) {
           self.alertSessionExpired();
       } else {
           setTimeout(function() { self.getPingStatus() ; }, 1000);
       }
    });
}

HTBookReader.prototype.alertSessionExpired = function() {
    $.pnotify({
       pnotify_title: "Login expired",
       pnotify_notice_icon: "",
       pnotify_hide: false,
       pnotify_closer: true,
       pnotify_opacity: 1.0,
       pnotify_width: "250px",
       pnotify_history: false,
       pnotify_text: "Your authentication session has expired."
    });
}
 
// reduce defaults to 1 (no reduction)
// rotate defaults to 0 (no rotation)
HTBookReader.prototype.getPageURI = function(index, reduce, rotate) {
    var _reduce;
    var _rotate;

    if ('undefined' == typeof(reduce)) {
        _reduce = 1;
    } else {
        _reduce = reduce;
    }
    if ('undefined' == typeof(rotate)) {
        _rotate = 0;
    } else {
        _rotate = rotate;
    }
    if ( _rotate == null || _rotate == 0 ) {
        _rotate = this.rotationCache[index] || 0;
    }
    if ( this.mode == 2 ) { _rotate = 0 ; }
    
    // convert to imgsrv orient
    var _orient = 0;
    if ( _rotate == 90 ) { _orient = 1; }
    else if ( _rotate == 180 ) { _orient = 2 ; }
    else if ( _rotate == 270 ) { _orient = 3 ; }
    
    var q1 = this.getURLParameter("q1");

    var _targetWidth = Math.round(this.getMedianPageSize().width / _reduce);
    var page_uri;
    if ( this.displayMode == 'text' && this.mode == 1 ) {
        page_uri = this.url_config.text;
    } else if ( this.mode == 3 ) {
        // thumbnail
        page_uri = this.url_config.thumb;
    } else {
        page_uri = this.url_config.image;
    }
    page_uri += '?id='+this.bookId+';seq='+(index+1);
    
    if ( this.mode == 1 && this.displayMode == "text" ) {
        if ( this.q1 ) {
            page_uri += ";q1=" + this.q1;
        }
    } else {
        page_uri += ';width=' + _targetWidth + ';height=' + _targetWidth + ';orient=' + _orient;
    }
    
    if ( this.flags.debug ) {
        page_uri += ';debug=' + this.flags.debug;
    }
    if ( this.flags.attr ) {
        page_uri += ';attr=' + this.flags.attr;
    }
    
    return page_uri
}

// Returns true if page image is available rotated
HTBookReader.prototype.canRotatePage = function(index) {
    //return 'jp2' == this.imageFormat; // Assume single format for now
    return true;
}

HTBookReader.prototype.getPageSide = function(index) {
    //assume the book starts with a cover (right-hand leaf)
    //we should really get handside from scandata.xml
    
        
    // $$$ we should get this from scandata instead of assuming the accessible
    //     leafs are contiguous
    if ('rl' != this.pageProgression) {
        // If pageProgression is not set RTL we assume it is LTR
        if (0 == (index & 0x1)) {
            // Even-numbered page
            return 'R';
        } else {
            // Odd-numbered page
            return 'L';
        }
    } else {
        // RTL
        if (0 == (index & 0x1)) {
            return 'L';
        } else {
            return 'R';
        }
    }
}
 
HTBookReader.prototype.getPageNum = function(index) {
    if(index < 0) { return ; }
    var slice = this.sliceFromIndex(index);
    var pageNum = this.bookData[slice.slice]['page_num'][slice.index];
    if (pageNum) {
        return pageNum;
    } else {
        return 'n' + index;
    }
}

HTBookReader.prototype.leafNumToIndex = function(leafNum) {
    for (var slice_idx = 0; slice_idx < this.slices.length; slice_idx++) {
      var slice = this.slices[slice_idx];
      for (var index = 0; index < this.bookData[slice]['seq'].length; index++) {
          if (this.bookData[slice]['seq'][index] == leafNum) {
              return index+1;
          }
      }
    }

    return null;
}
 
// This function returns the left and right indices for the user-visible
// spread that contains the given index.  The return values may be
// null if there is no facing page or the index is invalid.
HTBookReader.prototype.getSpreadIndices = function(pindex) {
    // $$$ we could make a separate function for the RTL case and
    //      only bind it if necessary instead of always checking
    // $$$ we currently assume there are no gaps
    
    var spreadIndices = [null, null]; 
    if ('rl' == this.pageProgression) {
        // Right to Left
        if (this.getPageSide(pindex) == 'R') {
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex + 1;
        } else {
            // Given index was LHS
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex - 1;
        }
    } else {
        // Left to right
        if (this.getPageSide(pindex) == 'L') {
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex + 1;
        } else {
            // Given index was RHS
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex - 1;
        }
    }
    
    //console.log("   index %d mapped to spread %d,%d", pindex, spreadIndices[0], spreadIndices[1]);
    
    return spreadIndices;
}
 
// Remove the page number assertions for all but the highest index page with
// a given assertion.  Ensures there is only a single page "{pagenum}"
// e.g. the last page asserted as page 5 retains that assertion.
HTBookReader.prototype.uniquifyPageNums = function() {
    var seen = {};

    for (var slice_idx = this.slices.length - 1; slice_idx--; slice_idx >= 0) {
      var slice = this.slices[slice_idx];
      for (var i = this.bookData[slice]['page_num'].length - 1; i--; i >= 0) {
          var pageNum = this.bookData[slice]['page_num'][i];
          if ( !seen[pageNum] ) {
              seen[pageNum] = true;
          } else {
              this.bookData[slice]['page_num'][i] = null;
          }
      }
    }


}
 
HTBookReader.prototype.cleanupMetadata = function() {
    if ( this.numLeafs > this.total_items ) {
      this.numLeafs = this.total_items;
    }
    this.uniquifyPageNums();
}

HTBookReader.prototype.updateViewSettings = function() {
    var viewHeight = 0;
    var viewWidth  = $('#BRcontainer').attr('clientWidth');   
    for (i=0; i<this.numLeafs; i++) {
        viewHeight += parseInt(this._getPageHeight(i)/this.reduce) + this.padding; 
        var width = parseInt(this._getPageWidth(i)/this.reduce);
        if (width>viewWidth) viewWidth=width;
    }
    $('#BRpageview').height(viewHeight);
    $('#BRpageview').width(viewWidth);
    
    if(3 == this.mode) {
        // thumb view needs to be told to keep painting
        this.drawLeafsThumbnail();
    }
}

// getEmbedURL
//________
// Returns a URL for an embedded version of the current book
HTBookReader.prototype.getEmbedURL = function() {
    // We could generate a URL hash fragment here but for now we just leave at defaults
    var url = 'http://' + window.location.host + '/stream/'+this.bookId;
    if (this.subPrefix != this.bookId) { // Only include if needed
        url += '/' + this.subPrefix;
    }
    url += '?ui=embed';
    return url;
}
 
// getEmbedCode
//________
// Returns the embed code HTML fragment suitable for copy and paste
HTBookReader.prototype.getEmbedCode = function() {
    return "<iframe src='" + this.getEmbedURL() + "' width='480px' height='430px'></iframe>";
}


// OVERRIDE

// installBookDataSlice()
//______________________________________________________________________________
// Handle slices.
HTBookReader.prototype.installBookDataSlice = function(slice_index, data, do_cache) {
    if ( this.bookData == null ) {
        this.bookData = {};
        this.slices = [];
        this.numLeafs = 0;
    }
    
    if ( this.bookData[slice_index] != null ) {
      return;
    }
    
    this.bookData[slice_index] = data;
    this.slices.push(slice_index);
    
    if ( do_cache && this.cache_age > 0 ) {
        lscache.set(this.bookId + "-" + slice_index, data, this.cache_age);
    }
    
    if ( slice_index == 0 ) {
        this.titleLeaf = this.bookData[0]['first_page_sequence'];
        this.total_slices = Math.ceil(data['total_items'] / this.slice_size);
        this.total_items = data['total_items'];
        this.flags.download_progress_base = data['download_progress_base'];
        if ( this.bookData[0]['readingOrder'] == 'right-to-left' ) {
            this.pageProgression = 'rl';
        }
    }
    
    // console.log("INSTALLING", this.numLeafs, "/", slice_index, "/", this.bookData[slice_index]['seq'].length);
    this.numLeafs += this.bookData[slice_index]['seq'].length;
    this.cleanupMetadata();
    this.complete = this.slices.length == this.total_slices;
}

HTBookReader.prototype.loadBookDataSlice = function(next_slice, callback) {
    var self = this;
    
    var post_data_callback = function(next_slice, data, do_cache) {
        self.installBookDataSlice(next_slice, data, do_cache);
        if ( next_slice == 0 ) {
            self.init();
        } else {
            self.updateViewSettings();
        }
        // console.log("GRABBING NEXT SLICE", next_slice);
        self.loadBookDataSlice(next_slice + 1);
    }
    
    if(next_slice < self.total_slices) {
        var data = lscache.get(self.bookId + "-" + next_slice);
        if (data) {
            post_data_callback(next_slice, data, false);
        } else {
            var start = next_slice * this.slice_size;
            var params = self.getMetaUrlParams(start);
            
            $.getJSON(self.url_config.meta, params,
                function(data) {
                    post_data_callback(next_slice, data, true);
                }
            );
        }
    } else {
        self.complete = true;
    }
}

HTBookReader.prototype.init = function(callback) {
    var self = this;
    var startIndex = undefined;
    var params = this.paramsFromFragment(window.location.hash);
    
    var do_wait = false;
    if ('undefined' != typeof(params.index)) {
        startIndex = params.index;
        do_wait = true;
    } else if ('undefined' != typeof(params.page)) {
        startIndex = this.getPageIndex(params.page);
        do_wait = true;
    }
    
    if ( params.displayMode ) {
      this.displayMode = params.displayMode;
      if ( this.displayMode == "text" ) {
          // this.reduce = 1;
          this.onePage.autofit = 'width';
      }
    }
    
    var now = Date();

    if (! this.complete && do_wait) {
        console.log("INIT: WAITING FOR", now, startIndex, "/", this.complete, "/", do_wait, "/", this.sliceFromIndex(startIndex), ":", this.total_slices);
        if ( 'undefined' == typeof(startIndex) || this.sliceFromIndex(startIndex).slice < this.total_slices ) {
             var self = this;

             setTimeout(function() {
                 if ( self.notice ) {
                     self.notice.setContent("<span>Loading: " + (self.numLeafs) + " / " + self.total_items + "</span>");
                 }
                 self.init();
             }, 500);
             console.log("WAITING:", now);
             return;
        }
    }
    
    console.log("BOOK READER INIT", now);
    
    var init_delay = 0;

    if ('undefined' != typeof(params.mode)) {
        this.mode = params.mode;
    }
    
    var origMaxLoading = this.thumbMaxLoading;
    var origLazyDelay = this.lazyDelay;
    // if ( (this.mode == this.constModeThumb) && (window.location.href.indexOf("size=105") < 0) ) {
    //   init_delay = 2500;
    //   this.lazyDelay = origLazyDelay * 4;
    //   this.thumbMaxLoading = Math.round(origMaxLoading / 2);
    // }
    
    if ( init_delay ) {
      setTimeout(function() {
        self.lazyDelay = origLazyDelay;
        self.thumbMaxLoading = origMaxLoading;
      }, init_delay * 10);
    }

    if ( self.notice != null ){
        self.notice.setTitle("&#160;").setContent("<span>All finished</span>");
        setTimeout(function() {
          self.notice.unload();
        }, init_delay + 1000);
    }
    
    setTimeout(function() {
      self.initializing = true;
      BookReader.prototype.init.call(self);
      self.initializing = false;
      self.saveReduce();
      if ( callback !== undefined ) {
        callback();
      }
    }, init_delay)

    if ( this.ui == 'full' ) {        
        this.bindPageControlHandlers();
    }
    
}

HTBookReader.prototype.shortTitle = function(n) {
    return this.bookTitle;
}

HTBookReader.prototype.openNotice = function() {
  var self = this;
  
  if ( self.notice == null ) {
      
      //        "left": ($("#BookReader").width() / 2) - ($notice.width() / 2) + $("#BookReader").offset().left // ($(window).width() / 2) - (pnotify.width() / 2)
      var $notice = new Boxy("<span>Loading book data</span>", {
         show : true,
         modal : false,
         draggable : true,
         closeable : false,
         title : "Please wait" 
      });

      self.notice = $notice;
  }

}

HTBookReader.prototype.getURLParameter = function(name, href) {
    if ( href == null ) {
      href = location.search;
    }
    return unescape(
        (RegExp(name + '=' + '(.+?)(;|&|$)').exec(href)||[,null])[1]
    );
}

HTBookReader.prototype.onePageCalculateReductionFactors = function( width, height ) {
    BookReader.prototype.onePageCalculateReductionFactors.call(this, width, height);
    var autoFit = this.onePage.reductionFactors[this.onePage.reductionFactors.length - 1];
    var prefFit = this.reductionFactors[this.reductionFactors.length - 1];
    
    if ( autoFit.reduce > prefFit.reduce ) {
      // pop off
      this.onePage.reductionFactors.pop();
      this.onePage.reductionFactors[this.onePage.reductionFactors.length - 1].autofit = 'height';
    }
}


// initToolbar
HTBookReader.prototype.initToolbar = function(mode, ui) {
    // bind view buttons
    var self = this;
    $("#btnBookReader1up").click(function() {
        self.switchMode(1, this);
        self.toggleDisplayMode("image");
        return false;
    })
    
    $("#btnBookReaderText").click(function() {
        if ( ! $(this).hasClass("PTbuttonDisabled") ) {
            self.switchMode(1, this);
            self.toggleDisplayMode("text");
        }
        return false;
    })

    $("#btnBookReader2up").click(function() {
        if ( ! $(this).hasClass("PTbuttonDisabled") ) {
            try {
                self.switchMode(2, this);
            } catch(err) {
                console.log(err);
            }
        }
        return false;
    })

    $("#btnBookReaderThumbnail").click(function() {
        if ( ! $(this).hasClass("PTbuttonDisabled") ) {
            self.switchMode(3, this);
        }
        return false;
    })
    
    // zoom buttons
    $("#mdpZoomOut").click(function() {
        self.zoom(-1);
        return false;
    })

    $("#mdpZoomIn").click(function() {
        self.zoom(1);
        return false;
    })
    
    $("#mdpZoomStatus").html('<span id="BRzoom">' + parseInt(100/self.reduce) + '</span>');
    self.updateToolbarZoom(self.reduce); // Pretty format
    
    // Nav handlers
    $("#mdpLastPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.rightmost();
        } else {
            self.last();
        }
        return false;
    })

    $("#mdpFirstPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.leftmost();
        } else {
            self.first();
        }
        return false;
    })
    
    $("#mdpPreviousPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.left();
        } else {
            // self.constMode1up, self.constModeThumb
            if ($.inArray(self.mode, [self.constModeThumb]) >= 0) {
                self.scrollUp();
            } else {
                self.prev();
            }
        }
        return false;
    })
    
    $("#mdpNextPageLink").click(function(e) {
        if ( self.mode == 2 ) {
            self.right();
        } else {
            // self.constMode1up, self.constModeThumb
            if ($.inArray(self.mode, [self.constModeThumb]) >= 0) {
                self.scrollDown();
            } else {
                self.next();
            }
        }
        return false;
    })


    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
        $("#btnBookReader2up").addClass("PTbuttonDisabled");
    }

    if ( !this.canSwitchToMode(this.constModeThumb) ) {
        $("#btnBookReaderThumbnail").addClass("PTbuttonDisabled");
    }

    if ( !this.flags.has_ocr ) {
        $("#btnBookReaderText").addClass("PTbuttonDisabled");
    }
    
    // // Hide one page button if it is the only mode available
    // if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
    //     jToolbar.find('.one_page_mode').hide();
    // }
    
    // re-bind jump-to-section
    $("#mdpJumpToSectionSubmit").bind('click', function() {
        var $sel = $("#mdpJumpToSection");
        var val = parseInt($sel.val());
        if ( val && val > 0 ) {
            self.jumpToIndex(val - 1);
        }
        return false;
    })
    
    $("#mdpPageForm").unbind('submit').bind('submit', function() {
        var $form = $(this);
        if ( ! FormValidation($form.get(0).num, "Please enter a page number in the box.") ) {
            return false;
        }
        var num = $form.get(0).num.value;
        // if ( num.substr(0, 1) == "n" ) {
        //     // technically a seq
        //     $form.get(0).seq.value = num.substr(1);
        //     $form.get(0).num.disabled = true;
        // }
        self.jumpToPage(num);
        return false;
    })
    
    if ( this.flags.final_access_status != 'allow' ) {
        $("#mdpToolbar").css('opacity', 0.4);
    }

    // Switch to requested mode -- binds other click handlers
    this.switchToolbarMode(mode);
    this.switchCurrentPageDownloadLinks();
    
}

// switchToolbarMode
//______________________________________________________________________________
// Update the toolbar for the given mode (changes navigation buttons)
// $$$ we should soon split the toolbar out into its own module
HTBookReader.prototype.switchToolbarMode = function(mode) { 
    
    var $e;
    $e = $(".PTbuttonActive").removeClass("PTbuttonActive").attr('title', '');
    
    if ( 1 == mode ) {
        if ( this.displayMode == 'text' ) {
            $e = $("#btnBookReaderText").addClass("PTbuttonActive");
            this.toggleZoomHandlers(false);
            this.toggleRotateHandlers(false);
            
        } else {
            $e = $("#btnBookReader1up").addClass("PTbuttonActive");
            this.toggleZoomHandlers(true);
            this.toggleRotateHandlers(true);
        }
    } else if ( 2 == mode ) {
        $e = $("#btnBookReader2up").addClass("PTbuttonActive");
        this.toggleZoomHandlers(true);
        this.toggleRotateHandlers(false);
    } else if ( 3 == mode ) {
        $e = $("#btnBookReaderThumbnail").addClass("PTbuttonActive");
        this.toggleZoomHandlers(true);
        this.toggleRotateHandlers(false);
    }
    var title = "current view";
    $e.attr('title', title);
    this.updateViewportHeader(mode);
}

HTBookReader.prototype.updateViewportHeader = function(mode) {
    var $h2 = $("h2.viewport")
    var key;
    if ( mode == 1 ) {
        key = 'header-1up';
    } else if ( mode == 2 ) {
        key = 'header-2up';
    } else {
        key = 'header-thumb';
    }
    var text = $h2.data(key) + " " + $h2.data('default-tail');
    $h2.text(text);
}

// Update titles on the magnifying glasses
HTBookReader.prototype.updateToolbarZoom = function(reduce) {
    BookReader.prototype.updateToolbarZoom.call(this, reduce);
    var reduction_factors = ( this.mode == this.constMode2up ) ? this.twoPage.reductionFactors : this.onePage.reductionFactors;
    if ( reduction_factors ) {
        var zoom_labels = [];
        zoom_labels.push(this.nextReduce(this.reduce, 'out', reduction_factors));
        zoom_labels.push(this.nextReduce(this.reduce, 'in', reduction_factors));
        for(var i = 0; i < zoom_labels.length; i++) {
            var value;
            if ( zoom_labels[i].autofit ) {
                value = zoom_labels[i].autofit;
                value = value.slice(0,1).toUpperCase() + value.slice(1); 
            } else {
                value = zoom_labels[i].reduce;
                value = (100 / value).toFixed(2);
                // Strip trailing zeroes and decimal if all zeroes
                value = value.replace(/0+$/,'');
                value = value.replace(/\.$/,'');
                value += '%';
            }
            zoom_labels[i] = value;
        }
        // $("#mdpZoomOut, #mdpZoomOut img").attr('title', "Zoom Out: " + zoom_labels[0]);
        // $("#mdpZoomIn, #mdpZoomIn img").attr('title', "Zoom In: " + zoom_labels[1]);
        $(".mdpZoomOut").text("Zoom Out: " + zoom_labels[0]);
        $(".mdpZoomIn").text("Zoom In: " + zoom_labels[1]);
    } else if ( this.mode == this.constModeThumb ) {
        $(".mdpZoomOut").text("Zoom Out: " + (this.thumbColumns + 1) );
        $(".mdpZoomIn").text("Zoom In: " + (this.thumbColumns > 1 ? this.thumbColumns - 1 : 1) );
    }
}

// Returns the width per thumbnail to display the requested number of columns
// Note: #BRpageview must already exist since its width is used to calculate the
//       thumbnail width
HTBookReader.prototype.getThumbnailWidth = function(thumbnailColumns) {
    var width = BookReader.prototype.getThumbnailWidth.call(this, thumbnailColumns);
    if ( this.flags.final_access_status != 'allow' ) {
        // calculate what the height _would_ be at this width
        var avg_height = this.getAvgDimension("height");
        var avg_width = this.getAvgDimension("width");
        var r = avg_width / avg_height;
        return this.restricted_height * r;
    }
    return width;
}

HTBookReader.prototype.getThumbnailHeight = function(thumbnailColumns) {
    var height = BookReader.prototype.getThumbnailHeight.call(this, thumbnailColumns);
    if ( this.flags.final_access_status != 'allow' ) {
        // keep this at 150
        return this.restricted_height;
    }
    return width;
}


HTBookReader.prototype.saveReduce = function() {
    var key = this.mode;
    if ( this.mode == 1 ) {
        key += "." + this.displayMode;
    }
    this.savedReduce[key] = this.reduce;
}

HTBookReader.prototype.getSavedReduce = function() {
    var key = this.mode;
    if ( this.mode == 1 ) {
        key += "." + this.displayMode;
    }
    var reduce = this.savedReduce[key];
    if ( reduce == null ) {
        if ( this.mode == 1 && this.displayMode == 'text' ) {
            reduce = 1;
        } else {
            reduce = this.defaultReduce; // default
        }
    }
    return reduce;
}

HTBookReader.prototype.switchMode = function(mode, btn) {

    if (mode == this.mode) {
        return;
    }
    
    if (!this.canSwitchToMode(mode)) {
        return;
    }

    // $(".PTbuttonActive").removeClass("PTbuttonActive");
    // $(btn).addClass("PTbuttonActive");

    this.autoStop();
    this.removeSearchHilites();
    
    // cache the existing reduce before we change mode
    this.saveReduce();

    this.mode = mode;
    this.switchToolbarMode(mode);
    this.reduce = this.getSavedReduce();
    
    // reinstate scale if moving from thumbnail view
    // $$$ TODO obsoleted by savedReduce tracking??
    // if (this.pageScale != this.reduce) {
    //     this.reduce = this.pageScale;
    // }
    
    // $$$ TODO preserve center of view when switching between mode
    //     See https://bugs.edge.launchpad.net/gnubook/+bug/416682

    // XXX maybe better to preserve zoom in each mode
    if (1 == mode) {
      
        this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'), $('#BRcontainer').attr('clientHeight'));
        // this.reduce = this.quantizeReduce(this.reduce, this.onePage.reductionFactors);
        
        // if ( this.displayMode == "text" ) {
        //   this.savedReduce[mode] = this.reduce;
        //   this.reduce = 1;
        // }
        
        this.prepareOnePageView();
    } else if (3 == mode) {
        this.reduce = this.quantizeReduce(this.reduce, this.reductionFactors);
        this.prepareThumbnailView();
    } else {
        // $$$ why don't we save autofit?
        this.twoPage.autofit = "auto"; // Take zoom level from other mode; RRE: we'd rather it didn't
        this.twoPageCalculateReductionFactors();
        
        if ( this.savedReduce[this.mode] == null ) {
            // no zoom recorded yet; default to the autofit version
            for(var i = 0; i < this.twoPage.reductionFactors.length; i++) {
                if ( this.twoPage.reductionFactors[i].autofit != null ) {
                    this.reduce = this.twoPage.reductionFactors[i].reduce;
                    this.twoPage.autofit = this.twoPage.reductionFactors[i].autofit;
                    break;
                }
            }
        } else {
            this.reduce = this.quantizeReduce(this.reduce, this.twoPage.reductionFactors);
        }
        
        this.prepareTwoPageView();
        this.twoPageCenterView(0.5, 0.5); // $$$ TODO preserve center
    }
    this.switchCurrentPageDownloadLinks();
    this.updateViewFields();

}

HTBookReader.prototype.updateViewFields = function() {
  var view = this.getViewParam({ mode : this.mode });
  $("input[name=view]").val(view);
}

HTBookReader.prototype.switchCurrentPageDownloadLinks = function() {
    var $link = $("#pagePdfLink");
    var caption = $link.text();
    $link.removeClass("disabled").fadeTo(0, 1.0);
    if ( this.mode == this.constMode2up ) {
        // add left/right download links
        var $rightLink = $link.clone().insertAfter($link).text(caption.replace("this page", "right page")).attr("id", "pageRightPdfLink");
        $link.text(caption.replace("this page", "left page"));
        
        var href = $rightLink.attr('href');
        if ( href ) {
          href = this._updateUrlFromParams(href, { seq : this.currentIndex() }, { id : '#' + $link.attr('id') });
          $rightLink.attr('href', href);
        }
    } else if ( this.mode == this.constMode1up ) {
        $("#pageRightPdfLink").remove();
        $link.text(caption.replace("left page", "this page"));
    } else {
        $("#pageRightPdfLink").remove();
        $link.text(caption.replace("left page", "this page"));
        $link.addClass('disabled').fadeTo(0, 0.4);
    }
}

// updateLocationHash
//________
// Update the location hash from the current parameters.  Call this instead of manually
// using window.location.replace

HTBookReader.prototype._updateUrlFromParams = function(href, params, options) {
    
    if ( options === null ) {
        options = {};
    }
    
    was_escaped = null;
    if ( href.indexOf("target=") > -1 ) {
        // escaped href, like the login link
        var tmp = href.split("target=");
        was_escaped = tmp.shift();
        href = unescape(tmp.join("target=")); // long shot
    }
    
    if ( params.page && ( typeof(params.page) == "number" || params.page.slice(0,1) != 'n' ) && ( options.id != '#pageRightPdfLink') ) {
        var pageParam;
        pageParam = "num=" + params.page;
        if ( href.indexOf("num=") > -1 ) {
            href = href.replace(/num=[^;]+(;?)/, pageParam + "$1");
        } else {
            href += ";" + pageParam;
        }
    } else {
        href = href.replace(/num=[^;]+(;?)/, "");
    }
    
    if ( typeof(params.index) != 'undefined' ) {
        var indexParam;
        var seq = params.index + 1;
        if ( options && options.id == "#pageRightPdfLink" ) {
            seq += 1;
        }
        indexParam = "seq=" + seq;
        if ( href.indexOf("seq=") > -1 ) {
            href = href.replace(/seq=\d+(;?)/, indexParam + "$1");
        } else {
            href += ";" + indexParam;
        }
    } else {
        href = href.replace(/seq=\d+(;?)/, "");
    }
    
    if ( options && options.view && params.mode ) {
        var viewParam;
        viewParam = "view=" + this.getViewParam(params);
        if ( href.indexOf("view=") > -1 ) {
            href = href.replace(/view=\w+(;?)/, viewParam + "$1");
        } else {
            href += ";" + viewParam;
        }
    }

    if ( was_escaped != null ) {
        href = was_escaped + "target=" + escape(href);
    } else if ( options.id == "#fullPdfLink" ) {
        // strip the seq and num from this link
        href = href.replace(/seq=\d+(;?)/, "");
        href = href.replace(/num=\w+(;?)/, "");
    }
    
    href = href.replace(/;+$/g, "");

    return href;
}

HTBookReader.prototype.updateLocationHash = function() {
    var self = this;
    
    // update the classic view link to reflect the current page number
    var params = this.paramsFromCurrent();
    
    $.each([ "#btnClassicView", "#btnClassicText", "#pagePdfLink", "#pageRightPdfLink", "#fullPdfLink", ".loginLink" ], function(idx, id) {
        var $a = $(id);
        var href = $a.attr('href');
        if ( href != null ) {
            var options = { id : id };
            if ( ( id == ".loginLink" ) || ( id == "#fullPdfLink") ) {
              options.view = true;
            }
            href = self._updateUrlFromParams(href, params, options);
            $a.attr('href', href);
        }
    })
    
    var $pageURL = $("#pageURL");
    if ( $pageURL.length ) {
      var pageurl_text = $pageURL.val();
      $pageURL.val(pageurl_text.replace(/seq=\d+/, "seq=" + (params.index + 1)));
    }

    var $input = $("input[name='return']");
    $input.val(self._updateUrlFromParams($input.val(), params, { view : true }));
    $input = $("input[name='SeqNo']");
    $input.val(params.index);

    
    if ( window.history && window.history.replaceState != null) {
        var new_href = this._updateUrlFromParams(window.location.search, params, { view : true });
        window.history.replaceState(null, document.title, new_href);
    } else {
        var newHash = '#' + this.fragmentFromParams(params);
        window.location.replace(newHash); // replace blocks the back button!
        // window.location.hash = newHash; // clutters the browser history?
    }
    
    if ( this.last_index != params.index ) {
        if ( this.last_index != null ) {
            if ( pageTracker != null ) {
                // window.location.origin?
                var params_ = this.paramsForTracking(params);
                // var href = window.location.protocol + "//" + window.location.host + window.location.pathname + "?";
                var href = window.location.pathname + "?";
                var args = ["id=" + params_.id];
                args.push("view=" + params_.view);
                args.push("orient=" + params_.orient);
                args.push("size=" + params_.size);
                
                var num = this.getPageNum(params_.seq);
                if ( typeof(num) == "number" ) {
                    args.push("num=", num);
                }
                
                args.push("seq=" + ( params_.seq + 1 ));
                href += args.join(";");
                // _gaq.push(["_trackPageview", href])
                _gaq.push(
                    ['_setAccount', pageTracker._getAccount() ],
                    ['_trackPageview', href]
                );
            }

            if ( nextTracker != null ) {
                var params_ = this.paramsForTracking(params);
                var href = window.location.protocol + "//" + window.location.host + window.location.pathname + "?";
                var href = [ location.pathname ];
                // href.push("id=" + params_.id.replace(/\//g, '|'));
                href.push("id=" + encodeURIComponent(params_.id));
                href.push("view=" + params_.view);
                href.push("seq=" + ( params_.seq + 1 ));
                href = href.join("/");
                _gaq.push(
                    ['_setAccount', nextTracker._getAccount() ],
                    ['_trackPageview', href]
                )
            }

        }
        this.last_index = params.index;
    }
    
    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;
}

HTBookReader.prototype.paramsForTracking = function(params) {
    var self = this;
    var retval = {};
    if ( params == null ) {
        params = self.paramsFromCurrent();
    }
    var orient = self.rotationCache[params.index] == null ? 0 : self.rotationCache[params.index];
    if ( orient == 90 ) { orient = 1; }
    else if ( orient == 180 ) { orient = 2 ; }
    else if ( orient == 270 ) { orient = 3 ; }
    var size = (100 / self.reduce).toFixed(2);
    
    retval.id = self.bookId;
    retval.seq = params.index;
    retval.size = size;
    retval.orient = orient;

    var $btn = $(".PTbuttonActive");
    if ( $btn.length ) {
      retval.view = $(".PTbuttonActive").attr('href').replace(/.*view=(\w+).*/, '$1');
    } else {
      retval.view = document.location.href.replace(/.*view=(\w+).*/, '$1');
    }
    
    return retval;
}

HTBookReader.prototype.paramsFromFragment = function(urlFragment) {
    var params = BookReader.prototype.paramsFromFragment.call( this, urlFragment );
    // and again
    // Split into key-value pairs
    var urlArray = urlFragment.split('/');
    var urlHash = {};
    for (var i = 0; i < urlArray.length; i += 2) {
        urlHash[urlArray[i]] = urlArray[i+1];
    }
    
    params.displayMode = 'image';
    
    if (urlHash['mode'] && urlHash['mode'] == 'text') {
        params.displayMode = 'text';
        params.mode = this.constMode1up;
    }

    params.debug = urlHash['debug'];

    return params;
}

HTBookReader.prototype.paramsFromCurrent = function() {
    var params = BookReader.prototype.paramsFromCurrent.call(this);
    params.displayMode = this.displayMode;
    return params;
}


HTBookReader.prototype.toggleDisplayMode = function(mode) {
    
    if ( this.displayMode == mode ) {
        return;
    }

    this.displayMode = mode;
    this.switchToolbarMode(this.mode);
    
    if ( this.displayMode == "text" ) {
      this.saved1upReduce = this.reduce;
      
      for(var i = 0; i < this.onePage.reductionFactors.length; i++) {
        if ( this.onePage.reductionFactors[i].reduce == 1 ) {
          this.reduce = 1;
          this.onePage.autofit = this.onePage.reductionFactors[i].autofit;
          break;
        }
      }
      
    } else {
      if ( this.saved1upReduce ) {
        for(var i = 0; i < this.onePage.reductionFactors.length; i++) {
          if ( this.onePage.reductionFactors[i].reduce == this.saved1upReduce ) {
            this.reduce = this.saved1upReduce;
            this.onePage.autofit = this.onePage.reductionFactors[i].autofit;
            break;
          }
        }
      }
    }
    
    this.prepareOnePageView();
    // this.displayedIndices = [];
    // this.drawLeafs();
}

//prepareOnePageView()
//______________________________________________________________________________
BookReader.prototype.prepareOnePageView = function() {

    // var startLeaf = this.displayedIndices[0];
    var startLeaf = this.currentIndex();
    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });
    
    $("#BRcontainer").append("<div id='BRpageview'></div>");
    var options = { ignoreTargets:['ocrText', 'rotateAction']};
    
    $('#BRcontainer').dragscrollable(options); // {preventDefault:true, ignoreTargets:['ocrText']}

    this.bindGestures($('#BRcontainer'));

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));
    
    this.resizePageView();    
    
    this.jumpToIndex(startLeaf);

    this.displayedIndices = [];
    
    this.drawLeafsOnePage();
}

HTBookReader.prototype.nextReduce = function( currentReduce, direction, reductionFactors ) {
  // if ( this.mode == this.constMode1up && this.displayMode == "text" && ( direction == "height" || direction == "width" ) ) {
  //   return { reduce : 1.0 };
  // }

    var targetWidth = parseInt(direction);
    if ( isNaN(targetWidth) ) {
        return BookReader.prototype.nextReduce.call( this, currentReduce, direction, reductionFactors );
    }

    if ( targetWidth > $("#BRcontainer").width() ) {
        targetWidth = $("#BRcontainer").width() - 10;
    }

    // Asked for specific width
    var avgW = this.getAvgDimension("width");
    var dims = {};
    for (var i = 0; i < reductionFactors.length; i++) {
        dims[i] = parseInt(avgW / reductionFactors[i].reduce);
        if ( dims[i] < targetWidth ) {
            if ( dims[i - 1] < $("#BRcontainer").width() ) {
                return reductionFactors[i - 1];
            }
            return reductionFactors[i];
        }
    }

    alert('Could not find reduction factor for direction ' + direction);
    return reductionFactors[0];
}

// fragmentFromParams(params)
//________
// Create a fragment string from the params object.
// See http://openlibrary.org/dev/docs/bookurls for an explanation of the fragment syntax.
HTBookReader.prototype.getViewParam = function(params) {
    var retval;
    if (params.mode == this.constMode1up) {
        if ( params.displayMode == "text" ) {
            retval = 'text';
        } else {
            retval = '1up';
        }
    } else if (params.mode == this.constMode2up) {
        retval = '2up';
    } else if (params.mode == this.constModeThumb) {
        retval = 'thumb';
    } else {
        throw 'getMode called with unknown mode ' + params.mode;
    }
    return retval;
}

HTBookReader.prototype.fragmentFromParams = function(params) {
    var separator = '/';

    var fragments = [];
    
    if ('undefined' != typeof(params.page)) {
        fragments.push('page', params.page);
    } else {
        // Don't have page numbering -- use index instead
        fragments.push('page', 'n' + params.index);
    }
    
    // $$$ highlight
    // $$$ region
    
    // mode
    if ('undefined' != typeof(params.mode)) {   
        fragments.push("mode", this.getViewParam(params)) ;
    }
    
    // search
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }
    
    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
}


// jumpToIndex()
//______________________________________________________________________________
HTBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
    
    if ( ! this.inTextMode ) {
        BookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
        return;
    }

    this.firstIndex=index;
    var ocr_url = this.getOcrURI(index);
    var $iframe = $('#MdpOcrFrame');
    
    var left = $iframe.css('left');
    // $iframe.animate({left: -5000}, 1000, function() {
    //     $iframe.attr('src', ocr_url);
    //     $iframe.css('left', '5000px')
    //         .animate({left : left}, 1000);
    // })
    
    $iframe.attr('src', ocr_url).addClass('loading');
    this.updatePageNumBox();
    this.updateLocationHash();
    
}

HTBookReader.prototype.updatePageNumBox = function() {
  var num = this.getPageNum(this.currentIndex());
  if ( (typeof(num) == "string") && (num.substr(0, 1) == "n" )) {
    num = '';
  }
  $("#BRpagenum").val(num);
}


function fireEvent(element,event) {
   if (document.createEvent) {
       // dispatch for firefox + others
       var evt = document.createEvent("HTMLEvents");
       evt.initEvent(event, true, true ); // event type,bubbling,cancelable
       return !element.dispatchEvent(evt);
   } else {
       // dispatch for IE
       var evt = document.createEventObject();
       return element.fireEvent('on'+event,evt)
   }
}

HTBookReader.prototype.printPage = function(index) {
    if ( index == null ) {
        index = this.currentIndex();
    }
    
    fireEvent($("a#pagePdfLink").get(0), "click");
    
    return false;
}

// reflowText()
//______________________________________________________________________________
// Reflow text within iframe. Not used.
HTBookReader.prototype.reflowText = function(div) {
    var maxFontSize = ( 40 / Math.round(this.reduce ));
    var minFontSize = ( 14 / Math.round(this.reduce ));
    if ( minFontSize < 9 ) { minFontSize = 9; }

    $(div).textfill({minFontSize:minFontSize, maxFontSize:maxFontSize});
}

// drawLeafsThumbnail()
//______________________________________________________________________________
// If seekIndex is defined, the view will be drawn with that page visible (without any
// animated scrolling)
HTBookReader.prototype.drawLeafsThumbnail = function( seekIndex ) {
    //alert('drawing leafs!');
    this.timer = null;
    
    var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer

    //console.log('top=' + scrollTop + ' bottom='+scrollBottom);

    var i;
    var leafWidth;
    var leafHeight;
    var rightPos = 0;
    var bottomPos = 0;
    var maxRight = 0;
    var currentRow = 0;
    var leafIndex = 0;
    var leafMap = [];
    
    var self = this;
    
    // Will be set to top of requested seek index, if set
    var seekTop;

    // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
    for (i=0; i<this.numLeafs; i++) {
        leafWidth = this.thumbWidth;
        if (rightPos + (leafWidth + this.padding) > viewWidth){
            currentRow++;
            rightPos = 0;
            leafIndex = 0;
        }

        if (leafMap[currentRow]===undefined) { leafMap[currentRow] = {}; }
        if (leafMap[currentRow].leafs===undefined) {
            leafMap[currentRow].leafs = [];
            leafMap[currentRow].height = 0;
            leafMap[currentRow].top = 0;
        }
        leafMap[currentRow].leafs[leafIndex] = {};
        leafMap[currentRow].leafs[leafIndex].num = i;
        leafMap[currentRow].leafs[leafIndex].left = rightPos;

        leafHeight = parseInt((this.getPageHeight(leafMap[currentRow].leafs[leafIndex].num)*this.thumbWidth)/this.getPageWidth(leafMap[currentRow].leafs[leafIndex].num), 10);
        if (leafHeight > leafMap[currentRow].height) {
            leafMap[currentRow].height = leafHeight;
        }
        if (leafIndex===0) { bottomPos += this.padding + leafMap[currentRow].height; }
        rightPos += leafWidth + this.padding;
        if (rightPos > maxRight) { maxRight = rightPos; }
        leafIndex++;
        
        if (i == seekIndex) {
            seekTop = bottomPos - this.padding - leafMap[currentRow].height;
        }
    }

    // reset the bottom position based on thumbnails
    $('#BRpageview').height(bottomPos);

    var pageViewBuffer = Math.floor(($('#BRcontainer').attr('scrollWidth') - maxRight) / 2) - 14;

    // If seekTop is defined, seeking was requested and target found
    if (typeof(seekTop) != 'undefined') {
        $('#BRcontainer').scrollTop( seekTop );
    }
        
    var scrollTop = $('#BRcontainer').attr('scrollTop');
    var scrollBottom = scrollTop + $('#BRcontainer').height();

    var leafTop = 0;
    var leafBottom = 0;
    var rowsToDisplay = [];

    // Visible leafs with least/greatest index
    var leastVisible = this.numLeafs - 1;
    var mostVisible = 0;
    
    // Determine the thumbnails in view
    for (i=0; i<leafMap.length; i++) {
        leafBottom += this.padding + leafMap[i].height;
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        if (topInView | bottomInView | middleInView) {
            //console.log('row to display: ' + j);
            rowsToDisplay.push(i);
            if (leafMap[i].leafs[0].num < leastVisible) {
                leastVisible = leafMap[i].leafs[0].num;
            }
            if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
                mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
            }
        }
        if (leafTop > leafMap[i].top) { leafMap[i].top = leafTop; }
        leafTop = leafBottom;
    }

    // create a buffer of preloaded rows before and after the visible rows
    var firstRow = rowsToDisplay[0];
    var lastRow = rowsToDisplay[rowsToDisplay.length-1];
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (lastRow+i < leafMap.length) { rowsToDisplay.push(lastRow+i); }
    }
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (firstRow-i >= 0) { rowsToDisplay.push(firstRow-i); }
    }

    // Create the thumbnail divs and images (lazy loaded)
    var j;
    var row;
    var left;
    var index;
    var div;
    var link;
    var img;
    var page;
    for (i=0; i<rowsToDisplay.length; i++) {
        if (BookReader.util.notInArray(rowsToDisplay[i], this.displayedRows)) {    
            row = rowsToDisplay[i];

            for (j=0; j<leafMap[row].leafs.length; j++) {
                index = j;
                leaf = leafMap[row].leafs[j].num;
                
                leafWidth = this.thumbWidth;
                leafHeight = parseInt((this.getPageHeight(leaf)*this.thumbWidth)/this.getPageWidth(leaf), 10);
                leafTop = leafMap[row].top;
                left = leafMap[row].leafs[index].left + pageViewBuffer;
                if ('rl' == this.pageProgression){
                    left = viewWidth - leafWidth - left;
                }
                
                var check = $("div#pagediv" + leaf);
                if(check.length > 0) { continue; }

                div = document.createElement("div");
                div.id = 'pagediv'+leaf;
                div.style.position = "absolute";
                div.className = "BRpagedivthumb";

                left += this.padding;
                $(div).css('top', leafTop + 'px');
                $(div).css('left', left+'px');
                $(div).css('width', leafWidth+'px');
                $(div).css('height', leafHeight+'px');
                //$(div).text('loading...');

                // link to page in single page mode
                link = document.createElement("a");
                $(link).data('leaf', leaf);
                $(link).bind('click', function(event) {
                    self.firstIndex = $(this).data('leaf');
                    self.switchMode(self.constMode1up);
                    event.preventDefault();
                });
                
                // $$$ we don't actually go to this URL (click is handled in handler above)
                var title = "image of page " + this.getPageNum(leaf);
                link.href = '#page/' + (this.getPageNum(leaf)) +'/mode/1up' ;
                $(link).attr({ title : title });
                $(div).append(link);
                
                $('#BRpageview').append(div);

                img = document.createElement("img");
                var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);
                
                $(img).attr('src', this.imagesBaseURL + 'transparent.png')
                    .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                    .addClass('BRlazyload')
                    // Store the URL of the image that will replace this one
                    .data('srcURL',  this._getPageURI(leaf, thumbReduce))
                    .data('index', leaf).
                    data('reduce', thumbReduce);
                $(link).append(img);
                //console.log('displaying thumbnail: ' + leaf);
            }   
        }
    }
    
    // Remove thumbnails that are not to be displayed
    var k;
    for (i=0; i<this.displayedRows.length; i++) {
        if (BookReader.util.notInArray(this.displayedRows[i], rowsToDisplay)) {
            row = this.displayedRows[i];
            
            // $$$ Safari doesn't like the comprehension
            //var rowLeafs =  [leaf.num for each (leaf in leafMap[row].leafs)];
            //console.log('Removing row ' + row + ' ' + rowLeafs);
            
            for (k=0; k<leafMap[row].leafs.length; k++) {
                index = leafMap[row].leafs[k].num;
                //console.log('Removing leaf ' + index);
                $('#pagediv'+index).remove();
            }
        } else {
            /*
            var mRow = this.displayedRows[i];
            var mLeafs = '[' +  [leaf.num for each (leaf in leafMap[mRow].leafs)] + ']';
            console.log('NOT Removing row ' + mRow + ' ' + mLeafs);
            */
        }
    }
    
    // Update which page is considered current to make sure a visible page is the current one
    var currentIndex = this.currentIndex();
    // console.log('current ' + currentIndex);
    // console.log('least visible ' + leastVisible + ' most visible ' + mostVisible);
    if (currentIndex < leastVisible) {
        this.setCurrentIndex(leastVisible);
    } else if (currentIndex > mostVisible ) {
      this.setCurrentIndex(mostVisible);
    }
    
    // if ( this.currentIndex() >= this.numLeafs ) {
    //   console.log("REDUCING THE CURRENT INDEX!!!");
    //   this.currentIndex(this.numLeafs - 1);
    // }

    this.displayedRows = rowsToDisplay.slice();
    
    // Update hash, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedRows.length > 0) {
        this.updateLocationHash();
    }

    // remove previous highlights
    $('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');
    
    // highlight current page
    $('#pagediv'+this.currentIndex()).addClass('BRpagedivthumb_highlight');
    
    this.lazyLoadThumbnails();

    // Update page number box.  $$$ refactor to function
    if (null !== this.getPageNum(this.currentIndex()))  {
      this.updatePageNumBox();
      // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
      $("#BRpagenum").val('');
    }

    this.updateToolbarZoom(this.reduce); 
}

HTBookReader.prototype._createTextElement = function(width, height) {
    e = document.createElement("div");
    $(e).addClass("ocrTextContainer");
    $(e).css('height', height + 'px');
    $(e).css('width', width + 'px');

    var ee = document.createElement("div");
    $(ee).addClass("ocrScrollBar");
    $(e).append(ee);
    
    return e;
}

HTBookReader.prototype._insertTextPane = function(data, index, e, sel) {
    var maxFontSize = ( 5 / Math.round(this.reduce ));
    var minFontSize = ( 1 / Math.round(this.reduce ));
    if ( minFontSize < 1 ) { minFontSize = 1; }
    
    var $e = $(e);

    var width = $e.width();

    var gutter = Math.floor(width / 8);

    $(data)
        .addClass('ocrText')
        .attr("id", "ocr" + index)
        .appendTo($e)
        .css({ left : gutter + 'px', width : ( gutter * 6 ) + 'px' })
        .textfill({maxFontSize : 40, sel:sel})
        
    $e
        .animate({ backgroundColor : '#ffffff', opacity: 1.0 }, "fast", function() {
            $(".ocrScrollBar", $e).css('backgroundColor', 'white');
        });
}

HTBookReader.prototype.createContentElement = function(index, reduce, width, height) {
    var self = this;
    var e;
    var url = this._getPageURI(index, reduce, 0);
    
    if ( 0 && this.hasPageFeature(index, "MISSING_PAGE") ) {

        e = this._createTextElement(width, height);
        
        // have to add the text AFTER the element is attached 
        // to the DOM
        setTimeout(function() {
            var data = 
                '<div class="noText ocrText">' +
                    '<div class="noTextAlert">MISSING PAGE</div>' +
                    '<span>This page is missing in the original.</span><br />' + 
                    '<span>Please continue to available pages.</span><br />' +
                    '<span><a target="_blank" href="http://www.hathitrust.org/help_digital_library#PageNotAvailable">See the Help page for more information.</a></span>' + 
                '</div>';

            self._insertTextPane(data, index, e);
        }, 200);

    } else if ( this.displayMode == 'image' ) {

      e = document.createElement("img");
      $(e).css('width', width+'px');
      $(e).css('height', height+'px');
      
      var lazy = new Image();
      $(lazy).one('load', function() {
        
        if ( this.height == HT.config.CHOKE_DIM && this.width == HT.config.CHOKE_DIM ) {
          $(e).addClass("choked");
          HT.monitor.run(this.src);
        }
        
        e.src = this.src;
      })
      .attr('src', url);

      var title = "image of page " + this.getPageNum(index);
      $(e).attr({ alt : title, title : title});
      e.src = this.imagesBaseURL + 'transparent.png';

      $.data(e, 'index', index);

    } else {

        var sel = 'span';
        
        e = this._createTextElement(width, height);
        
        $.get(url, null, function(data) {
            
            if ( ! data ) {
                data = 
                    '<div class="noText ocrText">' +
                        '<div class="noTextAlert">NO TEXT ON PAGE</div>' +
                        '<span>This page does not contain any text</span><br />' +
                        '<span>recoverable by the OCR engine</span>' + 
                    '</div>';
                sel = null;
            }
            
            self._insertTextPane(data, index, e, sel);

        })
        
    }
    return e;
}

HTBookReader.prototype.tweakDragParams = function() {
    $('#BRcontainer').dragscrollable({dragSelector : '.ocrScrollBar', acceptPropagatedEvent : false, preventDefault : false});
}

// ROTATE SUPPORT
$(window).scroll(function() {
    var $controls = $("#BRpageControls");
    if ( $controls.is(":visible") ) {
        $("div#BRpageControls").fadeOut(250);
    }
})

HTBookReader.prototype.rotationCache = {};
HTBookReader.prototype.rotatePage = function(idx, delta) {
    
    if (idx == null) {
        idx = this.currentIndex();
    }
    if ( delta == null ) {
        delta = 90;
    }
    var r = this.rotationCache[idx];
    if ( r == null ) {
        r = 0;
    }
    r += delta;
    
    if ( r < 0 ) {
        r += 360;
    }
    
    if ( r == 360 ) { r = 0 ; }
    this.rotationCache[idx] = r;

    // $("div.BRpagediv1up").remove();
    $("#BRpageview").empty();
    this.displayedIndices = [];
    
    this.drawLeafs();
    var self = this;
    setTimeout(function() { self.jumpToIndex(idx); }, 150);
}

HTBookReader.prototype.toggleZoomHandlers = function(on) {
  var self = this;
  var $buttons = $(".zoomAction");
  if ( on === undefined ) {
    on = ! $buttons.hasClass("PTbuttonDisabled");
  }
  if ( on ) {
    $buttons.removeClass("PTbuttonDisabled");
  } else {
    $buttons.addClass("PTbuttonDisabled");
  }
}

HTBookReader.prototype.toggleRotateHandlers = function(on) {
  var self = this;
  var $buttons = $(".rotateAction");
  if ( on === undefined ) {
    on = ! $buttons.hasClass("PTbuttonDisabled");
  }
  if ( on ) {
    $buttons.removeClass("PTbuttonDisabled");
  } else {
    $buttons.addClass("PTbuttonDisabled");
  }
}

HTBookReader.prototype.bindPageControlHandlers = function($pageControl) {
    var self = this;
    var $pageControl = $("#BRpageControls");
    
    $("a#rotate-counterclockwise").click(function(e) {
      var index = self.currentIndex();
      self.rotatePage(index, -90);
      return false;
    });

    // $("a#rotate-left").click(function(e) {
    //     var index = self._pageTarget.attr("id").replace("pagediv", "");
    //     // $pageControl.fadeOut(250, function() { $pageControl.appendTo("body") });
    //     $pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //     self.rotatePage(index, -90);
    //     return false;
    // });
    //     
    // $("a#rotate-right").click(function(e) {
    //     var index = self._pageTarget.attr("id").replace("pagediv", "");
    //     $pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //     self.rotatePage(index, 90);
    //     return false;
    // });

    $("a#rotate-clockwise").click(function(e) {
      var index = self.currentIndex();
      self.rotatePage(index, 90);
      return false;
    });
    
    // $("a#print-page").click(function(e) {
    //     var index = self._pageTarget.attr("id").replace("pagediv", "");
    //     $pageControl.fadeOut(250).appendTo("body");
    //     
    //     var pdf_uri = $("#pagePdfLink").attr('href');
    //     pdf_uri = pdf_uri.replace(/seq=\d+/, "seq=" + ( parseInt(index) + 1 )).replace(/num=\w+(;?)/, "");
    //     
    //     $(this).attr('href', pdf_uri);
    //     $pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //     
    //     return true;
    // })
    // 
    // $("#BRpageControls").hover(
    //     function() { $(this).addClass("hovered"); },
    //     function() { $(this).removeClass("hovered"); }
    // );
    // 
    // $("div.BRpagediv1up:has(img)").live("mouseover mouseleave", function(event) {
    //     var h = $(this).height();
    //     var w = $(this).width();
    //     // var $pageControl = $("#BRpageControls");
    //     if ( event.type == 'mouseover' ) {
    //         
    //         if ( $("#BRpageControls", this).length > 0 ) {
    //             // already appended, ignore...
    //             return true;
    //         }
    //         
    //         // var top = offset.top + h - 75;
    //         // var left = offset.left + w - 75;
    //         // var top = h - 75;
    //         // var left = w - 150;
    //         var left = w - $pageControl.width() - 20; // vertical
    //         var top = h - $pageControl.height() - 20; // vertical
    //         
    // 
    //         // if top is below the fold, pull back
    //         var $bookReaderDiv = $("#BookReader");
    //         
    //         var offset = $(this).offset();
    //         // console.log("TOP", top, "/", ooffset.top, "/", $bookReaderDiv.offset().top + $bookReaderDiv.height());
    //         
    //         while (( top + offset.top + $pageControl.height() ) > ($bookReaderDiv.offset().top + $bookReaderDiv.height()) ) {
    //             top -= 100;
    //         }
    //         
    //         //br._rotateWidget.appendTo($(this)).css("top", top).css("left", left).fadeIn(500)
    //         //$pageControl.css("top", top).css("left", left).fadeIn(250);
    //         //$pageControl.appendTo($(this)).css("top", top).css("left", left).addClass("waiting").fadeIn(250);
    //         //$pageControl.appendTo($(this)).css("top", top).css("left", left).css({ opacity: 0, display: 'block' }).animate({ opacity: 0.3 }, 250);
    //         $pageControl.appendTo($(this)).css("top", top).css("left", left);
    //         self._pageTarget = $(this);
    //         
    //     } else {
    //         // if ( ! (( event.pageX >= position.left && event.pageX <= ( offset.left + w ) ) && 
    //         //      ( event.pageY >= offset.top && event.pageY <= offset.top + h )) ) {
    //         //      $pageControl.fadeOut(250);
    //         //      self._pageTarget = null;
    //         // }
    //         
    //         if ( $("#BRpageControls", this).length > 0 ) {
    //             //$pageControl.fadeOut(250).css("left", -1000).appendTo("body");
    //             $pageControl.css("left", -1000).appendTo("body");
    //             self._pageTarget = null;
    //         }
    //         
    //     }
    //     return true;
    // })
    
}

