package MBooks::Operation::Test::TestAddMultipleItems;

#$Id: TestAddMultipleItems.pm,v 1.6 2010/05/06 22:54:54 tburtonw Exp $#
use Collection;
use AccessRights;


use base (Test::Class, MBooks::Operation::Test::OperationTestFixture);
use Test::More;



#Move this to invoking program
my $DEBUG="true";
$DEBUG=undef;

my $VERBOSE=undef;
$VERBOSE="true";

my $VERBOSE_ASSERTS=undef;
#$VERBOSE_ASSERTS="true";


sub readData: Test(setup)
{
    my $self = shift;
    my $id_ary_ref = [];
    my $hash_of_metahash={};
    
    
    while (<DATA>)
    {
        next if /^\s*$/;
        next if /^\s*\#/;
        chomp;
        my $metahash={};
        my (@fields) =split(/\|/,$_);

        my $id =$fields[0];
        push (@{$id_ary_ref}, $id);        

        $metahash->{id} = $id;
        $metahash->{author} = $fields[1];
        $metahash->{title} = $fields[2];
        $metahash->{date} = $fields[3];        
        $metahash->{rights} = $fields[4];        
        $metahash->{bib_id}="NULL";
        
        #normalize date
        $metahash->{date} = $metahash->{date} . '-00-00';
        
        $hash_of_metahash->{$id}= $metahash;
    }
    $self->set_id_ary_ref($id_ary_ref);
    $self->set_test_metadata($hash_of_metahash);
}

sub set_id_ary_ref 
{
    my $self = shift;
    my $ref = shift;
    $self->{'ids'}=$ref;
}

sub get_id_ary_ref 
{
    my $self = shift;
    return $self->{'ids'};
}

sub get_expected_metadata_hashref
{

}



#----------------------------------------------------------------------
sub update_item_metadata:Test(9)
{
    my $self = shift;
    diag("update function of add_item_metadata_to_database(co create_or_update_item_metadata):Operation") if $VERBOSE; 
    $self->do_update_item_metadata();
    
}

#-----------------------------------
sub do_update_item_metadata
{
    my $self = shift;
    my $flag = shift;
    my $co = $self->{co};
    my $dbh = $self->{'dbh'};


    my $statement = qq{SELECT * from test_item where item_id = 12};
    my $sth = DbUtils::prep_n_execute($dbh, $statement);
    my $hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    
    my $extern_id = $hash_ref->{'extern_item_id'};
    # add namespace to extern id
    $extern_id = 'mdp.' . $extern_id;
    
  #  SKIP:
#    {
#        skip "\$DEBUG flag not set to true",7, unless ($DEBUG);
#        diag("confirming test data for item 5 ");
#        $self->num_method_tests('update_item_metadata_op','14');
#        is ($hash_ref->{item_id}, 12, qq{checking item id });
#        is ($hash_ref->{extern_item_id}, 39015021112043, qq{checking extern_id/external_item_id});
#        is ($hash_ref->{display_title}, qq{BadTitle for update metadata,}, qq{ title is BadTitle for update metadata});
#        is ($hash_ref->{sort_title}, qq{motor book,}, qq{sort title is motor book});
#        is ($hash_ref->{author},  'Author, BadforTest, K.', qq{ author is Author, BadforTest, K.});
#        is ($hash_ref->{date}, '1903-00-00', qq{checking date});
#        is ($hash_ref->{rights}, 0, qq{checking rights = 0});
#    }

        is ($hash_ref->{display_title}, qq{BadTitle for update metadata,}, qq{ before: title is BadTitle for update metadata,});
        is ($hash_ref->{author},  'Author, BadforTest, K.', qq{ before: author is Author, BadforTest, K.});
        is ($hash_ref->{rights}, 0, qq{before: checking rights = 0});

    #setup and execute

    my $item_id =$self->setup_and_execute_update_item_metadata($flag, $extern_id, $hash_ref);
   
    # verify
    ok (defined($item_id),qq{item id returned from execute op defined});
    
    $statement = qq{SELECT * from test_item where item_id = $item_id};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    $new_hash_ref = $sth->fetchrow_hashref;
    $sth->finish;

    is ($new_hash_ref->{date},$hash_ref->{'date'}, qq{after: date is $hash_ref->{'date'}});
    is ($new_hash_ref->{display_title}, qq{The motor book, motor book,}, qq{after: title is 'The motor book, motor book'});
    is ($new_hash_ref->{author},  'Mercredy, R. J.', qq{after: author is 'Mercredy, R. J.'});

# Rights are different in dev database.  Here is what they are:
#mysql> mysql> select * from rights where namespace='mdp' and id='39015021112043';
#+-----------+----------------+------+--------+--------+----------+---------------------+------+
#| namespace | id             | attr | reason | source | user     | time                | note |
#+-----------+----------------+------+--------+--------+----------+---------------------+------+
#| mdp       | 39015021112043 |    9 |      1 |      1 | jhovater | 2006-11-28 09:31:21 | NULL |
#+-----------+----------------+------+--------+--------+----------+---------------------+------+
    is ($new_hash_ref->{rights}, 9, qq{after: rights = 9});
}

