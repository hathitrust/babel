//Script: section108.js

YAHOO.namespace("mbooks");

function getHelpContent() {
    var pubCollsLink = location.href.substring(0,location.href.lastIndexOf('/')) + "/mb?a=listcs;colltype=pub";
    var content =  
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
        
    "<p>&nbsp;</p><p align='right'><a href='' id='closeHelp'><b>Close</b></a></p>";	
    return content;
} 

function initHelpWidget() {
    var browser = navigator.appName;
    
    if (browser == "Microsoft Internet Explorer") { 
        //Make non-modal for IE 
	YAHOO.mbooks.helpWidget = new YAHOO.widget.Panel("helpWidget", { width:'750px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false} );
    }
    else {		
	YAHOO.mbooks.helpWidget = new YAHOO.widget.Panel("helpWidget", { width:'750px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true} );
    }
    
    YAHOO.mbooks.helpWidget.setHeader("Section 108");
    YAHOO.mbooks.helpWidget.setBody("");
    YAHOO.mbooks.helpWidget.render(document.body);	
    
}

var displayHelpWidget = function(e) {
    YAHOO.util.Event.preventDefault(e);	
    YAHOO.mbooks.helpWidget.setBody(getHelpContent());
    
    YAHOO.util.Event.addListener("closeHelp", "click", closeHelpWidget);	
    YAHOO.mbooks.helpWidget.show();
}

var closeHelpWidget = function(e) {		
    YAHOO.util.Event.preventDefault(e);
    YAHOO.mbooks.helpWidget.hide();	
}

YAHOO.util.Event.addListener(window, "load", initHelpWidget);

YAHOO.util.Event.addListener("section108", "click", displayHelpWidget);

//End section108.js
