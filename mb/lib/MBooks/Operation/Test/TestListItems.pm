package MBooks::Operation::TestListItems;

#$Id: TestListItems.pm,v 1.7 2010/07/06 17:57:42 tburtonw Exp $#
use Collection;
use AccessRights;

use base qw (Test::Class);

use base (Test::Class, MBooks::Operation::Test::OperationTestFixture);
use Test::More;

use MBooks::Operation::ListItems;

#Move this to invoking program
my $DEBUG="true";
$DEBUG=undef;

my $VERBOSE=undef;
$VERBOSE="true";

my $VERBOSE_ASSERTS=undef;
#$VERBOSE_ASSERTS="true";

#====================================================================

#   list_items       
#     sort           
#     slice   
#     limit_to_full_text            

#=====================================================================
# Actual tests
#---------------------------------------------------------------------

sub testNew:#Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    if ($DEBUG)
    {
        
        diag("testing constructor new") if $VERBOSE;
    
        my @methods=qw (new );
    
        isa_ok($co, Collection);
        can_ok($co,@methods);
    }
    
}




#----------------------------------------------------------------------
# list_items tests

sub list_items:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    
    $sort_key = 'sort_title';
    $direction = 'a';
    
    my $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[2]->{'display_title'},'The motor book,',qq{third item is the motor book});
    like ($list_ref->[0]->{'display_title'},qr/Diseases of a gasolene automobile/,qq{first item is Diseases of a gasolene automobile });

}

#----------------------------------------------------------------------
sub list_items_sort_by_display_title:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items sorting ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    
    $sort_key = 'sort_title';
    $direction = 'd';
    
    my $list_ref = $co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[1]->{'display_title'},'The motor book,',qq{second item is the motor book});
    like ($list_ref->[0]->{'display_title'},qr/The motor-car; an elementary handbook /,qq{first item is The motor-car; an elementary handbook });

}
#     mysql> select author, test_item.item_id,display_title  from test_item, test_coll_item where test_item.item_id =test_coll_item.item_id and test_coll_item.MColl_ID=11 order by author;
#+-------------------+---------+---------------------------------------------------+
#    | author            | item_id | display_title                                     |
#    +-------------------+---------+---------------------------------------------------+
#    | Dyke, Andrew Lee, |       3 | Diseases of a gasolene automobile and how to cure |
#    | Mercredy, R. J.   |       5 | The motor book,                                   |
#    | Thompson, Henry,  |       6 | The motor-car; an elementary handbook on its      |
#    | Young, Filson,    |       4 | The happy motorist; an introduction to the use    |
#    +-------------------+---------+---------------------------------------------------+

sub list_items_sort_by_author_ascending:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items sorting by author ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    $sort_key = 'author';
    $direction = 'a';
    
    my $first_author = qq{Dyke, Andrew Lee,};
    my $fourth_author = qq{Young, Filson,};
    
    
    
    my $list_ref = $co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[0]->{'author'},$first_author,qq{first author $first_author});
    is ($list_ref->[3]->{'author'},$fourth_author, qq{fourth author $fourth_author});
}


#    mysql> select date, test_item.item_id,display_title  from test_item, test_coll_item where test_item.item_id =test_coll_item.item_id and test_coll_item.MColl_ID=11 order by date asc;
#    +------------+---------+---------------------------------------------------+
#    | date       | item_id | display_title                                     |
#    +------------+---------+---------------------------------------------------+
#    | 1902-01-01 |       6 | The motor-car; an elementary handbook on its      |
#    | 1903-01-01 |       3 | Diseases of a gasolene automobile and how to cure |
#    | 1903-01-01 |       5 | The motor book,                                   |
#    | 1906-01-01 |       4 | The happy motorist; an introduction to the use    |
#    +------------+---------+---------------------------------------------------+



