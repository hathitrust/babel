
function FormValidation( input, msg ) {
    var stripped = input.value;
    stripped = stripped.replace(/^\s*|\s*$/g, '');
    
    if ( stripped === "" ) {
        alert( msg );
        return false;
    }
    else {
        return true;
    }
}


function Bookmark( title, url ) {
    var otherBrowsers = "Copy & Paste the permanent url string to your bookmarks.";
    
    if ( document.all ) {
        window.external.AddFavorite( url, title );
    }
    else if ( window.sidebar ) {
        window.sidebar.addPanel( title, url, "");
    }
    else {
        alert( otherBrowsers );
    }
}

function ToggleCitationSize( ) {
    var me = document.getElementById( "mdpFlexible_1" );
    var me_text = document.getElementById( "mdpFlexible_1_1" );
    
    // alert( me.style.display );    
    if ( me.style.display == "none" ||  me.style.display == "" ) {
        /* state is collapsed */
        me.style.display = "block";
        me_text.firstChild.nodeValue = "\u00AB less";
        
    }
    else {
        /* state is expanded */
        me.style.display = "none"
        me_text.firstChild.nodeValue = "more \u00BB";
    }
}

function getElementsByClassName( searchClass, node, tag ) {
    var i; 
    var j;
    var classElements = new Array();
    if ( node == null )
        node = document;
    if ( tag == null )
        tag = '*';
    var els = node.getElementsByTagName(tag);
    var elsLen = els.length;
    var pattern = new RegExp('(^|\\s)'+searchClass+'(\\s|$)');
    for (i = 0, j = 0; i < elsLen; i++) {
        if ( pattern.test(els[i].className) ) {
            classElements[j] = els[i];
            j++;
        }
    }
    return classElements;
}

function ToggleContentListSize( ) {
    var toggleCtrl = document.getElementById( "mdpFlexible_3_2" );
    var disp;
    var pad;
    
    if ( ! toggleCtrl ) {
        return;
    }
    
    if ( toggleCtrl.firstChild.nodeValue.indexOf( "less" ) > 0 ) {
        /* state is expanded */
        disp = "none";
        pad = "5pt";
        toggleCtrl.firstChild.nodeValue = "more \u00BB";
        
    }
    else {
        /* state is collapsed */
        disp = "";
        pad = "0pt";
        toggleCtrl.firstChild.nodeValue = "\u00AB less";
    }
    
    var rows = getElementsByClassName( "mdpFlexible_3_1", document, "TR" );
    var numbers = getElementsByClassName( "mdpContentsPageNumber", document, "TD" );
    var i;
    for ( i=0; i < rows.length; i++ ) {
        rows[i].style.display = disp;  
    }
    for ( i=0; i < numbers.length; i++ ) {
        numbers[i].style.paddingRight = pad;  
    }
    for ( i=0; i < rows.length; i++ ) {
        rows[i].style.display = disp;  
    }
}


function ClickClear( thisfield, defaulttext ) {
    if ( thisfield.value == defaulttext ) {
        thisfield.value = "";
    }
}

