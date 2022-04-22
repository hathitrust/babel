package Ping::Notifications;

use JSON::XS;
use Carp;
use List::Util qw(first);

sub get_notification_data {
    my ( $C ) = @_;

    my $data = load_notification_data($C);
    return $data;
}

sub load_notification_data {
    my ( $C ) = @_;

    my $data = [];

    my $data_root = first { -d $_ } ( 
        qq{$ENV{SDRROOT}/etc/notifications},
        q{/htapps/babel/etc/notifications}
    );
    return $data unless ( -d $data_root );

    opendir(my $data_dh, $data_root);

    foreach my $data_filename ( sort { $b cmp $a } grep(/\.json/, readdir($data_dh)) ) {
        my $raw;
        {
            local $/;
            my $fh;
            croak "Cannot open $data_filename" if not open($fh, '<:utf8', "$data_root/$data_filename");
            $raw = <$fh>;
            croak "Cannot close $data_filename" if not close($fh);
        }

        next unless ( $raw );
        my $notification = Ping::Notifications::Notification->new(JSON::XS::decode_json($raw));
        next unless ( $notification->is_valid($C) );

        push @$data, $notification->TO_JSON();
    }

    closedir($data_dh);

    return $data;

}

package Ping::Notifications::Notification;

use Utils;
use Utils::Time;
use Auth::Auth;

sub new {
    my $class = shift;
    my ( $self ) = shift;
    bless $self, $class;
    return $self;
}

sub is_valid {
    my $self = shift;
    my ( $C ) = @_;

    return 0 if ( $self->has_expired($C) || ! $self->is_effective($C) );
    return 1 if ( $self->is_public($C) );
    return 1 if ( $self->intended_for_user($C) );
    return 0;
}

sub has_expired {
    my $self = shift;
    my ( $C ) = @_;

    if ( my $expires_on = $$self{expires_on} ) {
        my $now = Utils::Time::iso_Time();
        return 1 if ( $now ge $expires_on );
    }

    return 0;
}

sub is_effective {
    my $self = shift;
    my ( $C ) = @_;

    if ( my $effective_on = $$self{effective_on} ) {
        my $now = Utils::Time::iso_Time();
        return 1 if ( $now ge $effective_on );
    }

    return 0;
}

sub is_public {
    my $self = shift;
    my ( $C ) = @_;

    return ( ref($$self{audience}) eq '' );
}

sub intended_for_user {
    my $self = shift;
    my ( $C ) = @_;

    my $auth = new Auth::Auth($C);

    my @remote_users = Utils::Get_Remote_User_Names();
    my $entityID = $auth->get_shibboleth_entityID($C);

    foreach my $audience ( @{ $$self{audience} } ) {
        if ( $$audience{target} eq 'entityID' ) {
            return 1 if ( $$audience{value} eq $entityID );
        } elsif ( $$audience{target} eq 'remote_user' ) {
            return 1 if ( grep(/^$$audience{value}$/, @remote_users) );
        }
    }

    return 0;
}

sub TO_JSON {
    my $self = shift;

    return { %$self };
}

1;