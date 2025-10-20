package TestHelper;

# This is ugly but spares us having to remember all of the -I parameters to perl/prove
# Could also provide these via PERL5LIB in perl.yml
use lib File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib');
use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 'lib');
use lib File::Spec->catdir($ENV{SDRROOT}, 'slip-lib');
use lib File::Spec->catdir($ENV{SDRROOT}, 'plack-lib');

1;
