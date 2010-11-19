// BOOKREADER METHOD CONFIG SECTION


br.sliceFromIndex = function(index) {
  return { slice : Math.floor(index / this.slice_size), index : index % this.slice_size };
}

br.getMetaUrlParams = function(start) {
    // var params = { id : this.bookId, noscale: 0, format: "list", limit : this.slice_size };
    var params = { id : this.bookId, size: '100', format: "list", limit : this.slice_size };
    if ( this.force !== undefined ) {
        params["force"] = this.force
    }
    params['start'] = start;
    params['debug'] = 'local';
    // params['noscale'] = '0';
    return params;
}

br.getPageWidth = function(index) {
    var r = this.rotationCache[index] || 0;
    var w = this.__getPageWidth(index);
    return w;
}

br.getPageHeight = function(index) {
    var r = this.rotationCache[index] || 0;
    var h = this.__getPageHeight(index);
    if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
        var w = this.__getPageWidth(index);
        h = Math.ceil(w * ( w / h ));
    }
    return h;
}

br.__getPageWidth = function(index) {
    var slice = this.sliceFromIndex(index);
    var w;
    if (this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['width'][slice.index]) == 'number'){
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

br.__getPageHeight = function(index) {
    // calculate slice from index
    var slice = this.sliceFromIndex(index);
    var h;
    if (this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['height'][slice.index]) == 'number'){
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
br.getAvgDimension = function(dimType) {
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
   }
   return sum / count;
}

br.getPingStatus = function() {
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

br.alertSessionExpired = function() {
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
br.getPageURI = function(index, reduce, rotate) {
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

    // console.log("USING REDUCE = ", _reduce);
    //return this.imageURL + '?id='+br.bookId+';seq='+(index+1)+';size=' + Math.round(100/_reduce);
    var _targetWidth = Math.round(this.getMedianPageSize().width / _reduce);
    var page_uri = ((this.displayMode == 'text' && this.mode == 1) ? this.ocrURL : this.imageURL ) + '?id='+this.bookId+';seq='+(index+1);
    
    if ( this.mode == 1 && this.displayMode == "text" ) {
        if ( this.qvalsHash ) {
            page_uri += ";qvalsHash=" + this.qvalsHash;
        }        
    } else {
        page_uri += ';width=' + _targetWidth + ';orient=' + _orient;
    }
    
    return page_uri
}

br.getOcrURI = function(index) {
    var q1 = this.getURLParameter("q1");
    var page_uri = this.ocrFrameURL + '?id=' + this.bookId + ';seq=' + (index+1) + ';view=text';
    if ( q1 ) {
        page_uri += ";q1=" + escape(q1);
    }
    return page_uri;
}

// Returns true if page image is available rotated
br.canRotatePage = function(index) {
    //return 'jp2' == this.imageFormat; // Assume single format for now
    return true;
}

br.getPageSide = function(index) {
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
 
br.getPageNum = function(index) {
    if(index < 0) { return ; }
    var slice = this.sliceFromIndex(index);
    var pageNum = this.bookData[slice.slice]['page_num'][slice.index];
    if (pageNum) {
        return pageNum;
    } else {
        return 'n' + index;
    }
}

br.leafNumToIndex = function(leafNum) {
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
br.getSpreadIndices = function(pindex) {
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
br.uniquifyPageNums = function() {
    var seen = {};

    for (var slice_idx = this.slices.length - 1; slice_idx--; slice_idx >= 0) {
      var slice = this.slices[slice_idx];
      for (var i = br.bookData[slice]['page_num'].length - 1; i--; i >= 0) {
          var pageNum = br.bookData[slice]['page_num'][i];
          if ( !seen[pageNum] ) {
              seen[pageNum] = true;
          } else {
              br.bookData[slice]['page_num'][i] = null;
          }
      }
    }


}
 
br.cleanupMetadata = function() {
    br.uniquifyPageNums();
}

br.updateViewSettings = function() {
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

br.loadSlices = function(next_slice) {
    var self = this;
    if(next_slice < self.total_slices) {
        var start = next_slice * this.slice_size;
        var params = self.getMetaUrlParams(start);
        $.getJSON(self.metaURL, params, function(data) {
            self.bookData[next_slice] = data;
            self.numLeafs += self.bookData[next_slice]['seq'].length;
            self.slices.push(next_slice);
            self.cleanupMetadata();

            self.updateViewSettings();

            self.loadSlices(next_slice + 1);
        });
    } else {
        self.complete = true;
    }
}


// getEmbedURL
//________
// Returns a URL for an embedded version of the current book
br.getEmbedURL = function() {
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
br.getEmbedCode = function() {
    return "<iframe src='" + this.getEmbedURL() + "' width='480px' height='430px'></iframe>";
}


// OVERRIDE

FrankenBookReader.prototype.init = function() {
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
    
    var now = Date();

    if (! this.complete && do_wait) {
        console.log("INIT: WAITING FOR", now, startIndex, "/", this.complete, "/", do_wait, "/", this.sliceFromIndex(startIndex), ":", this.total_slices);
        if ( 'undefined' == typeof(startIndex) || this.sliceFromIndex(startIndex).slice < this.total_slices ) {
             var self = this;

             if ( self.notice == null ) {
                 self.notice = $.pnotify({
                    pnotify_title: "Please wait",
                    pnotify_notice_icon: "",
                    pnotify_hide: false,
                    pnotify_closer: false,
                    pnotify_opacity: .85,
                    pnotify_width: "150px",
                    pnotify_history: false,
                    pnotify_before_open: function(pnotify){
                    	// Position this notice in the center of the screen.
                    	pnotify.css({
                    		"top": ($(window).height() / 2) - (pnotify.height() / 2),
                    		"left": ($(window).width() / 2) - (pnotify.width() / 2)
                    	});
                    }
                 });
             }

             setTimeout(function() {
                 var options = { pnotify_text: "Loading: " + (self.numLeafs) + " / " + self.total_items};
                 self.notice.pnotify(options);
                 self.init();
             }, 500);
             console.log("WAITING:", now);
             return;
        }
    }
    
    if ( self.notice != null ) {
        self.notice.pnotify({pnotify_title: "All finished", pnotify_text: "Enjoy!", pnotify_hide: true, pnotify_closer: true, pnotify_opacity: 1.0, pnotify_width: '250px' });
        self.notice = null; // notice will be cleaned up by pnotify
    }

    // if (! this.complete && do_wait) {
    //     console.log("INIT: WAITING FOR", now, startIndex, "/", this.complete, "/", do_wait, "/", this.sliceFromIndex(startIndex), ":", this.total_slices);
    //     if ( 'undefined' == typeof(startIndex) || this.sliceFromIndex(startIndex).slice < this.total_slices ) {
    //          var self = this;
    //          setTimeout(function() {
    //              self.init();
    //          }, 500);
    //          console.log("WAITING:", now);
    //          return;
    //     }
    // }
    
    console.log("BOOK READER INIT", now);
    BookReader.prototype.init.call(this);
    
    if ( this.ui == 'full' ) {
        var $rotateControl = $('<div id="BRrotateControls"><a href="#" id="rotate-left" class="rotateAction"><img alt="Rotate Left" src="/pt/common-web/graphics/rotateCCW.gif" height="25" width="25" /></a><a href="#" id="rotate-right" class="rotateAction"><img alt="Rotate Right" src="/pt/common-web/graphics/rotateCW.gif" height="25" width="25" /></a></div>').appendTo("#BookReader");
        this.bindRotateControlHandlers($rotateControl);
    }
    
    // $('.BRpagediv1up').unbind('mousedown');
    // $('.BRpagediv1up').bind('mousedown', this, function(e) {
    //     // $$$ the purpose of this is to disable selection of the image (makes it turn blue)
    //     //     but this also interferes with right-click.  See https://bugs.edge.launchpad.net/gnubook/+bug/362626
    //     console.log("AM ENABLING MOUSEDOWN");
    //     // if (e.data.displayMode == 'image') {
    //     //     return false;
    //     // }
    //     return true;
    // });
    
    
}

FrankenBookReader.prototype.getURLParameter = function(name) {
    return unescape(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

// initToolbar
FrankenBookReader.prototype.initToolbar = function(mode, ui) {

    $("#BookReader").append("<div id='BRtoolbar'>"
        + "<span id='BRtoolbarbuttons' style='float: right; white-space: nowrap; padding-right: 4px'>"
        +   "<div class='BRzoomOptions'>"
        +   " <button class='BRicon rollover zoom_out' onclick='br.zoom(-1); return false;'/>" 
        +   "<button class='BRicon rollover zoom_in' onclick='br.zoom(1); return false;'/>"
        +   " <span class='label'>Zoom: <span id='BRzoom'>"+parseInt(100/this.reduce)+"</span></span>"
        +   "</div>"
        +   "&nbsp;"
        +   "<form class='BRpageform' action='javascript:' onsubmit='br.jumpToPage(this.elements[0].value)'> <span class='label'>Jump to:<input id='BRpagenum' type='text' size='3' onfocus='br.autoStop();'></span></input>"
        +   " <button class='BRbutton'>Go</button>"
        +   "</form>"
        +   "&nbsp;"
        +   "<div class='BRtoolbarmode2' style='display: none'><button class='BRicon rollover book_leftmost' /><button class='BRicon rollover book_left' /><button class='BRicon rollover book_right' /><button class='BRicon rollover book_rightmost' /></div>"
        +   "<div class='BRtoolbarmode1' style='display: none'><button class='BRicon rollover book_top' /><button class='BRicon rollover book_up' /> <button class='BRicon rollover book_down' /><button class='BRicon rollover book_bottom' /></div>"
        +   "<div class='BRtoolbarmode3' style='display: none'><button class='BRicon rollover book_top' /><button class='BRicon rollover book_up' /> <button class='BRicon rollover book_down' /><button class='BRicon rollover book_bottom' /></div>"
        +   "&nbsp;"
        + "</span>"
        
        + "<span id='BRmodebuttons' style='padding-left: 4px'>"
        +   "<span>Scroll: </span>"
        +   " <button class='BRlabel one_page_mode mode1_image' onclick='br.switchMode(1, \"image\"); br.toggleDisplayMode(\"image\"); return false'>Image</button>"
        +   " / "
        +   " <button class='BRlabel one_page_mode mode1_text' onclick='br.switchMode(1, \"text\"); br.toggleDisplayMode(\"text\"); return false'>Text</button>"
        +   " | "
        +   " <button class='BRlabel two_page_mode mode2' onclick='br.switchMode(2); return false'>Flip</button>"
        +   " | "
        +   " <button class='BRlabel thumbnail_mode mode3' onclick='br.switchMode(3); return false'>Thumbnail</button>"
        +   " | "
        +   " <button class='BRlabel mode4' onclick='br.switchMode(4); return false'>Text</button>"
        + "</span>"
        
        + "</div>");

    this.updateToolbarZoom(this.reduce); // Pretty format
        
    // $$$ turn this into a member variable
    var jToolbar = $('#BRtoolbar'); // j prefix indicates jQuery object
    
    // We build in mode 2
    jToolbar.append();

    this.bindToolbarNavHandlers(jToolbar);
    
    // Setup tooltips -- later we could load these from a file for i18n
    var titles = { '.logo': 'Go to Archive.org',
                   '.zoom_in': 'Zoom in',
                   '.zoom_out': 'Zoom out',
                   '.one_page_mode': 'One-page view',
                   '.two_page_mode': 'Two-page view',
                   '.thumbnail_mode': 'Thumbnail view',
                   '.print': 'Print this page',
                   '.embed': 'Embed bookreader',
                   '.book_left': 'Flip left',
                   '.book_right': 'Flip right',
                   '.book_up': 'Page up',
                   '.book_down': 'Page down',
                   '.play': 'Play',
                   '.pause': 'Pause',
                   '.book_top': 'First page',
                   '.book_bottom': 'Last page'
                  };
    if ('rl' == this.pageProgression) {
        titles['.book_leftmost'] = 'Last page';
        titles['.book_rightmost'] = 'First page';
    } else { // LTR
        titles['.book_leftmost'] = 'First page';
        titles['.book_rightmost'] = 'Last page';
    }
                  
    for (var icon in titles) {
        jToolbar.find(icon).attr('title', titles[icon]);
    }
    
    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
        jToolbar.find('.two_page_mode, .play, .pause').hide();
    }
    if ( !this.canSwitchToMode(this.constModeThumb) ) {
        jToolbar.find('.thumbnail_mode').hide();
    }
    
    // Hide one page button if it is the only mode available
    if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
        jToolbar.find('.one_page_mode').hide();
    }

    // Switch to requested mode -- binds other click handlers
    this.switchToolbarMode(mode);
    
}

FrankenBookReader.prototype.switchMode = function(mode, extra) {

    cls = "mode" + mode;
    if ( extra != null ) {
        cls += "_" + extra;
    } else if ( cls == "mode1" ) {
        cls += "_image";        
    }
    
    console.log("TOGGLING", cls);
    $("#BRmodebuttons button").removeClass('active');
    $("#BRmodebuttons button." + cls).addClass('active');
    

    if (mode == this.mode) {
        return;
    }
    
    if ( 4 == mode ) {
        this.autoStop();
        this.toggleTextMode();
        this.mode = mode;
        this.switchToolbarMode(this.mode);
    } else {
        if ( this.mode == 4 ) {
            this.toggleTextMode();
        }
        BookReader.prototype.switchMode.call(this, mode);
    }
}

var _bindToolbarNavHandlers = br.bindToolbarNavHandlers;
br.bindToolbarNavHandlers = function(jToolbar) {
    var self = this;
    _bindToolbarNavHandlers.call(this, jToolbar);
    jToolbar.find('.print').unbind('click').bind('click', function(e) {
        self.toggleDisplayMode();
        return false;
    });
}

FrankenBookReader.prototype.paramsFromCurrent = function() {
    var params = BookReader.prototype.paramsFromCurrent.call(this);
    if ( this.displayMode == "text" ) {
        params['display'] = "text";
    }
    return params;
}


FrankenBookReader.prototype.toggleDisplayMode = function(mode) {
    
    if ( this.displayMode == mode ) {
        return;
    }
    
    this.displayMode = mode;
    
    // // does not change anything
    // $("#BRcontainer").empty();
    // $("#BRcontainer").append("<div id='BRpageview' class='ocrpage'></div>");
    // $('#BRcontainer').dragscrollable({acceptPropagatedEvent:false});
    
    this.prepareOnePageView();
    // this.displayedIndices = [];
    // this.drawLeafs();
}

FrankenBookReader.prototype.toggleTextMode = function() {
    
    var self = this;
    var $textContainer = $("#PTcontainer");
    var $imageContainer = $("#BRcontainer");
    if ( $textContainer.size() == 0 ) {
        $textContainer = $('<div id="PTcontainer"><iframe id="MdpOcrFrame"></iframe></div>').appendTo("#BookReader");
    }
    
    if ( $textContainer.css('left') == '0px' ) {
        // $textContainer.fadeOut(500, function() {
        //     $imageContainer.fadeIn(500, function() {
        //         $(this).scrollTop(self.imageScroll);
        //     });
        // })
        
        $textContainer.css('left', "-5000px");
        $imageContainer.css('left', "0px")
        $imageContainer.scrollTop(this.lastScrollTop);
        this.inTextMode = false;
        
    } else {
        // this.imageScroll = $imageContainer.scrollTop();
        // $imageContainer.fadeOut(500, function() {
        //     $textContainer.fadeIn(500);
        // })
        
        var ocr_url = this.getOcrURI(this.currentIndex());

        var viewWidth = $('#PTcontainer').attr('scrollWidth');
        var viewHeight = $('#PTcontainer').attr('scrollHeight');

        // var height  = parseInt(this._getPageHeight(0)/1); 
        // var width  = parseInt(this._getPageWidth(0)/1); 
        
        // if ( height > $textContainer.height() ) {
        //     height = $textContainer.height() - 150;
        // }
        
        var height = $('#PTcontainer').height() - 100;
        var width = $('#PTcontainer').width() - 200;
        var left = (viewWidth-width)>>1;
        var top = (viewHeight-height)>>1;
        
        if (left<0) left = 0;
        if (top<0) top = 0;

        var $iframe = $textContainer.find('#MdpOcrFrame');
        
        this.lastScrollTop = $imageContainer.scrollTop();
        
        $imageContainer.css('left', "-5000px");
        $textContainer.css('left', "0px");
        $iframe
            .css('width', width + 'px')
            .css('height', height + 'px')
            .css('left', left + 'px')
            .css('top', top + "px")
            .attr('src', ocr_url);
            
        this.inTextMode = true;
        

    }
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
    if ( this.displayMode == 'image' ) {
        // Attaches to first child - child must be present
    } else {
        
        // $("#BRpageview").delegate("div.ocrText", 'mousedown', function(event) {
        //     console.log("TEXT GOT A MOUSEDOWN");
        //     event.preventDefault();
        //     return false;
        // });
        
        // Attaches to first child - child must be present
        //$('#BRcontainer').dragscrollable({dragSelector : '.ocrScrollBar', acceptPropagatedEvent : false, preventDefault : false});
        
        //options = {dragSelector : '.ocrScrollBar', acceptPropagatedEvent : false, preventDefault : false};
    }
    
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

//prepareOcrPageView()
//______________________________________________________________________________
BookReader.prototype.prepareOcrPageView = function() {

    // var startLeaf = this.displayedIndices[0];
    var startLeaf = this.currentIndex();
        
    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });
        
    $("#BRcontainer").append("<div id='BRpageview' class='ocrpage'></div>");

    // Attaches to first child - child must be present
    // $('#BRcontainer').dragscrollable();
    // this.bindGestures($('#BRcontainer'));

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));
    
    //this.resizePageView();    
    
    //this.jumpToIndex(startLeaf);
    this.displayedIndices = [];
    
    this.drawLeafsOcrPage();
}

BookReader.prototype.drawLeafsOcrPage = function() {
    console.log("Drawing OCR pages, in theory");
}

// switchToolbarMode
//______________________________________________________________________________
// Update the toolbar for the given mode (changes navigation buttons)
// $$$ we should soon split the toolbar out into its own module
FrankenBookReader.prototype.switchToolbarMode = function(mode) { 
    if (4 == mode) {
        // 1-up
        $('#BRtoolbar .BRtoolbarzoom').show().css('display', 'inline');
        $('#BRtoolbar .BRtoolbarmode1').hide();
        $('#BRtoolbar .BRtoolbarmode3').hide();
        $('#BRtoolbar .BRtoolbarmode2').show().css('display', 'inline');
    } else {
        BookReader.prototype.switchToolbarMode.call(this, mode);
    }
}

FrankenBookReader.prototype.currentIndex = function() {
    if ( 4 == this.mode ) {
        return this.firstIndex;
    }
    return BookReader.prototype.currentIndex.call(this);
}

FrankenBookReader.prototype.fragmentFromParams = function(params) {
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
        if (params.mode == this.constMode1up) {
            fragments.push('mode', '1up');
        } else if (params.mode == this.constMode2up) {
            fragments.push('mode', '2up');
        } else if (params.mode == this.constModeThumb) {
            fragments.push('mode', 'thumb');
        } else if (params.mode == 4) {
            fragments.push('mode', 'text');
        } else {
            throw 'fragmentFromParams called with unknown mode ' + params.mode;
        }
    }
    
    // search
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }
    
    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
}


// jumpToIndex()
//______________________________________________________________________________
FrankenBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
    
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
    $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    this.updateLocationHash();
    
}


// drawLeafsThumbnail()
//______________________________________________________________________________
// If seekIndex is defined, the view will be drawn with that page visible (without any
// animated scrolling)
FrankenBookReader.prototype.drawLeafsThumbnail = function( seekIndex ) {
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
                link.href = '#page/' + (this.getPageNum(leaf)) +'/mode/1up' ;
                $(div).append(link);
                
                $('#BRpageview').append(div);

                img = document.createElement("img");
                var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);
                
                $(img).attr('src', this.imagesBaseURL + 'transparent.png')
                    .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                    .addClass('BRlazyload')
                    // Store the URL of the image that will replace this one
                    .data('srcURL',  this._getPageURI(leaf, thumbReduce));
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
    } else if (currentIndex > mostVisible) {
        this.setCurrentIndex(mostVisible);
    }

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
        $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }

    this.updateToolbarZoom(this.reduce); 
}

