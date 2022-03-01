package Download::Builder;

use Download::Builder::MB;
use Download::Builder::HathFiles;

sub new {
  my $class = shift;
  my ( $report ) = @_;

  if ( $report eq 'mb' ) {
    return Download::Builder::MB->new();
  } elsif ( $report eq 'hathfiles' ){
    return Download::Builder::HathiFiles->new();
  }
}