sub list_items_sort_by_date_ascending:# Test(2)
{
    my $self = shift;
    my $co = $self->{co};
    diag("testing list_items sorting by date ascending ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id = 11;
    $sort_key = 'date';
    $direction = 'a';
    
    my $first_date = qq{1902-01-01};
    my $fourth_date = qq{1906-01-01};
        
    my $list_ref = $co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is ($list_ref->[0]->{'date'},$first_date,qq{first date $first_date});
    is ($list_ref->[3]->{'date'},$fourth_date, qq{fourth date $fourth_date});
}


sub list_items_slice:# Test(3)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing list_items slice ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id=11;
    $sort_key='sort_title';
    $direction = 'a';
    $slice_start = 2;
    $recs_per_slice = 2;
    
        diag("testing slice of $recs_per_slice starting at $slice_start sorting in direction $direction") if $VERBOSE;
    
    $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is (scalar(@{$list_ref}),$recs_per_slice ,qq{slice returned correct number of records});
    
    like ($list_ref->[0]->{'display_title'},qr/The happy motorist/,qq{first item is The happy motororist});
    like ($list_ref->[1]->{'display_title'},qr/The motor book/,qq{second item is The motor book });
        
}


#
#  mysql> select id, dscr from attributes order by id;
#  +----+---------------------------------------------------------------+
#  | id | dscr                                                          |
#  +----+---------------------------------------------------------------+
#  |  1 | public domain                                                 |
#  |  2 | in copyright                                                  |
#  |  3 | out-of-print and brittle (implies in-copyright)               |
#  |  4 | copyright-orphaned (implies in-copyright)                     |
#  |  5 | undetermined copyright status                                 |
#  |  6 | available to UM affiliates and walk-in patrons (all campuses) |
#  |  7 | available to everyone in the world                            |
#  |  8 | available to nobody; blocked for all users                    |
#  |  9 | public domain only when viewed in the US                      |
#  +----+---------------------------------------------------------------+

#  mysql> select test_item.item_id, test_item.sort_title, test_item.rights  from test_item, test_coll_item
#  where test_coll_item.MColl_ID = 11 and test_coll_item.item_id = test_item.item_id order by test_item.sort_title;
#  +---------+---------------------------------------------------+--------+
#  | item_id | sort_title                                        | rights |
#  +---------+---------------------------------------------------+--------+
#  |       3 | Diseases of a gasolene automobile and how to cure |      4 |
#  |       4 | happy motorist; an introduction to the use        |      5 |
#  |       5 | motor book,                                       |      6 |
#  |       6 | motor-car; an elementary handbook on its          |      7 |
#  +---------+---------------------------------------------------+--------+
#  4 rows in set (0.00 sec)

sub list_items_limit_to_full_text_fakerights:#Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing list_items limit to full-text fakerights") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id=11;
    $sort_key='sort_title';
    $direction = 'a';
    my $rights_ref=[6,7];
    
   
    $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice,$rights_ref);
    
    like ($list_ref->[0]->{'display_title'},qr/motor book/,qq{first item is motor book});
    like ($list_ref->[1]->{'display_title'},qr/motor-car/,qq{second item is  motor-car});
}

sub list_items_limit_to_full_text:#Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing list_items limit to full-text ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id=11;
    $sort_key='sort_title';
    $direction = 'a';


    my  $ar = new AccessRights($C, undef);
    $rights_ref=$ar->get_fulltext_attr_list($C);
    my $rights_bool ='';
    
    foreach my $attr (@{$rights_ref})
    {
        $rights_attr{$attr}=1;
    }
    my $rights_list = join ("\,",(sort(keys %rights_attr)));
    
    $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice,$rights_ref);

    foreach my $item_hash_ref (@{$list_ref})
    {
        my $item_id =$item_hash_ref->{'item_id'};
        my $item_rights_attr = $self->get_rights_attr($item_id);
        is ($rights_attr{$item_rights_attr},1,qq{item id $item_id rights att $item_rights_attr is  in  $rights_list});
    }

}


#  mysql> select test_item.item_id, test_item.sort_title, test_item.rights  from test_item, test_coll_item
#  where test_coll_item.MColl_ID = 11 and test_coll_item.item_id = test_item.item_id order by test_item.sort_title;
#  +---------+---------------------------------------------------+--------+
#  | item_id | sort_title                                        | rights |
#  +---------+---------------------------------------------------+--------+
#  |       3 | Diseases of a gasolene automobile and how to cure |      4 |
#  |       4 | happy motorist; an introduction to the use        |      5 |
#  |       5 | motor book,                                       |      6 |
#  |       6 | motor-car; an elementary handbook on its          |      7 |
#  +---------+---------------------------------------------------+--------+
#  4 rows in set (0.00 sec)