#-----------------------------------------------------
sub setup_and_execute_update_item_metadata
{
    my $self= shift;
    my $flag = shift;
    my $extern_id = shift;
    my $hash_ref = shift;
    my $co = $self->{co};
    my $C = $self->get_context();
        if ($DEBUG)
        {
            isa_ok($C,Context);    
        }
        my $temp_cgi = $C->get_object('CGI');
        my $action = "addits";
        my $to_coll_id =12345; # not used by AddItems, but must have as cgi param
      
 
        $temp_cgi->param('id',$extern_id);       
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c2',"$to_coll_id");
      
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $AddMultipleItems = new MBooks::Operation::AddMultipleItems($attr_ref);

         if ($DEBUG)
        {
            isa_ok($AddMultipleItems, MBooks::Operation::AddMultipleItems);
        }
    
        #EXECUTE
        my $status= $AddMultipleItems->execute_operation($C);

        #WARNING!!   should test for status here
#        is ($status,'0',"status from add items is 0 ok success");
        # adding items should set the cgi parameter id
        my $testCGI=$C->get_object('CGI');
        ok (defined($testCGI->param('iid')), qq{AddMultipleItems set cgi param iid});
        return $testCGI->param('iid');
}

#-----------------------------------------------------


# this tests the create function add_item_metadata_to_database (co->create_or_update_item_metadata)
sub add_multiple_items:Test(no_plan)
{
    my $self = shift;
    my $co = $self->{co};
    diag(" add multiple items") if $VERBOSE; 
    my $dbh = $self->{'dbh'};
    
    #get number of items in test db
    my $statement = qq{SELECT count(*) as numrecs from test_item };
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    $hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    my $numrecs = $hash_ref->{numrecs};

    
    my $action = "addits";
    my $to_coll_id =12345;
    my $C = $self->get_context();
    my $temp_cgi = $C->get_object('CGI');
    
    $temp_cgi->param('a',"$action");
    $temp_cgi->param('c2',"$to_coll_id");
    
    my $id_ary_ref = $self->get_id_ary_ref();
    $temp_cgi->append(-name=>'id',-values=>$id_ary_ref);
    #XXX TEMP DEBUG
    my $url = $temp_cgi->url(-query=>1);
    print "url is $url\n";
  #  exit;
    
    $C->set_object('CGI', $temp_cgi);

    my $attr_ref = $self->setup_operation($C);
    my $AddMultipleItems = new MBooks::Operation::AddMultipleItems($attr_ref);

    if ($DEBUG)
    {
        isa_ok($AddMultipleItems, MBooks::Operation::AddMultipleItems);
    }
    
    #EXECUTE
       
    my $status= $AddMultipleItems->execute_operation($C);
        
    # check number of records 
    #    my $expected_num_recs = $numrecs + xxx


#  | item_id | extern_item_id | display_title   | sort_title  | author          | date       | modified            | rights |
 
    foreach my $id (@{$id_ary_ref})
    {
        my $quoted_id = $dbh->quote($id);
        
        $statement = qq{SELECT * from test_item where extern_item_id = $quoted_id};
        $sth = DbUtils::prep_n_execute($dbh, $statement);
        my $new_hash_ref = $sth->fetchrow_hashref;
        $sth->finish;
        #test 
        # compare values from setup with values retrieved from database
        # WARNING !  if actual mirlyn values change test will fail unless we updaet setup table
        my $metadata_ref = $self->get_test_metadata_for_id($id);
            diag("\ntesting item $id $metadata_ref->{'title'}") if $VERBOSE; 
        is ($new_hash_ref->{display_title},$metadata_ref->{'title'}, "title is $metadata_ref->{'title'}");
        is ($new_hash_ref->{author}, $metadata_ref->{'author'}, "author is $metadata_ref->{'author'}");
        is ($new_hash_ref->{rights}, $metadata_ref->{'rights'}, "rights = $metadata_ref->{'rights'}");
        is ($new_hash_ref->{'date'}, $metadata_ref->{'date'}, "date = $metadata_ref->{'date'}");
        # do we need to test sort title as well?
    }
}

#-----------------------------------------------------------------------------------------------------
sub get_test_metadata_for_id
{
    my $self = shift;
    my $id = shift;
    my $metadata_ref= $self->{test_metadata}->{$id};
    return $metadata_ref;
}
#-----------------------------------------------------------------------------------------------------
sub set_test_metadata
{
    my $self = shift;
    my $hash_of_metahash = shift;
    $self->{test_metadata} = $hash_of_metahash;
}


#---------------------------------------------------------------------------------------------------------------
1;
__DATA__

# test ids
#id|author|title|date|rights
mdp.39015021054385|Institution of Locomotive Engineers (Great Britain)|Journal.|1911|2
mdp.39015021054393|Institution of Locomotive Engineers (Great Britain)|Journal.|1911|2
mdp.39015001241002|Indian Botanical Society.|Journal.|1919|2
mdp.39015001241010|Indian Botanical Society.|Journal.|1919|2
uc1.b4212567|Doudnikoff, Basil, 1933-|Information retrieval.|1973|2
mdp.39015003713727|Van Rijsbergen, C. J., 1943-|Information retrieval /|1979|2
uc1.b4213428|National Colloquium on Information Retrieval Philadelphia, Pa.)|Information retrieval : a critical view; [proceedings]|1967|2
mdp.39015058234611|Muir, John Kenneth, 1969-|The encyclopedia of superheroes on film and television / encyclopedia of superheroes on film and tel|2004|2
mdp.39015074225049|Martin, Onnie.|Much I do about nothing : zany interviews of an annulment lawyer with spouses of superheroes /|2007|2
mdp.39015047294510|Ellis, Warren.|The Invincible Iron Man : Extremis / Invincible Iron Man : Extremis /|2006|2


#uc1.b4212567
#mdp.39015003713727
#uc1.b4213428
#mdp.39015058234611
#mdp.39015055806270
#mdp.39015062626810
#mdp.39015060008276
#uc1.b4213406
#mdp.39015021054393
#mdp.39015001241002
#mdp.39015001241010
