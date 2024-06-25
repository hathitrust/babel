package MBooks::Operation::Test::TestAddItems;

#$Id: TestAddItems.pm,v 1.4 2009/08/14 15:30:13 tburtonw Exp $#
use Collection;
use AccessRights;


use base (Test::Class, MBooks::Operation::Test::OperationTestFixture);
use Test::More;



#Move this to invoking program
my $DEBUG="true";
#$DEBUG=undef;

my $VERBOSE=undef;
$VERBOSE="true";

my $VERBOSE_ASSERTS=undef;
#$VERBOSE_ASSERTS="true";



#----------------------------------------------------------------------

#    mysql> select item_id, extern_item_id, display_title from test_item;
#    +---------+----------------+---------------------------------------------------+
#    | item_id | extern_item_id | display_title                                     |
#    +---------+----------------+---------------------------------------------------+
#    |       1 | 39015020230051 | The automobile hand-book;                         |
#    |       2 | 39015021038404 | ChaufÃ¯eur chaff; or, Automobilia,                |
#    |       3 | 39015002057589 | Diseases of a gasolene automobile and how to cure |
#    |       4 | 39015021302552 | The happy motorist; an introduction to the use    |
#    |       5 | 39015021112043 | The motor book,                                   |
#    |       6 | 39015021302602 | The motor-car; an elementary handbook on its      |
#    |       7 | 39015021302586 | Motor vehicles for business purposes; a practical |
#    |       8 | 39015020229939 | Self-propelled vehicles; a practical treatise on  |
#    |       9 | 39015021057735 | Tramways et automobiles,                          |
#    |      10 | 39015021054963 | Tube, train, tram, and car, or, Up-to-date        |
#    |      11 | 39015002056151 | Whys and wherefores of the automobile, A simple   |
#    +---------+----------------+---------------------------------------------------+
sub get_item_id_from_extern_id:Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("get_item_id_from_extern_id") if $VERBOSE; 
    my $extern_id= 39015021038404; #extern_id for item 2 see above
    is ($co->get_item_id_from_extern_id($extern_id),2,qq{extern_id in db});
    $extern_id=666;# non-existant extern_id
    is ($co->get_item_id_from_extern_id($extern_id),undef,qq{extern_id $extern_id not in db});
    
}
#----------------------------------------------------------------------
sub update_item_metadata:Test(7)
{
    my $self = shift;
 diag("update function of create_or_update_item_metadata") if $VERBOSE; 
    $self->do_update_item_metadata('foo');
    
}

sub update_item_metadata_op:Test(7)
{
    my $self = shift;
    diag("update function of create_or_update_item_metadata:Operation") if $VERBOSE; 
    $self->do_update_item_metadata('op');
    
}

