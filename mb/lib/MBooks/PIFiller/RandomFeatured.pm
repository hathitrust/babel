package MBooks::PIFiller::RandomFeatured;


=head1 NAME

MBooks::PIFiller::Error (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_DISP_PAGE page=error_ajax action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use base qw(PIFiller);
use Search::Constants;

use JSON::XS;


# ---------------------------------------------------------------------
sub  handle_RANDOM_FEATURED_COLLECTION_PI
    : PI_handler(RANDOM_FEATURED_COLLECTION) {
    my ($C, $act, $piParamHashRef) = @_;

    my $cs = $act->get_transient_facade_member_data($C, 'collection_set_object');
    my $cgi = $C->get_object('CGI');
    
    # XXX will this method of getting user name work accross scripts? i.e. vufind--cosign--CB?
    # If not do we send uniqname as a get parameter or as a post?
    
    my $coll_arr_ref = $act->get_transient_facade_member_data($C, 'public_list_colls_data');
    my $item = $$coll_arr_ref[0];
        
    my $json = JSON::XS->new;
    $json->utf8(0);
    my $output = $json->encode($item);
    if ( $cgi->param('callback') ) {
        $output = $cgi->param('callback') . qq{($output);};
    }
    return $output;
}

# ---------------------------------------------------------------------

1;
__END__

=head1 AUTHOR

Roger Espinosa, University of Michigan, roger@umich.edu

=head1 COPYRIGHT

Copyright 2012 ©, The Regents of The University of Michigan, All Rights Reserved

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
