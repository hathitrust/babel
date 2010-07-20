//Script: pdfSelector.js

YAHOO.namespace("mbooks");

var pgCount = 10;
var currentPg;
var startPage;
var endPage;         
var singlePdfUrl;
var multiPdfUrl;
var seqNo;
var itemId;
var u;
var size;
var ssd;
var changedStartPg = 0;

function calcEndPage() 
{
	var pdfForm = document.getElementById("pdfForm");
	endPage = pdfForm.endpg.value;
	startPage = pdfForm.startpg.value; 
	
	if (startPage == "Current" || isNaN(startPage)) 
	{
		var diff = pgCount - 1;	
		pdfForm.endpg.value = "+ " + diff;
	}
	else 
	{
		pdfForm.endpg.value = parseInt(startPage) + pgCount - 1;
	}
	
	changedStartPg = 1;
}

function enablePageRange() 
{	
	document.getElementById("startpg").disabled=false;
} 

function disablePageRange()
{
	document.getElementById("startpg").disabled=true;
}

function getPDFFormHTML() 
{
	//Capture the variables from the original single pdf url
	//These will be used to construct the URL for the multi-page pdf 
	currentPg = getURLParam('num', singlePdfUrl); 	
	
	var diff = pgCount - 1;
	if(currentPg == "root" || currentPg == "") 
	{
		currentPage = "Current";
		endPage = "+ " + diff;
	}
	else if(isNaN(currentPg)) 
	{
		currentPage = currentPg; 
		endPage = "+ " + diff;
	}
	else 
	{
		currentPage = parseInt(currentPg);
		endPage = currentPage + diff;
	}
	var html = "<div align='left'><form id='pdfForm'><input type='radio' id='pdfType1' name='pdfType' value='single' checked='checked' onclick='disablePageRange()'>Current page</input><br>" + 			 
			"<input type='radio' id='pdfType2' name='pdfType' value='pgcount' onclick='enablePageRange()'>10 pages at a time</input><br>" +
			"<div id='pageRange' style='padding-top: 5px'><table><tr><td width='50'>&nbsp;</td>" +
			"<td><div style='padding-bottom: 10px'>Start Page:<br/></div> <input name='startpg' id='startpg' size='7' maxChars='7' value='"+ currentPage + "' onclick=\"clickclear(this, 'Current')\" onfocus=\"clickclear(this, 'Current')\" onblur=\"clickrecall(this,'Current')\" onKeyUp=\"calcEndPage()\" disabled='true'/></td>" +
			"<td><div style='padding-bottom: 10px'>End Page:<br></div> <input name='endpg' id='endpg' size='4' maxChars='4' value='"+ endPage + "' disabled='true'/></td>" + 
			"</td></tr></table></div>" +
			"<br><button id='loadPDFbutton' type='submit'>View PDF</button></form>" +
			"<br><div id='badStartPg'>Invalid start page</div>" + 
			"</div>";
	return html;
} 