br.createContentElement = function(url, width, height) {
    var e;
    if ( this.displayMode == 'image' ) {
        e = document.createElement("img");
        $(e).css('width', width+'px');
        $(e).css('height', height+'px');
        e.src = url;
    } else {
        // e = document.createElement("div");
        // $(e).addClass("ocrText");
        // $(e).css('height', ( height - 25 ) + 'px');
        // $(e).css('width', ( width - 50 ) + 'px');
        // var value = (100 / this.reduce).toFixed(2);
        // $(e).css("font-size", value + "%");
        // $.get(url, null, function(data) {
        //     e.innerHTML = data;
        // })
        
        e = document.createElement("div");
        $(e).addClass("ocrTextContainer");
        $(e).css('height', height + 'px');
        $(e).css('width', width + 'px');

        var ee = document.createElement("div");
        $(ee).addClass("ocrScrollBar");
        $(e).append(ee);
        // var value = (100 / this.reduce).toFixed(2);
        // $(ee).css("font-size", value + "%");
        // $.get(url, null, function(data) {
        //     ee.innerHTML = data;
        // })
        
        ee = document.createElement("div");
        $(ee).addClass("ocrText");
        // var value = (100 / this.reduce).toFixed(2);
        // $(ee).css("font-size", value + "%");
        // value = ( 100 / ( this.reduce / 1.5 ) ).toFixed(2);
        //         $(ee).css('line-height', value + "%");
        
        var maxFontSize = ( 40 / Math.round(this.reduce ));
        var minFontSize = ( 14 / Math.round(this.reduce ));
        if ( minFontSize < 9 ) { minFontSize = 9; }
        // console.log("USING FONT:", minFontSize, "/", maxFontSize, "/", this.reduce);
        $.get(url, null, function(data) {
            ee.innerHTML = data;
            $(ee).textfill({debug:url, minFontSize:minFontSize, maxFontSize:maxFontSize});
        })
        
        $(ee).appendTo(e).bind('mousedown', function() { console.log("HEY"); return true })
        var w = $(ee).width();
        var gutter = Math.floor(width / 8);
        // $(ee).css('right', gutter + "px");
        $(ee).css({ left : gutter + 'px', width : ( gutter * 6 ) + 'px' });
        
        // $(e).append(ee);
        
    }
    return e;
}