sub list_items_limit_to_full_text_op:Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing Operation: list_items limit to full-text ") if $VERBOSE;

    my $C = $self->get_context();
    if ($DEBUG)
    {
        isa_ok($C,Context);    
    }
       
    my $coll_id=11;
    #    $sort_key='sort_title';
    #   $direction = 'a';
    my $action = 'listis';
    
    my $temp_cgi = $C->get_object('CGI');
    $temp_cgi->param('a',"$action");
    $temp_cgi->param('c',"$coll_id");
    $temp_cgi->param('sort',"auth");
    $temp_cgi->param('sz',2);
    $temp_cgi->param('lmt',"ft");
    $C->set_object('CGI', $temp_cgi);

    my $attr_ref = $self->setup_operation($C);
    my $ListItems = new MBooks::Operation::ListItems($attr_ref);
    my $act = $ListItems->get_action();

    if ($DEBUG)
    {
        isa_ok($ListItems, MBooks::Operation::ListItems);
        #check cgi
        my $testCGI=$C->get_object('CGI');
        is ($testCGI->param('c'),11,qq{cgi coll param ok});
    }
    
    #EXECUTE
    $ListItems->execute_operation($C);
    #WARNING!!   should test for status here
    
#$act->get_transient_facade_member_data($C, 'list_items_full_text_count');
    my $full_text_count = $act->get_transient_facade_member_data($C, 'list_items_full_text_count');
    my $all_count =  $act->get_transient_facade_member_data($C, 'list_items_all_count');
    my $coll_data =  $act->get_transient_facade_member_data($C, 'list_items_owned_collection_data');
    my $pager =    $act->get_transient_facade_member_data($C, 'pager');
    my $data_ref =  $act->get_transient_facade_member_data($C, 'list_items_data');

    is ($full_text_count, 2,qq{full text count should be 2});
    is ($all_count,4,qq{all count for $coll_id should be 4});
    
    # test collection's owned by user data $coll_data
#  mysql> select MColl_ID from test_collection where owner = 'tburtonw' ;
#  +----------+
#  | MColl_ID |
#  +----------+
#  |        8 |
#  |        7 |
#  |       11 |
#  +----------+
    my @collections_owned =(8,7,11);
    my %collections_returned =();
    
    foreach $row  (@{$coll_data})
    {
        $coll_id=$row->{'MColl_ID'};
        $collections_returned{$coll_id}=1;
    }
    foreach $coll (@collections_owned)
    {
        is ($collections_returned{$coll}, 1,qq{$coll is in collections_returned in coll_data});
    }
    
    # test paging data
    $expected_current=1;
    $expected_prev = undef; # Data::Page returns undef if there is no previous page
    $expected_next =undef;
    $expected_total=1;
    

    is ($pager->previous_page ,$expected_prev,qq{prev page is $expected_prev});
    
    is ($pager->current_page  ,$expected_current,qq{current page is $expected_current});
    is ($pager->next_page  ,$expected_next,qq{next page is $expected_next});
    is ($pager->last_page ,$expected_total,qq{total pages are $expected_total});
    
    

    # test data_ref
    # note that these were sorted by author
#  mysql> select  test_item.author, test_item.display_title from test_item,test_coll_item where test_item.item_id = test_coll_item.item_id and test_coll_item.MColl_ID = 11 order by test_item.author;
#    +-------------------+---------------------------------------------------+
#    | author            | display_title                                     |
#    +-------------------+---------------------------------------------------+
#    | Dyke, Andrew Lee, | Diseases of a gasolene automobile and how to cure |
#    | Mercredy, R. J.   | The motor book,                                   |
#    | Thompson, Henry,  | The motor-car; an elementary handbook on its      |
#    | Young, Filson,    | The happy motorist; an introduction to the use    |
#    +-------------------+---------------------------------------------------+
    my @authors = ('Dyke','Mercredy','Thompson','Young');