function initPDFView() 
{
	//Populate the overlay with the HTML generated from the XSL stylesheet
	//KL: Note: In order to get the widget to appear above the pdf view in IE, I had to set the iframe property to true.  
	var view = getURLParam('view', location.href);
	
	if(view =="pdf") 
	{
		YAHOO.mbooks.pdfSelector = new YAHOO.widget.Panel("pdfWidget", { width:'250px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false, iframe: true} );
	}
	else 
	{
		YAHOO.mbooks.pdfSelector = new YAHOO.widget.Panel("pdfWidget", { width:'250px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true} );
	}
	
	YAHOO.mbooks.pdfSelector.setHeader("Select PDF View");
	YAHOO.mbooks.pdfSelector.setBody("");
	YAHOO.mbooks.pdfSelector.render(document.body);	
}

var displayPDFForm = function(e) 
{	
	YAHOO.util.Event.preventDefault(e);
	initPDFView();
	singlePdfUrl = document.getElementById('selectPdf').href;
	YAHOO.mbooks.pdfSelector.setBody(getPDFFormHTML());
	YAHOO.mbooks.pdfSelector.show();
	
	YAHOO.mbooks.pdfPageRange = new YAHOO.widget.Module("pageRange", { visible: true });
	YAHOO.mbooks.pdfPageRange.render();
	
	YAHOO.mbooks.pdfBadStartPg = new YAHOO.widget.Module("badStartPg", { visible: false });
	YAHOO.mbooks.pdfBadStartPg.render();
	
	//Add listener to form submit: This will cover when the form is submitted by click or by the enter key in Safari
	YAHOO.util.Event.addListener("pdfForm", "submit", interceptPDFSubmit);
}

function hideErrorMessages() 
{
	YAHOO.mbooks.pdfBadStartPg.hide();
}

var interceptPDFSubmit = function(e) 
{
	YAHOO.util.Event.preventDefault(e);
	hideErrorMessages();
	var pdfForm = document.getElementById("pdfForm");
	var type;
	
	for (var i=0; i < pdfForm.pdfType.length; i++)
	{
		if (pdfForm.pdfType[i].checked)
		{
			type =pdfForm.pdfType[i].value;
		}
	}
	
	var startPg = pdfForm.startpg.value;
	
	if(type=='single') 
	{		
		//Use original url
		location.replace(singlePdfUrl);				
	}
	else 
	{		
		if (startPg < 0)
		{
			YAHOO.mbooks.pdfBadStartPg.show();	
		}
		else if (startPg.length <= 0) 
		{
			YAHOO.mbooks.pdfBadStartPg.show();
		}
		else 
		{			
			YAHOO.mbooks.pdfBadStartPg.hide();
			
			singlePdfUrl = (document.getElementById('selectPdf')).href;
			seqNo =  getURLParam('seq', singlePdfUrl);			
			itemId =  getURLParam('id', singlePdfUrl);
			size = getURLParam('size', singlePdfUrl);
			u = getURLParam('u', singlePdfUrl);
			ssd = getURLParam('ssd', singlePdfUrl);
			
			//If single pdf URL starts with https (for SSD users), multipage pdf must too
			var prefix;
			if(singlePdfUrl.indexOf("https") >= 0) 
			{
				prefix = "https://";
			}
			else 
			{
				prefix = "http://";
			}
			
			if(startPg == "Current" || changedStartPg ==0) 				
			{
				//Add debug=all as a param if you want to debug
				//the multipage pdf								 				
				multiPdfUrl = prefix + location.hostname + "/cgi/m/mdp/pt?view=pdf;size=" + size + ";id=" + itemId + ";u=" + u + ";seq=" + seqNo + ";num=" + startPg + ";pgcount=10;";
			}
			else 
			{
				//Add debug=all as a param if you want to debug 
				//the multipage pdf
				multiPdfUrl = prefix + location.hostname + "/cgi/m/mdp/pt?view=pdf;size=" + size + ";id=" + itemId + ";u=" + 1 + ";seq=" + seqNo + ";num=" + startPg + ";pgcount=10;";
			}
			
			if(ssd=="1") 
			{
				multiPdfUrl = multiPdfUrl + ";ssd=1"	
			}
			
			YAHOO.mbooks.pdfSelector.hide();
			
			//alert(multiPdfUrl);
			window.open(multiPdfUrl);			
		}
	}
}

//Listener to open widget - one for icon and one for text

// Commented out to remove light box to select range. As of Mon Sep 14
// 11:57:00 2009 we offer only 1 page pdf.  When Shib is supported
// we'll expand that to either 1 or 'all'.

//YAHOO.util.Event.addListener("selectPdf", "click", displayPDFForm); 
//YAHOO.util.Event.addListener("pdfLink", "click", displayPDFForm); 

//End of pdfSelector.js
