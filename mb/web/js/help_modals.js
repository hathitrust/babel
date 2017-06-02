head.ready(function() {

    $(".form-download-metadata a.download-help-link").click(function(e) {
        e.preventDefault();
        var html = '<p>You can download certain information about the items in this collection as a text file.';
        html += "\n" + 'You can choose one of these formats of the file:' + "\n" + '<ul>';
        html += "\n" + '<li>Item metadata: tab-delimited text (TSV)</li>';
        html += "\n" + '<li>Item + collection metadata as linked data (JSON)</li>';
        html += '</ul>';
        html += '<p><img src="/mb/mb_download_menu.png" /></p>';
        html += "\n" + '<p>In both formats, the file ​will contain a few fields about each item in the collection, including title, author, date, rights, and important identifiers. The JSON file will also contain a few fields about the collection, including collection title, number of items, owner, identifier, and description.</p>';
        html += "\n" + '<p>JSON downloads can be imported for analysis into the <a href="https://analytics.hathitrust.org">HathiTrust Research Center</a>.</p>';
        html += "\n" + '<p><a target="_blank" href="https://www.hathitrust.org/help_digital_library#CBDownload">More Information</a></p>';
        bootbox.alert(html);
    });

});

