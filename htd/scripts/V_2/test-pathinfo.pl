#! /usr/bin/env perl

use warnings;
use strict;

my %patterns =
  (
   type                =>                             '^/(type)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   
   volume_structure    =>       '^/(volume/structure|structure)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   volume_aggregate    =>       '^/(volume/aggregate|aggregate)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   volume_pageimage    =>       '^/(volume/pageimage|pageimage)/((_NS_)\.((_ARK_)|(_ID_P_)))/(\d+)$',
   volume_pageocr      =>           '^/(volume/pageocr|pageocr)/((_NS_)\.((_ARK_)|(_ID_P_)))/(\d+)$',
   volume_pagecoordocr => '^/(volume/pagecoordocr|pagecoordocr)/((_NS_)\.((_ARK_)|(_ID_P_)))/(\d+)$',
   volume_pagemeta     =>         '^/(volume/pagemeta|pagemeta)/((_NS_)\.((_ARK_)|(_ID_P_)))/(\d+)$',
   volume_meta         =>                 '^/(volume/meta|meta)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   volume              =>                           '^/(volume)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   
   article             =>                          '^/(article)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   asset               =>                    '^/(article/asset)/((_NS_)\.((_ARK_)|(_ID_P_)))/(\d+)$',
   supplement          =>               '^/(article/supplement)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   article_meta        =>                     '^/(article/meta)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   article_structure   =>                '^/(article/structure)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
   article_aggregate   =>                '^/(article/aggregate)/((_NS_)\.((_ARK_)|(_ID_P_)))$',
  );

# separate, for readability
my $ad_pat = 'ark:/13960/(t|fk)\d[a-z\d][a-z\d]\d[a-z\d][a-z\d]\d[a-z\d]';
my $id_pat = '.+';
my $ns_pat = '.{2,4}';

my @ids = ('mdp.39015011716761', 'uc2.ark:/13960/t74t6w95q');

my %pathinfo =
  (
   # type
   '/type/_ID_1_'                         => {'resource' => 'type',
                                              'test' => '/type/_ID_1_', 'pass' => 0},
   
   # volume + subresource
   '/volume/pageimage/_ID_1_/42'          => {'resource' => 'volume/pageimage',
                                              'test' => '/volume/pageimage/_ID_1_/42', 'pass' => 0},
   '/volume/pageocr/_ID_1_/42'            => {'resource' => 'volume/pageocr',
                                              'test' => '/volume/pageocr/_ID_1_/42', 'pass' => 0},
   '/volume/pagecoordocr/_ID_1_/42'       => {'resource' => 'volume/pagecoordocr',
                                              'test' => '/volume/pagecoordocr/_ID_1_/42', 'pass' => 0},
   '/volume/pagemeta/_ID_1_/42'           => {'resource' => 'volume/pagemeta',
                                              'test' => '/volume/pagemeta/_ID_1_/42', 'pass' => 0},
   '/volume/meta/_ID_1_'                  => {'resource' => 'volume/meta',
                                              'test' => '/volume/meta/_ID_1_', 'pass' => 0},
   '/volume/structure/_ID_1_'             => {'resource' => 'volume/structure',
                                              'test' => '/volume/structure/_ID_1_', 'pass' => 0},
   '/volume/aggregate/_ID_1_'             => {'resource' => 'volume/aggregate',
                                              'test' => '/volume/aggregate/_ID_1_', 'pass' => 0},
   '/volume/_ID_1_'                       => {'resource' => 'volume',
                                              'test' => '/volume/_ID_1_', 'pass' => 0},
   
   # article + subresource
   '/article/asset/_ID_1_/42'             => {'resource' => 'article/asset',
                                              'test' => '/article/asset/_ID_1_/42', 'pass' => 0},
   '/article/supplement/_ID_1_'           => {'resource' => 'article/supplement',
                                              'test' => '/article/supplement/_ID_1_', 'pass' => 0},
   '/article/structure/_ID_1_'            => {'resource' => 'article/structure',
                                              'test' => '/article/structure/_ID_1_', 'pass' => 0},
   '/article/aggregate/_ID_1_'            => {'resource' => 'article/aggregate',
                                              'test' => '/article/aggregate/_ID_1_', 'pass' => 0},
   '/article/_ID_1_'                      => {'resource' => 'article',
                                              'test' => '/article/_ID_1_', 'pass' => 0},
  );