#    mysql> select test_coll_item.MColl_ID, test_collection.collname from test_coll_item, test_collection  where test_coll_item.MColl_ID = 
#    test_collection.MColl_ID and test_coll_item.item_id = 3 and test_collection.owner = 'tburtonw';
#    +----------+-----------------------+
#    | MColl_ID | collname              |
#    +----------+-----------------------+
#    |        7 | Favorites             |
#    |        8 | Stuff for English 324 |
#    |       11 | Books and Stuff       |
#    +----------+-----------------------+
#    mysql> select test_coll_item.MColl_ID, test_collection.collname from test_coll_item, test_collection  where test_coll_item.MColl_ID = 
#    test_collection.MColl_ID and test_coll_item.item_id in (4,5,6)  and test_collection.owner = 'tburtonw';
#    +----------+-----------------+
#    | MColl_ID | collname        |
#    +----------+-----------------+
#    |       11 | Books and Stuff |
#    |       11 | Books and Stuff |
#    |       11 | Books and Stuff |
#    +----------+-----------------+
# mysql> select author from test_item where item_id = 3;
#+-------------------+
#| author            |
#+-------------------+
#| Dyke, Andrew Lee, |
#+-------------------+

    my $count=0;
    my $expected_collref=[];# array of hashrefs
    
    $expected_collref->[0]={'Favorites'=>1,'Stuff for English 324'=>1,'Books and Stuff'=>1};
    $expected_collref->[1] = {'Books and Stuff'=>1};
    $expected_collref->[2] = {'Books and Stuff'=>1};
    $expected_collref->[3] = {'Books and Stuff'=>1};
    
    
    foreach $item (@{$data_ref})
    {
        like ($item->{'author'},qr/$authors[$count]/,qq{author  $count is $authors[$count]});
 
        my $coll_ary_ref=$item->{'item_in_collections'};
        
         foreach my $coll (@{$coll_ary_ref})
        {
            is ($expected_collref->[$count]->{$coll},1,qq{$coll is in expected collection list for item $count});
        }
        # make sure that for item the correct number of collections is listed
         my $numcolls =scalar(@{$coll_ary_ref});
         my $expected_numcolls =scalar(keys %{$expected_collref->[$count]});
        
        is ($numcolls,$expected_numcolls,qq{number of collections $numcolls match expected number of colls $expected_numcolls for item $count });
        $count++; 
    }
}

#  mysql> select test_item.item_id, test_item.sort_title, test_item.rights  from test_item, test_coll_item
#  where test_coll_item.MColl_ID = 11 and test_coll_item.item_id = test_item.item_id order by test_item.sort_title;
#  +---------+---------------------------------------------------+--------+
#  | item_id | sort_title                                        | rights |
#  +---------+---------------------------------------------------+--------+
#  |       3 | Diseases of a gasolene automobile and how to cure |      4 |
#  |       4 | happy motorist; an introduction to the use        |      5 |
#  |       5 | motor book,                                       |      6 |
#  |       6 | motor-car; an elementary handbook on its          |      7 |
#  +---------+---------------------------------------------------+--------+
#  4 rows in set (0.00 sec)


sub list_items_slice: Test(3)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing list_items slice ") if $VERBOSE;
    
    my ($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice)=undef;
       
    $coll_id=11;
    $sort_key='sort_title';
    $direction = 'a';
    $slice_start = 2;
    $recs_per_slice = 2;
    
        diag("testing slice of $recs_per_slice starting at $slice_start sorting in direction $direction") if $VERBOSE;
    
    $list_ref=$co->list_items($coll_id, $sort_key, $direction, $slice_start, $recs_per_slice);
    is (scalar(@{$list_ref}),$recs_per_slice ,qq{slice returned correct number of records});
    
    like ($list_ref->[0]->{'display_title'},qr/The happy motorist/,qq{first item is The happy motororist});
    like ($list_ref->[1]->{'display_title'},qr/The motor book/,qq{second item is The motor book });
        
}

#---------------------------------------------------------------------------------------

