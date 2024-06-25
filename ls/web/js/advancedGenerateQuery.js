alert("this is advancedGenerateQuery.js");

/** bind on change handler to all the selects and all the text boxes**/
              $("#showquery").html("message:");



function setCurrentValues(num,op,field)
{
  var  opname="op" + num;
  op[num]= $("select[name=" + opname +"]").val();
  var fieldname= "field"+num;
  field[num]=$("select.[name=" + fieldname + "]").val();

}

function getNum (x)
{
  //  num=s/op|field/g
  var num;
  num=x.replace(/op|field|q/,"");
  return num;
}

function displayQuery(q, op, field)
{
  var buffer="";
  for (var i=1; i<5; i++)
  {
    if (i === 1)
    {
      // no op1 because ops join with preceding field
      buffer = buffer + " " + field[i]  + ' (' + q[i] + ') ' ;
    }
    else{
      buffer = buffer + op[i] + " " + field[i]  + ' (' + q[i] + ') ' ;
    }
  }
  return buffer;
}
/**
Set up buffer for each group i.e. q1/field1/
set up something to logically figure out operators and where they go
buffer1 OP2 buffer2 OP2 buffer3 OP3



**/
function setBuffer(name,value,q,op,field)
{
  /**
if its a select:
name = op1|field1|anything else is a facet
  **/
  var num=getNum(name);
  if (/op/.test(name))
    {
      op[num]=value;
    }
  else if (/field/.test(name))
  {
    field[num]=value;
  }
  else if (/q/.test(name))
  {
    q[num]=value;
  }
  else
  {
    // its a facet what do we return?
  }

}


$(function()
  {
    var q=[];
    var op=[];
    var field=[];
    var buffer=[];

    // can we initialize this to empty string
    for (var i=0;i<5;i++)
    {
     q[i]="";
     op[i]="";
     field[i]="";
     buffer[i]="";
    }


    // select boxes are either op or field or facet
    $("select")
      .bind('change',function(event)
            {
              var s=$(this).val();
              var name=$(this).attr("name");
              // we don't want to pass q,op,field around all the time, maybe pass an object? or make global vars
              setBuffer(name,s,q,op,field);
              var toDisplay=displayQuery(q,op,field)
                $("#showquery").html(toDisplay);
              
            }
            );


    $("input:text")
      .bind('click',function(event)
            {
              //              alert("textbox change");
            }
            );

    $("input:text")
      .bind('keyup',function(event)
            {
              var value=$(this).val();
              var name=$(this).attr("name");
              var num =getNum(name);
              q[num]=value;
              //set field and op to whatever they are currently
              setCurrentValues(num,op, field);
              setBuffer(name,value,q,op,field);
              var toDisplay=displayQuery(q,op,field)
                $("#showquery").html(toDisplay);
              // this is the q variable q[num]
              //              buffer[num]= value;
              // $("#showquery").html('<div>'+ value + '</div>');
             
              //                            alert("textbox key change"+value );
            }
            );




  }

  );