my $call = 0;
my $matches = 0;
my %TEST_PATHINFO;

foreach my $id (@ids) {
    print("\n");
    
    init_test($id);
    
    foreach my $path (sort keys %TEST_PATHINFO) {
        printf("PATH=%s\n", $path);
        
        foreach my $pat (keys %patterns) {
            my $regexp = $patterns{$pat};
            $regexp =~ s,_ARK_,$ad_pat,;
            $regexp =~ s,_ID_P_,$id_pat,;
            $regexp =~ s,_NS_,$ns_pat,;
            
            my @parts = ($path =~ m,$regexp,);
            my $test_resource = $TEST_PATHINFO{$path}->{resource};
            my $match = scalar @parts;
            
            $call++;
            $matches += ($match > 0);
            
            testParams($match, $path, $regexp, $test_resource,
                       $parts[0], $parts[1], $parts[2], $parts[3], $parts[7]);
        }
    }
}


printf("Matches=%s Required matches=%s\n", $matches, (scalar @ids) * (scalar keys %TEST_PATHINFO));
foreach my $path (keys %TEST_PATHINFO) {
    if (! $TEST_PATHINFO{$path}->{pass}) {
        printf("Unmatched path=%s\n", $path);
    }
}

exit 0;

sub init_test {
    my $id = shift;
    
    %TEST_PATHINFO = ();
    
    foreach my $key (keys %pathinfo) {
        my $testkey = $key;
        $testkey =~ s,_ID_1_,$id,;
        my $testtest = $pathinfo{$key}->{test};
        $testtest =~ s,_ID_1_,$id,;
        my $testresource = $pathinfo{$key}->{resource};
        my $testpass = 0;
        
        $TEST_PATHINFO{$testkey} = {'resource' => $testresource, 'test' => $testtest, 'pass' => $testpass};
    }
}

sub test_fail {
    my ($path, $resource, $id, $namespace, $barcode, $seq) = @_;
    
    # id = namespace.barcode?
    if ($id ne "$namespace.$barcode") {
        return "FAIL: ns=$namespace barcode=$barcode id=$id mismatch";
    }
    
    my $test = "/$resource/$id";
    if ($seq) {
        $test .= "/$seq";
    }
    if ($test ne $TEST_PATHINFO{$path}->{test}) {
        return "FAIL: Test=$test path=$path";
    }
    return 0;
}

sub testParams {
    #                                           0          1    2           3         8
    my ($match, $path, $regexp, $test_resource, $resource, $id, $namespace, $barcode, $seq) = @_;
    
    if ($match) {
        if (my $failmsg = test_fail($path, $resource, $id, $namespace, $barcode, $seq)) {
            print("$failmsg\n");
        }
        
        $seq = $seq ? $seq : '';        
        # printf("\tRE=%s \n\t   resource=%s id=%s ns=%s bc=%s seq=%s\n", $regexp, $resource, $id, $namespace, $barcode, $seq);
        printf("\tMATCHED\n");
        
        if ($TEST_PATHINFO{$path}->{pass}) {
            printf("\t ALREADY MATCHED=%s path=%s\n", $regexp, $path);
        }
        else {
            $TEST_PATHINFO{$path}->{pass} = 1;
        }
    }
    else {
        $resource = $resource ? $resource : '';
        if ($resource eq $test_resource) {
            printf("path=%s RE=%s\n", $path, $regexp);
        }
    }
}

