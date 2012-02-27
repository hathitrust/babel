package LS::PIFiller::Advanced;

=head1 NAME

LS::Operation::Search (op)

=head1 DESCRIPTION

This class Search implementation of the abstract Operation
class.  

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

# MDP Modules
use base qw(PIFiller);

use Utils;
use Debug::DUtils;


BEGIN
{
    require "PIFiller/Common/Globals.pm";
    require "LS/PIFiller/Globals.pm";
}

#======================================================================
#
#                        P I    H a n d l e r s
#
#======================================================================
# ---------------------------------------------------------------------
#


#   
# ---------------------------------------------------------------------
sub handle_ADVANCED_SEARCH_FORM_PI
    : PI_handler(ADVANCED_SEARCH_FORM)
{
    my ($C, $act, $piParamHashRef) = @_;

    
    my $cgi =             $C->get_object('CGI');
    my $fconfig =         $C->get_object('FacetConfig');
    my $default_fields =  $fconfig->{default_fields};
    my $field_order =     $fconfig->{field_order};
    my $field_hash =      $fconfig->{field_2_display};
    
    my $op;
    my $q;
    my $field;
    my $qParams="";
    my $xml;
    
    # do we want to allow more fields than the number specified in the defaults?
    my $MAXFIELDS  = scalar(@{$default_fields});

    # Generate one row without saying what is selected or do we want to use an html util routine?
    my $field_list;
    foreach my $fieldname (@{$field_order})
    {
        my $pair .= wrap_string_in_tag($fieldname,'Value') . "\n";         
        $pair .= wrap_string_in_tag($field_hash->{$fieldname},'Label') . "\n";
        $field_list .=wrap_string_in_tag($pair,'Option') . "\n";         
    }
    $xml .=wrap_string_in_tag($field_list,'fieldlist') . "\n";

    #  list for any all widget
    my $bool2display = $fconfig->{'anyall_2_display'};
    my @booleans = keys (%{$bool2display});

    my $anyall;
    
    foreach my $bool (@booleans)
    {
        my $pair .= wrap_string_in_tag($bool,'Value') . "\n";         
        $pair .= wrap_string_in_tag($bool2display->{$bool},'Label') . "\n";
        $anyall .=wrap_string_in_tag($pair,'Option') . "\n";         

    }        
    $xml .= wrap_string_in_tag($anyall,'AnyAll') . "\n";
    


    # this sets the default selected value for each op or field or if there is an existing query inserts the 
    # existing values
    my $rows;
    
    for my $i (1..$MAXFIELDS)
    {
        my $row = getRow($i,$cgi,$fconfig);
        $rows .= wrap_string_in_tag($row,'row') . "\n";         
    }
    $xml.=wrap_string_in_tag($rows,'rows') . "\n";         

    # read any search parameters
    # might want to read some kind of config here


    my $yop_xml =getYOP($cgi,$fconfig);
    $xml .= $yop_xml;
    
    # add facets for language and format
    my $formats_list = $fconfig->{'formats_list'};
    my $language_list = $fconfig->{'language_list'};
    my $facets;
    
    my $list;
    $list = getDropdown($cgi,'format',$formats_list);
    $facets .=  wrap_string_in_tag($list,'formats_list') . "\n";         
    $list = getDropdown($cgi,'language',$language_list);
    $facets .=  wrap_string_in_tag($list,'language_list') . "\n";         

    $xml.=wrap_string_in_tag($facets,'facets') . "\n";         
    return $xml;
    
}
#----------------------------------------------------------------------
# helpers
sub getYOP
{
    my $cgi = shift;
    my $fconfig = shift;
    my $xml;
    my $yop_xml;
    
    #XXX default should come from config file not hardcoded here or in xsl

    my $yop_selected="after";
    
    # options
    my $yop=$cgi->param('yop');
    if (defined ($yop) )
    {
        $yop_selected=$yop;
    }
    
    my $selected;
        
    foreach my $yop_type (@{$fconfig->{yop_order}})
    {
        $selected="";
        if ($yop_type eq $yop_selected)
        {
            $selected = ' selected="selected" ';
        }
        $yop_xml .= '<option value="' . $yop_type . "\"" . $selected . '>'. $fconfig->{'yop_map'}->{$yop_type} .'</option>' . "\n";
    }
    my    $yop_options=wrap_string_in_tag($yop_xml,'yopOptions') . "\n";         
    my $yop_inputs;
    
    
    foreach my $input (@{$fconfig->{'yop_input_order'}})
    {
        $yop_inputs.= '<label for="' . "$input". '" class="SearchLabel">' ."$fconfig->{'yop2label'}->{$input}". '</label>'. "\n" ;
        $yop_inputs.= '<input class="yop" id="'. "$input" . '" type="text" size="4"';
            
        my $pdate="";
        my $param=$fconfig->{'yop2name'}->{$input};
        my $pvalue=$cgi->param($param);
        
        if (defined ($pvalue) && $pvalue ne "")
        {
            $pdate=$pvalue;
            $yop_inputs.= ' value="' . $pdate . '"';
        }
        #XXX kludge for "only during" i.e. yop =in
        # Right now we rewrite the pdate param so this looks like a regular date facet query
        #TODO: revisit this decision
        my $yop_param=$cgi->param('yop');

        
        if($yop_param eq "in" && $input eq "yop-in")
        {
            # get date from daterangefacet
            my $pdate=getDateFromDateFacet($cgi);
            $yop_inputs.= ' value="' . $pdate . '"';
        }
        

        $yop_inputs.=     '  name="' ."$fconfig->{'yop2name'}->{$input}" . '" />' . "\n";

        
        #XXX kludge.  Can we do this with a config somehow
        if ($input eq 'yop-start')
        {
            $yop_inputs.='<span class="yop" id="yop-between" > and </span>' . "\n";
        }
        
    }

    #my $yop_inputs_xml=wrap_string_in_tag($yop_inputs,'yopInputs') . "\n";         
    my  $yop_inputs_xml='<span name="yopInputs">' . $yop_inputs . '</span>' . "\n";
    my $yop_xml2 = "\n" . $yop_options ."\n" .$yop_inputs_xml ;
    
    my $xml  =wrap_string_in_tag($yop_xml2,'yop') . "\n";         
    return $xml;
}