# TODO refactor to allow reuse with different slice sizes and page starting numbers
sub list_items_slicing_op:Test(no_plan)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing Operation: list_items slicing  ") if $VERBOSE;

    my $C = $self->get_context();
    if ($DEBUG)
    {
        isa_ok($C,Context);    
    }
       
    my $coll_id=11;
    my $action = 'listis';
    
    my $temp_cgi = $C->get_object('CGI');
    $temp_cgi->param('a',"$action");
    $temp_cgi->param('c',"$coll_id");
    $temp_cgi->param('sort',"auth");
    $temp_cgi->param('sz',2);
    $temp_cgi->param('pn',2);
    $C->set_object('CGI', $temp_cgi);

    my $attr_ref = $self->setup_operation($C);
    my $ListItems = new MBooks::Operation::ListItems($attr_ref);
    my $act = $ListItems->get_action();

    if ($DEBUG)
    {
        isa_ok($ListItems, MBooks::Operation::ListItems);
        #check cgi
        my $testCGI=$C->get_object('CGI');
        is ($testCGI->param('c'),11,qq{cgi coll param ok});
    }
    
    #EXECUTE
    $ListItems->execute_operation($C);
    


    my $full_text_count = $act->get_transient_facade_member_data($C, 'list_items_full_text_count');
    my $all_count = $act->get_transient_facade_member_data($C, 'list_items_all_count');

    my $coll_data =  $act->get_transient_facade_member_data($C, 'list_items_collection_data');
    my $pager=    $act->get_transient_facade_member_data($C, 'pager');
    my $data_ref =  $act->get_transient_facade_member_data($C, 'list_items_data');

    is ($full_text_count, 2,qq{full text count should be 2});
    is ($all_count,4,qq{all count for $coll_id should be 4});
    
    # test paging data
    $expected_current=2;
    $expected_prev = 1;
    $expected_next =undef;
    $expected_total=2;
    

    is ($pager->previous_page,$expected_prev,qq{prev page is $expected_prev});
    
    is ($pager->current_page ,$expected_current,qq{current page is $expected_current});
    is ($pager->next_page   ,$expected_next,qq{next page is $expected_next});
    is ($pager->last_page ,$expected_total,qq{total pages are $expected_total});
    
    

    # test data_ref
    # note that these were sorted by author
#  mysql> select  test_item.author, test_item.display_title from test_item,test_coll_item where test_item.item_id = test_coll_item.item_id and test_coll_item.MColl_ID = 11 order by test_item.author;
#    +-------------------+---------------------------------------------------+
#    | author            | display_title                                     |
#    +-------------------+---------------------------------------------------+
#    | Dyke, Andrew Lee, | Diseases of a gasolene automobile and how to cure |
#    | Mercredy, R. J.   | The motor book,                                   |
#    | Thompson, Henry,  | The motor-car; an elementary handbook on its      |
#    | Young, Filson,    | The happy motorist; an introduction to the use    |
#    +-------------------+---------------------------------------------------+

# since we are starting on page 2 with 2 records per page we should get the last two on the list
    my @authors = ('Thompson','Young');

    my $count=0;
    
    foreach $item (@{$data_ref})
    {
        like ($item->{'author'},qr/$authors[$count]/,qq{author  $count is $authors[$count]});
        $count++; 
    }
}




#======================================================================
#  Test Collection utility routines
#----------------------------------------------------------------------

#----------------------------------------------------------------------
#    +----------+---------+
#    | MColl_ID | owner   |
#    +----------+---------+
#    |        9 | diabob  |
#    |       11 | tburtonw |
#    +----------+---------+
sub coll_owned_by_user # :Test(3)
           
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing coll_owned_by_user") if $VERBOSE;
    my $user_id = 'tburtonw';
    my $coll_id = 11;
    
    ok ($co->coll_owned_by_user($coll_id, $user_id),"collection $coll_id owned by $user_id");

    $coll_id = 9; #not owned by $user_id tburtonw
    ok (!$co->coll_owned_by_user($coll_id, $user_id),"collection $coll_id not owned by $user_id");

    #non-existant user_id
     $user_id = 999;
   ok (! $co->coll_owned_by_user($coll_id, $user_id),"collection $coll_id not owned by non-existent user:$user_id");


}
           

#----------------------------------------------------------------------
sub item_exists  # :Test(2)
{
    my $self=shift;
    my $co=$self->{co};
    diag("item_exists") if $VERBOSE;
    my $item_id = 5;  #5 exists
    ok ($co->item_exists($item_id),"item $item_id exists");
        
    $item_id = 666;  # item 666 does not exist
    ok (! $co->item_exists($item_id)," item $item_id does not exist");
    
}

#----------------------------------------------------------------------
sub test_item_in_collection  # :Test(2)
{
    my $self=shift;
    my $co=$self->{co};
    diag("testing $co->item_in_collection") if $VERBOSE;
    my $coll_id = 11;
    my $item_id = 6;
    ok ($co->item_in_collection($item_id,$coll_id), "item $item_id is in collection $coll_id");
    $item_id=666;
    ok (!$co->item_in_collection($item_id,$coll_id), "item $item_id is not  in collection $coll_id");
}


#----------------------------------------------------------------------
#=====================================================================
# Setup and teardown
#
# these are run before and after every test
#----------------------------------------------------------------------