br.tweakDragParams = function() {
    $('#BRcontainer').dragscrollable({dragSelector : '.ocrScrollBar', acceptPropagatedEvent : false, preventDefault : false});
}

// ROTATE SUPPORT
$(window).scroll(function() {
    $("div#BRrotateControls").fadeOut(250);
})

br.rotationCache = {};
br.rotatePage = function(idx, delta) {
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
    r += 90;
    if ( r == 360 || r < 0 ) { r = 0 ; }
    this.rotationCache[idx] = r;

    $("div.BRpagediv1up").remove();
    this.displayedIndices = [];
    
    this.drawLeafs();
    var self = this;
    setTimeout(function() { self.jumpToIndex(idx); }, 150);
}

br.bindRotateControlHandlers = function($rotateControl) {
    var self = this;
    $("a#rotate-left").click(function(e) {
        var index = self._rotateTarget.attr("id").replace("pagediv", "");
        $rotateControl.fadeOut(250).appendTo("body");
        self.rotatePage(index, -90);
        return false;
    })
    $("a#rotate-right").click(function(e) {
        var index = self._rotateTarget.attr("id").replace("pagediv", "");
        $rotateControl.fadeOut(250).appendTo("body");
        self.rotatePage(index, 90);
        return false;
    })
    
    $("div.BRpagediv1up:has(img)").live("mouseover mouseleave", function(event) {
        var h = $(this).height();
        var w = $(this).width();
        // var $rotateControl = $("#BRrotateControls");
        if ( event.type == 'mouseover' ) {
            // var top = offset.top + h - 75;
            // var left = offset.left + w - 75;
            var top = h - 75;
            var left = w - 100;

            // if top is below the fold, pull back
            var $bookReaderDiv = $("#BookReader");
            
            var offset = $(this).offset();
            // console.log("TOP", top, "/", ooffset.top, "/", $bookReaderDiv.offset().top + $bookReaderDiv.height());
            
            while (( top + offset.top ) > ($bookReaderDiv.offset().top + $bookReaderDiv.height()) ) {
                top -= 100;
            }
            
            //br._rotateWidget.appendTo($(this)).css("top", top).css("left", left).fadeIn(500)
            //$rotateControl.css("top", top).css("left", left).fadeIn(250);
            $rotateControl.appendTo($(this)).css("top", top).css("left", left).css("width", 75).fadeIn(250);
            self._rotateTarget = $(this);
            //$rotateControl.css("top", top).css("left", left).fadeIn("500");
        } else {
            // if ( ! (( event.pageX >= position.left && event.pageX <= ( offset.left + w ) ) && 
            //      ( event.pageY >= offset.top && event.pageY <= offset.top + h )) ) {
            //      $rotateControl.fadeOut(250);
            //      self._rotateTarget = null;
            // }
            $rotateControl.fadeOut(250).css("left", -1000).appendTo("body");
            self._rotateTarget = null;
        }
        return false;
    })
    
}



