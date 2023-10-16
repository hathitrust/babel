use strict;
use warnings;

use Encode;
use Test::More;

use lib "$ENV{SDRROOT}/ls/lib";
use lib "$ENV{SDRROOT}/ls/vendor/common-lib/lib";

use Context;
use LS::PIFiller::Advanced;
use LS::FacetConfig;
use PIFiller;
use Utils;


### THE MINDLESS SETUP BOILERPLATE
# copied from cgi/ls
my $C = new Context;
my $config = new MdpConfig(
                           Utils::get_uber_config_path('ls'),
                           $ENV{SDRROOT} . "/ls/lib/Config/global.conf",
                           $ENV{SDRROOT} . "/ls/lib/Config/local.conf"
                          );
$C->set_object('MdpConfig', $config);
my $AB_test_config_filename = $ENV{SDRROOT} . '/ls/lib/Config/AB_test_config';
my $AB_test_config = $config = Config::Tiny->read($AB_test_config_filename);
ASSERT($AB_test_config, qq{Error in testing config file $AB_test_config_filename: } . Config::Tiny::errstr);
# 1 disables checking object name
$C->set_object('AB_test_config', $AB_test_config, 1);
my $facet_config = new LS::FacetConfig($C, $ENV{SDRROOT} . "/ls/lib/Config/facetconfig.pl");
$C->set_object('FacetConfig', $facet_config);

### THE ACTUAL TEST
# Make sure we have U+00ED and not UTF8 sequence "C3AD"
my $result = LS::PIFiller::Advanced::handle_ADVANCED_SEARCH_CONFIG_PI($C);
ok($result =~ m/Aljam\x{ed}a/);
#ok($result !~ m/Aljam\x{c3}\x{ad}a/);
done_testing();
