$(document).ready(function() {
    var $dialog = $('<div></div>')
	.html('This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <a href="mailto:feedback@issues.hathitrust.org">Contact us</a> for more information.')
	.dialog({
	    autoOpen: false,
            resizable: false,
            title: 'About versions',
            height: 140,
            MaxHeight: 140
	});

    $('#versionIcon').click(function(e) {
        // placement near where the user clicked
        $dialog.dialog("option", "position", [e.clientX+20, e.clientY-150]);
	$dialog.dialog('open');
	// prevent the default action, e.g., following a link
	return false;
    });
});
