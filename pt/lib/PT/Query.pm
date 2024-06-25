package PT::Query;


=head1 NAME

PT::Query (Q)

=head1 DESCRIPTION

This class subclasses Search::Query for logging purposes in Item-level search.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Debug::DUtils;

use base qw(Search::Query);

use SLIP_Utils::Common;

# ---------------------------------------------------------------------

=item AFTER_Query_initialize

Description

=cut

# ---------------------------------------------------------------------
sub AFTER_Query_initialize {
}

# ---------------------------------------------------------------------

=item get_Solr_query_string

Description

=cut

# ---------------------------------------------------------------------
sub get_Solr_query_string {
    my $self = shift;
    my $C = shift;

    return $self->{'query_string'};
}

# ---------------------------------------------------------------------

=item __format_time

Description

=cut

# ---------------------------------------------------------------------
sub __format_time {
    my $t = shift;
    my $precision = shift;
    
    return sprintf("%.${precision}f", $t);
}

# ---------------------------------------------------------------------

=item log_query 

Override base class

=cut

# ---------------------------------------------------------------------
sub log_query {
    my $self = shift;
    my ($C, $stats_ref, $Solr_url) = @_;

    # Log
    my $tempcgi = $C->get_object('CGI');
    my $referer=$ENV{REFERER} ||$tempcgi->referer();
    #add logged_in
    my $auth = $C->get_object('Auth');
    my $is_logged_in = $auth->is_logged_in($C) ? 'YES':'NO';


    my $ipaddr = $ENV{'REMOTE_ADDR'};
    my $session_id = $C->get_object('Session')->get_session_id();
    
    my $cgi_elapsed     = qq{cgi:elapsed=}    . __format_time($stats_ref->{cgi}{elapsed}, 1);
    my $create_doc_size = qq{create:docsize=} . sprintf("%.0f", $stats_ref->{create}{doc_size}/1024) . qq{K};
    my $create_elapsed  = qq{create:elapsed=} . __format_time($stats_ref->{create}{elapsed}, 1);
    my $update_check    = qq{update:check=}   . __format_time($stats_ref->{update}{check}, 2);
    my $update_qtime    = qq{update:qtime=}   . __format_time($stats_ref->{update}{qtime}/1000, 3);
    my $update_elapsed  = qq{update:elapsed=} . __format_time($stats_ref->{update}{elapsed}, 1);
    my $commit_elapsed  = qq{commit:elapsed=} . __format_time($stats_ref->{commit}{elapsed}, 1);
    my $update_total    = qq{update:total=}   . __format_time($stats_ref->{update}{total}, 1);
    my $query_elapsed   = qq{query:elapsed=}  . __format_time($stats_ref->{query}{elapsed}, 1);
    my $query_qtime     = qq{query:qtime=}    . __format_time($stats_ref->{query}{qtime}, 3);
    my $query_num_found = qq{query:num_found=$stats_ref->{query}{num_found}};

    my $log_string = qq{$ipaddr $session_id $$ }
      . Utils::Time::iso_Time('time')
        . qq{ url=$Solr_url }
          . qq{$cgi_elapsed }
            . qq{$create_doc_size $create_elapsed }
              . qq{$update_check $update_qtime $update_elapsed $commit_elapsed ($update_total) }
	      . qq{ $query_qtime $query_elapsed $query_num_found}
	      . qq{ referer=$referer logged_in=$is_logged_in};

    
    Utils::Logger::__Log_string($C, $log_string, 'query_logfile', '___RUN___',
                                SLIP_Utils::Common::get_run_number($C->get_object('MdpConfig')));
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2011 ©, The Regents of The University of Michigan, All Rights Reserved

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
