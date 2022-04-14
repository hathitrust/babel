package Download::Builder::HathiFiles;

use File::Temp;

our $LOOP_LIMIT = 10000;

sub new {
  my $class = shift;

  my $self = {@_};
  $$self{params} = [];

  if ( $$self{is_ft} ) {
    $$self{rights_map} = {};
    foreach my $key ( @{ $$self{rights_ref} } ) {
      $$self{rights_map}{$key} = 1;
    }
  }

  bless $self, $class;
  return $self;
}

sub open {
  my $self = shift;
  my ($suffix) = @_;
}

sub writer {
  my $self = shift;
  my ( $writer ) = @_;
  $$self{fh} = $writer;
}

sub write {
  my $self = shift;
  $$self{fh}->write(@_);
}

sub run {
  my $self = shift;

  $self->init();

  my $sql = $self->_get_query();
  my $sth = $$self{dbh}->prepare($sql);

  my $extern_item_id = '';
  my $total = 0;

  while ( $total < $$self{num_items} ) {
    $sth->execute($$self{coll_id}, $extern_item_id, @{ $$self{params} });
    my $rows = $sth->fetchall_arrayref($$self{slice});
    last unless ( scalar @$rows );
    $self->_fill_contents($rows);
    $total += scalar @$rows;
    $extern_item_id = $self->_get_extern_item_id($$rows[-1]);
  }

  $self->finish();
}

sub _get_extern_item_id {
  my $self = shift;
  my ( $row ) = @_;
  return defined $$self{slice} ? $$row{htid}  : $$row[0];
}

sub _get_access {
  my $self = shift;
  my ( $row ) = @_;
  return defined $$self{slice} ? $$row{access}  : $$row[1];
}

sub _include {
  my $self      = shift;
  my ($row)     = @_;
  my $htitem_id = $self->_get_extern_item_id($row);
  if ( $$self{is_ft} ) {
    my $access = $self->_get_access($row);
    return 0 unless ( $$self{rights_map}{$access} );
  }
  if ( ref( $$self{include} ) ) {
    return exists( $$self{include}{$htitem_id} );
  }
  return 1;
}

sub _get_query {
  my $self = shift;

  my $inner_loop_sql = <<SQL;
SELECT mx.extern_item_id 
FROM mb_coll_item mx 
WHERE mx.MColl_ID = ? AND mx.extern_item_id > ?
SQL

  $inner_loop_sql .= q{ORDER BY mx.extern_item_id};

  my $loop_sql = <<SQL;
SELECT 
    hf.htid,
    hf.access,
    hf.rights_code AS 'rights',
    hf.bib_num AS 'ht_bib_key',
    hf.description,
    hf.source,
    hf.source_bib_num,
    COALESCE(GROUP_CONCAT(DISTINCT hf_oclc.value SEPARATOR ','), '') AS oclc_num, 
    COALESCE(GROUP_CONCAT(DISTINCT hf_isbn.value SEPARATOR ','), '') AS isbn, 
    COALESCE(GROUP_CONCAT(DISTINCT hf_issn.value SEPARATOR ',')) AS issn,         
    COALESCE(GROUP_CONCAT(DISTINCT hf_lccn.value SEPARATOR ',')) AS lccn,
    hf.title,
    hf.imprint,
    hf.rights_reason AS 'rights_reason_code',
    hf.rights_timestamp,
    hf.us_gov_doc_flag,
    hf.rights_date_used,
    hf.pub_place,
    hf.lang_code AS 'lang',
    hf.bib_fmt,
    hf.collection_code,
    hf.content_provider_code,
    hf.responsible_entity_code,
    hf.digitization_agent_code,
    hf.access_profile_code,
    hf.author
FROM hf
JOIN ( 
  $inner_loop_sql
  LIMIT $LOOP_LIMIT ) mxx ON hf.htid = mxx.extern_item_id 
LEFT OUTER JOIN hf_oclc ON hf.htid = hf_oclc.htid
LEFT OUTER JOIN hf_lccn ON hf.htid = hf_lccn.htid
LEFT OUTER JOIN hf_issn ON hf.htid = hf_issn.htid
LEFT OUTER JOIN hf_isbn ON hf.htid = hf_isbn.htid
GROUP BY hf.htid
SQL

  return $loop_sql;
}

