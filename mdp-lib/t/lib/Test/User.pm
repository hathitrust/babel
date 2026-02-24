package Test::User;

# A testing package that attempts to simulate a user by performing surgery
# on the current Context C and Session, and various other bits dangling off them.
# It is intended that the users with their default attributes will be be helpful for most
# testing applications, but it should be possible to manipulate things like:
#  institution
#  geoip
#  affiliation
# ... when such things are of interest

use lib "$ENV{SDRROOT}/mdp-lib";
use lib "$ENV{SDRROOT}/mdp-lib/t/lib";
use Auth::ACL;
use RightsGlobals;
use Session;

use Test::ACL;

my $US_DOMAIN = 'hathitrust.org';
my $NONUS_DOMAIN = 'ox.ac.uk';
my $ETAS_DOMAIN = 'etas.example';
my $US_IDP = 'https://idp.hathitrust.org/entity';
my $NONUS_IDP = 'https://registry.shibboleth.ox.ac.uk/idp';
my $ETAS_IDP = 'https://idp.etas.example';

# Map from keywords to ht_users fixtures
# We may not need the fixtures at all if we can do the ACL override trick
my $USER_MAP = {
  $RightsGlobals::HT_TOTAL_USER => 'totaluser',
  $RightsGlobals::ORDINARY_USER => 'nobody',
  $RightsGlobals::SSD_USER => 'ssduser',
  $RightsGlobals::SSD_PROXY_USER => 'ssdproxy',
  $RightsGlobals::LIBRARY_IPADDR_USER => '',
  $RightsGlobals::HT_AFFILIATE => 'member',
  $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE => 'etasuser',
  $RightsGlobals::HT_STAFF_USER => 'totaluser',
  $RightsGlobals::RESOURCE_SHARING_USER => 'rsuser',
};

my $USER_ACL_MAP = {
  $RightsGlobals::HT_TOTAL_USER => {
    role => 'crms',
    usertype => 'external',
    access => 'total',
  },
  $RightsGlobals::ORDINARY_USER => {
  },
  $RightsGlobals::SSD_USER => {
    role => 'ssd',
    usertype => 'student',
    access => 'normal',
  },
  $RightsGlobals::SSD_PROXY_USER => {
    role => 'ssdproxy',
    usertype => 'external',
    access => 'normal',
  },
  $RightsGlobals::LIBRARY_IPADDR_USER => {
  },
  $RightsGlobals::HT_AFFILIATE => {
    role => '',
    usertype => 'external',
    access => 'normal',
  },
  $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE => {
    role => '',
    usertype => 'external',
    access => 'normal',
  },
  $RightsGlobals::HT_STAFF_USER => {
    role => 'staffdeveloper',
    usertype => 'staff',
    access => 'total',
  },
  $RightsGlobals::RESOURCE_SHARING_USER => {
    role => 'resource_sharing',
    usertype => 'external',
    access => 'normal',
  },
};


sub new {
  my ($class, @args) = @_; 
  my $self = {};
  bless $self, $class;
  my $params = { @args };
  #if (!defined $params->{type}) {
  #  die "TestUser created without 'type' parameter";
  #}
  #if (!defined %RightsGlobals::g_access_type_names{$params->{type}}) {
  #  die "TestUser type '$params->{type}' not found in RightsGlobals::g_access_type_names";
  #}
  $self->{type} = $params->{type} || $RightsGlobals::ORDINARY_USER;
  $self->{location} = $params->{location} || 'US';
  if ($self->{location} ne 'US' && $self->{location} ne 'NONUS') {
    die "TestUser location must be 'US' or 'NONUS', given '$self->{location}'";
  }
  $self->{affiliation} = $params->{affiliation} || $self->_default_affiliation;
  $self->{userid} = '';
  if ($USER_MAP->{$self->{type}}) {
    $self->{userid} = $USER_MAP->{$self->{type}} . '@' . $self->domain;
  }
  return $self;
}

my @USER_ENV = qw(
  AUTH_TYPE
  REMOTE_ADDR
  REMOTE_USER
  REQUEST_URI
  SDRINST
  SDRLIB
  Shib_Identity_Provider
  TEST_GEO_IP_COUNTRY_CODE
  affiliation
  eppn
);