#-------------------------------------------------------------------
#XXX warning this is a kludge to get around our remove of pdate from cgi param and turning it into a regular date facet when
# user chooses limit to exact date "only during" in advanced search
# is there a side effect if user adds a date facet and then clicks on advanced search?
#
sub getDateFromDateFacet
{
    my $cgi = shift;
    my @facets=$cgi->param('facet');
    foreach my $facet (@facets)
    {
        if ($facet =~ /publishDateRange(.+)/)
        {
            my $date=$1;
            $date =~s/\%3A//g;
            $date =~s/\%22//g;
            $date =~s/[\"\:]//g;
            return $date;
        }
        
    }

}

#----------------------------------------------------------------------
sub getDropdown
{
    my $cgi = shift;
    my $list_type = shift;
    my $list = shift;
    my $xml;
    my $facet_name;
    my $all;
    my $attrs;
    my $selected;
    my $param_name;
    my $selected="";
    

    if ($list_type eq 'format')
    {
        $param_name='facet_format';
    }
    else
    {
        $param_name='facet_lang';
    }
    my $param_hash = {};
    my @params=$cgi->param($param_name);
    foreach my $param (@params)
    {
        $param_hash->{$param}++;
    }
    my $FACET_SELECTED;

    # check if option is in cgi parameters
    # and make option selected if it is
    # and  make "All" option unselected if any other option is selected
    
    foreach my $value (@{$list})
    {
        $facet_name = "$list_type" . ':' . $value;
        $attrs = ' value=' .  "\"" . $facet_name  . "\"";
        # it should be selected
        $selected="";
        
        if ($param_hash->{$facet_name} eq 1)
        {
            $selected= ' selected="selected" ';
            $FACET_SELECTED="true";
        }
        $attrs .= $selected;
        $xml .= '<option' . $attrs . '>'; 
        $xml .=  $value . '</option>' . "\n" ;
    }
    # if no facets in this list are selected, then select the "All" pseudofacet
    if ($FACET_SELECTED ne "true")
    {
        $all= '<option value="' . $list_type .  ':All" selected="selected">All</option>' . "\n";
    }
    else
    {
        $all= '<option value="' . $list_type .  ':All">All</option>' . "\n";

    }
    $xml = $all . $xml;
    
    return $xml;
}

sub getRow
{
    # get defaults
    # replace default with cgi param if there
    
    my $i =         shift;
    my $cgi=        shift;
    my $fconfig =   shift;
    my $row;

    my $opname =    'op' . $i;
    my $fieldname = 'field'. $i;
    my $qname=       'q' . $i;
    # first value in array is the default

    my $op=$fconfig->{op_order}->[0];
    if (defined ($cgi->param($opname)))
    {
        $op= $cgi->param($opname);
    }
    $row .= wrap_string_in_tag($op,'op') . "\n";         

    my $field = $fconfig->{default_fields}->[$i-1];
    if (defined ($cgi->param($fieldname)))
    {
        $field= $cgi->param($fieldname);
    }
    $row .= wrap_string_in_tag($field,'field') . "\n";         
    
    #XXX defaults for any all phrase selector
    # XXX need better name than anyall but boolean risks confusion with the op which is also boolean
    my $anyallname= 'anyall' . $i;
    my $anyall =$fconfig->{default_anyall}->[$i-1];
    if (defined ($cgi->param($anyallname)))
    {
        $anyall= $cgi->param($anyallname);
    }
    $row .= wrap_string_in_tag($anyall,'anyall') . "\n";         
    
    my $q ="";
    if (defined ($cgi->param($qname)))
    {
        $q = $cgi->param($qname);
    }
    $row .= wrap_string_in_tag($q,'q') . "\n";         
    return $row;
}



1;


__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=head1 COPYRIGHT

Copyright 2008 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

=cut

