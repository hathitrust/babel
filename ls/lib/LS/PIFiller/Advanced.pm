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
sub handle_ADVANCED_SEARCH_PI
    : PI_handler(ADVANCED_SEARCH)
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
    return $xml;
    
    
}
#----------------------------------------------------------------------
# helpers

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