sub _get_columns {
  my $self = shift;
  return (
    'htid',
    'access',
    'rights',
    'ht_bib_key',
    'description',
    'source',
    'source_bib_num',
    'oclc_num',
    'isbn',
    'issn',
    'lccn',
    'title',
    'imprint',
    'rights_reason_code',
    'rights_timestamp',
    'us_gov_doc_flag',
    'rights_date_used',
    'pub_place',
    'lang',
    'bib_fmt',
    'collection_code',
    'content_provider_code',
    'responsible_entity_code',
    'digitization_agent_code',
    'access_profile_code',
    'author',
    'catalog_url',
    'handle_url',
  );
}

sub _process_row {
  my $self = shift;
  my ($row) = @_;
}

package Download::Builder::HathiFiles::Text;

use base qw/Download::Builder::HathiFiles/;
use utf8;

our $IDX_HTID = 0;
our $IDX_HT_BIB_KEY = 3;

sub new {
  my $class = shift;

  my $self = $class->SUPER::new(@_);
  $$self{slice} = undef;
  $self->open('.txt');
  binmode( $$self{fh}, ":utf8" );
  return $self;
}

sub init {
  my $self = shift;
  $self->write(join( "\t",
    $self->_get_columns
  ) . "\n");

}

sub _fill_contents {
  my $self = shift;
  my ($rows) = @_;

  foreach my $row (@$rows) {
    next unless ( $self->_include($row) );
    $self->_process_row($row);

    push @$row, qq{https://catalog.hathitrust.org/Record/$$row[$IDX_HT_BIB_KEY]};
    push @$row, qq{https://hdl.handle.net/2027/$$row[$IDX_HTID]};

    my $line = join("\t", @$row);
    utf8::encode($line);

    $self->write($line . "\n");
  }
}

sub finish {
  my $self = shift;
}

package Download::Builder::HathiFiles::JSON;

use base qw/Download::Builder::HathiFiles/;
use JSON::XS;

sub new {
  my $class = shift;

  my $self = $class->SUPER::new(@_);
  $$self{slice} = {};
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
  my $coll_id     = $$self{coll_id};

  $self->write('{' . "\n");
  $self->write("  "
    . $self->emit( "id",
    "https://babel.hathitrust.org/cgi/mb?a=listis;c=$coll_id" )
    . "\n");
  $self->write("  "
    . $self->emit( "type", "http://purl.org/dc/dcmitype/Collection" ) . "\n");
  $self->write("  "
    . $self->emit( "description", $$coll_record{description} ) . "\n");
  # $self->write("  "
  #   . $self->emit( "created", $$coll_record{owner_name} ) . "\n");
  $self->write("  "
    . $self->emit( "extent", $$coll_record{num_items} ) . "\n");
  $self->write("  " . $self->emit( "formats", "text/txt" ) . "\n");
  $self->write("  "
    . $self->emit( "publisher", { "id" => "https://www.hathitrust.org" } )
    . "\n");
  $self->write("  "
    . $self->emit( "title", $$coll_record{collname} ) . "\n");
  $self->write("  "
    . $self->emit( "visibility", $$coll_record{shared} ? 'publish' : 'private' )
    . "\n");

  $self->write("  " . $$self{json}->encode("gathers") . ": [" . "\n");

  $$self{num_contents} = 0;
}

sub _fill_contents {
  my $self = shift;
  my ($rows) = @_;

  my @columns = $self->_get_columns();

  foreach my $row ( @$rows ) {
    next unless ( $self->_include($row) );
    $self->_process_row($row);

    $$row{catalog_url} =
      qq{https://catalog.hathitrust.org/Record/$$row{ht_bib_key}};
    $$row{handle_url} = qq{https://hdl.handle.net/2027/$$row{htid}};

    if ( $$self{num_contents} ) {
      $self->write(",\n");
    }
    $$self{num_contents} += 1;

    $self->write("    {\n");
    foreach my $key (@columns) {
      my $value = $$row{$key};
      my $last  = $key eq $columns[-1];
      $self->write("      " . $self->emit( $key, $value, $last ) . "\n");
    }
    $self->write("    }");
  }
}

sub finish {
  my $self = shift;
  $self->write("\n  ]" . "\n");
  $self->write("}");
  return $$self{fh};
}

1;