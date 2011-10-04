subclass(FudgingBookReader, HTBookReader);

function FudgingBookReader() {
    HTBookReader.call(this);
}

FudgingBookReader.prototype.resizePageView1up = function() {
    var i;
    var viewHeight = 0;
    //var viewWidth  = $('#BRcontainer').width(); //includes scrollBar
    var viewWidth  = $('#BRcontainer').attr('clientWidth');   

    var oldScrollTop  = $('#BRcontainer').attr('scrollTop');
    var oldScrollLeft = $('#BRcontainer').attr('scrollLeft');
    var oldPageViewHeight = $('#BRpageview').height();
    var oldPageViewWidth = $('#BRpageview').width();
    
    var oldCenterY = this.centerY1up();
    var oldCenterX = this.centerX1up();
    
    if (0 != oldPageViewHeight) {
        var scrollRatio = oldCenterY / oldPageViewHeight;
    } else {
        var scrollRatio = 0;
    }
    
    console.log("INITIAL REDUCE", this.reduce);
    
    // Recalculate 1up reduction factors
    this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'),
                                           $('#BRcontainer').attr('clientHeight') );                                        
    // Update current reduce (if in autofit)
    if (this.onePage.autofit) {
        var reductionFactor = this.nextReduce(this.reduce, this.onePage.autofit, this.onePage.reductionFactors);
        this.reduce = reductionFactor.reduce;
    }
    
    var leafs = [];
    for (i=0; i<this.numLeafs; i++) {
        viewHeight += parseInt(this._getPageHeight(i)/this.reduce) + this.padding; 
        var height = parseInt(this._getPageHeight(i)/this.reduce);
        var width = parseInt(this._getPageWidth(i)/this.reduce);
        leafs.push(
          '<div class="page1up" id="pagediv{i}" style="height: {height}px; width: {width}px"><div class="debugIndex">{i}</div></div>'
          .replace(/{i}/g, i).replace('{height}', height).replace('{width}', width)
        );
        if (width>viewWidth) viewWidth=width;
    }
    // $('#BRpageview').height(viewHeight);
    $('#BRpageview').width(viewWidth).css('margin', '0 auto');
    $('#BRpageview').get(0).innerHTML = leafs.join("\n");

    var newCenterY = scrollRatio*viewHeight;
    var newTop = Math.max(0, Math.floor( newCenterY - $('#BRcontainer').height()/2 ));
    $('#BRcontainer').attr('scrollTop', newTop);
    
    // We use clientWidth here to avoid miscalculating due to scroll bar
    var newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    var newLeft = newCenterX - $('#BRcontainer').attr('clientWidth') / 2;
    newLeft = Math.max(newLeft, 0);
    $('#BRcontainer').attr('scrollLeft', newLeft);
    //console.log('oldCenterX ' + oldCenterX + ' newCenterX ' + newCenterX + ' newLeft ' + newLeft);
    
    //this.centerPageView();
    //this.loadLeafs();
        
    this.removeSearchHilites();
    this.updateSearchHilites();
}

