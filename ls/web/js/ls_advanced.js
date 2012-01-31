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


$(function()
  {

    // hide extra yop boxes
    $(".yop").val('').hide();
    // show yop-start
    $('#yop-start').show().val("");


   
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
                   redirect(rowNums);
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
    var Msg = 'Please enter a search term.';
    showErrMsg(Msg,'submitErrMsg');
    showErrMsg(Msg,'queryErrMsg');
  }
  return queryExists;
}


function showErrMsg(Msg,id)
{
  var target= '#' + id;
  $("<div  class='error' ></div>").html(Msg).appendTo(target);

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
  $(':input.querybox').each(function(index)
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
  $(":input").each(function (index,element)
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
                           addInput(name,value);
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
  
  if(value[0] === "All" && typeof value !== "string")
  {
    var newValues = new Array();
    var i=1;
    for (i=0;i< value.length-1;i++)
    {
      newValues[i]=value[i+1];
    }
    addInput(name,newValues);
  }
  else if (value ==="All")
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
        type: 'hidden',
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

