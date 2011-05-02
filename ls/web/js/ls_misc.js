/*ls_misc.js*/

//alert("this is ls_misc.js");

/**$("li.hidequery").addClass("showquery");**/
$(document).ready(function()
                  {
                    /** we want to only affect the facets in the group so we need to assign a second class and
                        feed that to the function **/
                       $("a.morefacets").css("color","blue").bind('click',function(event)
                                                                  {
                                                                    alert('Im clicked');
                                                                    $("li.hidefacet").css("display","block").css("visibility","visible");
                                                                  }
                                                                  );
                    $("li.showfacet").css("color","blue");
                                       $("li.hidefacet").css("display","none").css("visibility","hidden");
                  }
                  );
