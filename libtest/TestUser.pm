package TestUser;

use lib "$ENV{SDRROOT}/mdp-lib";
use lib "$ENV{SDRROOT}/mdp-lib/t/lib";
use Auth::ACL;
use RightsGlobals;
use Session;

use Test::ACL;

# Map from keywords to ht_users fixtures
# TODO: make fixtures for the blank userids
my $USER_MAP = {
  $RightsGlobals::HT_TOTAL_USER => 'totaluser@hathitrust.org',
  $RightsGlobals::ORDINARY_USER => '',
  $RightsGlobals::SSD_USER => 'ssduser@hathitrust.org',
  $RightsGlobals::SSD_PROXY_USER => 'ssdproxy@hathitrust.org',
  $RightsGlobals::LIBRARY_IPADDR_USER => '',
  $RightsGlobals::HT_AFFILIATE => '',
  $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE => '',
  $RightsGlobals::HT_STAFF_USER => '',
  $RightsGlobals::RESOURCE_SHARING_USER => 'rsuser@hathitrust.org',
};

my $USER_ACL_MAP = {
  $RightsGlobals::HT_TOTAL_USER => {
    userid => 'totaluser@hathitrust.org',
    role => 'corrections',
    usertype => 'staff',
    access => 'total',
  },
  $RightsGlobals::ORDINARY_USER => {
    userid => 'nobody@default.invalid',
  },
  $RightsGlobals::SSD_USER => {
    userid => 'ssduser@hathitrust.org',
    role => 'ssd',
    usertype => 'student',
    access => 'normal',
  },
  $RightsGlobals::SSD_PROXY_USER => 'ssdproxy@hathitrust.org',
  $RightsGlobals::LIBRARY_IPADDR_USER => '',
  $RightsGlobals::HT_AFFILIATE => '',
  $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE => '',
  $RightsGlobals::HT_STAFF_USER => '',
  $RightsGlobals::RESOURCE_SHARING_USER => {
    userid => 'rsuser@hathitrust.org',
    role => 'resource_sharing',
    usertype => 'external',
    access => 'normal',
  },
};

my $US_IDP = 'https://idp.hathitrust.org/entity';
my $NONUS_IDP = 'https://registry.shibboleth.nonus.ac.uk/idp';


sub new {
  my ($class, @args) = @_; 
  my $self = {};
  bless $self, $class;
  my $params = { @args };
  if (!defined $params->{type}) {
    die "TestUser created without 'type' parameter";
  }
  if (!defined %RightsGlobals::g_access_type_names{$params->{type}}) {
    die "TestUser type '$params->{type}' not found in RightsGlobals::g_access_type_names";
  }
  # FIXME: not necessary to pass context, it's a singleton. So create it here or as needed.
  if (!defined $params->{context}) {
    die "TestUser created without 'context' parameter";
  }
  $self->{type} = $params->{type};
  $self->{context} = $params->{context};
  $self->{location} = $params->{location} || 'US';
  if ($self->{location} ne 'US' && $self->{location} ne 'NONUS') {
    die "TestUser location must be 'US' or 'NONUS', given '$self->{location}'";
  }
  $self->{affiliation} = $params->{affiliation} || $self->_default_affiliation;
  return $self;
}

my @USER_ENV = qw(AUTH_TYPE REMOTE_USER eppn affiliation Shib_Identity_Provider TEST_GEO_IP_COUNTRY_CODE REMOTE_ADDR);
sub begin {
  my $self = shift;

  my $C = $self->{context};
  $self->{save_env} = $self->save_env(@USER_ENV);
  my $ses = Session::start_session($C);
  $ses->set_persistent('authenticated_via', 'shibboleth');
  # Set activated role where appropriate
  if ($self->{type} == $RightsGlobals::RESOURCE_SHARING_USER) {
    $ses->set_persistent('activated_role', 'resourceSharing');
  }
  # TODO: other user roles
  $C->set_object('Session', $ses);
  Test::ACL::mock_acls($self->{context}, $self->_default_acl);
  $ENV{AUTH_TYPE} = 'shibboleth';
  $ENV{REMOTE_USER} = $USER_MAP->{$self->{type}};
  $ENV{eppn} = $USER_MAP->{$self->{type}};
  $ENV{affiliation} = $self->{affiliation};
  # In order for this to work, we need to set the IDP to a non-US value
  # and set the user
  if ($self->{location} eq 'US') {
    $ENV{Shib_Identity_Provider} = 'https://idp.hathitrust.org/entity';
  } else {
    $ENV{Shib_Identity_Provider} = 'https://registry.shibboleth.nonus.ac.uk/idp';
  }
  $ENV{TEST_GEO_IP_COUNTRY_CODE} = $self->{location};
  # _resolve_access_by_GeoIP returns must have HTTP_HOST or REMOTE_ADDR set to not short circuit
  $ENV{REMOTE_ADDR} = '127.0.0.1';
}

sub _default_affiliation {
  my $self = shift;

  my $affiliation = 'member@hathitrust.org';
  if ($self->{type} == $RightsGlobals::SSD_USER) {
    $affiliation = 'student@hathitrust.org';
  }
}

sub _default_acl {
  my $self = shift;

  # Shallow copy to new hashref
  my $acl = { %{$USER_ACL_MAP->{$self->{type}}} };
  if ($self->{location} eq 'US') {
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

  my $C = $self->{context};
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