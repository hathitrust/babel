#
#$Id$#
#facetconfig.pl
#

# perl data structures needed for faceting and advanced search
use YAML::Any;

#foobar XXX remove after testing
#my $rel_weights_file_A = $ENV{SDRROOT} . '/ls/lib/Config/dismax_A.yaml';
#my $rel_weights_file_B = $ENV{SDRROOT} . '/ls/lib/Config/dismax_B.yaml';

my $lang_format_file = $ENV{SDRROOT} . '/ls/lib/Config/langformat.yaml';

# date type (date|both)
# date= regular bib date, both=date from parsed enumcron if exists otherwise bib

$date_type="both";

$facet_limit=30;

$facet_initial_show=5;


$facet_to_label_map =
{
 'ht_availability' => 'Viewability',
 'topicStr' =>'Subject',
'authorStr' =>'Author',
'language008_full' =>'Language',
'countryOfPubStr' =>'Place of Publication',
'publishDateRange' =>'Date of Publication',
'bothPublishDateRange' =>'Date of Publication',
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
                language008_full 
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

# rel ranking  foobar XXX remove after testing
#$rel_weights_A= getRelWeights("$rel_weights_file_A");
#$rel_weights_B= getRelWeights("$rel_weights_file_B");

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
                  'ocronly'=>'Only Full Text',
                  'ocr'=>'Full Text &amp; All Fields',
                  'ocr2'=>'ocr2',
                  'ocrpf'=>'ocrpf',
                  'all'=>'All Fields',
                  'callnumber'=>'Callnumber',
                  'publisher'=>'Publisher',
                  'series'=>'Series Title',
                  'year'=>'Year of Publication',
                  'isn'=>'ISBN, ISSN, OCLC, etc.',
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
                   'author',
                   'subject',
                  ];
# default any all phrase for each of the groups
$default_anyall = ['all',
                   'phrase',
		   'any',
		   'all',
                  ];
#order of anyall for each option group
$anyall_order = ['all',
		   'any',
                   'phrase',
		];

# mappings of anyall to user strings
$anyall_2_display = {"any"=>"any of these words",
                     "all"=>"all of these words", 
                     "phrase"=>"this exact phrase",

                    };
#----------------------------------------------------------------------
# yop defaults and mappings
$yop_default ='after';
$yop_order =["before","after","between","in"];

# $yop_map = {
#             "before" => "Before or during",
#             "after" => "During or after",
#             "between" => "Between",
#             "in" => "Only during",
#            };
$yop_map = {
            "before" => "Before",
            "after" => "After",
            "between" => "Between",
            "in" => "Only during",
           };
$yop_input_order = ['yop-start','yop-end','yop-in'];
$yop2label={
            'yop-start'=>"Starting Year",
            'yop-end'=>"Ending Year",
            'yop-in'=>"In Year",
};
$yop2name={
            'yop-start'=>"pdate_start",
            'yop-end'=>"pdate_end",
            'yop-in'=>"pdate",
};

#----------------------------------------------------------------------
# 
$map2han={
          'ocr'=>'hanUnigrams',
          'title'=>'titleHan',
	'author'=>'authorHan',
	'author2'=>'author2Han',
	'allfields'=>'allfieldsHan',
	'allfieldsProper'=>'allfieldsProperHan',
	'publisher'=>'publisherHan',
	'Vauthor'=>'VauthorHan',
	'author_top'=>'author_topHan',
	'author_rest'=>'author_restHan',
	'volume_enumcron'=>'volume_enumcronHan',
	'Vtitle'=>'VtitleHan',
	'title_ab'=>'title_abHan',
	'title_a'=>'title_aHan',
	'titleProper'=>'titleProperHan',
	'title_top'=>'title_topHan',
	'title_topProper'=>'title_topProperHan',
	'title_restProper'=>'title_restProperHan',
	'title_rest'=>'title_restHan',
	'series'=>'seriesHan',
	'series2'=>'series2Han',
	'serialTitle_ab'=>'serialTitle_abHan',
	'serialTitle_a'=>'serialTitle_aHan',
	'serialTitle'=>'serialTitleHan',
	'serialTitleProper'=>'serialTitleProperHan',
	'serialTitle_restProper'=>'serialTitle_restProperHan',
	'serialTitle_rest'=>'serialTitle_restHan',
	'topic'=>'topicHan',
	'topicProper'=>'topicProperHan',
	'fullgenre'=>'fullgenreHan',
	'genre'=>'genreHan',
	'hlb3'=>'hlb3Han',
	'geographic'=>'geographicHan',
	'country_of_pub'=>'country_of_pubHan',
	'fullgeographic'=>'fullgeographicHan',
         };

#----------------------------------------------------------------------
# load list of languages and formats for dropdown in advanced search menu
($language_list,$formats_list,$location_list) = getLangFormats($lang_format_file);

#----------------------------------------------------------------------
sub getLangFormats
{
    my $yamlfile = shift;
    my ($language_list,$formats_list);
    my $parsed = readYamlFile($yamlfile);
    $language_list= $parsed->{'languages'};
    $formats_list = $parsed->{'formats'};
    $location_list = $parsed->{'locations'};
    return ($language_list,$formats_list,$location_list);
}


#----------------------------------------------------------------------
sub getRelWeights
{
    my $yamlfile = shift;
    my $weights = readYamlFile($yamlfile);
    return $weights;
}


#----------------------------------------------------------------------
sub readYamlFile
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
