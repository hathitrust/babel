/*ls_misc.js*/

//alert("this is ls_misc.js");
/** consider using jquery toggle for the less and more buttons **/

//$(document).ready(function()  below is jquery shortcut for document.ready...

//$(function()  use head ready for unicorn framework instead!

head.ready(function() {
    /** we want to only affect the facets in the group so we need to assign a second class and
        feed that to the function 
        Note that there is probably a better jquery way to do this than to get an array and look at the first element
        We should be able to look for "not morefacets"
    **/
    
    //    $("a.lessfacets").css("color","green");
    
    $("a.lessfacets").hide();
    
    $("a.morefacets")
      .bind('click',function(event)
            {

              var c = getFacetClass(this);
              var myclass= "dd." +c;
              $(myclass).css("display","block").css("visibility","visible");
              // need to hide more button and show fewer button

              var moreSelector="a.morefacets." + c;
              $(moreSelector).hide();

              var lessSelector="a.lessfacets." + c;
              $(lessSelector).show();
              event.preventDefault();
            }
            );

    $("a.lessfacets")
      .bind('click',function(event)
            {

              var c = getFacetClass(this);
              // we want to hide only the
              // 1) facets in this group
              // 2) that also belong to the class hidefacet
              var myclass= "dd." +c +'.hidefacet';
              $(myclass).hide();
              var moreSelector="a.morefacets." + c;
              $(moreSelector).show();

              var lessSelector="a.lessfacets." + c;
              $(lessSelector).hide();

              event.preventDefault();
            }
            );

    $(".query-summary").on('click', '.query-item', function(e) {
      var $a = $(this).find("a");
      if ( $a.size() ) {
        var href = $a.attr('href');
        window.location.href = href;
      }
    });

  $(".form-download-metadata").on('submit', function(e) {
    // e.preventDefault();
    var $form = $(this);
    var $btn = $form.find(".btn-group").css({ opacity: 0.4 });
    $btn.find("button").attr("disabled", "disabled");
    var $progress = $form.find("[data-role=progress]").addClass("active");

    var collid = (location.search.match(/coll_id=(\d+)/))[1];
    var cookieName = "download" + collid;

    var downloadTimeout;
    var checkDownloadCookie = function() {
      if ( $.cookie(cookieName, undefined, { json: false }) == 1 ) {
        // $.cookie('downloadStarted', "false");
        $.cookie(cookieName, '', { json: false, expires: -1, path: '/' });
        $progress.removeClass('active');
        $btn.css({ opacity: 1.0 }).find("button").attr('disabled', null);
      } else {
        downloadTimeout = setTimeout(checkDownloadCookie, 1000);
      }
    }

    $.cookie(cookieName, 0, { path: '/' });
    setTimeout(checkDownloadCookie, 1000);
  });

});

function getFacetClass(selected)
{

              var ary=$(selected).attr("class").split(" ");
              // need only one that isn't morefacets or lessfacets
              // for now rely on order so morefacets =1
              var c=ary[0];
              return c;
}


