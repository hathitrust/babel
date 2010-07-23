package API::HTD::App::V_2::Plugin;


=head1 NAME

API::HTD::App::V_2::Plugin;

=head1 DESCRIPTION

This is a subclass of API::HTD::App which contains resource handlers
and associated support code to handle the Version 2 schemas for the
HathiTruse Data API.

*** This is currently a placeholder/example of version evolution ***

Subsequent versions will, in all likelyhood, be largely copies of this
code with minor emendations.  Obviously, code copying is not
desirable.  However, the thought is that the functional changes between
versions are general unpredictable.  Consequently it would be difficult to
create a class hierarchy that defined a base class that supported an
inheritance scheme general enough to anticipate any new function that
might come along such that a subclass could easily override base class
functionality to implement it.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


use strict;
use base qw(API::HTD::App);

use constant API_VERSION => 2;

# =====================================================================
# =====================================================================
# Accessors
# =====================================================================
# =====================================================================
sub getVersion {
    my $self = shift;
    return API_VERSION;
}





1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009 ©, The Regents of The University of Michigan, All Rights Reserved

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
