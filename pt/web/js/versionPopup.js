$(document).ready(function() {
    if ( $("#versionIcon").length ) {

                var html = '<div class="accessBannerText"><span>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href="mailto:feedback@issues.hathitrust.org">Contact us</a> for more information.</span></div>';
	    	var valert = new Boxy(html, {
	            show : false,
	            modal : false,
	            draggable : true,
	            closeable : true,
                    closeText : "<span class='accessBannerCloseText'>close</span> <span class='accessBannerClose'>X</span></span>",
	            title : "About versions"
                });

      $('#versionIcon').click(function(e) {
        // placement near where the user clicked
          valert.moveTo(e.clientX+20, e.clientY-150);
          valert.show();
        // prevent the default action, e.g., following a link
        return false;
      });



//       var $dialog = $('<div></div>')
//         .html('This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <a href="mailto:feedback@issues.hathitrust.org">Contact us</a> for more information.')
//         .dialog({
//           autoOpen: false,
//           resizable: false,
//           title: 'About versions',
//           height: 140,
//           MaxHeight: 140
//         });
// 
//       $('#versionIcon').click(function(e) {
//         // placement near where the user clicked
//         $dialog.dialog("option", "position", [e.clientX+20, e.clientY-150]);
//         $dialog.dialog('open');
//         // prevent the default action, e.g., following a link
//         return false;
//       });
     }
});
