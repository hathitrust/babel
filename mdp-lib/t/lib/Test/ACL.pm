package Test::ACL;

use Time::HiRes qw();
use POSIX qw();

sub mock_acls {
    my ( $C, $acl_data ) = @_;

    if ( ref($acl_data) eq 'HASH' ) {
        $acl_data = [ $acl_data ];
    }

    my $acl_ref = {};
    foreach my $acl_datum ( @$acl_data ) {
        my $key = join('|', $$acl_datum{userid}, $$acl_datum{identity_provider});
        $$acl_ref{$key} = $acl_datum;
    }

    bless $acl_ref, 'Auth::ACL';
    $C->set_object('Auth::ACL', $acl_ref);
}

# Used by the access_*.t tests to create ACLs for users expiring in the future.
# Return a formatted date/time of the 24-hour form 'YYYY-MM-DD HH:MM:SS'
# a year or so in the future (which is ballpark 32M seconds).
sub future_date_string {
    my $time = Time::HiRes::time + 32_000_000;
    return POSIX::strftime "%Y-%m-%d %H:%M:%S", localtime($time);
}

1;