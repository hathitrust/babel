//Script: section108.js PROBABLY OBSOLETE

function getHelpContent() {
    var pubCollsLink = location.href.substring(0,location.href.lastIndexOf('/')) + "/mb?a=listcs;colltype=pub";
    var content = 
    "<div class='section108panel'>" + 
 "<p>Section 108 of United States copyright law allows full view access to this item in limited circumstances (listed below).    In all other cases, access will be search only.</p>" +
 "<ul><li>Full view is available to authenticated University of Michigan users (limited to one user at a time).</li>" +
 "<li>Full view is available from public in-library workstations in the following UM libraries:" +
 "<ul><li><a href=\"http://www.lib.umich.edu/art-architecture-engineering-library\">Art, Architecture, and Engineering Library</a></li>" + 
 "<li><a href=\"http://www.lib.umich.edu/buhr-remote-shelving-facility\">Buhr Remote Shelving Facility</a></li>" + 
 "<li><a href=\"http://www.lib.umich.edu/hatcher-graduate-library\">Hatcher Graduate Library</a></li>" + 
 "<li><a href=\"http://www.lib.umich.edu/health-sciences-libraries\">Health Sciences Libraries</a></li>" +
 "<li><a href=\"http://www.lib.umich.edu/music-library\">Music Library</a></li>" + 
 "<li><a href=\"http://www.lib.umich.edu/shapiro-undergraduate-library\">Shapiro Undergraduate Library</a></li>" +
 "<li><a href=\"http://www.lib.umich.edu/shapiro-science-library\">Shapiro Science Library</a></li></ul></li></ul>" +
 "<p>Notice Concerning Copyright Restrictions:  Access to this digital reproduction is governed by the copyright law of the United States [Title 17, United States Code].  Libraries and archives are authorized to provide access to a digitized reproduction under certain conditions.  No further reproduction and distribution of this digitized material is permitted by transmission or any other means. A user who reproduces or transmits this material may be liable for copyright infringement.</p>" + 
        "</div>" +
        
    "<p>&nbsp;</p><p align='right'><a href='' class='closeHelp' id='closeHelp'><b>Close</b></a></p>";    
    return content;
} 

function displayHelpWidget(e) {
    var dialog = new Boxy(getHelpContent(), {
        show : false,
        modal: true,
        draggable : false,
        closeable : false,
        title : "Section 108",
        unloadOnHide: true
    });
    dialog.getContent().find(".closeHelp").click(function(e) {
        e.preventDefault();
        dialog.hide();
        return false;
    });
    dialog.show();
}

$(document).ready(function() {
    $("#ic-access").click(function(e) {
        displayHelpWidget(e);
        return false;
    })
});

//End section108.js
