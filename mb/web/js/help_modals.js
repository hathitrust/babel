head.ready(function() {

    $(".form-download-metadata a.download-help-link").click(function(e) {
        e.preventDefault();
        bootbox.alert('<p>You can download certain information about the items in this collection.<br /><p><a target="_blank" href="https://www.hathitrust.org/help_digital_library#CBDownload">More Information</a></p><p><img src="/mb/mb_download_menu.png" /></p><p>JSON downloads can be imported for analysis into the <a href="https://analytics.hathitrust.org">HathiTrust Research Center</a>.</p>');
    });

});

