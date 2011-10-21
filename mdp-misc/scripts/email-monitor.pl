#!/l/local/bin/perl

=head1 NAME

email-monitor.pl

=head1 USAGE

Run from cron every N minutes to mail any buffer ASSERT messages

=head1 DESCRIPTION

Prevent mail bombs. Use e.g. 15 minute intervals.

=head1 OPTIONS

=over 8

=item none

No options.

=back

=cut

umask 0000;

use strict;

use Mail::Mailer;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

use Utils;
use Utils::Time;


#
# Addresses NOTE: Must coordinate with Debug::Email
#
my $g_assert_email_to_addr   = q{dlxs-system@umich.edu};
my $g_assert_email_from_addr = q{"HathiTrust Mailer" <dlps-help@umich.edu>};
my $g_email_file             = qq{$ENV{SDRROOT}/logs/assert/hathitrust-email-digest-current};
my $g_email_subject          = qq{[MAFR] HathiTrust assert fail Digest};

my $HOST = `hostname`; $HOST =~ s,\..*$,,s;

if (-e $g_email_file) {
    my $text_ref = Utils::read_file($g_email_file, 1, 0);

    if ($text_ref && $$text_ref) {
        my $when = Utils::Time::iso_Time();
        my $email_subject = $g_email_subject . qq{ ($when)($HOST)};

        my $mailer = new Mail::Mailer('sendmail');
        $mailer->open({
                       'To'      => $g_assert_email_to_addr,
                       'From'    => $g_assert_email_from_addr,
                       'Subject' => $email_subject,
                      });
        print $mailer($$text_ref);
        $mailer->close;

        my $archive_file = $g_email_file;
        $archive_file =~ s,current,$when,;
        $archive_file =~ s, ,_,;
        
        system("mv", "-f", "$g_email_file", "$archive_file");
    }
}


exit 0;

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
