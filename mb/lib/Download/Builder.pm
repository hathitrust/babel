package Download::Builder;

use parent qw( Plack::Component );

use CGI::PSGI;
use Plack::Request;
use Plack::Response;
use Plack::Util::Accessor qw(
    cgi
    coll_id
    source
    format
    q1
    is_ft
);

# Permit created directories at 777 and created files at 666.
umask 0000;

# MDP specfic
use Debug::DUtils;
use MdpGlobals;
use Identifier;

use MdpConfig;
use Auth::Auth;
use Auth::Logging;
use Access::Rights;
use Utils;
use Database;
use Session;
use Collection;
use CollectionSet;

use MBooks::Operation::Status;
use MBooks::Utils::ResultsCache;
use MBooks::FacetConfig;

use JSON::XS;

use URI::Escape;
use Date::Manip;
use utf8;

use Download::Builder::MB;
use Download::Builder::HathiFiles;

delete $INC{"MBooks/Operation/OpListUtils.pl"};
require "MBooks/Operation/OpListUtils.pl";

sub new {
    my $class = shift;
    my $self = $class->SUPER::new(@_);

    $self;
}

sub call {
    my ( $self, $env ) = @_;

    my $request = Plack::Request->new($env);
    my $response;

    $self->_fill_params($request);
    
    # configuration; do we need our own config?
    my $config = new MdpConfig(
                               Utils::get_uber_config_path('ping'),
                               $ENV{SDRROOT} . "/mb/lib/Config/global.conf",
                               $ENV{SDRROOT} . "/mb/lib/Config/local.conf"
                              );
    
    
    # now need to hit the database
    my $C = new Context;

    $C->set_object('MdpConfig', $config);
    $C->set_object('App', new App);

    # additional configuration for facets and relevance weighting
    my $facet_config =
    new MBooks::FacetConfig( $C,
        $ENV{SDRROOT} . "/mb/lib/Config/facetconfig.pl" );
    $C->set_object( 'FacetConfig', $facet_config );

    my $cgi = CGI::PSGI->new($env);
    $C->set_object('CGI', $cgi);

    # Database connection
    my $db = new Database('ht_web');
    $C->set_object('Database', $db);

    # Session
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);

    # get an Auth object to trigger cgi/shcgi redirection
    my $auth = new Auth::Auth($C);
    $C->set_object('Auth', $auth);

    my $dbh = $C->get_object('Database')->get_DBH();
    my $co = Collection->new( $dbh, $config, $auth );
    $C->set_object('Collection', $co);

    my $CS = CollectionSet->new( $dbh, $config, $auth );

    my $coll_id = $cgi->param('c');
    my $owner = $co->get_user_id;

    if ( ! $CS->exists_coll_id($coll_id) ) {
        $response = Plack::Response->new(404);
        return $response->finalize;
    }

    {
        package Mini::Action;

        sub new {
            my $class = shift;
            my $self = {};
            bless $self, $class;
            return $self;
        }

        sub set_error_record {
            my $self = shift;
            my ( $C, $record ) = @_;
            # nop
        }

        sub make_error_record {
            my $self = shift;
            my ( $C, $message ) = @_;
            $$self{message} = $message;
        }
    }

    my $act = Mini::Action->new;
    my $status = $self->test_ownership($C, $co, $act, $coll_id, $owner);
    unless ( $status == $ST_OK ) {
        $response = Plack::Repsonse->new(401);
        return $response->finalize;
    }

    ## check $request->method eq 'POST' if we decide
    ## to reject GET requests

    my $download_key = join('.', 'mb', 'download', $coll_id);
    if ( $request->param('a') && $request->param('a') eq 'download-status' ) {
        $response = Plack::Response->new(200);
        $response->content_type('application/javascript');
        $response->headers({'Cache-Control' => 'no-cache', 'Pragma' => 'no-cache' });
        $response->body(JSON::XS::encode_json({ status => $ses->get_persistent($download_key) }));
        return $response->finalize;
    }

    $ses->set_persistent($download_key, 'working');
    tied( %{ $ses->{persistent_data} } )->save;

    my $coll_id = $self->coll_id;
    my $coll_record = $co->get_coll_record($coll_id);
    my $rights_ref = $self->get_rights($C);

    # Result object
    my $rs = $self->get_search_results($C, $cgi);

    $dbh->do(qq{SET NAMES utf8});

    my $idx = 0;
    
    my $num_items = $$coll_record{num_items};
    my $suffix;

    if ( $self->is_ft ) {
        $suffix .= "-ft";
        $num_items = $co->count_full_text($coll_id, $rights_ref);
    }

    my $include_hashref; 
    if ( $rs ) {
        my $result_id_arrayref = $rs->get_result_ids();
        unless ( scalar @$result_id_arrayref == $num_items ) {
            $include_hashref = { map { $_ => 1 } @$result_id_arrayref };
            require HTML::Entities;
            $suffix = lc HTML::Entities::decode_entities(uri_unescape($self->q1));
            $suffix =~ s,[^a-z],-,g;
            $suffix =~ s,-+,-,g;
            $suffix = "-$suffix";
        }
    }

    my $cls = $self->get_builder();
    my $builder = $cls->new(
        dbh => $dbh, 
        coll_record => $coll_record, 
        coll_id => $self->coll_id, 
        num_items => $num_items, 
        rights_ref => $rights_ref,
        is_ft => $self->is_ft,
        include => $include_hashref
    );

    $suffix .= "-" . time();

    my $op = "attachment; ";
    my $ext = ( $self->format eq 'json' ? 'json' : 'txt' );

    $self->log_access($C);

    return sub {
        my $responder = shift;
        my $writer = $responder->(
            [ 200, [
                'Content-Disposition' => qq{$op filename="$coll_id$suffix.$ext},
                'Set-Cookie' => qq{download$coll_id=1; Path=/}
            ]]
        );

        $builder->writer($writer);
        $builder->run();

        $ses->set_persistent( $download_key, 'done' );
        tied( %{ $ses->{persistent_data} } )->save;

        # print STDERR "AHOY AHOY SESSION :: " . $ses->get_persistent($download_key) . "\n";

        $writer->close();
    };

}

