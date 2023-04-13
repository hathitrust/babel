package MBooks::Utils::ResultsCache;

use Utils;
use Utils::Cache::Storable;
use Digest::MD5 qw(md5_hex);

# my %CACHEABLE_ACTIONS = ( 'listis' => 1 );

sub new {
    my $class = shift;
    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);
    return $self;
}

sub _initialize {
    my $self = shift;
    my ( $C, $coll_id ) = @_;
    $$self{C} = $C;
    $$self{coll_id} = $coll_id;

    
    if ( defined ( my $action = $C->get_object('CGI')->param('a') ) ) {
        $action =~ s,^list,,;
        $$self{action} = $action;
    }

    # set up cache
    my $cache_dir = Utils::get_true_cache_dir($C, 'mb_cache_dir');
    my $cache_max_age = 600;
    my $cache = Utils::Cache::Storable->new($cache_dir, $cache_max_age);
    $$self{cache} = $cache;
}

sub key {
    my $self = shift;
    unless ( $$self{key} ) {
        my $C = $$self{C};
        my $cgi = $C->get_object('CGI');
        my @parts = ( $$self{coll_id} );
        if ( defined $cgi->param('q1') ) {
            push @parts, scalar $cgi->param('q1');
        }
        if ( defined $$self{action} ) {
            push @parts, $$self{action};
        }
        push @parts, sort $cgi->multi_param('facet');
        $$self{key} = $self->hexify(join('/', @parts));
    }
    return $$self{key};
}

sub id {
    my $self = shift;
    my $C = $$self{C};
    my $ses = $C->get_object('Session');
    return join(".", $$self{coll_id}, $self->hexify( Utils::Get_Remote_User() || $ses->get_session_id() ));
}

sub get {
    my $self = shift;
    my $id = $self->id();
    my $key = $self->key();
    return $$self{cache}->Get($id, $key);
}

sub set {
    my $self = shift;
    my ( $data ) = @_;
    my $id = $self->id();
    my $key = $self->key();
    $$self{cache}->Set($id, $key, $data);
}

sub hexify {
  my $self = shift;
  my $str = shift;
  return md5_hex(utf8::is_utf8($str) ? Encode::encode_utf8($str) : $str);
}

1;
