//Script: overlayUtils.js

function clickclear(thisfield, defaulttext) {
    if (thisfield.value == defaulttext) {
        thisfield.value = "";
    }
}

function clickrecall(thisfield, defaulttext) {  
    if (thisfield.value == "") {
        thisfield.value = defaulttext;
    }
}

//Javascript function below adapted from http://snipplr.com/view/463/get-url-params-2-methods/ 
function getURLParam(strParamName, strHref) {
    var strReturn = "";
    var link ="";
    if (strHref !== null) {
	link = strHref;
    }
    
    if ( link.indexOf("?") > -1 ) {
	var strQueryString = link.substr(link.indexOf("?")).toLowerCase();
	var aQueryString;
	
	//If URL contains &, split on &. If not, assume ;
	//This is here to catch the two types of URLs in MBooks
	//The prev, next buttons use ;
	//The page number form for image and ocr view uses &
	if (strHref.indexOf("&") > -1) { 
	    aQueryString = strQueryString.split("&");
	}
	else {
	    aQueryString = strQueryString.split(";");
	}
        
	for ( var iParam = 0; iParam < aQueryString.length; iParam++ ) {			
	    if (aQueryString[iParam].indexOf(strParamName + "=") > -1 ) {
		var aParam = aQueryString[iParam].split("=");
		strReturn = aParam[1];
		break;
	    }
	}
    }
    
    return strReturn;
}


//Strip xml PI <?xml ...?> from input string
function stripXMLPI(inputText) {
    var returnText = inputText.replace(/<\?xml.*\?>/, "");
    return returnText;
}

function trimString (str) {
    return str.replace(/^\s+/g, '').replace(/\s+$/g, '');
}

//end of overlayUtils.js