sub log_access {
    my $self = shift;
    my ( $C ) = @_;

    my $request_uri = join(';', 
        q{/cgi/mb?a=download},
        q{c=} . $self->coll_id,
        q{format=} . $self->format,
        q{source=} . $self->source);
    if ( $self->q1 ) { $request_uri .= ";q1=" . $self->q1; }
    if ( $self->is_ft ) { $request_uri .= ";lmt=ft"; }
    Auth::Logging::log_access($C, 'mb', undef, {
        REQUEST_URI => $request_uri
    });

}

sub get_search_results {
    my $self = shift;
    my ( $C, $cgi ) = @_;

    require MBooks::Result::FullText;

    my $rs;
    my $q1 = $self->q1;
    if ( $q1 && $q1 ne '*' ) {
        my $search_result_object =
          MBooks::Utils::ResultsCache->new( $C, $self->coll_id )->get();
        $rs = $$search_result_object{result_object};
    }

    if ( !defined $rs ) {

        # stale session OR query from download
        if ( ( $q1 && $q1 ne '*' )
            || ( scalar $cgi->multi_param('facet') ) )
        {
            # can we fake this?
            require MBooks::Query::FullText;
            require MBooks::Searcher::FullText;
            require Search::Searcher;

            my $user_query_string = $self->q1;
            my $Q = new MBooks::Query::FullText( $C, $user_query_string );
            $Q->disable_sort();
            $rs = new MBooks::Result::FullText($self->coll_id);

            my $engine_uri =
              Search::Searcher::get_random_shard_solr_engine_uri($C);
            my $searcher =
              new MBooks::Searcher::FullText( $engine_uri, undef, 1 );

            $rs = $searcher->get_populated_Solr_query_result( $C, $Q, $rs );
        }
    }

    return $rs;
}

sub get_builder {
    my $self = shift;

    my $FORMAT_MAP = {
        text => 'Text',
        json => 'JSON',
    };
    my $SOURCE_MAP = {
        mb => 'MB',
        hathifiles => 'HathiFiles',
    };

    return join("::", "Download", "Builder", $$SOURCE_MAP{$self->source}, $$FORMAT_MAP{$self->format});

}

sub _fill_params {
    my $self = shift;
    my ( $request ) = @_;

    $self->coll_id($request->param('c'));
    $self->source($request->param('source') || 'mb');
    $self->format($request->param('format') || 'text');

    my $q1 = $request->param('q1');
    if ( $q1 ) { $self->q1($q1); }

    if ( defined $request->param('lmt') && $request->param('lmt') eq 'ft' ) {
        $self->is_ft(1);
    }
}

1;