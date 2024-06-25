//alert("this is ls_advanced.js edited");
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


//$(function() replace with head.ready to use unicorn framework

head.ready(function()
  {

  if ($.browser.msie && $.browser.version < 8)
  {
    //    alert("IE xxxx detected version prior to IE8");
    $("#advanced_searchform").css('visibility','visible');

    /**  Generic code
         $(".tablecell").wrap("<td />");
         $(".tablerow").wrap("<tr />");
         $(".table").wrapInner("<table />");
**/
    // we need to replace the div.IEcell with a td not wrap it
    //     $(".IEcell").wrap('<td class="IEtd"/>');
    // need to copy group number
    $(".IEcell.parenRight.parenGroup1").replaceWith('<td class="IEtd paren parenGroup1">)</td>');
    $(".IEcell.parenLeft.parenGroup1").replaceWith('<td class="IEtd paren  parenGroup1">(</td>');

    $(".IEcell.parenRight").replaceWith('<td class="IEtd paren">)</td>');
    $(".IEcell.parenLeft").replaceWith('<td class="IEtd paren">(</td>');
    // ok to wrap the group div in the middle
    $(".IEmiddleCell").wrap('<td class="IEtd"/>');
    $(".IErow").wrap('<tr class="IEtr"/>');
    $(".parenGroup").wrapInner('<table class="IEtable" />');

  }

  //hide first paren group until we have two sets of rows
  // jquery hide does both display:hidden and visibility:invisible
   
  //$(".parenGroup1").hide();

    showHidePdates();

    
    if($('#q3').val() == "" && $('#q4').val() == "")
    {
      $(".parenGroup1").css('visibility','hidden');
      hideGroup2();
      $('#removeGroup').hide();
    }
    else
    {
      $('#addGroup').hide();
      // make 
    }
    $('#addGroup').click(function(event) 
                     {
                       showGroup2();
                       //                         $(".parenGroup1").show();
                       $(".parenGroup1").css('visibility','visible');
                       $('#removeGroup').show();
                       $('#addGroup').hide();
                       event.preventDefault();
                     }
                     );

    $('#removeGroup').click(function(event) 
                     {
                       // remove any q3/q4 since we are "removing the group"
                       $("#q3").val("");
                       $("#q4").val("");
                       hideGroup2();
                       
                       //                       $(".parenGroup1").hide();
                       $(".parenGroup1").css('visibility','hidden');
                       $('#removeGroup').hide();
                       $('#addGroup').show();
                       event.preventDefault();
                     }
                     );


    $('#reset').click(function(event) 
                      {
                        /**
                           overide default reset button to actually clear values
                           XXX WARNING!!  We hard-code the defaults here so if 
                           defaults change in the config files/perl
                           these will need to be redone!
                        **/
                        doReset(event);
                        event.preventDefault();
                      }
                      );
    

    $('#advanced_searchform').submit(function(event) 
            {
              
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
                   var rowNums = new Array();
                   rowNums = getRowNums();
                   // this actually removes blank rows as well as changing the url
                   // XXX consider renaming it!
                   redirect(rowNums);
                 }
               }
               event.preventDefault();
            }
                                     );
  }
  );

//--------------------------------------------------------------------------------------
function doReset (event)
{ 
  //clear all text boxess
  var boxes=   $("#advanced_searchform").find("input:text");
  $(boxes).val("");
  
  // set formats to "All"
  var selectedOpt = $("#advanced_searchform").find(".orFacet :selected");
  selectedOpt.attr("selected", false);
  $(".orFacet [value='language008_full:All']").attr("selected", true);
  $(".orFacet [value='format:All']").attr("selected", true);
  
  //uncheck any check boxes
  $("#advanced_searchform").find("input:checked").attr("checked",false);
  
  // set search widgets back to defaults See warning above re hard-coding
  // unselect whatever is selected and then select
  $("#anyall1 option").attr("selected", false);
  $("#anyall1 option[value='all']").attr("selected", true);
  
  $("#anyall2 option").attr("selected", false);//default value=all
  $("#anyall2 option[value='all']").attr("selected", true);
  
  $("#op2 option").attr("selected", false); 
  $("#op2 option[value='AND'] ").attr("selected", true); 
    
  $("#field1 option").attr("selected", false);
  $("#field1 option[value='ocr']").attr("selected", true);
  
  $("#field2 option").attr("selected", false);
  $("#field2 option[value='title']").attr("selected", true);
  
  // yop
  $("#yop option").attr("selected", false);
  $("#yop option[value='after']").attr("selected", true);
  
  //hide yop-end box or 
    $("#yop-between").val("").hide();
    $("#yop-end").val("").hide();
  //show pdate_start box
    $("#yop-start").val("").show();
}
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
                       var Msg = 'You must enter a number from 0 to 9999 for the publication date';
                       showErrMsg(Msg,'yopErrMsg');
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
      var Msg = 'start date must be less than end date';
      showErrMsg(Msg,'yopErrMsg');
      return false;
    }
    
  }  
  return isValid;
}
  
  //--------------------------------------------------------------------------------------
function checkForQuery()
{
  var queryExists=false;
  var queries = $("#advanced_searchform").find(":input.querybox");
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
    var Msg = 'Please enter a search term.';
    showErrMsg(Msg,'submitErrMsg');
    showErrMsg(Msg,'queryErrMsg');
  }
  return queryExists;
}


