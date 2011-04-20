#
#$Id$#
#facetconfig.pl
#
# perl data structures needed for faceting

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








1;