// drawLeafsOnePage()
//______________________________________________________________________________
FudgingBookReader.prototype.drawLeafsOnePage = function() {
    //alert('drawing leafs!');
    
    return;
    this.timer = null;

    var scrollTop = $('#BRcontainer').attr('scrollTop');
    var scrollBottom = scrollTop + $('#BRcontainer').height();
    
    var indicesToDisplay = [];
    var portionVisible = {};
    
    var i;
    var leafTop = 0;
    var leafBottom = 0;
    for (i=0; i<this.numLeafs; i++) {
        var height  = parseInt(this._getPageHeight(i)/this.reduce); 
    
        leafBottom += height;
        // console.log('leafTop = '+leafTop+ ' pageH = ' + this.pageH[i] + 'leafTop>=scrollTop=' + (leafTop>=scrollTop));
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        // console.log('LEAF', i, scrollTop, leafTop, height, topInView, bottomInView, middleInView);
        if (topInView | bottomInView | middleInView) {
            //console.log('displayed: ' + this.displayedIndices);
            //console.log('to display: ' + i);
            indicesToDisplay.push(i);
            if ( leafTop <= scrollTop ) {
              // leaf is scrolling off
              portionVisible[i] = (height - ( scrollTop - leafTop )) / height;
            } else if ( leafBottom >= scrollBottom ) {
              portionVisible[i] = (height - ( leafBottom - scrollBottom )) / height;
            } else {
              portionVisible[i] = 1;
            }
        }
        leafTop += height +10;      
        leafBottom += 10;
    }
    
    var firstIndexToDraw  = indicesToDisplay[0];
    this.firstIndex      = firstIndexToDraw;
    
    // var now = new Date;
    // console.log(now.getSeconds(), "SET CURRENT INDEX", this.firstIndex, indicesToDisplay.join("/"));
    
    for(i=0; i < indicesToDisplay.length; i++) {
      var index = indicesToDisplay[i];
      if (portionVisible[index] > portionVisible[this.firstIndex] && portionVisible[this.firstIndex] < 0.4) {
        this.firstIndex = index;
        if ( this.firstIndex != this.lastUpdatedIndex ) {
          this.lastUpdatedIndex = this.firstIndex;
        }
      }
    }
    
    // Update hash, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedIndices.length > 0) {
        this.updateLocationHash();
    }

    if ((0 != firstIndexToDraw) && (1 < this.reduce)) {
        firstIndexToDraw--;
        indicesToDisplay.unshift(firstIndexToDraw);
    }
    
    var lastIndexToDraw = indicesToDisplay[indicesToDisplay.length-1];
    if ( ((this.numLeafs-1) != lastIndexToDraw) && (1 < this.reduce) ) {
        indicesToDisplay.push(lastIndexToDraw+1);
    }
    
    //var viewWidth = $('#BRpageview').width(); //includes scroll bar width
    var viewWidth = $('#BRcontainer').attr('scrollWidth');

    leafTop = 0;
    var i;
    for (i=0; i<firstIndexToDraw; i++) {
      var height = this._getPageHeight(i) / this.reduce;
      var width = this._getPageWidth(i) / this.reduce;
      if ( viewWidth < width ) {
        var r = ( viewWidth - 20 ) / width;
        width = ( viewWidth - 20 );
        height = Math.floor(height * r);
      }
        // leafTop += parseInt(this._getPageHeight(i)/this.reduce) +10;
        leafTop += height + 10;
    }

    this.onePage.firstIndexToDraw = firstIndexToDraw;


    for (i=0; i<indicesToDisplay.length; i++) {
        var index = indicesToDisplay[i];    
        var height  = parseInt(this._getPageHeight(index)/this.reduce); 
        var width   = parseInt(this._getPageWidth(index)/this.reduce); 

        if ( viewWidth < width ) {
          var r = ( viewWidth - 20 ) / width;
          width = ( viewWidth - 20 );
          height = Math.floor(height * r);
        }

        if (BookReader.util.notInArray(indicesToDisplay[i], this.displayedIndices)) {            
            //console.log("displaying leaf " + indicesToDisplay[i] + ' leafTop=' +leafTop);
            var div = document.createElement("div");
            div.className = 'BRpagediv1up';
            div.id = 'pagediv'+index;
            div.style.position = "absolute";
            $(div).css('top', leafTop + 'px');
            var left = (viewWidth-width)>>1;
            if (left<0) left = 0;
            $(div).css('left', left+'px');
            $(div).css('width', width+'px');
            $(div).css('height', height+'px');
            //$(div).text('loading...');
            
            $('#BRpageview').append(div);
            $.data(div, 'index', index);

            var img = this.createContentElement(index, this.reduce, width, height);
            // $(img).css('width', width+'px');
            // $(img).css('height', height+'px');
            $(div).append(img);
            
            $('<div class="debugIndex">' + index + '</div>').appendTo(div);

            // var img = document.createElement("img");
            // img.src = this._getPageURI(index, this.reduce, 0);
            // $(img).css('width', width+'px');
            // $(img).css('height', height+'px');
            // $(div).append(img);
            
        } else {
            //console.log("not displaying " + indicesToDisplay[i] + ' score=' + jQuery.inArray(indicesToDisplay[i], this.displayedIndices));            
        }

        leafTop += height +10;

    }
    
    for (i=0; i<this.displayedIndices.length; i++) {
        if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
            var index = this.displayedIndices[i];
            //console.log('Removing leaf ' + index);
            //console.log('id='+'#pagediv'+index+ ' top = ' +$('#pagediv'+index).css('top'));
            $('#pagediv'+index).remove();
        } else {
            //console.log('NOT Removing leaf ' + this.displayedIndices[i]);
        }
    }
    
    this.displayedIndices = indicesToDisplay.slice();
    this.updateSearchHilites();
    
    if (null != this.getPageNum(firstIndexToDraw))  {
        this.updatePageNumBox();
        // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }
            
    this.updateToolbarZoom(this.reduce);
    
}

//prepareOnePageView()
//______________________________________________________________________________
FudgingBookReader.prototype.prepareOnePageView = function() {

    // var startLeaf = this.displayedIndices[0];
    var startLeaf = this.currentIndex();
    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto',
        position: 'static',
        'text-align' : 'center'
    });
    
    $("#BRcontainer").height($("#BookReader").height() - 16);
    
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
    
    //this.drawLeafsOnePage();
}

FudgingBookReader.prototype.onePageGetAutofitHeight = function() {
    var clientHeight = $('#BRcontainer').attr('clientHeight') || $("#BookReader").attr("clientHeight");
    return (this.getMedianPageSize().height + 0.0) / (clientHeight - this.padding * 2); // make sure a little of adjacent pages show
}

FudgingBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
  if ( this.mode == this.constMode1up ) {
    var $div = $("#pagediv" + index);
    var $container = $("#BRcontainer");
    $container.animate({ scrollTop : ($container.scrollTop() + $div.offset().top - $container.offset().top ) }, "fast");
  } else {
    HTBookReader.prototype.call(this, index, pageX, pageY);
  }
}