sub A_create_test_tables:Test(setup=>no_plan)
{
    my $self = shift;
    my $config = $self->{'config'};
    my $db_dev_server   = $config->get('db_dev_server' );
    my $db_name   = $config->get('db_name');
    my $db_user   = $config->get('db_user');
    my $db_passwd   = $config->get('db_passwd');

# This should probably not be hard coded!
    my $create_SQL = '/l1/dev/tburtonw/lib/App/Collection/make_test_tables.sql';
    
    $command = qq{mysql -h $db_dev_server -u $db_user  $db_name -p$db_passwd} . ' < ' .  $create_SQL;

    #print "load command is $command\n";

    system $command;

}


sub B_get_co:Test(setup=>no_plan)
{

    # set env $DEBUG to usetesttbl before instantiating collection object
    $ENV{DEBUG}='usetesttbl';
    
    diag("setting up co Collection ") if $DEBUG;
    my $self = shift;
    my $dbh = $self->get_dbh();
    my $user_id = 'tburtonw';
    
    my $co= Collection->new($dbh,$self->{config},$user_id) ;

    $self->{co}=$co;
  if ($DEBUG)
    {
        $self->num_method_tests('B_get_co','2');
        test_get_co($self->{co},$dbh);
        
    }

    
}

sub test_get_co
{
  #  my $self=shift;
    my $co=shift;
    my $dbh=shift;
        
    isa_ok($co, Collection,"Collection is set up");
    is ($co->get_dbh,$dbh,qq{dbh is ok});
}


sub C_setup_objects:Test(setup=>no_plan)
{

    # set env $DEBUG to usetesttbl before instantiating collection object
    $ENV{DEBUG}='usetesttbl';
    
    diag("setting up objects ") if $DEBUG;
    my $self = shift;
    my $C = setup_objects();
    $self->{'context'} = $C;
    
    if ($DEBUG)
    {
        $self->num_method_tests('C_setup_objects','2');
        $self->test_setup_objects();
    }
}
sub test_setup_objects
{
    my $self=shift;
    my $C = $self->get_context();
    isa_ok($C,Context);
    # add tests for member data
}



#========================================================================
# STARTUP and TEARDOWN/SHUTDOWN 
# these are run once per test suite
#========================================================================
sub A_get_config:Test(startup=>no_plan)
{
    my $self=shift;
    
    # uncomment below and change 2nd test following to use production/development config file instead of test file

    my $config = new MdpConfig($ENV{'SDRROOT'} . '/cgi/m/mdp/MBooks/Config/global.conf');
    $ENV{DEBUG}='usetesttbl';
   
  # my $config = new MdpConfig($ENV{'SDRROOT'} . '/lib/App/Collection/testCollection.conf');
    $self->{'config'}=$config;
    if ($DEBUG)
    {
        diag("testing config ")if $VERBOSE;
        isa_ok($self->{'config'}, MdpConfig, "config object okay");
        is ($config->get('test_coll_table_name'), 'test_collection',"collection table in config object is test_collection");
    }
    
    $self->{'coll_table_name'} = $config->get('test_coll_table_name');
    $self->{'coll_item_table_name'} = $config->get('test_coll_item_table_name');
    $self->{'item_table_name'} = $config->get('test_item_table_name');
}


sub C_get_dbh :Test(startup=>no_plan)
{
    my $self=shift;
    my $dbh = $self->_get_dbh();
    $self->{'dbh'}=$dbh;
    
}

sub A_finish # :Test(shutdown=>no_plan)
{
    #close dbh here!!!
}

#======================================================================
#  utility routines
#======================================================================

# getters

#----------------------------------------------------------------------
sub get_config 
{
    my $self = shift;
    return $self->{'config'};
}

#----------------------------------------------------------------------

sub get_coll_table_name
{
    my $self = shift;
    return $self->{coll_table_name};
}
#----------------------------------------------------------------------
sub get_coll_item_table_name
{
    my $self = shift;
    return $self->{coll_item_table_name};
}
#----------------------------------------------------------------------
sub get_item_table_name
{
    my $self = shift;
    return $self->{item_table_name};
}
#----------------------------------------------------------------------

sub get_dbh
{
    my $self=shift;
    return $self->{'dbh'};
    
}

