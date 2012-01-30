#
#$Id$#
#facetconfig.pl
#

# perl data structures needed for faceting and advanced search
use YAML::Any;



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
'hlb3Str' =>'Academic Discipline',
'geographicStr' =>'Place',
'era' =>'Era',
'genreStr'=>'genre',
'geographicStr' =>'Region',
'facet_lang' =>'Language',
'facet_format' =>'Original Format',
};


# temporary replace topicStr (Subject) with hlb3Str until we patch
# production for the too many words topicStr bug
# removed                 hlb3Str per Suz email 7/7/11
# removed                 geographicStr per Suz


@facet_order=qw{
                topicStr
                authorStr 
                language 
                countryOfPubStr 
                publishDateRange 
                format 
                htsource 
            };
# for debugging


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

# Advanced search config stuff here


# cgi params for type of search mapped to the solr field name that we want
# XXX which Solr subject field is appropriate for keyword searching?
#XXX read from config file.  check marc mapping for proper field for subject searching and hlb3 searching
# XXX this map is probably not needed if we put the right field name in the html forms

# need to compare dismax.yaml with searchspecs.yaml
    
$param_2_solr_map = {
                           'author'=>'author',
                           'title'=>'title',
                           'debugtitle' =>'debugtitle',
                           'debugocr'=>'debugocr',
                           'subject'=>'subject', 
                           'hlb3'=>'hlb3',
                            'ocronly'=>'ocronly',
                            'ocr'=>'ocr',
                            'ocr2'=>'ocr2',
                            'ocrpf'=>'ocrpf',
                            'all'=>'all',
                            'callnumber'=>'callnumber',
                            'publisher'=>'publisher',
                            'series'=>'serialtitle',
                            'year'=>'year',
                            'isn'=>'isn',
                          };
#----------------------------------------------------------------------
#
#Advanced Search config
#
#----------------------------------------------------------------------

$field_2_display={
                  'author'=>'Author',
                  'title'=>'Title',
                  'subject'=>'Subject', 
                  'hlb3'=>'Academic Discipline',
                  'ocronly'=>'Just Full Text',
                  'ocr'=>'Everything',
                  'ocr2'=>'ocr2',
                  'ocrpf'=>'ocrpf',
                  'all'=>'All Metadata',
                  'callnumber'=>'Callnumber',
                  'publisher'=>'Publisher',
                  'series'=>'Series Title',
                  'year'=>'Year of Publication',
                  'isn'=>'ISBN/ISSN',
                 };

$field_order=['ocronly',
              'ocr',
              'title',
              'author',
              'subject',
              'publisher',
              'series',
              'isn',
             ];

$op_order=['AND','OR'];

# default field for each row starting with fisrt row
$default_fields = ['ocr',
                 'title',
                  ];
# default any all phrase
$default_anyall = ['all',
                   'all',
                   'any',
                   'phrase',
                  ];
# mappings of anyall to user strings
$anyall_2_display = {"any"=>"any of these words",
                     "all"=>"all of these words", 
                     "phrase"=>"this exact phrase"
                    };

#----------------------------------------------------------------------
sub getRelWeights
{
    my $yamlfile = shift;
#    print STDERR "yamlfile is $yamlfile\n";
    
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