function showErrMsg(Msg,id)
{
  var target= '#' + id;
  $("<div  class='alert-error alert' ></div>").html(Msg).appendTo(target);

}

//##################################################################
/**
   look for rows with blank query box
   return array with only the non-blank row numbers i.e.
   if q2 and q3 are the only non-blank query boxes return array:
   rowNum[0]=2
   rowNum[1]=3
 **/



function getRowNums()
{
  var rowNums = new Array();
  var count=0;
  $("#advanced_searchform").find(':input.querybox').each(function(index)
                            {
                              var rownum=index+1;
                              var query=$(this).val();
                               if (query ==="")
                               {
                                 //alert ("no query for q number " + qnum );
                               }
                               else
                               {
                                 rowNums[count]=rownum;
                                 count++;
                               }
                            });
  return rowNums
}



function redirect(rowNums)
{

  // create new form

  var newform = document.createElement("form");
  newform.id= "newform" ; // IE won't work with setAttribute

  //  Test length of url on only post if its longer than 2000 characters  (IE limit about 2048)
  // See:http://www.boutell.com/newfaq/misc/urllength.html
  var serialized= ($("#advanced_searchform").serialize());
  if (serialized.length > 2000)
  {
    newform.method="post";
  }
  // append to doc
  document.body.appendChild(newform);

  //copy input elements  
  $("#advanced_searchform").find(":input").each(function (index,element)
                   {
                     var value= $(element).val();
                     var name = $(element).attr('name');
                     
                     // code to only copy checked checkboxes
                     var type=$(element).attr('type');
                     if (type === "checkbox" )
                     {
                       var checked=$(element).attr('checked');
                       if ( checked)
                       {
                         addInput(name,value);
                       }
                     }
                     else
                     {
                       // remove blank rows

                       var result = name.match(/(op|anyall|field|q)([1-4])/);

                       if (result)
                       {
                         // remove blank rows
                         // if number is in rowNums (i.e. non-blank query) add this row

                         //hard-coded exception fof op3, because with boolean parens op3 is no longer tied to q3/row3
                         
                         if (name === "op3")
                         {
                           addInput(name,value);
                         }

                         var number=result[2];
                         var i=0;
                         for (i=0;i<=rowNums.length;i++)
                         {
                           
                           if ( number == rowNums[i])
                           {
                             addInput(name,value);
                           }
                         }
                       }
                       else
                       {
                         if (name.match(/(facet_lang|facet_format)/))
                         {
                           processMultiSelectFacet(name,value);
                         }
                         // this handles everything else
                         else
                         {
                           if (name == "srch")
                           {
                             //  alert("IE 7 trying to add srch=value" + name +" " + value);
                           }

                           else
                           {
                             addInput(name,value);
                           }
                         }
                       }
                     }
                                          
                   });
  
  // for debugging
  /**
     var formValues= ($("#newform").serialize());
     alert("newform=" + formValues);
  **/

  // submit form
  $("#newform").submit();
}

//----------------------------------------------------------------------

function processMultiSelectFacet(name,value)
{
  // remove the All facet because we only have it to indicate the default to the user.
  // test for value[0]= All
  // and scalar(value)> 1foobar
  
  if( (value[0] === "language008_full:All"|| value[0] === "format:All") && typeof value !== "string")
  {
    var newValues = new Array();
    var i=1;
    for (i=0;i< value.length-1;i++)
    {
      newValues[i]=value[i+1];
    }
    addInput(name,newValues);
  }
  else if( value[0] === "language008_full:All"|| value[0] === "format:All") 
  {
         // don't add if only the All is selected
  }
  else
  {
    addInput(name,value);
  }
                         }
//----------------------------------------------------------------------


// add a hidden input to the new form with given name and value
// do we want/need any other attributes?

function addInput(name,value)
{
  if (value === null || value === "")
  {
    return;
  }
  var val= value;
  var type = typeof value;
  //  alert (name +  "is type " +type);

  if (type === "string")
  {
      $('<input>').attr({
        type: 'hidden',
            name: name,
            value: value
            }).appendTo("#newform");
  }

  else
  {
    var i=0;
    for (i=0;i<=value.length;i++)
    {
      $('<input>').attr({
        type:  'hidden',
            name: name,
            value: value[i]
            }).appendTo("#newform");
    }
  }

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

function hideGroup2(){
  // hide them unless there are values to show
  $("#op3").hide();
  $("#fieldsetGroup2").hide();
  
}


function showGroup2(){
  $("#op3").show();
  $("#fieldsetGroup2").show();
}


function showHidePdates(){
  // hide the "and" in "yop-between"
  if ($("#yop").val() == 'between')
  {
    $("#yop-between").show();
    $("#yop-end").show();
  }
  else
  {
    $("#yop-between").val("").hide();
  }
  
  var allBlank=true;
  var pdates = $(":input.yop");
  
  $(pdates).each (function (index,element)
                  {
                    var value=$(element).val();
                    
                    if (value.match(/^\s*\d+\s*$/) )
                    {
                      // if it has a value show it
                      allBlank=false;
                    }
                    else
                    {
                      // hide it
                      $(element).hide();
                    }
                  });
  if (allBlank)
  {
      // does this make sense or should we check the widget to determine which box to show
    $('#yop-start').show().val("");
  }
  
}

