
umask 0000;

use Plack::Builder;
use Plack::Builder::Conditionals::Choke;

use Plack::Request;
use Plack::Util;
use Utils;

use SRV::Utils;

use Utils::Settings;
our $settings = Utils::Settings::load('imgsrv', 'download');

my $app = sub {
    my $env = shift;
    my $C = $$env{'psgix.context'};
    my $mdpItem = $C->get_object('MdpItem');
    my $item_type = lc $mdpItem->GetItemType();
    $$env{'psgix.image.transformers'} = $$settings{transformers};
    $$env{'psgix.image.verbose'} = $$settings{verbose};
    unless ( $$env{PATH_INFO} ) { $$env{PATH_INFO} = '/pdf'; }
    Plack::Recursive::ForwardRequest->throw("/$item_type$$env{PATH_INFO}");
};

# lazy load classes, since this app only executes one per request
my $loader = sub {
    my $cls = shift;
    return sub {
        my $env = shift;
        my $class = Plack::Util::load_class($cls);
        return $class->new->call($env);
    }
};

builder {

    # Fix mangled URLs by unescaping `;` and `=` (from `%3B` amd `%3D` respectively)
    # Must not be enabled when URL has embedded URLs, such as a progress callback.
    # e.g., download_url parameter will have its escapes unescaped, breaking downloads.
    if ( SRV::Utils::under_server() ) {
        enable 'URLFixer';
    }

    enable "PopulateENV", app_name => 'imgsrv';

    # uncomment if needed for debugging purposes
    # enable_if { (Debug::DUtils::under_server() && $ENV{HT_DEV}) } 'StackTrace';

    enable_if { SRV::Utils::under_server() } "HTHTTPExceptions",
      error_pages => {
        500 => "/mdp-web/production_500.html",
        404 => "/mdp-web/production_404.html"
      };

    enable_if { SRV::Utils::under_server() }
      "HTErrorDocument", 500 => "/mdp-web/production_500.html";


    if ( SRV::Utils::under_server() ) {

        enable 'Choke::Cache::Filesystem';

        enable
            match_if param('marker'),
                'Choke::Null'
                ;

        enable
            match_if param('seq', qr/^\d+$/, 1),
                     'Choke::Requests',
                         %{ $$settings{choke}{'page'} }
                     ;

        enable
            match_if unchoked(),
                'Choke::Requests',
                    %{ $$settings{choke}{'default'} }
                ;


    }

    enable "+SRV::Prolog", app_name => 'imgsrv';
    enable "Recursive";

    mount "/" => $app;
    mount "/volume" => builder {
        mount "/pdf" => $loader->('SRV::Volume::PDF');
        mount "/epub" => $loader->('SRV::Volume::EPUB');
        mount "/plaintext" => $loader->('SRV::Volume::Text::Bundle');
        mount "/image" => $loader->('SRV::Volume::Image::Bundle');
        mount "/remediated"   => $loader->('SRV::Volume::Remediated::Bundle');
    };

};