#----------------------------------------------------------------------
sub get_context
{
    my $self = shift;
    return $self->{'context'}; 
}

#----------------------------------------------------------------------
sub get_rights_attr
{
    my $self = shift;
    my $item_id = shift;
    my $dbh =$self->get_dbh();
    my $item_table_name = $self->get_item_table_name();
    
    my $statement = qq{select rights from $item_table_name where item_id = $item_id};
    $sth = DbUtils::prep_n_execute($dbh, $statement);
    my  $hash_ref = $sth->fetchrow_hashref;
    $sth->finish;
    my $rights_attr = $hash_ref->{rights};
    return $rights_attr;
    
}



#----------------------------------------------------------------------------------------------

sub ASSERT_test
{
    my $self = shift;
    my $method_ref = shift;
    my $arg_ref = shift;
    my $caller = (caller(1))[3];

    $caller =~ s/Collection::Test::ASSERT_//;
    

    eval 
    {
        $method_ref->(@{$arg_ref});
     };
    my $err_msg=$@;
    my $output_err_msg = "$err_msg\n" if $VERBOSE_ASSERTS;
     
    like ($err_msg,qr/ASSERT_FAIL/,qq{assertion triggered for $caller\n $output_err_msg});

}

#----------------------------------------------------------------------------------------------

# private routine used by startup only
sub _get_dbh
{
    my $self = shift;
    my $config = $self->get_config();
    
    my $db_host = $config->get('db_dev_server'); #'dev.mysql';
    my $db_name = $config->get('db_name');    #'dlxs';

    my $dbSourceName = join(':', 'DBI:mysql', $db_name,  $db_host);
    my $dbUser = $config->get('db_user');
    my $dbPassword = $config->get('db_passwd');

    my $dbh;
    eval
    {
        $dbh = DbUtils::Connect_DBI(
                                     $dbSourceName,
                                     $dbUser,
                                     $dbPassword,
                                    );
    };
    Utils::ASSERT( ( ! $@ ), qq {Database connect error: $@} );
    return ($dbh);
}
#----------------------------------------------------------------------------------------------

sub item_in_collection
{
    my $self = shift;
    my $item_id = shift;
    my $coll_id = shift;
    my $coll_item_table = $self->get_coll_item_table_name;
    my $dbh =  $self->get_dbh;
    
    

        my $statement = "SELECT count(*) FROM   $coll_item_table  WHERE MColl_ID = $coll_id and item_id = $item_id\;";
   
    
   my $sth = DbUtils::prep_n_execute($dbh, $statement);
   my $result = scalar($sth->fetchrow_array);
   $sth->finish;
    
   return  ($result > 0);
}
#==============================================================================================================
#  Utility routines for setting up objects so we can test operations
#
#==============================================================================================================
sub setup_objects{
    #
    # Setup
    #
    # Establish and populate the Context.  Order dependent.
    #

    # WARNING!! right here we are hardcoding the user/owner so that the auth object will read it
    # this probably should be in each test by putting the auth setup after the rest
    # set up environment varible remote user to tburtonw
    $ENV{'REMOTE_USER'} ='tburtonw';

    my $C = new Context;

    # CGI
    my $cgi = new CGI;

    # set cgi parameters here
    $C->set_object('CGI', $cgi);

    # configuration
      
    my $config = new MdpConfig($ENV{'SDRROOT'} . '/cgi/m/mdp/MBooks/Config/global.conf');
    $C->set_object('MdpConfig', $config);


    # Database connection
    my $db = new Database($config);
    $C->set_object('Database', $db);

    
    # Session
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);


    # Auth
    my $auth = new Auth($C);
    $C->set_object('Auth', $auth);

    return $C;

}
#---------------------------------------------------------------------------------------------------------------
#XXX remove this and depend on OperationTestFixture::setup_operation
sub foo_setup_operation{
    #my $self = shift;
    my $C = shift;
    
    # bindings
    my $ab = new Action::Bind($C, $ENV{'SDRROOT'} . '/cgi/m/mdp/MBooks/Config/bindings.pl');
    $C->set_object('Bind', $ab);


    # Action
    my $act = new MBooks::Action($C);

    #initialize op
    my $attr_ref={};
    $$attr_ref{'C'}=$C;
    $$attr_ref{'act'} =$act;
    return $attr_ref;
    
}

#---------------------------------------------------------------------------------------------------------------
1;
