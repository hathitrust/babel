
head.ready(function() {

  var API_URL = ( window.location.protocol == 'https:' ? "https://encrypted.google.com" : "http://books.google.com" ) + "/books?callback=?";
  var THUMBNAIL_SIZE = 60;

  $("[data-bookid]").each(function() {
    var $div = $(this);
    var book_id = $div.data('bookid');
    $.getJSON(API_URL, {
      jscmd : 'viewapi',
      bibkeys : book_id
    }, function(gdata) {
      if ( gdata.length == 0 ) {
        var $img = $('<img class="bookCover" aria-hidden="true" alt=""/>')
        $img.attr("src", "/common/unicorn/img/nocover-thumbnail.png");
        $div.append($img);
      }
      var google_link = selectGoogleLink(gdata, 1, 1 );
      if ( google_link.thumbnail_url ) {
        var $img = $('<img class="bookCover" aria-hidden="true" alt=""/>')
        $img.load(function() {
          $img = jQuery(this);
          owidth = $img.attr('width');
          if (owidth > THUMBNAIL_SIZE) {
            $img.attr('width', THUMBNAIL_SIZE);
            $img.attr('height', $img.attr('height') * (THUMBNAIL_SIZE/owidth));
          }
          $div.append($img);
        }).attr('src', google_link.thumbnail_url);
      } else {
        var $img = $('<img class="bookCover" aria-hidden="true" alt=""/>')
        $img.attr("src", "/cgi/imgsrv/cover?id=" + $div.data('barcode'));
        if ( window.location.href.indexOf("debug=covers") > -1 ) {
          $div.addClass("localCover");
        }

        // $img.attr("src", "/common/unicorn/img/nocover-thumbnail.png");
        $div.append($img);
      }
    })
  })
})


function getGoogleBookInfo(link_nums, record_num, record_counter)
{
  var google_id = '';
  var oclc = '';
  var lccn = '';
  var id = '';
  if (link_nums.length > 0 ) {
    // call the google api with the collected link numbers
    //alert(link_nums);
    var api_url ="//books.google.com/books?jscmd=viewapi&bibkeys=" + link_nums + "&callback=?";
    //alert("calling script: " + api_url);
    jQuery.getJSON(api_url,
      function(gdata) {
        if (gdata.length == 0) return;
        // process the data returned from the google api
        var thumbnailImg = '';
        googleLink = selectGoogleLink(gdata, record_num, record_counter);
        if ( googleLink.searchNum ) {
          jQuery('#ELEC_holdings').append('<tr><th></th><td style="width: 50%;"></td><td>' + googleLink.link + '</td></tr>');
          jQuery('#dummyElec').show();
          // deal with elec copy on results page
          if (jQuery('#ELEC_'+ record_num).length ) {   // replace link
            //alert("replace elec copy for record num" + record_num);
            jQuery('#ELEC_' + record_num).replaceWith('<tr><td class="holdingLocation">Electronic Resources</td><td><a href="/Record/' + record_num + '/Holdings#holdings">See Holdings</a></td>');
          } else {  // add a row
            //alert("add elec copy for record num" + record_num);
            jQuery('#holdings' + record_num).append('<tr><td class="holdingLocation">Electronic Resources</td><td>' + googleLink.link + '</td></tr>');
          }
        }
        // if (googleLink.thumbnailImg) {
        //   jQuery("#GoogleCover_" + record_num).html(googleLink.thumbnailImg);
        //   jQuery("#GoogleCover_" + record_num).show();
        // }
        if (googleLink.thumbnail_url) {
          img = jQuery('<img class="bookCover" aria-hidden="true" alt="">');
          img.load(function() {
            img = jQuery(this);
            owidth = img.attr('width');
            if (owidth > 75) {
              img.attr('width', 75);
              img.attr('height', img.attr('height') * (75/owidth));
            }
            jQuery("#GoogleCover_" + record_num).empty().append(img).show();
          }).attr('src', googleLink.thumbnail_url);
        }
      }
    );          // end of callback
  }
}

function getViewRank(preview) {
  if (preview == 'noview') return 0;            // test--could be snippet, but no way to tell
  if (preview == 'partial') return 2;
  if (preview == 'full') return 3;
  return 0;
}

function selectGoogleLink(gdata, record_num, record_counter) {
  var selectLink = [];
  selectLink["thumbnailImg"] = '';
  selectLink["link"] = '';
  selectLink["searchNum"] = '';
  var currRank = 0;
  // loop through gdata--get thumbnail_url, and extract view info for ranking
  for (num in gdata) {
    var rank = getViewRank(gdata[num].preview);
    if (gdata[num].thumbnail_url) {
      selectLink.thumbnailImg = '<img alt="Cover Image" src="' + gdata[num].thumbnail_url + '">';
      selectLink.thumbnail_url = gdata[num].thumbnail_url;
    }
    if (rank > currRank) {
      if (gdata[num].thumbnail_url) selectLink.thumbnailImg = '<img alt="Cover Image" src="' + gdata[num].thumbnail_url + '">';
      currRank = rank;
      viewInfo = translateGooglePreview(gdata[num].preview);
      selectLink.link =
        '<a class="clickpostlog" ref="googlebook|' + record_num + '|google|' + record_counter + '" href="' + gdata[num].preview_url + '" target="fulltext">' +
        'Google Online (' + viewInfo + ')' + '</a>';
      selectLink.searchNum = num;
    }
  }
  return selectLink;
}

function translateGooglePreview(preview) {
  if (preview == 'full') return('Available Online');
  if (preview == 'noview') return('Snippet View');
  if (preview == 'partial') return('Limited View');
  return(preview);
}