$(document).ready(function() {
    
});

// PREPPING AND LOADING SECTION

// Check for config object
// $$$ change this to use the newer params object
if (typeof(brConfig) != 'undefined') {
    if (typeof(brConfig["ui"]) != 'undefined') {
        br.ui = brConfig["ui"];
    }
    if (brConfig['mode'] == 1) {
        br.mode = 1;
        if (typeof(brConfig['reduce'] != 'undefined')) {
            br.reduce = brConfig['reduce'];
        }
    } else if (brConfig['mode'] == 2) {
        br.mode = 2;  
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
    br.slice_size = parseInt(slice_size);
}

// update slice_size to match thumbColumns
while ( br.slice_size % br.thumbColumns != 0 ) {
    br.slice_size += 1;
}

// Load bookreader
var params = br.getMetaUrlParams(0);
// delay loading metaURL - BAH HUMBUG
setTimeout(function() {
    $.getJSON(br.metaURL, params, function(data) {
      br.bookData = { 0 : data };
      br.slices = [0];
      // br.numLeafs = br.bookData['total_pages'];
      br.titleLeaf = br.bookData[0]['first_page_sequence'];
      br.numLeafs = br.bookData[0]['seq'].length;
      br.total_slices = Math.ceil(data['total_items'] / br.slice_size);
      br.total_items = data['total_items'];
      br.cleanupMetadata();
      br.complete = false;
      br.init();

      br.loadSlices(1);
      
      
    });
}, 500);

$(document).ready(function() {
    if ( window.console === undefined ) {
        window.console = {
            log : function() { }
        }
    }
})
