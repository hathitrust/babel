#!/l/local/bin/perl -w
#$Id: runqueries.pl,v 1.10 2010/01/25 18:53:32 tburtonw Exp $#

use LWP;
use LWP::UserAgent;
use JSON::XS;
use Data::Dumper;


$ua = LWP::UserAgent->new;
$ua->agent("SolrTesterDevel ");



my $url='http://solr-sdr-search-7.umdl.umich.edu:8081/serve-7/select/?q=snow&version=2.2&start=0&indent=true&rows=2&facet.field=genreStr&facet=true&facet.field=language&facet.limit=30&facet.field=hlb3Str&wt=json&json.nl=arrarr';

#my $url='http://solr-sdr-search-7.umdl.umich.edu:8081/serve-7/select/?q=snow&version=2.2&start=0&indent=true&rows=2&facet.field=genreStr&facet=true&facet.field=language&facet.limit=30&facet.field=hlb3Str&wt=json';
my $r=getIt($ua,$url);
print $r;


my $coder = JSON::XS->new->ascii->pretty->allow_nonref;


#my  $parsed = $coder->decode ($r);

##print Data::Dumper->Dump($parsed);


#my $facethash= $parsed->{'facet_counts'}->{'facet_fields'};
#foreach my $field (keys %{$facethash})
#{
#    print "\n======\n$field\n";
#    $aryOfary = ($facethash->{$field});
#    foreach my $ary (@{$aryOfary})
    
#    {
#        $name=$ary->[0];
#        $value=$ary->[1];
#        print "$name $value\n";
#    }
    
#}                

#my $foo ="bar";


sub getIt
{
    my $ua =shift;
    my $url = shift;
    
    my $res = $ua->get($url);
    if ($res->is_success) 
    {
        my $content= $res->content;
        return $content;
    }
    else 
    {
        return $res->status_line;
    }

}