#-----------------------------------
sub do_update_item_metadata
{
    my $self = shift;
    my $flag = shift;
    my $co = $self->{co};
   

    my $dbh = $self->{'dbh'};
    


#  mysql> select * from test_item where item_id=5;
#  +---------+----------------+-----------------+-------------+-----------------+------------+---------------------+--------+
#  | item_id | extern_item_id | display_title   | sort_title  | author          | date       | modified            | rights |
#  +---------+----------------+-----------------+-------------+-----------------+------------+---------------------+--------+
#  |       5 | 39015021112043 | The motor book, | motor book, | Mercredy, R. J. | 1903-01-01 | 2007-06-21 17:07:56 |      6 |
#  +---------+----------------+-----------------+-------------+-----------------+------------+---------------------+--------+
#  1 row in set (0.00 sec)


    my $statement = qq{SELECT * from test_item where item_id = 5};
    my $sth = DbUtils::prep_n_execute($dbh, $statement);
    my $hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    
    my $extern_id = $hash_ref->{'extern_item_id'};
    # add namespace to extern id
    $extern_id = 'mdp.' . $extern_id;
    
     if ($DEBUG)
    {
        diag("confirming test data for item 5 ");
        
        $self->num_method_tests('update_item_metadata','14');
        is ($hash_ref->{item_id}, 5, qq{checking item id });
        is ($hash_ref->{extern_item_id}, 39015021112043, qq{checking extern_id/external_item_id});
        is ($hash_ref->{display_title}, qq{The motor book,}, qq{ title is The motor book});
        is ($hash_ref->{sort_title}, qq{motor book,}, qq{sort title is motor book});
        is ($hash_ref->{author},  'Mercredy, R. J.', qq{ author is Mercredy});
        is ($hash_ref->{date}, '1903-00-00', qq{checking date});
        is ($hash_ref->{rights}, 6, qq{checking rights = 6});
    }
    
    is ($hash_ref->{display_title}, qq{The motor book,}, qq{before: title is The motor book});
    is ($hash_ref->{author},  'Mercredy, R. J.', qq{before: author is Mercredy});
    is ($hash_ref->{rights}, 6, qq{before: rights = 6});

    #setup and execute

    my $item_id =$self->setup_and_execute_update_item_metadata($flag, $extern_id, $hash_ref);
   
    # verify
    SKIP:
        {
            skip "can't set expected value for newly assigned id",1;
            is ($item_id,5,qq{extern_id $extern_id is item $item_id});
        }    
    $statement = qq{SELECT * from test_item where item_id = $item_id};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    $new_hash_ref = $sth->fetchrow_hashref;
    $sth->finish;

    
    
    is ($new_hash_ref->{date},$hash_ref->{'date'}, qq{after: date is $hash_ref->{'date'}});
    is ($new_hash_ref->{display_title}, qq{This is a new title}, qq{after: title is 'This is a new title'});
    is ($new_hash_ref->{author},  'foo,von author', qq{after: author is 'foo'});
    is ($new_hash_ref->{rights}, 5, qq{after: rights = 5});
    
}
#-----------------------------------------------------
sub setup_and_execute_update_item_metadata
{
    my $self= shift;
    my $flag = shift;
    my $extern_id = shift;
    my $hash_ref = shift;
    my $co = $self->{co};

        #change three  fields
        $hash_ref->{display_title} = qq{This is a new title};
        $hash_ref->{author} = qq{foo,von author};
        $hash_ref->{rights} = 5;
    
    if ($flag eq "op")
    {
        $self->num_method_tests('update_item_metadata_op','18');
        my $C = $self->get_context();
        if ($DEBUG)
        {
            isa_ok($C,Context);    
        }
        my $temp_cgi = $C->get_object('CGI');
        my $action = "addit";
        my $to_coll_id =12345; # not used by AddItems, but must have as cgi param
      
 
        $temp_cgi->param('id',$extern_id);       
        $temp_cgi->param('a',"$action");
        $temp_cgi->param('c2',"$to_coll_id");

        $temp_cgi->param('au',$hash_ref->{author});
        $temp_cgi->param('ti',$hash_ref->{display_title});
        $temp_cgi->param('i2',0); # 
        $temp_cgi->param('da',$hash_ref->{date});
        $temp_cgi->param('rattr',$hash_ref->{rights});
        $C->set_object('CGI', $temp_cgi);

        my $attr_ref = $self->setup_operation($C);
        my $AddItems = new MBooks::Operation::AddItems($attr_ref);

         if ($DEBUG)
        {
            isa_ok($AddItems, MBooks::Operation::AddItems);
        }
##XXX temporary stuff
#        my $dbh=$C->{}
#        set trace level on dbh

    
        #EXECUTE
        my $status= $AddItems->execute_operation($C);

        #WARNING!!   should test for status here
#        is ($status,'0',"status from add items is 0 ok success");
        # adding items should set the cgi parameter id
        my $testCGI=$C->get_object('CGI');
    SKIP:
        {
            skip "can't set expected value for newly assigned id",1;
            
            is ($testCGI->param('iid'),$hash_ref->{item_id}, qq{AddItems set cgi param iid to $hash_ref->{item_id} });
        }
        
       
        return $testCGI->param('iid');
    }
    else 
    {

        my $metadata_ref = $hash_ref;
    
        #execute 
        my $item_id = $co->create_or_update_item_metadata($metadata_ref);
        return $item_id;
    }
    
}


#-----------------------------------------------------


# this tests the create function of sub create_or_update_item_metadata
sub create_item_metadata:Test(no_plan)
{
    my $self = shift;
    my $co = $self->{co};
    diag("create function of create_or_update_item_metadata") if $VERBOSE; 
    my $dbh = $self->{'dbh'};

    #get number of items in test db
    $statement = qq{SELECT count(*) as numrecs from test_item };
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    $hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    my $numrecs = $hash_ref->{numrecs};
    my $expected_new_id = $numrecs +1;
    
    
    my $extern_id ='12345';
#  | item_id | extern_item_id | display_title   | sort_title  | author          | date       | modified            | rights |
 
    my $metadata_ref = {
                       'extern_item_id'=> $extern_id,
                       'display_title' =>qq{The rain in spain},
                       'sort_title' =>qq{rain in spain},
                       'author' => qq{Higgins, Henry H.},
                       'date' => qq{1937-04-04},
                        'rights' => '7',
                       };
    
    my $item_id = $co->create_or_update_item_metadata( $metadata_ref);
    $statement = qq{SELECT * from test_item where item_id = $item_id};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    my $new_hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
 SKIP:
    {
#       skip $why, $how_many if $condition;
        skip "new ids are random so we can't test an expected value", 1;
        
        is ($item_id, $expected_new_id, qq{returned id is $expected_new_id });  
    }
    
    is ($new_hash_ref->{display_title},$metadata_ref->{'display_title'}, "title is $metadata_ref->{'display_title'}");
    is ($new_hash_ref->{author}, $metadata_ref->{'author'}, "author is $metadata_ref->{'author'}");
    is ($new_hash_ref->{rights}, $metadata_ref->{'rights'}, "rights = $metadata_ref->{'rights'}");
    is ($new_hash_ref->{'date'}, $metadata_ref->{'date'}, "rights = $metadata_ref->{'date'}");
}

#----------------------------------------------------------------------
sub ASSERT_create_or_update_item_metadata:Test(1)
 {

    my $self = shift;

    diag("testing ASSERT create_or_update_item_metadata ") if $VERBOSE; 
    
    my $method_ref = sub {$co->_edit_metadata(@_)};
    my $arg_ref = [$MColl_ID, $field,$value];
 SKIP:
    {   
        skip "assert testing appears to be broken due to string returnd from assertion",1;
        $self->ASSERT_test($method_ref,$arg_ref);
    }
    
}

#---------------------------------------------------------------------------------------------------------------
1;
