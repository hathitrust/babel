alert("this is ls_advanced.js");
/**
1) remove all parameters for any rows with a blank query box
2) do we want to bother renumbering them?
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

    $("#srch")
      .bind('click',function(event)
            {

              //rewriteOrFacets();  //doesn't work can do at perl end or fix jquery
              removeBlankRows();
              redirect();
    
              event.preventDefault();
            }
            );

  }
  );

function rewriteOrFacets()
{
  var str="";
  var orstuff=$("select.orFacet option:selected");
  $(orstuff).each(function()
    {
      var p= $("this.parent().attr(name)");
      str += $(this).text() + " ";
    }  
                );

 alert(str +"\n");


  $("select.orFacet").each(function(index)
  {
    alert("this is " + this +"index is " +index);
    var s=$("this option:selected");
    alert("s is " + s +"index is " +index);
  }

                           
                           );
}

function removeBlankRows()
{
 var q= $(":input.querybox');

if ()
{

}

}
function redirect()
{
}
