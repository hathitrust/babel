use strict;
use warnings;

use Test::More;

subtest 'solr9 facetconfig has incompatible fields removed' => sub {
  our ($param_2_solr_map, $field_2_display, $map2han);

  my $rc = do "$ENV{SDRROOT}/ls/lib/Config/solr9/facetconfig.pl";
  ok(defined $rc, "solr9/facetconfig.pl loaded (do returned defined value): $! $@")
    or BAIL_OUT("Cannot load solr9/facetconfig.pl: $! $@");

  ok(ref $param_2_solr_map eq 'HASH', 'param_2_solr_map defined after loading solr9 copy');
  ok(!exists $param_2_solr_map->{'hlb3'},
     'hlb3 absent from param_2_solr_map in solr9 copy');

  ok(ref $field_2_display eq 'HASH', 'field_2_display defined after loading solr9 copy');
  ok(!exists $field_2_display->{'hlb3'},
     'hlb3 absent from field_2_display in solr9 copy');

  ok(ref $map2han eq 'HASH', 'map2han (Han/CJK mapping block) defined after loading solr9 copy');
  ok(!exists $map2han->{'fullgenre'},
     'fullgenre absent from Han/CJK mapping block in solr9 copy');
  ok(!exists $map2han->{'hlb3'},
     'hlb3 absent from Han/CJK mapping block in solr9 copy');
  ok(!exists $map2han->{'fullgeographic'},
     'fullgeographic absent from Han/CJK mapping block in solr9 copy');
};

subtest 'solr9/ is a self-consistent parallel config dir' => sub {
  my $s6 = "$ENV{SDRROOT}/ls/lib/Config";
  my $s9 = "$ENV{SDRROOT}/ls/lib/Config/solr9";

  my $slurp = sub {
    my $path = shift;
    open(my $fh, '<:raw', $path) or return undef;
    local $/;
    my $content = <$fh>;
    close($fh);
    return $content;
  };

  # Files that are intentionally byte-identical between the Solr 6 dir and its
  # solr9/ parallel copy. If one is edited without mirroring the other, this
  # fails -- catching silent drift while both copies must coexist during the
  # Solr 6 -> Solr 9 transition. At cutover, solr9/* is moved up and the Solr 6
  # remainder deleted.
  for my $f (qw(AB_test_config bindings.pl langformat.yaml js_css_filelist.txt)) {
    is($slurp->("$s9/$f"), $slurp->("$s6/$f"),
       "solr9/$f is byte-identical to ls/lib/Config/$f");
  }

  # Mirlyn_dismaxsearchspecs.yaml is loaded by no ls/ or slip-lib Perl code and
  # was removed from both dirs (2026-08-31). Guard against it being re-added.
  ok(!-e "$s6/Mirlyn_dismaxsearchspecs.yaml",
     'Mirlyn_dismaxsearchspecs.yaml absent from ls/lib/Config/');
  ok(!-e "$s9/Mirlyn_dismaxsearchspecs.yaml",
     'Mirlyn_dismaxsearchspecs.yaml absent from ls/lib/Config/solr9/');

  # solr9/facetconfig.pl must resolve langformat.yaml from its own directory
  # (via dirname(__FILE__)), not reach back into the hardcoded Solr 6 path, so
  # the solr9/ copy stays relocatable as a single unit.
  my $fc9 = $slurp->("$s9/facetconfig.pl");
  ok(defined $fc9, 'solr9/facetconfig.pl readable');
  unlike($fc9, qr{/ls/lib/Config/langformat\.yaml},
     'solr9/facetconfig.pl does not hardcode the Solr 6 langformat.yaml path');
  like($fc9, qr{dirname\(__FILE__\)},
     'solr9/facetconfig.pl resolves langformat.yaml relative to its own dir');
};

done_testing();