sub begin {
  my $self = shift;
  my $C = new Context;
  # Auth objects memoize __eduPerson_scoped_affiliation,
  # leading to stale data when swapping in a new user.
  # Un-memoize this.
  my $auth = $C->get_object('Auth');
  if ($auth) {
    delete $auth->{__eduPerson_scoped_affiliation};
  }
  $self->{save_env} = $self->save_env(@USER_ENV);
  my $ses = Session::start_session($C);
  $ses->set_persistent('authenticated_via', 'shibboleth');
  # Set activated role where appropriate
  # TODO: other user roles
  # Currently there is no way to set type but not activate it.
  if ($self->{type} == $RightsGlobals::RESOURCE_SHARING_USER) {
    $ses->set_persistent('activated_role', 'resourceSharing');
  } elsif ($self->{type} == $RightsGlobals::SSD_PROXY_USER) {
    $ses->set_persistent('activated_role', 'enhancedTextProxy');
  } elsif ($self->{type} == $RightsGlobals::HT_TOTAL_USER || $self->{type} == $RightsGlobals::HT_STAFF_USER) {
    $ses->set_persistent('activated_role', 'totalAccess');
  }
  $C->set_object('Session', $ses);
  Test::ACL::mock_acls(new Context, $self->_default_acl);
  $ENV{AUTH_TYPE} = $self->is_not_logged_in ? '' : 'shibboleth';
  $ENV{REMOTE_USER} = $self->{userid};
  $ENV{eppn} = $self->{userid};
  $ENV{affiliation} = $self->{affiliation};
  $self->_set_idp;
  $ENV{TEST_GEO_IP_COUNTRY_CODE} = $self->{location};
  # _resolve_access_by_GeoIP returns must have HTTP_HOST or REMOTE_ADDR set to not short circuit
  $ENV{REMOTE_ADDR} = '127.0.0.1';
  # Auth::Auth::handle_possible_auth_renewal cares about this and gripes if not set.
  $ENV{REQUEST_URI} = 'nothing-in-particular';
  # Set SDRINST and SDRLIB if simulating LIBRARY_IPADDR_USER
  if ($self->{type} == $RightsGlobals::LIBRARY_IPADDR_USER) {
    $ENV{SDRINST} = 'in-library';
    $ENV{SDRLIB} = 1;
  }
}

sub is_not_logged_in {
  my $self = shift;

  return $self->{type} == $RightsGlobals::ORDINARY_USER;
}

sub is_logged_in {
  my $self = shift;

  return $self->{type} != $RightsGlobals::ORDINARY_USER;
}

sub domain {
  my $self = shift;

  return $ETAS_DOMAIN if $self->{type} == $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE;
  return $NONUS_DOMAIN if $self->{location} eq 'NONUS';
  return $US_DOMAIN;
}

sub _set_idp {
  my $self = shift;

  my $idp = '';
  if ($self->is_logged_in) {
    if ($self->{type} == $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE) {
      $idp = $ETAS_IDP;
    } elsif ($self->{location} eq 'US') {
      $idp = $US_IDP;
    } else {
      $idp = $NONUS_IDP
    }
  }
  $ENV{Shib_Identity_Provider} = $idp;
}

sub _default_affiliation {
  my $self = shift;

  my $affiliation = 'member';
  if ($self->{type} == $RightsGlobals::ORDINARY_USER) {
    #$affiliation = 'member@default.invalid';
    $affiliation = '';
  } elsif ($self->{type} == $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE) {
    $affiliation = 'member';
  } elsif ($self->{type} == $RightsGlobals::SSD_USER) {
    $affiliation = 'student';
  } elsif ($self->is_not_logged_in) {
    $affiliation = '';
  }
  $affiliation .= '@' . $self->domain if $affiliation;
  return $affiliation;
}

sub _default_acl {
  my $self = shift;

  return {} if $self->is_not_logged_in;

  # Shallow copy to new hashref
  my $acl = { %{$USER_ACL_MAP->{$self->{type}}} };
  $acl->{userid} = $self->{userid};
  if ($self->{type} == $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE) {
    $acl->{identity_provider} = $ETAS_IDP;
  } elsif ($self->{location} eq 'US') {
    $acl->{identity_provider} = $US_IDP;
  } else {
    $acl->{identity_provider} = $NONUS_IDP;
  }
  # Set the defaults common to all
  $acl->{expires} = Test::ACL::future_date_string(),
  # Avoid Perl m// jankiness by always setting this!
  $acl->{iprestrict} = '.*'; #iprestrict_none
  return $acl;
}

sub end {
  my $self = shift;

  my $C = new Context;
  $self->restore_env($self->{save_env});
  # Remove Session from context
  $C->set_object('Session', undef, 1);
  # Reset ACL
  Auth::ACL::___set_ACL( {} );
}

# FIXME: duplicated from auth.t, maybe useful here, may no longer be needed in auth.t
sub save_env {
  my $self = shift;

  my $saved_env = {};
  $saved_env->{$_} = $ENV{$_} for @_;
  return $saved_env;
}

sub restore_env {
  my $self      = shift;
  my $saved_env = shift;

  foreach my $key (keys %$saved_env) {
    my $val = $saved_env->{$key};
    if (defined $val) {
      $ENV{$key} = $val;
    } else {
      delete $ENV{$key};
    }
  }
}

1;
