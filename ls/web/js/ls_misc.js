/*ls_misc.js*/

//alert("this is ls_misc.js");

/**$("li.hidequery").addClass("showquery");**/
//$(document).ready(function()  below is jquery shortcut for document.ready...

$(function()
  {
    /** we want to only affect the facets in the group so we need to assign a second class and
        feed that to the function 
        Note that there is probably a better jquery way to do this than to get an array and look at the first element
        We should be able to look for "not morefacets"
    **/
    $("a.morefacets").css("color","blue").bind('click',function(event)
                                               {
                                                 alert('Im clicked');
                                                 var ary=$(this).attr("class").split(" ");
                                                   // need only one that isn't morefacets or lessfacets
                                                 // for now rely on order so morefacets =1
                                                 var c=ary[0];

                                                 var myclass= "dd." +c;
                                                 $(myclass).css("display","block").css("visibility","visible");
                                                 // need to hide more button and show fewer button
                                                 // stuff goes here
                                                 event.preventDefault();
                                               }
                                               );
  }
  );
