alert("this is ls_advanced.js edited");
/**
1) remove all parameters for any rows with a blank query box   DONE
2) do we want to bother renumbering them?                    yes DONE
3) change the language and format multiselect queries to OR queries facet=language:(English OR French)
4) handle basic validation, i.e. if there is nothing in any query box
This may be a problem because the YUI library is already doing this.
Can we not includ YUI library or do we need it for cb functionality?
Look at concatenate script with Rogers rewrite.
Need to be able to exclude a javascript call? or rename form?
**/

// process stuff and then submit

$(function()
  {

    // hide extra yop boxes
    $(".yop").val('').hide();
    // show yop-start
    $('#yop-start').show().val("");


    var rows= new Array();
    $('#advanced_searchform').submit(function(event) 
            {

              //              rewriteOrFacets();  //doesn't work can do at perl end or fix jquery
              // check that at least one querybox has text in it
               var queryExists = checkForQuery();
               
               if (queryExists === true)
               {
                 var validOrBlankPdate=checkPdate();
                 if (validOrBlankPdate === false)
                 {

                 }
                 else
                 {
                   //              rows = removeAndConsolidateBlankRows(rows);
                   rows = removeBlankRows(rows);
                   redirect(rows);
                 }
               }
               event.preventDefault();
            }
                                     );
  }
  );

//--------------------------------------------------------------------------------------
function checkPdate()
{
  var isValid=true;
  // get any non blank pdate param and check that it is \d+ (allow 0-9999as a date since we have some cataloged at 494 and 9999)
  // 
  /***
      TODO:
1) limit to numbers up to 9999
2) make sure start date is less than end date
   ***/
  
  var pdates = $(":input.yop");

  $(pdates).each (function (index,element)
                   {
                     var value=$(element).val();
                     
                     if ( ( value.match(/^\s*\d+\s*$/))|| (value === "") )
                     {
                       // its ok if its blank or a number
                     }
                     else{
                       alert("You must enter a number from 0 to 9999 for the publication date");
                       isValid = false;
                       return isValid;
                     }
                   });
  if (isValid === true){

    var startDate = $("#yop-start").val();
    var endDate= $("#yop-end").val();
    // replace blank date with minimum/maximum for testing
    if (startDate === "")
    {
      startDate=0;
    }
    if (endDate === "")
    {
      endDate=10000;
    }
    if ( startDate  > endDate  )
    {
      alert("start date must be less than end date");
      return false;
    }
    
  }  
  return isValid;
}
  
  //--------------------------------------------------------------------------------------
function checkForQuery()
{
  var queryExists=false;
  var queries = $(":input.querybox");
  $(queries).each (function (index,element)
                   {
                     var value=$(element).val();
                     if (value !== "")
                     {
                       queryExists=true;
                     }
                   }
                   );
  if (queryExists === false)
  {
    // alert for now.  Change to nicer styled message written to div like other error messages
    alert("you must enter a query");
  }
  return queryExists;
}


