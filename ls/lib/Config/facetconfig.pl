#
#$Id$#
#facetconfig.pl
#
# perl data structures needed for faceting
use YAML::XS;


my $rel_weights_file = $ENV{SDRROOT} . '/ls/lib/Config/dismax.yaml';
$facet_limit=30;
$facet_initial_show=5;


$facet_to_label_map =
{
 'ht_availability' => 'Viewability',
 'topicStr' =>'Subject',
'authorStr' =>'Author',
'language' =>'Language',
'countryOfPubStr' =>'Place of Publication',
'publishDateRange' =>'Date of Publication',
'format' =>'Original Format',
'htsource' =>'Original Location',
'hlb3Str' =>'Topic',
'geographicStr' =>'Place',
'era' =>'Era',
'genreStr'=>'genre',
#''=>'',
};


# temporary replace topicStr (Subject) with hlb3Str until we patch
# production for the too many words topicStr bug
@facet_order=qw{
                ht_availability 
                hlb3Str
                authorStr 
                language 
                countryOfPubStr 
                publishDateRange 
                format 
                htsource 
            };

#@facet_order=qw{
#                ht_availability 
#                topicStr 
#                authorStr 
#                language 
#                countryOfPubStr 
#                publishDateRange 
#                format 
#                htsource 
#            };

# rel ranking
$rel_weights= getRelWeights("$rel_weights_file");

# HT/mirlyn out of the box yaml file contains these keys
#      'subject2'
#      'journaltitle'
#      'serialtitle'
#      'subject'
#      'author'
#      'all'
#      'hlb'
#      'realauth'
#      'title'




$all_weights     = $rel_weights->{'all'};

#my $title_weights   = $rel_weights->{'title'};
#my $author_weights  = $rel_weights->{'author'};
#my $subject_weights = $rel_weights->{'subject'};




sub getRelWeights
{
    my $yamlfile = shift;
    print STDERR "yamlfile is $yamlfile\n";
    
    my $yaml = do 
    {
        local $/;
        open (my ($fh), '<', $yamlfile) or die $!;
        <$fh>;
    };
    
    my $parsed = Load $yaml;
    return $parsed;
}




1;
