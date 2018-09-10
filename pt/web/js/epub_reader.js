head.ready(function() {

  function dig(el){
      $(el).contents().each(function(i,e){
          if (e.nodeType==1){
              // not a textnode
           dig(e);   
          }else{
              if (pos<=start){
                 if (pos+e.length>=start){
                  range.setStart(e, start-pos);
                 }
              }
              
              if (pos<=end){
                 if (pos+e.length>=end){
                  range.setEnd(e, end-pos);
                 }
              }            
              
              pos = pos+e.length;
          }
      });  
  }

  var start,end, range, s, pos;
  function highlight(c, s, element, text){
      var hrefs = [];
      element.querySelectorAll("p").forEach(function(e, i) {
        start = e.innerText.toLowerCase().indexOf(text.toLowerCase());
        if ( start > -1 ) {
          range = element.ownerDocument.createRange();
          end = start + text.length;
          pos = 0;
          dig(e, start, end);
          // console.log("AHOY", e, start, end, text, text.length, range);
          var cfi = c.cfiFromRange(range);
          hrefs.push(cfi);
          // console.log(cfi);
        } else {
          // console.log("AHOY NO", e, text);
        }
      })
      return hrefs;
      // s.addRange(range);
  }

  console.log("AHOY READER");
  // var book_href = "https://roger-full.babel.hathitrust.org/cgi/imgsrv/files/epub.buell/";
  var book_href = $("html").data('epub-root');
  var flow = 'paginated';

  var start_cfi;
  // if ( HT.params.num ) {
  //   start_cfi = "epubcfi(" + HT.params.num + ")";
  //   console.log("AHOY STARTING WITH", location.hash, start_cfi);
  //   location.hash = '';
  // }
  if ( location.hash && location.hash.startsWith("#/6") ) {
    start_cfi = "epubcfi(" + location.hash.substr(1) + ")";
    console.log("AHOY STARTING WITH", location.hash, start_cfi);
    location.hash = "";
  } else {
    if ( sessionStorage.getItem('id') == HT.params.id ) {
      start_cfi = "epubcfi(" + sessionStorage.getItem('hash').substr(1) + ")";
      console.log("AHOY STARTING WITH SAVED", start_cfi);
    }
  }

  var reader = cozy.reader('content', { href: book_href, flow: flow });
  HT.reader = reader;

  var $toolbar = $("#action-go-prev").parent();
  console.log("AHOY TOOLBAR", $toolbar);
  cozy.control.pageFirst({ container: $toolbar.get(0) }).addTo(reader);
  cozy.control.pagePrevious({ container: $toolbar.get(0) }).addTo(reader);
  cozy.control.pageNext({ container: $toolbar.get(0) }).addTo(reader);
  cozy.control.pageLast({ container: $toolbar.get(0) }).addTo(reader);
  // cozy.control.navigator({ region: 'book.navigator' }).addTo(reader);
  cozy.control.navigator({ region: 'bottom.navigator' }).addTo(reader);

  // because HT doesn't have a _preferences_ panel, per se
  var resetFlow = function(btn) {
    target = reader.currentLocation();
    $("a[data-target].active").removeClass("active");
    $(btn).addClass("active");
    var flow = $(btn).data('target');
    // $("body").removeClass("view-1up").removeClass("view-2up").addClass("view-" + cls);
    if ( flow == 'scrolled-doc' ) { manager = 'continuous'; }
    reader.reopen({ flow: flow });
  }

  $("a[data-target=scrolled-doc]").on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    resetFlow(this);
  })

  $("a[data-target=paginate]").on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    resetFlow(this);
  })

  var text_size = 100;

  var resetTextSize = function(delta) {
    text_size += ( delta * 10 );
    if ( text_size == 200 ) {
      $("#action-zoom-in").attr("disabled", "disabled");
      $("#action-zoom-out").attr("disabled", null);
    } else if ( text_size == 70 ) {
      $("#action-zoom-in").attr("disabled", null);
      $("#action-zoom-out").attr("disabled", "disabled");
    } else {
      $("#action-zoom-in").attr("disabled", null);
      $("#action-zoom-out").attr("disabled", null);
    }
    reader.reopen({ text_size: text_size });
  }

  $("#action-zoom-in").on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    resetTextSize(1);
  })

  $("#action-zoom-out").on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    resetTextSize(-1);
  })

  $("#action-toggle-fullscreen").on('click', function(e) {
    // reader.requestFullscreen();
    if ( screenfull.enabled ) {
      // this._preResize();
      screenfull.toggle($(".container.page.centered").get(0));
    }
  })

  var _filter = function(list, parent_id, tabindex, parent) {
    var retval = [];
    $.each(list, function() {
      if ( this.parent == parent_id ) {
        retval.push([ this, tabindex, parent ]);
      }
    })
    return retval;
  };

  var _process_menu = function(items, tabindex, $parent) {
    items.forEach(function(item) {
      var $li = $("<li><a></a></li>").appendTo($parent);
      var $a = $li.find("a");
      $a.attr("href", item.href);
      $a.text(item.label);
      if ( item.subitems.length ) {
        var $ul = $("<ul></ul>").appendTo($li);
        _process_menu(item.subitems, tabindex + 1, $ul);
      }
    })
  }

  var $menu = $(".table-of-contents ul");
  reader.on('updateContents', function(data) {
    if ( data ) {
      _process_menu(data.toc, 0, $menu);
    }
  });
  $menu.on('click', 'a', function(e) {
    e.preventDefault();
    var target = $(this).attr("href");
    console.log("AHOY GO TO", target);
    reader.gotoPage(target);
  })

  var highlights = HT.params.h;
  if ( highlights ) { highlights = highlights.split(":"); }
  else { highlights = []; }
  var highlighted = {};

  // highlights = [ 'Russian Futurism', 'successivity', 'Šklovskij' ]; // 'Šklovskij', 
  
  window.DEBUG = window.DEBUG || {};

  reader.on("updateSection", function(location) {
    var view = reader._rendition.manager.current();
    if ( ! view ) { return; }
    var section = view.section;
    if ( ! highlighted[section.href] ) {
      highlighted[section.href] = true;
      console.log("AHOY", section.href, highlights);
      DEBUG.view = view;
      if ( true && view.contents && highlights.length > 0) {
        console.log("AHOY WIDTH 1", $(view.contents.window).width());
          highlights.forEach(function(word) {
              s = view.contents.window.getSelection();
              var e = view.contents.document.getElementsByTagName('body').item(0);
              var hrefs = highlight(view.contents, s, e, word);
              if ( hrefs.length ) {
                hrefs.forEach(function(href) {
                  console.log("AHOY HIGHLIGHTING", href, word);
                  reader.annotations.highlight(href);
                })
              }
          })
          setTimeout(function() {
            console.log("AHOY WIDTH 2", $(view.contents.window).width());
          }, 500);
      }
    }
  });

  reader.on("updateSection", function() {
    // var cfi_href = reader.currentLocation().start.cfi;
    // location.hash = '#' + cfi_href.substr(8, cfi_href.length - 8 - 1);

    sessionStorage.setItem('id', HT.params.id);
    sessionStorage.setItem('hash', window.location.hash);

  });

  reader.start(start_cfi);

  setTimeout(function() {
  }, 100);

});