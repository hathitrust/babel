package MBooks::PIFiller::Survey;

=head1 NAME

MBooks::PIFiller::Survey

=head1 DESCRIPTION

This class implements the PI handler sor Surveys in Collection Builder

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use base qw(PIFiller);

use Context;
use Utils;
use Survey;


# ---------------------------------------------------------------------

=item handle_PT_SURVEY_PI : PI_handler(PT_SURVEY)

 <Surveys><?MB_SURVEY?></Surveys>

  i.e.

 <Surveys>
   <Survey>
     <Desc>words</Desc>
     <Effective>2013-06-06</Expires>
     <Expires>2013-06-07</Expires>
   </Survey>
   <Survey>
     <Desc>words</Desc>
     <Effective>2013-06-06</Expires>
     <Expires>2013-06-07</Expires>
   </Survey>
   [...]
  </Surveys>

=cut

# ---------------------------------------------------------------------
sub handle_MB_SURVEY_PI
    : PI_handler(MB_SURVEY)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $survey_arr_ref = 
      Survey::get_survey_by_collid($C, 
                                   $C->get_object('Database')->get_DBH,
                                   scalar $C->get_object('CGI')->param('c'));    

    my $surveys = '';
    foreach my $hashref (@$survey_arr_ref) {
        my $s = '';
        $s .= wrap_string_in_tag($hashref->{description}, 'Desc');
        $s .= wrap_string_in_tag($hashref->{effective_date}, 'Effective');
        $s .= wrap_string_in_tag($hashref->{expires_date}, 'Expires');
        $surveys .= wrap_string_in_tag($s, 'Survey');
    }

    return $surveys;
}

1;


=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2013 ©, The Regents of The University of Michigan, All Rights Reserved

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
