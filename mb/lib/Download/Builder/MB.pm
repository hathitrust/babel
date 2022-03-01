package Download::Builder::MB;

use File::Temp;

sub new {
  my $class = shift;

  my $self = {@_};
  $$self{params} = [ $$self{coll_id} ];
  bless $self, $class;
  return $self;
}

sub open {
  my $self = shift;
  my ($suffix) = @_;
  $$self{fh} = File::Temp->new( DIR => '/ram', SUFFIX => $suffix );
  $$self{fh}->unlink_on_destroy(1);
}

sub run {
  my $self = shift;

  $self->init();

  my $sql = $self->_get_query();
  my $sth = $$self{dbh}->prepare($sql);
  $sth->execute(@{ $$self{params}} );

  while ( my $rows = $sth->fetchall_arrayref({}, 10000) ){
    last unless ( scalar @$rows );
    $self->_fill_contents($rows);
  }

  $self->finish();
}

sub _include {
  my $self      = shift;
  my ($row)     = @_;
  my $htitem_id = $$row{htitem_id};
  if ( ref( $$self{include} ) ) {
    return exists( $$self{include}{$htitem_id} );
  }
  return 1;
}

sub _get_query {
  my $self = shift;

  my $select_sql = q{SELECT a.extern_item_id AS htitem_id, a.display_title AS title, a.author, a.date, a.rights, a.book_id, a.bib_id};
  my $from_sql = qq{mb_coll_item b, mb_item a};
  my $where_sql = qq{MColl_ID = ? AND a.extern_item_id = b.extern_item_id};
  my $sql = qq{$select_sql FROM $from_sql WHERE $where_sql };

  if ( $$self{is_ft} ) {
      my $rights_sql = join( ' OR ', map { 'rights = ?' } @$$self{rights_ref} );
      push @{ $$self{params} }, @$$self{rights_ref};
      $sql .= " AND ( $rights_sql )";
  }

  $sql .= qq{ ORDER BY sort_title};

  return $sql;
}

sub _process_row {
  my $self = shift;
  my ($row) = @_;

  my $USE_CODES = { OCLC => 1, LCCN => 1, ISBN => 1 };

  my @parts = split( /,/, $$row{book_id} );
  my ( $key, $value );
  $$row{codes} = {};
  while ( scalar @parts ) {
    my $part = shift @parts;
    if ( $part =~ m,:, ) {
      ( $key, $value ) = split( /:/, $part, 2 );
      unless ( $$USE_CODES{$key} ) {
        $key = undef;
        next;
      }
      $$row{codes}{$key} = [] unless ( ref( $$row{codes}{$key} ) );
      push @{ $$row{codes}{$key} }, $value;
    }
    elsif ($key) {
      $$row{codes}{$key}[-1] .= ",$part";
    }
  }
}

package Download::Builder::MB::Text;

use base qw/Download::Builder::MB/;
use utf8;

sub new {
  my $class = shift;

  my $self = $class->SUPER::new(@_);
  $self->open('.txt');
  binmode( $$self{fh}, ":utf8" );
  return $self;
}

sub init {
  my $self = shift;
  print { $$self{fh} } join( "\t",
    "htitem_id", "title", "author", "date",        "rights",
    "OCLC",      "LCCN",  "ISBN",   "catalog_url", "handle_url" )
    . "\n";
}

sub _fill_contents {
  my $self = shift;
  my ($rows) = @_;

  foreach my $row (@$rows) {
    next unless ( $self->_include($row) );
    $self->_process_row($row);
    $$row{catalog_url} =
      qq{https://catalog.hathitrust.org/Record/$$row{bib_id}};
    $$row{handle_url} = qq{https://hdl.handle.net/2027/$$row{htitem_id}};

    foreach my $code ( keys %{ $$row{codes} } ) {
      $$row{codes}{$code} = join( ',', @{ $$row{codes}{$code} } );
    }

    my $line = join( "\t",
      $$row{htitem_id},   $$row{title},       $$row{author},
      $$row{date},        $$row{rights},      $$row{codes}{OCLC},
      $$row{codes}{LCCN}, $$row{codes}{ISBN}, $$row{catalog_url},
      $$row{handle_url}, );
    utf8::encode($line);

    print { $$self{fh} } $line, "\n";
  }
}

sub finish {
  my $self = shift;
  $$self{fh}->seek( 0, 0 );
  return $$self{fh};
}

package Download::Builder::MB::JSON;

use base qw/Download::Builder::MB/;
use JSON::XS;

sub new {
  my $class = shift;

  my $self = $class->SUPER::new(@_);
  $self->open(".json");
  $$self{json} = JSON::XS->new()->utf8(1)->allow_nonref(1);
  return $self;
}

sub emit {
  my ( $self, $key, $value, $last ) = @_;
  my $suffix = $last ? '' : ',';
  return sprintf( qq{%s: %s%s},
    $$self{json}->encode($key),
    $$self{json}->encode($value), $suffix );
}

sub init {
  my $self        = shift;
  my $coll_record = $$self{coll_record};
  my $coll_id     = $$coll_record{coll_id};

  print { $$self{fh} } '{' . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "id",
    "https://babel.hathitrust.org/cgi/mb?a=listis;c=$coll_id" )
    . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "type", "http://purl.org/dc/dcmitype/Collection" ) . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "description", $$coll_record{description} ) . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "created", $$coll_record{owner_name} ) . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "extent", $$coll_record{num_items} ) . "\n";
  print { $$self{fh} } "  " . $self->emit( "formats", "text/txt" ) . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "publisher", { "id" => "https://www.hathitrust.org" } )
    . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "title", $$coll_record{collname} ) . "\n";
  print { $$self{fh} } "  "
    . $self->emit( "visibility", $$coll_record{shared} ? 'publish' : 'private' )
    . "\n";

  print { $$self{fh} } "  " . $$self{json}->encode("gathers") . ": [" . "\n";

  $$self{num_contents} = 0;
}

sub _fill_contents {
  my $self = shift;
  my ($rows) = @_;

  my $USE_CODES = { OCLC => 1, LCCN => 1, ISBN => 1 };
  my %SEEN      = ();
  foreach my $row (@$rows) {
    next unless ( $self->_include($row) );

    # my ( $htitem_id, $title, $author, $date, $book_id, $bib_id ) = @$row;
    $self->_process_row($row);
    $$row{catalog_url} =
      qq{https://catalog.hathitrust.org/Record/$$row{bib_id}};
    $$row{handle_url} = qq{https://hdl.handle.net/2027/$$row{htitem_id}};
    $$row{rights}     = $RightsGlobals::g_attribute_keys{ $$row{rights} };

    if ( $$self{num_contents} ) {
      print { $$self{fh} } ",\n";
    }
    $$self{num_contents} += 1;

    print { $$self{fh} } "    {\n";

    my $keys = [
      qw/title author date rights codes__oclc codes__lccn codes__isbn catalog_url htitem_id/
    ];
    foreach my $key (@$keys) {
      my $value = $$row{$key};
      my $last  = $key eq $$keys[-1];
      if ( $key =~ m,^codes__, ) {
        my @tmp = split( /__/, $key );
        $key   = $tmp[-1];
        $value = $$row{codes}{ uc $key };
      }
      print { $$self{fh} } "      " . $self->emit( $key, $value, $last ) . "\n";
    }
    print { $$self{fh} } "    }";
  }
}

sub finish {
  my $self = shift;
  print { $$self{fh} } "\n  ]" . "\n";
  print { $$self{fh} } "}";

  $$self{fh}->seek( 0, 0 );
  return $$self{fh};
}

1;