function rewriteOrFacets()
{
 
  var str="";
  //   var orstuff=$("select.orFacet option:selected");

  var orstuff=$("select.orFacet");
  
  $(orstuff).each(function(index,element)
                  {
                    var clause="";
                    var facetName = $(this).attr('name');
                    var selected = $(this).find("option:selected");
                    $(selected).each(function()
                                     {
                                       var facetValue = $(this).val();
                                       clause += facetValue + " OR "; 
                                     }
                                     );
                    clause=clause.replace(/OR$/,"");
                    str+='(' + clause + ') AND (' ;                                     
                  }
  
                  );
  str=str.replace(/\'\)\s+AND\s+\($/,"");
  alert("str is " + str);

  /**
  var facetOp=$("#facet_lang");
  
  var langstuff= $(facetOp).filter(orstuff);
  
  $(langstuff).each(function(index)
                    {
                      var facet=$(this).val();
                      
                      str += $(this).text() + " OR ";
                    }  
                    );
  
  alert(str +"\n");
  
  **/  
                           

}


/**

 write a removeBlankRows function that only removes the blank rows and does no renumbering
 so possibly leaving only a q2 and q4
 Also  remove the operator preceding the first row that has a query in it
 **/

function removeBlankRows(rows)
{ 
  var count=0;
  $(':input.querybox').each(function(index)
                            {
                              var rownum=index+1
                              var query=$(this).val();
                               if (query ==="")
                               {
                                 //alert ("no query for q number " + qnum );
                               }
                               else
                               {
                                 count++;
                                 rows[index]=getRow(rownum,count)
                               }
                            });
  return rows;
}


function getRow(qnum,count)
{
  var row="";

  var OpID="#op" + qnum;
  var OpValue= $(OpID).val();

  var FieldID="#field" + qnum;
  var FieldValue= $(FieldID).val();

  var QueryID = "#q" + qnum; 
  var QueryValue= $(QueryID).val();
  
  var AnyAllId ="#anyall" + qnum;
  var AnyAllValue= $(AnyAllId).val();

  // no op for first query in set
  var OpClause="";
  if(count !== 1)
  {
    OpClause= "op" + qnum + "=" +OpValue + "&";
  }
  row = row+ OpClause + "anyall" + qnum + "=" + AnyAllValue + '&' +"field" + qnum + "=" + FieldValue + "&" + "q" +qnum +"=" +QueryValue ;
  return row;
}


/**
 function removeAndConsolidateBlankRows(rows)
 This will consolidate rows and move them starting with moving the first non-blank row to q1
**/

function removeAndConsolidateBlankRows(rows)
{ 
  var count=0;
  $(':input.querybox').each(function(index)
                             {
                               var qnum=index+1;
                               var query=$(this).val();
                               if (query ==="")
                               {
                                 //alert ("no query for q number " + qnum );
                               }
                               else{
                                 //XXX redo this so we don't have to rewrite the query if it doesn't need it
                                 count++; 
                                 if (qnum !== count){
                                   //  alert("q number " + qnum +" has query " + query + " rewrite to q " +count );
                                   rows[count]=rewriteQuery(query,qnum,count);
                                 }
                                 else
                                 {
                                   //XXX redo this so we don't have to rewrite the query if it doesn't need it
                                   //alert("dontRewriteQuery");
                                   rows[count]=rewriteQuery(query,qnum,count);
                                 }
                               }
                                 
                             });
  return rows;
}



// rewrite query from query number qnum to query number toNum
function rewriteQuery(query,qnum,toNum)
{
  var row="";
    //op
  // if this is the first row there is no op so must remove it
  // XXX add logic
  var newOp = "op" + toNum; 
  var oldOpID="#op" + qnum;
  var newOpValue= $(oldOpID).val();
  //field
  var newField = "field" + toNum; 
  var oldFieldID="#field" + qnum;
  var newFieldValue= $(oldFieldID).val();

  //query

  var newQuery = "q" + toNum; 
  var newQueryValue= query;
  var OpClause="";
  if(toNum >1)
  {
    OpClause=newOp + "=" +newOpValue + "&";
  }
  row = row+ OpClause + newField + "=" + newFieldValue + "&" + newQuery +"=" +newQueryValue;
  return row;
}




// create new query with modified rows
//http://tburtonw-full.babel.hathitrust.org/cgi/ls?
//a=srchls&a=srchls
//&field1=ocronly&q1=art&op2=AND&field2=title&q2=history&op3=AND&field3=author&q3=&op4=AND&field4=subject&q4=
//&facet stuf maybe

function redirect(rows)
{
  // get serialized form object, i.e. suitable for url

  var formValues= ($("#advanced_searchform").serialize());
  var rest= replaceRows(formValues,rows)
    // removeRows
  var host=window.location.host;
  var path=window.location.pathname;
  var URL= host + path +"?" +rest;

  alert ("url would be " + URL);
  //  window.location.(URL);
  var href='http://' +URL;
  location.href=href;
}





function replaceRows(formValues,rows)
{
  var newURLString="";

  var newParms= new Array();
  var pairs=formValues.split(/\&/);
  for (var i=0; i < pairs.length; i++)
  {
      var keyvalue = pairs[i].split(/\=/);
      var key = keyvalue[0];
      var value = keyvalue[1];
      // convert from perl to js regex
      if (key.match(/(op|anyall|field|q)[1-4]/)) 
      {
        //skipit
      }
      else
      {
        //add to output
        newURLString=newURLString + pairs[i] +"&";
      }
  }
  for (var j=0; j < rows.length; j++)
  {
    if ( (rows[j]))
    {
      var URLrow="&" + rows[j];
      newURLString=newURLString+URLrow;
    }
  }
  //get rid of any double ampersands
  newURLString=newURLString.replace(/&&/g,"&");

  return newURLString;
}


//------------copied from Bill/Jeremy catalog code
// why is yop hard coded in the hide and nowhere else?

function changeRange(id) 
{
      sel = $('#' + id);
      name = sel.attr('name');
      val = sel.val();
      $(".yop").val('').hide();
      if (val == 'before') {
        $('#' + name + '-end').val('').show().val("");
      }
      if (val == 'after') {
        $('#' + name + '-start').show().val("");
      }
      
      if (val == 'between') {
        $('#' + name + '-start').show().val("");
        $('#' + name + '-between').show();
        $('#' + name + '-end').show().val("");
      }
      
      if (val == 'in') {
       $('#' + name + '-in').show().val(''); 
      }
      
}

